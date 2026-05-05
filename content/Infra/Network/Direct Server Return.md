# Direct Server Return

로드밸런서는 여러 서버 앞에 위치해 Client 요청을 적절한 Real Server로 분산한다.

일반적인 구조에서는 사용자가 **VIP(Virtual IP)** 로 접근하고, L4 장비가 이 요청을 backend 서버 중 하나로 전달한다.

```text
Client → VIP(L4) → Real Server
```

여기서 중요한 점은 Client가 알고 있는 목적지는 Real Server IP가 아니라 **VIP** 라는 것이다.

Client 입장에서는 `VIP` 하나와 통신하는 것처럼 보이고, 실제로 어떤 Real Server가 처리했는지는 알 필요가 없다.

![[Excalidraw/Direct Server Return - NAT vs DSR.excalidraw.md]]

---

## L4의 역할과 VIP

L4 Load Balancer는 TCP/UDP 같은 Transport Layer 정보를 기준으로 트래픽을 분산한다.

- 목적지 IP: VIP
- 목적지 Port: 80, 443 등
- Source IP/Port
- Protocol: TCP, UDP

예를 들어 다음과 같은 서비스가 있다고 가정한다.

```text
VIP: 203.0.113.10:80

Real Server A: 10.0.1.11:80
Real Server B: 10.0.1.12:80
Real Server C: 10.0.1.13:80
```

Client는 `203.0.113.10:80` 으로 요청을 보낸다.

L4 장비는 이 요청을 받아 Round Robin, Least Connection, Hash 같은 알고리즘으로 하나의 Real Server를 선택한다.

```text
Client
  ↓ dst=203.0.113.10:80
L4 Load Balancer
  ↓ select backend
Real Server A/B/C
```

이때 L4 장비가 패킷을 Real Server로 전달하는 방식에 따라 NAT 방식과 DSR 방식으로 나눌 수 있다.

---

## NAT 방식의 한계와 SPOF

가장 직관적인 방식은 Load Balancer가 NAT를 수행하는 것이다.

Client는 VIP로 요청을 보내고, L4는 목적지 IP를 Real Server IP로 바꿔서 전달한다.

```text
request:
Client → L4(VIP) → Real Server

response:
Client ← L4(VIP) ← Real Server
```

### Request 방향

```text
Before NAT:
[src=Client IP][dst=VIP]

After DNAT:
[src=Client IP][dst=Real Server IP]
```

Real Server는 목적지가 자신의 IP로 바뀐 패킷을 받기 때문에 평범한 서버처럼 요청을 처리할 수 있다.

### Response 방향

Real Server가 Client에게 응답할 때는 다시 L4를 거쳐야 한다.

L4는 응답 패킷의 Source IP를 Real Server IP에서 VIP로 바꿔준다.

```text
Before SNAT:
[src=Real Server IP][dst=Client IP]

After SNAT:
[src=VIP][dst=Client IP]
```

Client는 처음에 VIP로 요청했으므로 응답도 VIP에서 와야 한다.

만약 Real Server가 자신의 IP로 직접 응답하면 Client 입장에서는 예상하지 못한 IP에서 응답이 온 것이므로 정상적인 연결로 보기 어렵다.

### NAT 방식의 문제

NAT 방식은 구조가 단순하지만 모든 요청과 응답이 L4 장비를 지나야 한다.

```text
Client → L4 → Real Server
Client ← L4 ← Real Server
```

이 구조에서는 L4 장비가 다음 역할을 모두 담당한다.

- 요청 패킷 분산
- 응답 패킷 처리
- DNAT/SNAT
- Connection tracking
- Health check

트래픽이 작을 때는 문제가 없지만, 응답 트래픽이 커질수록 L4 장비가 병목이 되기 쉽다.

특히 Web 서비스는 보통 요청보다 응답이 훨씬 크다.

```text
request:  HTTP GET /video
response: large video file
```

이때 응답까지 모두 L4를 거치면 Real Server를 여러 대 늘려도 L4 장비의 네트워크 대역폭, PPS, conntrack 용량이 먼저 한계에 도달할 수 있다.

또한 L4가 단일 장애 지점(SPOF, Single Point of Failure)이 되기 때문에 HA 구성이 필수다.

---

## DSR

**DSR(Direct Server Return)** 은 이름 그대로 Real Server가 응답을 L4 장비로 돌려보내지 않고 Client에게 직접 반환하는 방식이다.

```text
request:
Client → L4 → Real Server

response:
Client ← Real Server
```

NAT 방식과 가장 큰 차이는 **response path** 에 있다.

```text
NAT mode:
Client → L4 → Real Server
Client ← L4 ← Real Server

DSR mode:
Client → L4 → Real Server
Client ← Real Server
```

L4 장비는 요청 방향에서만 Real Server를 선택하고, 응답 트래픽은 처리하지 않는다.

따라서 응답 트래픽이 큰 서비스에서는 L4 장비의 부하를 크게 줄일 수 있다.

### DSR에서 VIP가 필요한 이유

DSR에서는 Real Server가 Client에게 직접 응답한다.

그런데 Client는 VIP로 요청했기 때문에 응답의 Source IP도 VIP여야 한다.

```text
Client request:
src=Client IP, dst=VIP

Server response:
src=VIP, dst=Client IP
```

이를 위해 Real Server도 VIP를 로컬 주소로 가지고 있어야 한다.

일반적으로 Linux에서는 loopback interface에 VIP를 `/32` 로 설정한다.

```bash
ip addr add 203.0.113.10/32 dev lo
```

이렇게 하면 Real Server는 목적지가 VIP인 패킷을 자기 자신에게 온 패킷으로 처리할 수 있고, 응답할 때도 VIP를 Source IP로 사용할 수 있다.

### Real Server가 VIP ARP에 응답하면 안 된다

DSR 구성에서 VIP의 진입점은 L4 장비여야 한다.

만약 Real Server가 VIP에 대한 ARP 요청에 응답하면 Client 또는 upstream switch/router가 L4가 아니라 Real Server로 직접 트래픽을 보낼 수 있다.

그러면 로드밸런싱이 깨진다.

따라서 Real Server는 VIP를 가지고 있더라도 VIP에 대한 ARP 응답을 하지 않도록 설정해야 한다.

```bash
sysctl -w net.ipv4.conf.all.arp_ignore=1
sysctl -w net.ipv4.conf.all.arp_announce=2
sysctl -w net.ipv4.conf.lo.arp_ignore=1
sysctl -w net.ipv4.conf.lo.arp_announce=2
```

정리하면 DSR의 기본 전제는 다음과 같다.

- Client는 VIP로 요청한다.
- L4 장비가 VIP 트래픽의 진입점이다.
- Real Server도 VIP를 로컬 주소로 가지고 있다.
- Real Server는 VIP에 대한 ARP 응답을 하지 않는다.
- Real Server의 응답은 L4를 거치지 않고 Client로 직접 나간다.

---

## L2 DSR

L2 DSR은 L4 장비가 패킷의 IP 헤더는 유지하고 **Ethernet MAC 주소만 바꿔서** Real Server로 전달하는 방식이다.

```text
Before:
Ethernet dst = L4 MAC
IP dst       = VIP

After:
Ethernet dst = Real Server MAC
IP dst       = VIP
```

IP 헤더의 목적지는 여전히 VIP다.

Real Server는 loopback에 VIP를 가지고 있으므로 이 패킷을 로컬 패킷으로 처리한다.

```text
Client → VIP
L4: dst MAC만 Real Server MAC으로 변경
Real Server: dst IP가 VIP인 패킷을 처리
Real Server → Client 직접 응답
```

### L2 DSR의 특징

L2 DSR은 encapsulation이 없기 때문에 오버헤드가 작다.

하지만 L4 장비가 Real Server의 MAC 주소로 직접 패킷을 전달해야 하므로, 보통 L4와 Real Server가 같은 L2 segment에 있어야 한다.

```text
L4 Load Balancer
  ├── Real Server A
  ├── Real Server B
  └── Real Server C

same VLAN / same L2 domain
```

서버가 다른 subnet, 다른 rack, 다른 datacenter에 있으면 L2 DSR 구성은 어려워진다.

---

## L3 DSR

L3 DSR은 Real Server가 같은 L2 segment에 있지 않아도 되도록, L4 장비가 원본 패킷을 **터널링** 해서 Real Server로 전달하는 방식이다.

대표적으로 IP-in-IP, GRE 같은 encapsulation을 사용할 수 있다.

```text
Before:
[IP: Client IP → VIP][TCP/UDP...]

After encapsulation:
[Outer IP: L4 IP → Real Server IP][Inner IP: Client IP → VIP][TCP/UDP...]
```

여기서 핵심은 inner packet이 그대로 유지된다는 점이다.

```text
inner.src = Client IP
inner.dst = VIP
```

Real Server는 outer IP header를 제거한 뒤, inner packet을 처리한다.

inner packet의 목적지는 VIP이고, Real Server는 loopback에 VIP를 가지고 있으므로 정상적으로 요청을 처리할 수 있다.

응답은 다음과 같이 직접 Client에게 나간다.

```text
Real Server response:
[src=VIP][dst=Client IP]
```

### L3 DSR의 특징

L3 DSR은 L2 DSR보다 네트워크 배치 제약이 적다.

L4 장비가 Real Server IP로 라우팅할 수 있고, Real Server가 tunnel decapsulation을 처리할 수 있으면 된다.

대신 다음과 같은 추가 조건이 필요하다.

- Real Server가 IPIP/GRE decapsulation을 지원해야 한다.
- Encapsulation 때문에 MTU를 고려해야 한다.
- 방화벽 또는 보안 장비에서 tunnel protocol을 허용해야 한다.
- 장애 분석 시 outer packet과 inner packet을 함께 봐야 한다.

---

## L4 DSR이라는 표현

DSR을 설명할 때 L2 DSR, L3 DSR과 함께 **L4 DSR** 이라는 표현을 쓰는 경우가 있다.

엄밀히 말하면 DSR 자체는 "응답 경로를 Load Balancer에서 제외하는 구조"이고, L2/L3는 요청 패킷을 Real Server까지 전달하는 방식에 가깝다.

반면 L4는 패킷 전달 방식이라기보다 **TCP/UDP Port와 Connection 정보를 기준으로 Real Server를 선택하는 Load Balancing 계층**을 의미하는 경우가 많다.

예를 들어 다음과 같은 정책이 있다.

```text
VIP 203.0.113.10:80  → web server pool
VIP 203.0.113.10:443 → tls server pool
VIP 203.0.113.10:53  → dns server pool
```

이 경우 L4 장비는 IP뿐 아니라 Port까지 보고 backend pool을 선택한다.

이후 Real Server로 전달하는 방식은 다시 L2 MAC rewrite가 될 수도 있고, L3 tunneling이 될 수도 있다.

따라서 정리하면 다음처럼 보는 것이 좋다.

| 구분 | 의미 |
| --- | --- |
| L2 DSR | MAC 주소를 바꿔 같은 L2 구간의 Real Server로 전달 |
| L3 DSR | IPIP/GRE 등 터널링으로 Real Server까지 전달 |
| L4 DSR | TCP/UDP Port 기준으로 backend를 고르는 L4 로드밸런싱 + DSR 구조를 의미하는 경우가 많음 |

---

## IPIP protocol

IPIP는 IP 패킷 안에 또 다른 IP 패킷을 넣어 전달하는 단순한 tunneling 방식이다.

DSR에서는 L4 장비가 VIP 목적지 패킷을 Real Server까지 보내기 위해 IPIP를 사용할 수 있다.

```text
Original packet:
[IP: Client IP → VIP][TCP: Client Port → 80]

IPIP packet:
[Outer IP: L4 IP → Real Server IP]
  [Inner IP: Client IP → VIP][TCP: Client Port → 80]
```

중간 라우터들은 outer IP header만 보고 패킷을 전달한다.

```text
outer.dst = Real Server IP
```

Real Server에 도착하면 outer IP header를 제거한다.

```text
decapsulation 후:
[Inner IP: Client IP → VIP][TCP: Client Port → 80]
```

Real Server는 이 패킷을 VIP로 들어온 일반 요청처럼 처리한다.

Linux에서는 IPIP tunnel interface를 통해 처리할 수 있다.

```bash
ip tunnel add tunl0 mode ipip local <real-server-ip> remote any
ip link set tunl0 up
ip addr add <vip>/32 dev lo
```

IPIP는 구조가 단순하지만 outer IP header가 추가되므로 MTU가 줄어든다.

일반 IPv4 header가 20 bytes이기 때문에, 기존 MTU가 1500이라면 inner packet은 그보다 작아야 fragmentation을 피할 수 있다.

```text
Ethernet MTU 1500
- Outer IPv4 header 20 bytes
= Inner packet 최대 1480 bytes
```

운영 환경에서는 MSS clamping, MTU 조정, PMTUD 동작 여부를 함께 확인해야 한다.

---

## DSR의 장점

DSR의 가장 큰 장점은 응답 트래픽이 L4 장비를 거치지 않는다는 점이다.

```text
large response:
Real Server → Client
```

덕분에 다음 효과를 기대할 수 있다.

- L4 장비의 outbound 대역폭 부담 감소
- 응답 트래픽 처리 병목 완화
- Real Server 수평 확장 효과 증가
- NAT/conntrack 부담 감소
- 대용량 다운로드, 스트리밍, CDN edge 같은 read-heavy 서비스에 유리

요청은 작고 응답이 큰 서비스일수록 DSR의 이점이 커진다.

---

## DSR의 주의점

DSR은 성능상 장점이 있지만 NAT 방식보다 운영 조건이 까다롭다.

### 1. Real Server에 VIP 설정이 필요하다

Real Server가 목적지 VIP 패킷을 로컬 패킷으로 처리해야 하므로 VIP를 loopback 등에 설정해야 한다.

```bash
ip addr add <vip>/32 dev lo
```

### 2. ARP 설정이 필요하다

Real Server가 VIP에 대해 ARP 응답하면 L4를 우회하는 트래픽이 생길 수 있다.

따라서 ARP ignore/announce 설정이 필요하다.

### 3. 비대칭 라우팅을 이해해야 한다

DSR은 request path와 response path가 다르다.

```text
request:  Client → L4 → Real Server
response: Client ← Real Server
```

방화벽, 보안 장비, flow 기반 모니터링 시스템은 양방향 트래픽이 같은 장비를 지나간다고 가정하는 경우가 많다.

이런 환경에서는 DSR의 비대칭 경로가 문제를 만들 수 있다.

### 4. L7 기능과는 잘 맞지 않는다

DSR은 L4 수준에서 요청을 분산하고 응답을 직접 반환하는 구조다.

따라서 다음 기능이 필요한 경우에는 L7 Proxy 방식이 더 적합할 수 있다.

- TLS termination
- HTTP header 기반 routing
- Cookie 기반 session 처리
- WAF
- Response body 수정
- 상세한 application metric 수집

DSR은 "빠르게 전달하고 빠르게 빠지는" 구조에 가깝고, L7 Proxy는 "중간에서 내용을 이해하고 제어하는" 구조에 가깝다.

### 5. Outbound 경로와 보안 정책을 확인해야 한다

DSR 응답은 Real Server에서 Client로 직접 나간다.

따라서 Real Server의 default gateway, source IP가 VIP인 패킷에 대한 방화벽 정책, upstream router의 anti-spoofing 정책을 함께 확인해야 한다.

특히 Real Server가 사설망에 있고 VIP가 공인 IP인 구조라면, 네트워크 장비가 `src=VIP` 패킷을 정상적인 출발지로 허용하는지 확인해야 한다.

---

## 정리

DSR은 Load Balancer가 요청 방향에서만 Real Server를 선택하고, 응답은 Real Server가 Client에게 직접 보내도록 만드는 구조다.

```text
NAT:
Client → L4 → Real Server
Client ← L4 ← Real Server

DSR:
Client → L4 → Real Server
Client ← Real Server
```

응답 트래픽이 큰 서비스에서는 L4 장비의 병목을 줄일 수 있다는 장점이 있다.

하지만 Real Server의 VIP 설정, ARP 제어, 비대칭 라우팅, tunnel MTU 같은 운영 포인트를 반드시 이해해야 한다.

결국 DSR은 단순히 "빠른 로드밸런싱 방식"이라기보다, 네트워크 경로를 의도적으로 비대칭으로 만들어 응답 트래픽을 분산시키는 설계라고 볼 수 있다.
