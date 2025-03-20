
### TCP/IP 란?
TCP/IP는 인터넷에서 사용되는 핵심 프로토콜 스택으로, 데이터를 신뢰성 있게 전달하는 **전송 계층(Transport Layer)의 TCP**와, 목적지까지의 **라우팅을 담당하는 네트워크 계층(Network Layer)의 IP** 프로토콜을 함께 사용하는 것을 의미합니다.

- **IP (Internet Protocol, 인터넷 프로토콜)**
    
    - 패킷을 목적지까지 전달하는 역할
    - 호스트의 주소 지정 (IP 주소)
    - 패킷이 최적의 경로를 통해 이동하도록 라우팅
- **TCP (Transmission Control Protocol, 전송 제어 프로토콜)**
    
    - 신뢰성 있는 데이터 전송 제공 (패킷 손실, 순서 보장, 흐름/혼잡 제어)
    - 연결 지향적 프로토콜 (3-way handshake, 4-way teardown)

TCP/IP는 계층적으로 설계되어 있어 **각 계층이 독립적으로 동작**하면서도, 전체적으로 신뢰성 있는 네트워크 통신을 가능하게 합니다.

### TCP의 특징

![[Pasted image 20250308152908.png]]
- connection oriented
	- 3 handshake를 통해 연결
	- 4 handshake를 통해 종료
		- 종료 이후에도 송신한 패킷 받기 가능
- reliable transport
	-  패킷 손실 발생 시 **재전송** (ACK, Timeout 기반)
	- 패킷 순서를 보장 (Sequence Number 활용)
- flow control
	- 송신자가 수신자의 처리 속도를 초과하지 않도록 조정
- congestion control
	- 네트워크 상태를 고려하여 패킷 전송 속도를 조절



### IP 프로토콜의 라우팅 방법
IP 프로토콜을 패킷 단위로 데이터를 전송하게 되는데, 단 엣지를 통과할 때, 다음 router를 거치게 되고 해당 라우터는 패킷의 IP address에 매핑된 다음 라우터의 목적지로 전송하게 된다.

이 때, 라우터는 라우팅 테이블에 IP 대역마다 다음 hop을 저장하게 된다

주로 동적 라우팅 사용
#### 동적 라우팅
- 라우터들이 서로 정보를 교환하여 최적 경로를 자동으로 설정
- 네트워크 변화에 유동적으로 대응 가능 (물리적 단절, 최적 경로 업데이트)
- 주요 프로토콜:
    - **RIP (Routing Information Protocol)**: 거리 벡터 방식, 홉 수 기반
    - **OSPF (Open Shortest Path First)**: 링크 상태 방식, 다익스트라 알고리즘 기반
    - **BGP (Border Gateway Protocol)**: AS(자율 시스템) 간 라우팅


### 라우팅 테이블?
![[Pasted image 20250308150616.png]]

```bash
~ ❯ netstat -nr                                                               
Routing tables

Internet:
Destination        Gateway            Flags               Netif Expire
default            192.168.1.1        UGScg                 en0
127                127.0.0.1          UCS                   lo0
127.0.0.1          127.0.0.1          UH                    lo0
169.254            link#13            UCS                   en0      !
169.254.9.77       f8:63:3f:f:3f:7f   UHLSW                 en0     33
169.254.40.205     f8:63:3f:9:f1:14   UHLSW                 en0      !
169.254.65.198     90:78:41:9f:63:c0  UHLSW                 en0      !
169.254.92.93      2c:d:a7:b7:fb:dd   UHLSW                 en0   1111
169.254.109.130    bc:38:98:3:83:42   UHLSW                 en0      !
169.254.136.79     9c:29:76:cd:e6:14  UHLSW                 en0      !
169.254.152.208    98:af:65:a1:7c:55  UHLSW                 en0   1147
169.254.156.185    b6:5e:9b:fd:45:ba  UHLSW                 en0      !
169.254.169.183    8:6a:c5:86:a3:f8   UHLSW                 en0   1044
169.254.196.71     aa:66:df:c2:6c:77  UHLSW                 en0      !
169.254.210.25     d4:e9:8a:f9:4a:7   UHLSW                 en0      !
```

요런식으로 IP CIDR에 따라 gateway(외부 네트워크 연결 통로) 지정


### Congestion control

![[Pasted image 20250308151545.png]]

트래픽의 속도를 조절하는 기능, congestion window와 recevier advertised window 상요

1. slow start
	1. ACK 하나 받은 이후, CWND +1 -> 두배씩 커짐
2. Congestion Avoidance
	1. ****ssthresh**** 도달
	2. cwnd 모두 ack 오면, cwnd +1
3. Congestion Detection Phase
	- `Timeout` or `3 dup ack` trigger 
	-  Tahoe algo
		1. **cwnd** = 1
		2. **ssthresh** / 2
		3. 다시 slow start
	-  Reno algo
		1. **ssthresh** / 2
		2. **cwnd** = **ssthresh**
		3. 다시 slow start


### TCP 3 handshake 

**Connection 3 handshake**
client : SYNC
server: SYNC + ACK
client : ACK

terminate connection 4 handshake



####  SYNC flooding?
![[Pasted image 20250308151744.png]]

다중의 client SYNC 요청을 보내고, ACK를 보내지 않아서 서버가 ACK를 계속 기다리게 하고, 리소스를 낭비하게 함
- 서버는 한번의 연결동안 포트와 socket을 open
- 포트와 소켓은 한정되어있으므로 limit시 다른 요청 처리 불가

#### Sync flooding 대응 방법
- tcp connection timeout을 두어 half-open 상태를 지속하지 않도록함
- Increasing Backlog queue (대기 상태의 queue)
- IP 및 트래픽 필터링
- SYN Cookies


#### Sync Cookie?

기존 SYNC의 initial sequence number(32bit) 대신에
- **T (5비트)**: 현재 시스템 시간을 기반으로 한 값 (wrap-around 방지를 위해)
- **MSS (3비트)**: 클라이언트가 보낸 SYN 패킷의 Maximum Segment Size 값
- **Hash (24비트)**: 서버의 비밀 키, 클라이언트 IP, 포트 번호, 초기 Sequence Number 등을 조합해 만든 해시 값

넣어서 보냄

1. L4 방화벽을 두어 서버로 요청 시, Sync Cookie를 방화벽에서 발급
2. client가 Sync cookie로부터 SYN Cookie + 1를 방화벽으로 전송
3. server ACK Number - 1로 복호화해서 검증

**L4 방화벽 Proxy vs Transparent**
- Proxy
	- client <-> L4 <-> Server 각자의 tcp 연결 수립
	- 모든 통신을 L4가 중개
- Transparent
	- 쿠키 발행 및 검증만 진행
	- client <-> server tcp 연결 수립



### TCP vs UDP

### flow control vs congestion control




IP