
[[IPSec]] 기반의 VPN이 주로 **Site-to-Site** 연결을 위해 사용된다면,

**SSL VPN**은 외부 인터넷에 있는 개별 사용자가 사내망에 안전하게 접근할 수 있도록 만들어진 VPN 방식


![[Pasted image 20250903223849.png]]


SSL VPN을 위해서는 **VPN 장비가 공인 IP**를 가지고 있어야 하며 (DMZ에 배치), 동시에 **사설 대역 IP 풀**을 관리 

사용자가 VPN에 접속하면, 이 풀에서 사설 IP를 할당받아 터널 내부에서 통신

이 과정에서 VPN 장비는 **Destination IP NAT** 역할하기도 함 
-> 외부 사용자의 트래픽을 사내망에 맞게 변환해 전달


### 암호화

SSL VPN은 이름 그대로 **SSL(Secure Socket Layer, 현재는 TLS로 발전)** 기반의 암호화를 사용

클라이언트와 VPN 장비는 HTTPS와 동일한 방식으로 **SSL/TLS Handshake** 를 수행하여 세션 키를 교환하고, 이후 트래픽은 암호화된 터널을 통해 전송

![[Pasted image 20250903224137.png]]



### Client routing table update

TLS Handshake가 끝나고 터널이 맺어지면, 클라이언트는 VPN 장비로부터 **라우팅 경로(Route Push)** 를 전달받고 업데이트하는데,이때 두 가지 방식 존재

- **Full Tunnel**: 모든 트래픽을 VPN을 거쳐 전달
- **Split Tunnel**: 특정 사내망 대역만 VPN을 거쳐 전달
  

기업 환경에서는 일반적으로 인터넷 트래픽은 로컬 게이트웨이를 그대로 쓰고, 사내망만 VPN으로 연결하기 위해 **Split Tunnel**을 많이 사용

반면, NordVPN 같은 개인용 VPN 서비스는 사용자의 실제 출발지(Source IP)를 감추기 위해 **Full Tunnel** 방식을 기본으로 사용

VPN off
```
Internet:
Destination        Gateway            Flags        Netif  Expire
default            192.168.0.1        UGScg          en0
127                127.0.0.1          UCS             lo0
127.0.0.1          127.0.0.1          UH              lo0
192.168.0/24       link#4             UCS             en0
192.168.0.1        0:14:22:33:44:55   UHLWIir         en0   1195
192.168.0.23       192.168.0.23       UHS             lo0
224.0.0/4          link#4             UmCS            en0
255.255.255.255    link#4             UHLWbI          en0

````
- default → 192.168.0.1 en0 : 로컬 라우터(공유기)를 기본 게이트웨이로 사용
- 192.168.0/24 link#4 en0 : 동일 서브넷 트래픽은 L2로 직접 송신
- 192.168.0.1 … en0 : 게이트웨이의 ARP 
- 224.0.0/4 : 멀티캐스트(ARP/IGMP 등) 브로드캐스트 관련


full tunnel
```
~ ❯ netstat -nr                                                                  
Internet:

Destination        Gateway            Flags          Netif   Expire
default            10.8.0.5           UGSc           utun3
10.8/24            10.8.0.5           UGSc           utun3
127                127.0.0.1          UCS              lo0
127.0.0.1          127.0.0.1          UH               lo0
192.168.0          link#4             UCS              en0
192.168.0.1        0:14:22:33:44:55   UHLWIir          en0   1195

````
- 기본(default) 경로가 VPN 인터페이스(utun3)로 변경됨
- **모든 트래픽(인터넷 포함)이 VPN 서버를 거쳐 나감**


split tunnel
```
~ ❯ netstat -nr                                                                  
Internet:
Destination        Gateway            Flags          Netif  Expire
default            192.168.0.1        UGScg          en0
10/8               10.8.0.5           UGSc           utun4
172.16/12          10.8.0.5           UGSc           utun4
127                127.0.0.1          UCS              lo0
127.0.0.1          127.0.0.1          UH               lo0
192.168.0          link#4             UCS              en0
192.168.0.1        0:14:22:33:44:55   UHLWIir          en0   1195
````
- **기본(default) 경로는 여전히 로컬 게이트웨이(192.168.0.1)를 사용**
- 대신 특정 사내망 대역(10/8, 172.16/12)만 VPN 인터페이스(utun4)를 통해 전달
