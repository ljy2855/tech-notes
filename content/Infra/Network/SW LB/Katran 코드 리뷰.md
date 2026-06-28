# Katran 코드 리뷰 (2편)

[[SW LB를 위한 배경 1편]]에서 본 조각들 — XDP, DSR/IPIP, RSS, Session Table, Maglev — 이 실제 코드에서 어떻게 맞물리는지 Meta의 **Katran**으로 본다.

> Katran = XDP/eBPF로 만든 L4 Load Balancer. 데이터 평면은 한 개의 XDP 프로그램, 제어 평면은 C++ 라이브러리 + gRPC.

---

## Katran 한눈에

```mermaid
flowchart TB
    subgraph CP["Control Plane (user space)"]
        direction LR
        GRPC["`**gRPC server**
        VIP/real 추가·삭제`"] --> LIB["`**KatranLb (C++)**
        설정 → map 반영
        Maglev ring 계산`"]
    end
    subgraph DP["Data Plane (kernel, XDP)"]
        BAL["`**balancer_kern.c**
        패킷당 실행`"]
    end
    MAPS[("`**BPF Maps**
    vip / ch_rings / reals
    lru / stats`")]

    LIB -->|"bpf syscall로 write"| MAPS
    MAPS -->|"패킷 처리 중 lookup"| BAL

    style LIB fill:#d1ecf1,stroke:#17a2b8,color:#000
    style BAL fill:#fff3cd,stroke:#ffc107,color:#000
    style MAPS fill:#d4edda,stroke:#28a745,color:#000
```

> 둘은 **BPF Map을 사이에 두고만 만난다**. control plane은 map을 쓰고, data plane은 map을 읽는다.

---

## Control plane vs Data plane 구조

```mermaid
flowchart LR
    subgraph slow["느린 경로 · 가끔"]
        direction TB
        C["`설정 변경
        backend 추가/제거
        health check 반영`"] --> C2["`Maglev ring 재계산
        → ch_rings 갱신`"]
    end
    subgraph fast["빠른 경로 · 패킷마다"]
        direction TB
        F["`map lookup
        backend 선택
        encap → XDP_TX`"]
    end

    style C fill:#d1ecf1,stroke:#17a2b8,color:#000
    style F fill:#fff3cd,stroke:#ffc107,color:#000
```

| | Control Plane | Data Plane |
| --- | --- | --- |
| 위치 | user space (C++) | kernel (XDP) |
| 언어 | C++ / libbpf | C → BPF bytecode |
| 빈도 | 설정 변경 시 | 패킷마다 |
| 역할 | map 작성, ring 계산, 통계 수집 | lookup, 선택, encap, 전송 |
| 상태 | 갖지 않음(전부 map) | 갖지 않음(전부 map) |

> 패킷 처리 로직에는 **분기와 lookup만** 있고 정책/설정은 없다. 무엇을 할지는 control plane이 map에 미리 적어둔다.

---

## XDP hook

진입점은 NIC 드라이버에 attach된 XDP 프로그램 하나다. 반환값으로 패킷의 운명이 정해진다.

```mermaid
flowchart LR
    NIC(["`NIC 수신`"]) --> PROG["`**xdp balancer**
    balancer_kern.c`"]
    PROG -->|"VIP 아님"| PASS["`XDP_PASS
    커널 스택으로`"]
    PROG -->|"encap 완료"| TX["`XDP_TX
    backend로 되돌려 전송`"]
    PROG -->|"비정상"| DROP["`XDP_DROP`"]

    style PROG fill:#fff3cd,stroke:#ffc107,color:#000
    style TX fill:#d4edda,stroke:#28a745,color:#000
    style PASS fill:#d1ecf1,stroke:#17a2b8,color:#000
    style DROP fill:#f8d7da,stroke:#dc3545,color:#000
```

> DSR이므로 응답 경로는 없다. LB가 하는 건 요청을 encap해서 `XDP_TX`로 backend에 쏘는 것까지다. 응답은 Real Server가 Client로 직접 보낸다.

---

## Dataplane 패킷 처리 flow

배경 1편의 Session Table → Maglev 흐름이 여기서 그대로 코드가 된다.

```mermaid
flowchart TD
    START["`패킷 수신`"] --> PARSE["`L2/L3/L4 파싱
    IPv4 / IPv6`"]
    PARSE --> VIP{"`dst가 VIP?
    (vip_map lookup)`"}
    VIP -->|no| PASS["`XDP_PASS`"]
    VIP -->|yes| KEY["`flow key 생성
    (5-tuple)`"]
    KEY --> LRU{"`Session Table
    lookup (lru)`"}
    LRU -->|hit| REAL["`기존 real 재사용`"]
    LRU -->|miss| HASH["`Maglev hash
    → ch_rings 인덱싱`"]
    HASH --> PICK["`real 선택`"]
    PICK --> STORE["`lru에 기록`"]
    STORE --> REAL
    REAL --> RLOOK["`reals lookup
    → real IP`"]
    RLOOK --> ENCAP["`IPIP/GUE encap
    outer dst = real IP`"]
    ENCAP --> STAT["`stats / reals_stats
    카운터 증가`"]
    STAT --> TX["`XDP_TX`"]

    style VIP fill:#fff3cd,stroke:#ffc107,color:#000
    style LRU fill:#fff3cd,stroke:#ffc107,color:#000
    style HASH fill:#d1ecf1,stroke:#17a2b8,color:#000
    style ENCAP fill:#d4edda,stroke:#28a745,color:#000
    style TX fill:#d4edda,stroke:#28a745,color:#000
```

```text
요약: parse → VIP? → 연결 있으면 재사용 / 없으면 Maglev로 선택 → encap → XDP_TX
```

> 정상 트래픽의 절대다수는 **lru hit** 경로로 빠진다. Maglev 계산은 새 연결(또는 lru miss)일 때만 탄다.

---

## ebpf map 종류

Katran의 map은 크게 **포워딩용**과 **통계용**으로 나뉜다. (실제 `balancer_maps.h` 기준)

### 포워딩 (lookup으로 backend를 찾는다)

| Map | 타입 | 저장 내용 |
| --- | --- | --- |
| `vip_map` | `HASH` | VIP → vip 메타(번호, flag) |
| `ch_rings` | `ARRAY` | **Maglev ring**: (vip, hash) → real index |
| `reals` | `ARRAY` | real index → real 서버 IP/flag |
| `lru_mapping` | `ARRAY_OF_MAPS` | **CPU별 Session Table**(아래에서 자세히) |
| `fallback_cache` | `LRU_HASH` | per-CPU lru가 빗나갈 때의 공용 백업 |
| `ctl_array` | `ARRAY` | mac 등 제어값 |

### 통계 (전부 `PERCPU_ARRAY`)

| Map | 타입 | 저장 내용 |
| --- | --- | --- |
| `stats` | `PERCPU_ARRAY` | VIP 단위 패킷/바이트 |
| `reals_stats` | `PERCPU_ARRAY` | real 단위 패킷/바이트 |
| `lru_miss_stats` | `PERCPU_ARRAY` | lru miss 카운트 |

> **통계가 전부 `PERCPU_ARRAY`인 이유**: CPU마다 자기 복사본에 락 없이 더하기만 하면 된다. 합산은 user space(control plane)가 읽을 때 한 번에 한다. 패킷당 atomic/lock이 없다.

```mermaid
flowchart LR
    CPU0["`CPU0 +1`"] --> S0["`slot[cpu0]`"]
    CPU1["`CPU1 +1`"] --> S1["`slot[cpu1]`"]
    CPUN["`CPUn +1`"] --> SN["`slot[cpun]`"]
    S0 & S1 & SN -->|"읽을 때 sum"| USER["`control plane`"]

    style USER fill:#d1ecf1,stroke:#17a2b8,color:#000
```

---

## PER-CPU session table

여기가 Katran 설계에서 제일 재밌는 부분이다.

연결 추적 테이블은 **CPU마다 따로** 둔다. 단, 흔한 오해와 달리 `LRU_PERCPU_HASH`가 아니라, **`ARRAY_OF_MAPS` 바깥 + 각 칸에 일반 `LRU_HASH`** 구조다.

```mermaid
flowchart LR
    PROG["`XDP 프로그램`"] --> CPUID["`bpf_get_smp_processor_id()`"]
    CPUID --> OUTER["`**lru_mapping**
    (ARRAY_OF_MAPS)
    key = cpu id`"]
    OUTER -->|cpu0| L0["`LRU_HASH (CPU0 전용)`"]
    OUTER -->|cpu1| L1["`LRU_HASH (CPU1 전용)`"]
    OUTER -->|cpuN| LN["`LRU_HASH (CPUn 전용)`"]

    style OUTER fill:#fff3cd,stroke:#ffc107,color:#000
    style L0 fill:#d4edda,stroke:#28a745,color:#000
    style L1 fill:#d4edda,stroke:#28a745,color:#000
    style LN fill:#d4edda,stroke:#28a745,color:#000
```

```text
cpu = bpf_get_smp_processor_id();
lru = lookup(lru_mapping, cpu);   // 이 CPU 전용 LRU_HASH
real = lookup(lru, flow_key);     // 그 안에서 연결 조회
```

### 왜 CPU별로 쪼개나

[[SW LB를 위한 배경 1편]]의 **RSS**가 답이다. NIC이 5-tuple을 해시해 연결을 CPU에 고정하므로, **한 연결의 패킷은 항상 같은 CPU = 같은 inner LRU**로 온다. 그래서 CPU끼리 테이블을 공유할 필요가 없다.

```mermaid
flowchart LR
    F["`연결 A 패킷들`"] -->|RSS| CPU["`항상 CPU k`"]
    CPU --> LRUk["`CPU k의 LRU만 접근
    → 락 경합 0`"]

    style CPU fill:#fff3cd,stroke:#ffc107,color:#000
    style LRUk fill:#d4edda,stroke:#28a745,color:#000
```

### 왜 `LRU_PERCPU_HASH`가 아닌가

| 구조 | key | value | 문제/이점 |
| --- | --- | --- | --- |
| `LRU_PERCPU_HASH` | 모든 CPU 공유 | **CPU마다 별도** | 한 연결의 value가 CPU 수만큼 복제 → 메모리 ×N, 의미상 불필요 |
| `ARRAY_OF_MAPS` + `LRU_HASH` (Katran) | 바깥에서 CPU별 분리 | 단일 값 | 이미 CPU 전용이라 value 복제 불필요, "한 연결 → 한 real"이 그대로 단일 값 |

- 바깥(`ARRAY_OF_MAPS`)에서 이미 **CPU별로 인스턴스가 분리**돼 있다 → 안쪽까지 per-CPU일 이유가 없다.
- `LRU_PERCPU_HASH`라면 key는 공유하면서 value를 CPU 수만큼 들고 있어, 정작 그 연결을 만지는 CPU는 하나인데 **메모리만 N배** 쓴다.
- 우리가 원하는 값은 "이 연결이 가야 할 real **하나**"다. 일반 `LRU_HASH`의 단일 value가 정확히 그 의미다.

### fallback_cache가 증거다

RSS 가정이 깨질 수 있다 — 큐 재해시, CPU 수 초과, `XDP_REDIRECT`로 CPU가 바뀌는 경우. 그래서 **공용 `fallback_cache (LRU_HASH)`** 를 둔다.

```mermaid
flowchart TD
    P["`패킷`"] --> A{"`CPU 전용 lru
    hit?`"}
    A -->|yes| OK["`그대로 사용`"]
    A -->|no| B{"`fallback_cache
    hit?`"}
    B -->|yes| OK
    B -->|no| C["`Maglev로 선택
    양쪽에 기록`"]

    style A fill:#fff3cd,stroke:#ffc107,color:#000
    style B fill:#d1ecf1,stroke:#17a2b8,color:#000
    style C fill:#d4edda,stroke:#28a745,color:#000
```

> per-CPU 테이블은 **속도(락 없음)** 를 위해, fallback은 **정확성(연결이 다른 CPU로 가도 유지)** 을 위해 둔다. 이 이중 구조가 "per-CPU지만 PERCPU_HASH는 아닌" 설계의 이유를 그대로 보여준다.

---

## 정리

```mermaid
flowchart LR
    A["`Control plane
    C++ + gRPC`"] -->|map write| M[("`BPF Maps`")]
    M -->|map read| B["`Data plane
    XDP balancer`"]
    B --> C["`per-CPU LRU + Maglev
    + IPIP encap → XDP_TX`"]

    style A fill:#d1ecf1,stroke:#17a2b8,color:#000
    style M fill:#d4edda,stroke:#28a745,color:#000
    style B fill:#fff3cd,stroke:#ffc107,color:#000
```

- control / data plane은 **BPF map으로만** 결합한다.
- data plane은 상태가 없다. **lookup → 선택 → encap → XDP_TX**가 전부다.
- 통계는 `PERCPU_ARRAY`로 락 없이 더하고, 합산은 user space에서.
- session table은 **RSS로 연결을 CPU에 고정**한 위에서 CPU별 `LRU_HASH`로 쪼갠다. `LRU_PERCPU_HASH`가 아닌 이유는 바깥에서 이미 CPU별로 나뉘었기 때문이고, `fallback_cache`가 RSS 가정이 깨질 때의 안전망이다.

---

## 참고

- [[SW LB를 위한 배경 1편]] — 이 글의 배경 (XDP, RSS, Session Table, Maglev)
- [facebookincubator/katran](https://github.com/facebookincubator/katran) — 소스
- [Open-sourcing Katran (Meta Engineering)](https://engineering.fb.com/2018/05/22/open-source/open-sourcing-katran-a-scalable-network-load-balancer/)
- [The Linux Kernel - BPF map types](https://docs.kernel.org/bpf/maps.html)
