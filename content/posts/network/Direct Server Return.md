# Direct Server Return

로드밸런서는 여러 서버 앞에 위치해 Client 요청을 적절한 Real Server로 분산한다.

일반적인 구조에서는 사용자가 **VIP(Virtual IP)** 로 접근하고, L4 장비가 이 요청을 backend 서버 중 하나로 전달한다.

```text
Client → VIP(L4) → Real Server
```

여기서 중요한 점은 Client가 알고 있는 목적지는 Real Server IP가 아니라 **VIP** 라는 것이다.

Client 입장에서는 `VIP` 하나와 통신하는 것처럼 보이고, 실제로 어떤 Real Server가 처리했는지는 알 필요가 없다.

![[Drawio/Direct Server Return - NAT vs DSR.drawio.svg]]

위 전체 경로 다이어그램을 기준으로 보면 왼쪽은 **NAT mode**, 오른쪽은 **DSR mode**다.

파란색 화살표는 request path, 빨간색 화살표는 response path를 의미한다.

이 글에서는 두 방식의 차이를 주로 **response path가 L4를 다시 거치는가**라는 관점에서 볼 것이다.

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

다이어그램에서 각 패널의 `L4 Load Balancer` 박스가 이 역할을 한다.

NAT mode와 DSR mode 모두 request 방향에서는 Client → L4 → Real Server 흐름을 갖는다.

차이는 Real Server가 응답을 보낼 때부터 생긴다.

---

## NAT 방식의 한계와 SPOF

가장 직관적인 방식은 Load Balancer가 NAT를 수행하는 것이다.

Client는 VIP로 요청을 보내고, L4는 NAT를 통해 패킷의 IP header를 바꿔 Real Server로 전달한다.

IP header 변화만 따로 보면 다음과 같다.

![[Drawio/Direct Server Return - IP Header Flow.drawio.svg]]

위 헤더 다이어그램의 왼쪽 NAT mode를 보면 request에서는 **DNAT**, response에서는 **SNAT**이 필요하다.

### Request 방향

request 방향에서는 L4가 `dst=VIP`를 `dst=Real Server IP`로 바꾼다.

Source IP는 Client IP 그대로 둔다.

그래서 Real Server는 목적지가 자신의 IP인 일반 패킷처럼 요청을 처리할 수 있다.

### Response 방향

Real Server가 Client에게 응답할 때는 다시 L4를 거쳐야 한다.

response 방향에서는 L4가 `src=Real Server IP`를 `src=VIP`로 바꾼다.

Client는 VIP로 요청했기 때문에, 응답도 VIP에서 온 것처럼 보여야 TCP 연결이 자연스럽게 유지된다.

### NAT 방식의 문제

NAT 방식은 구조가 단순하지만 모든 요청과 응답이 L4 장비를 지나야 한다.

이 구조에서는 L4 장비가 다음 역할을 모두 담당한다.

- 요청 패킷 분산
- 응답 패킷 처리
- DNAT/SNAT
- Connection tracking
- Health check

전체 경로 다이어그램 왼쪽의 note에 적힌 `DNAT / SNAT`, `conntrack 필요`, `양방향 트래픽 처리`가 이 부담을 요약한다.

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

위 헤더 다이어그램의 오른쪽 DSR mode를 보면 request는 `src=Client IP`, `dst=VIP`를 유지한 채 Real Server에 도착한다.

응답은 `src=VIP`, `dst=Client IP`로 Real Server가 직접 보낸다.

NAT 방식과 가장 큰 차이는 **response path** 에 있다.

전체 경로 다이어그램에서 NAT mode의 빨간색 response는 L4를 통과하지만, DSR mode의 빨간색 response는 L4를 우회한다.

L4 장비는 요청 방향에서만 Real Server를 선택하고, 응답 트래픽은 처리하지 않는다.

따라서 응답 트래픽이 큰 서비스에서는 L4 장비의 부하를 크게 줄일 수 있다.

### DSR에서 VIP가 필요한 이유

DSR에서는 요청 패킷의 목적지가 여전히 VIP다.

따라서 Real Server도 VIP를 로컬 주소로 가지고 있어야 한다.

일반적으로 Linux에서는 loopback interface에 VIP를 `/32` 로 설정한다.

```bash
ip addr add 203.0.113.10/32 dev lo
```

이렇게 하면 Real Server는 목적지가 VIP인 패킷을 자기 자신에게 온 패킷으로 처리할 수 있고, 응답할 때도 VIP를 Source IP로 사용할 수 있다.

Real Server의 실제 IP는 `10.0.1.11` 같은 backend IP일 수 있지만, Client와의 TCP 연결 관점에서는 VIP가 서버 주소처럼 보여야 한다.

### Real Server가 VIP ARP에 응답하면 안 된다

DSR 구성에서 VIP의 진입점은 L4 장비여야 한다.

전체 경로 다이어그램 오른쪽의 L4 박스에 `VIP entrypoint`라고 표시한 것도 이 때문이다.

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

위 다이어그램의 DSR mode는 개념적으로 `Client → L4 → Real Server` 요청 흐름만 보여준다.

L2 DSR은 이 요청 흐름을 만들 때 L4가 IP 주소를 바꾸지 않고, 다음 홉의 MAC 주소만 Real Server MAC으로 바꾸는 방식이라고 보면 된다.

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

다이어그램 오른쪽의 request 경로를 L3 DSR로 구현한다면, L4와 Real Server 사이의 파란색 화살표는 단순 Ethernet 전달이 아니라 IPIP/GRE 같은 tunnel 구간이 된다.

대표적으로 IP-in-IP, GRE 같은 encapsulation을 사용할 수 있다.

헤더 다이어그램 하단처럼 outer header는 Real Server까지 라우팅하기 위한 껍데기고, inner header는 원래 요청인 `Client IP → VIP` 그대로 유지된다.

Real Server는 outer header를 제거한 뒤 inner packet을 처리하고, 응답은 `VIP → Client IP`로 직접 보낸다.

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

헤더 다이어그램 하단의 IPIP 구간처럼, L4는 원래 패킷을 outer IP header로 한 번 더 감싼다.

중간 라우터들은 outer IP header만 보고 패킷을 전달한다.

```text
outer.dst = Real Server IP
```

Real Server에 도착하면 outer header만 제거한다.

inner header는 `src=Client IP`, `dst=VIP` 그대로 남아 있으므로, Real Server는 이 패킷을 VIP로 들어온 일반 요청처럼 처리한다.

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

전체 경로 다이어그램에서 가장 중요한 차이는 왼쪽 NAT mode의 빨간색 response 화살표가 L4를 통과하지만, 오른쪽 DSR mode의 빨간색 response 화살표는 L4를 우회한다는 점이다.

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

전체 경로 다이어그램만 보면 DSR mode가 단순해 보이지만, 실제 운영에서는 오른쪽 그림의 `direct response`가 가능하도록 서버와 네트워크 장비를 맞춰야 한다.

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

전체 경로 다이어그램 오른쪽이 바로 이 비대칭 라우팅을 보여준다.

파란색 request는 L4를 지나지만, 빨간색 response는 L4를 지나지 않는다.

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

전체 경로 다이어그램의 오른쪽 빨간색 `direct response` 경로가 실제 네트워크에서도 허용되어야 DSR이 정상 동작한다.

---

## 정리

DSR은 Load Balancer가 요청 방향에서만 Real Server를 선택하고, 응답은 Real Server가 Client에게 직접 보내도록 만드는 구조다.

NAT와 DSR 모두 요청은 L4가 Real Server를 선택하지만, 응답 경로는 다르다.

NAT는 응답도 L4를 거치고, DSR은 Real Server가 Client에게 직접 응답한다.

응답 트래픽이 큰 서비스에서는 L4 장비의 병목을 줄일 수 있다는 장점이 있다.

하지만 Real Server의 VIP 설정, ARP 제어, 비대칭 라우팅, tunnel MTU 같은 운영 포인트를 반드시 이해해야 한다.

결국 DSR은 단순히 "빠른 로드밸런싱 방식"이라기보다, 네트워크 경로를 의도적으로 비대칭으로 만들어 응답 트래픽을 분산시키는 설계라고 볼 수 있다.
