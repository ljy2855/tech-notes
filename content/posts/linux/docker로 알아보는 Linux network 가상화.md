
docker engine에서 네트워크를 어떻게 구성하고, 컨테이너에 연결하는지 정리

> [!NOTE] 운영체제 확인
> Docker는 기본적으로 Linux의 커널 기능을 통해 컨테이너 기술들을 구현. 때문에 Mac, Window에서는 VM위에 docker를 돌리기에, host상에서는 network 인터페이스, 컴퓨팅 리소스가 안보일 수 있음

때문에 해당 실험은 Ubuntu Baremetal 서버에서 진행
### Docker Network

도커 네트워크 드라이버는 다음과 같이 설정할 수 있음

| Driver    | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `bridge`  | The default network driver.                                              |
| `host`    | Remove network isolation between the container and the Docker host.      |
| `none`    | Completely isolate a container from the host and other containers.       |
| `overlay` | Overlay networks connect multiple Docker daemons together.               |
| `ipvlan`  | IPvlan networks provide full control over both IPv4 and IPv6 addressing. |
| `macvlan` | Assign a MAC address to a container.                                     |

- **bridge** : 기본 드라이버. 컨테이너 veth ↔ docker0 (브리지) ↔ host NIC. 호스트는 docker0 IP로 게이트웨이 역할
- **host** : 컨테이너가 host 네트워크 stack을 그대로 공유. 별도 네트워크 네임스페이스 없음, 컨테이너가 host NIC를 직접 사용
- **none** : 네트워크 연결 없음. 컨테이너 네임스페이스에 NIC만 있고 라우팅 없음
- **overlay** : VXLAN 기반으로 여러 host의 Docker 데몬을 하나의 L2 네트워크처럼 묶음. Docker Swarm/K8s 등에서 사용
- **ipvlan** : 컨테이너가 host NIC와 동일한 L2 도메인에서 IP를 직접 받음. bridge 불필요, VLAN 기반으로 L3 라우팅 
- **macvlan** : 컨테이너가 고유한 MAC 주소를 받아 host NIC를 스위치에 “물리 장비 여러 대”처럼 보이게 함

### Linux Network Interface


리눅스에서 **네트워크 인터페이스(Network Interface)** 는 네트워크 계층에서 데이터를 송수신하기 위해 커널이 제공하는 논리적 장치

하드웨어/소프트웨어 구현에 따라 물리 인터페이스와 가상 인터페이스로 나뉨

  
 **물리 인터페이스 (Physical NIC)**

- 서버나 PC에 장착된 실제 네트워크 카드 (ex. eth0, enp2s0)
- 하드웨어 MAC 주소를 가지며 스위치/라우터 같은 물리 네트워크 장비와 직접 연결
- 외부 네트워크와 통신하기 위한 기본 경로


**가상 인터페이스 (Virtual NIC)**

소프트웨어적으로 여러 종류의 가상 인터페이스를 제공

- **loopback (lo)**: 자기 자신과 통신하기 위한 인터페이스. 항상 127.0.0.1 로 연결됨.
- **bridge (docker0, br-xxxxxx)**: 소프트웨어 스위치 역할. 여러 NIC을 묶어 같은 네트워크 세그먼트에 두는 기능
- **veth**: 가상 이더넷 페어(링크). 물리적인 이더넷 연결 가상화
- **tun/tap**: 사용자 공간과 커널 네트워크 스택을 연결하는 가상 장치. VPN에서 사용
- **macvlan/ipvlan**: 가상으로 별도의 MAC/IP를 가진 인터페이스를 호스트 NIC 위에 올려서, 컨테이너가 외부 네트워크에 직접 붙은 것처럼 동작

**IP**

각 인터페이스는 **IP 주소**, **netmask**, **gateway** 등을 설정 가능

- 물리 NIC: 외부 네트워크와 직접 연결되므로 ISP나 내부 DHCP 서버에서 IP를 받음
- 가상 NIC: Docker나 K8s, VPN 같은 소프트웨어가 IPAM(IP Address Management)을 통해 주소를 할당


### 실험

```yml
services:
  # default bridge(docker0)에 붙는 컨테이너
  web-default:
    image: nginx:alpine
    container_name: web-default
    restart: unless-stopped
    # 로컬에서 바로 보기 쉽게 포트 하나만 매핑
    ports:
      - "18080:80"

  # 사용자 정의 bridge(br-xx)에 붙는 컨테이너 1
  web-bridge-1:
    image: nginx:alpine
    container_name: web-bridge-1
    restart: unless-stopped
    networks:
      br_xx:
        ipv4_address: 172.30.0.10

  # 사용자 정의 bridge(br-xx)에 붙는 컨테이너 2
  web-bridge-2:
    image: nginx:alpine
    container_name: web-bridge-2
    restart: unless-stopped
    networks:
      br_xx:
        ipv4_address: 172.30.0.11
networks:
  br_xx:
    driver: bridge
    ipam:
      config:
        - subnet: 172.30.0.0/16
          gateway: 172.30.0.1


````


**네트워크 구성도**

![[Pasted image 20250906163836.png]]
- 별도의 네트워크를 지정하지 않는 컨테이너는 default bridge 네트워크 docker0에 붙여서 연결
- 컨테이너간 네트워크 연결은 bridge interface를 통해 연결


**host의 인터페이스 확인**

```
cocopam@soyo:~/docker-network-test$ ifconfig
br-cbbf334f7335: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.30.0.1  netmask 255.255.0.0  broadcast 172.30.255.255
        inet6 fe80::8f8:f4ff:fec7:cb37  prefixlen 64  scopeid 0x20<link>
        ether 0a:f8:f4:c7:cb:37  txqueuelen 0  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

docker0: flags=4099<UP,BROADCAST,MULTICAST>  mtu 1500
        inet 172.17.0.1  netmask 255.255.0.0  broadcast 172.17.255.255
        inet6 fe80::780f:6aff:fe8b:f762  prefixlen 64  scopeid 0x20<link>
        ether 7a:0f:6a:8b:f7:62  txqueuelen 0  (Ethernet)
        RX packets 13349  bytes 10863266 (10.8 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 15979  bytes 2222681 (2.2 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

enp2s0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.0.21  netmask 255.255.255.0  broadcast 192.168.0.255
        inet6 fe80::e251:d8ff:fe19:d971  prefixlen 64  scopeid 0x20<link>
        ether e0:51:d8:19:d9:71  txqueuelen 1000  (Ethernet)
        RX packets 4305101  bytes 3610932183 (3.6 GB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 2058422  bytes 377432017 (377.4 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 542525534  bytes 113566300139 (113.5 GB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 542525534  bytes 113566300139 (113.5 GB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

veth5f81027: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet6 fe80::e805:acff:fe5b:a1a0  prefixlen 64  scopeid 0x20<link>
        ether ea:05:ac:5b:a1:a0  txqueuelen 0  (Ethernet)
        RX packets 3  bytes 126 (126.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 15  bytes 1626 (1.6 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

veth3931235: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet6 fe80::74b6:a4ff:fe8e:ffe7  prefixlen 64  scopeid 0x20<link>
        ether 76:b6:a4:8e:ff:e7  txqueuelen 0  (Ethernet)
        RX packets 3  bytes 126 (126.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 16  bytes 1580 (1.5 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

vethf3e5e1e: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet6 fe80::3cf6:9bff:fe36:245a  prefixlen 64  scopeid 0x20<link>
        ether 3e:f6:9b:36:24:5a  txqueuelen 0  (Ethernet)
        RX packets 3  bytes 126 (126.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 18  bytes 1752 (1.7 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

````
- 새로운 `br-cbbf334f7335` 브릿지 인터페이스 생성
- veth 가상 이더넷 링크 3개 생성

**bridge에 링크된 인터페이스**

```
cocopam@soyo:~/docker-network-test$ brctl show br-cbbf334f7335
bridge name	        bridge id		    STP enabled	   interfaces
br-cbbf334f7335		8000.0af8f4c7cb37	no		       veth3931235
							                           vethf3e5e1e

````
- 생성된 브릿지에 링크된 두 개의 veth 확인


**Host routing table 확인**

```
cocopam@soyo:~/docker-network-test$ netstat -nr
Kernel IP routing table
Destination     Gateway         Genmask         Flags   MSS Window  irtt Iface
0.0.0.0         192.168.0.1     0.0.0.0         UG        0 0          0 enp2s0
172.17.0.0      0.0.0.0         255.255.0.0     U         0 0          0 docker0
172.30.0.0      0.0.0.0         255.255.0.0     U         0 0          0 br-cbbf334f7335
192.168.0.0     0.0.0.0         255.255.255.0   U         0 0          0 enp2s0
192.168.0.1     0.0.0.0         255.255.255.255 UH        0 0          0 enp2s0

````
- 할당한 네트워크이 사설 대역 172.30.0.0/16 라우팅은 생성한 `br-cbbf334f733`로 감
- 때문에 HOST에서도 bridge를 타고 컨테이너에 접근 가능


라우팅 테스트

```
cocopam@soyo:~/docker-network-test$ docker exec -it web-bridge-1 ifconfig
eth0      Link encap:Ethernet  HWaddr 7E:93:22:8D:92:C5
          inet addr:172.30.0.10  Bcast:172.30.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:18 errors:0 dropped:0 overruns:0 frame:0
          TX packets:3 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0
          RX bytes:1752 (1.7 KiB)  TX bytes:126 (126.0 B)

lo        Link encap:Local Loopback
          inet addr:127.0.0.1  Mask:255.0.0.0
          inet6 addr: ::1/128 Scope:Host
          UP LOOPBACK RUNNING  MTU:65536  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:0 (0.0 B)  TX bytes:0 (0.0 B)

````
- 컨테이너 내부의 eth0에 172.30.0.10가 할당되어있고, 해당 링크의 MAC이 `7E:93:22:8D:92:C5` 인것을 확인


**host bridge tcp dump**

```
cocopam@soyo:~$ docker exec -it web-bridge-1 ping 172.30.0.11
PING 172.30.0.11 (172.30.0.11): 56 data bytes
64 bytes from 172.30.0.11: seq=0 ttl=64 time=0.539 ms
64 bytes from 172.30.0.11: seq=1 ttl=64 time=0.189 ms
64 bytes from 172.30.0.11: seq=2 ttl=64 time=0.183 ms



cocopam@soyo:~/docker-network-test$ sudo tcpdump -i br-cbbf334f7335
tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
listening on br-cbbf334f7335, link-type EN10MB (Ethernet), snapshot length 262144 bytes
21:54:33.977616 ARP, Request who-has 172.30.0.11 tell 172.30.0.10, length 28
21:54:33.977694 ARP, Reply 172.30.0.11 is-at 7a:7c:8e:e5:dd:93 (oui Unknown), length 28
21:54:33.977710 IP 172.30.0.10 > 172.30.0.11: ICMP echo request, id 47, seq 0, length 64
21:54:33.977936 IP 172.30.0.11 > 172.30.0.10: ICMP echo reply, id 47, seq 0, length 64
21:54:34.978097 IP 172.30.0.10 > 172.30.0.11: ICMP echo request, id 47, seq 1, length 64
21:54:34.978184 IP 172.30.0.11 > 172.30.0.10: ICMP echo reply, id 47, seq 1, length 64
21:54:35.978355 IP 172.30.0.10 > 172.30.0.11: ICMP echo request, id 47, seq 2, length 64
21:54:35.978439 IP 172.30.0.11 > 172.30.0.10: ICMP echo reply, id 47, seq 2, length 64
21:54:36.978563 IP 172.30.0.10 > 172.30.0.11: ICMP echo request, id 47, seq 3, length 64
21:54:36.978657 IP 172.30.0.11 > 172.30.0.10: ICMP echo reply, id 47, seq 3, length 64
21:54:37.978790 IP 172.30.0.10 > 172.30.0.11: ICMP echo request, id 47, seq 4, length 64
21:54:37.978873 IP 172.30.0.11 > 172.30.0.10: ICMP echo reply, id 47, seq 4, length 64
21:54:38.979002 IP 172.30.0.10 > 172.30.0.11: ICMP echo request, id 47, seq 5, length 64
21:54:38.979089 IP 172.30.0.11 > 172.30.0.10: ICMP echo reply, id 47, seq 5, length 64
21:54:39.337760 ARP, Request who-has 172.30.0.10 tell 172.30.0.11, length 28
21:54:39.337843 ARP, Reply 172.30.0.10 is-at 7e:93:22:8d:92:c5 (oui Unknown)
````
- web-bridge-1(172.30.0.10) 에서 web-bridge-2(172.30.0.11) ping을 확인
	- ICMP를 위해서 IP를 MAC으로 변환하는 ARP 패킷 전송
	- 이후 web-bridge-2에서 eth0 MAC 전달 (arp reply)


**bridge mac table 확인**

```
cocopam@soyo:~/docker-network-test$ sudo bridge fdb show | grep br-cbbf334f7335
33:33:00:00:00:01 dev br-cbbf334f7335 self permanent
33:33:00:00:00:02 dev br-cbbf334f7335 self permanent
01:00:5e:00:00:6a dev br-cbbf334f7335 self permanent
33:33:00:00:00:6a dev br-cbbf334f7335 self permanent
01:00:5e:00:00:01 dev br-cbbf334f7335 self permanent
33:33:ff:c7:cb:37 dev br-cbbf334f7335 self permanent
33:33:ff:00:00:00 dev br-cbbf334f7335 self permanent
0a:f8:f4:c7:cb:37 dev br-cbbf334f7335 vlan 1 master br-cbbf334f7335 permanent
0a:f8:f4:c7:cb:37 dev br-cbbf334f7335 master br-cbbf334f7335 permanent
7e:93:22:8d:92:c5 dev vethf3e5e1e master br-cbbf334f7335
3e:f6:9b:36:24:5a dev vethf3e5e1e vlan 1 master br-cbbf334f7335 permanent
3e:f6:9b:36:24:5a dev vethf3e5e1e master br-cbbf334f7335 permanent
7a:7c:8e:e5:dd:93 dev veth3931235 master br-cbbf334f7335
76:b6:a4:8e:ff:e7 dev veth3931235 vlan 1 master br-cbbf334f7335 permanent
76:b6:a4:8e:ff:e7 dev veth3931235 master br-cbbf334f7335 permanent
````
- web-bridge-1
	- 컨테이너 내부의 `7E:93:22:8D:92:C5` eth0 MAC -> vethf3e5e1e로  포워딩
	- veth MAC `76:b6:a4:8e:ff:e7` 
- 마찬가지로 web-bridge-2도 연결된 것 확인 가능

#### Ref
https://docs.docker.com/engine/network/