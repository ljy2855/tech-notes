

KVM(Kernel-based Virtual Machine)은 리눅스 커널에 통합된 **하이퍼바이저 기능**
클라우드 컴퓨팅에서 흔히 사용되는 KVM 기반의 가상 머신은 어떻게 CPU 자원을 활용하고, vCPU는 어떻게 실제 pCPU에 매핑하는지 확인

## KVM 구조 

KVM은 리눅스 커널을 그대로 **하이퍼바이저로 확장**한 구조

![[Pasted image 20250609174454.png]]

```
[User Space]
  QEMU          ← 가상 하드웨어 에뮬레이션, 장치 모델
    │
  └── /dev/kvm  ← ioctl을 통해 KVM 커널 모듈 호출

[Kernel Space]
  KVM 모듈      ← VM 실행/제어, VMCS 설정 등
  Linux Scheduler
  Physical CPU
```

- **QEMU**: 유저 공간에서 VM을 관리하고 장치를 에뮬레이션함
- **KVM 커널 모듈**: VM의 실행 컨텍스트(vCPU, MMU 등)를 커널 레벨에서 제어
- **/dev/kvm**: 유저 ↔ 커널 간 인터페이스
- **Linux CFS Scheduler**: vCPU를 실제 pCPU에 스케줄링

---

### vCPU(Virtual CPU)
- VM 입장에서는 독립적인 CPU처럼 보임
- 실제로는 **호스트의 쓰레드**로 동작함 (`pthread`)
- `KVM_RUN` ioctl 호출을 통해 **게스트 코드를 실행하다가 VM Exit 시 돌아옴**

**Key Feature**
- 1 vCPU = 1 host thread (by QEMU)
- 게스트 OS에서는 SMP 시스템처럼 동작하지만, 실제 자원은 동적임
- 스케줄링, 인터럽트, 타이머 등도 커널에서 처리됨

---

## vCPU → pCPU 스케줄링 메커니즘

### 호스트 입장
vCPU는 커널에서 관리하는 **일반적인 커널 스레드**와 동일하게 취급
→ 즉, **CFS Completely Fair Scheduler**가 vCPU를 포함한 모든 프로세스를 공평하게 스케줄링

### vCPU 스케줄링 특징

| 항목 | 설명 |
|------|------|
| 스케줄링 단위 | host thread (즉, vCPU) |
| 우선순위 | 일반 task와 동일하게 CFS 기준 |
| preemption | 가능함 (vCPU 실행 중에도 커널이 context switch) |
| NUMA awareness | 기본은 없음 → `taskset`, `numactl`, cgroup 설정 필요 |
| pinning | 특정 pCPU에 고정 (static affinity 가능) |

---

## 성능에 영향을 주는 요소들

### Double Scheduling
- 게스트 내부에서도 자체적인 CFS 스케줄링이 존재
- → host와 guest에서 모두 스케줄링 발생 → 불필요한 latency/straggler 유발 가능

### Steal Time
- 게스트 OS는 vCPU가 사용 중인 줄 알지만, 실제로는 **host에서 pCPU를 잃었을 경우**
- `/proc/stat`의 steal 항목 또는 `top`의 `%st`로 확인 가능

### SMT/stacked core 문제
- 동일한 물리 코어의 sibling(vCPU1, vCPU2)이 동시에 스케줄되면 → 성능 간섭
- → NUMA-aware + SMT-aware 스케줄링이 중요

> [!NOTE] NUMA란?
> **NUMA(Non-Uniform Memory Access)**는 멀티코어 시스템에서 **CPU와 메모리 사이의 접근 속도**가 **균일하지 않은** 아키텍처입니다.
> - 시스템은 여러 개의 **메모리 노드(memory node)**와 **CPU 노드**로 구성
> - 각 CPU는 자기 노드(local)의 메모리에 접근할 때는 빠르지만, **다른 노드(remote)의 메모리**에 접근할 때는 더 느림
> - **메모리 접근 지연(latency)**이 위치에 따라 달라지므로, 자원 배치가 매우 중요
    
![[Pasted image 20250609174244.png]]
- 물리 서버는 여러개의 CPU 소켓을 가지고 있고 각 소켓에 연결된 memory bank를 가짐

### Overcommit
- vCPU 수 > pCPU 수인 경우 성능 예측 어려움
- 예: 4코어 머신에 10 vCPU 할당 시 → 컨텐션, latency spike 발생 가능

---

## Practice

### pinning 설정 (CPU 고정)
```bash
taskset -c 0,1 qemu-system-x86_64 ...
```

### libvirt를 통한 CPU policy 설정
```xml
<vcpu placement='static'>4</vcpu>
<cputune>
  <vcpupin vcpu='0' cpuset='0'/>
  <vcpupin vcpu='1' cpuset='1'/>
</cputune>
```

### NUMA-aware 배치
```xml
<numatune>
  <memory mode='strict' nodeset='0'/>
</numatune>
```


## 레퍼런스

- [KVM Documentation – kernel.org](https://www.kernel.org/doc/html/latest/virt/kvm/index.html)
- [Linux CFS Scheduler Explained](https://www.kernel.org/doc/Documentation/scheduler/sched-design-CFS.txt)
- `man taskset`, `man numactl`, `perf`, `trace-cmd`
