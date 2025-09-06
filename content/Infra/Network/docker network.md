
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


### 인터페이스 별 통신
#### bridge

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


![[Pasted image 20250906163836.png]]

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

vethee2b3d1: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet6 fe80::f0ad:b6ff:fe05:d300  prefixlen 64  scopeid 0x20<link>
        ether f2:ad:b6:05:d3:00  txqueuelen 0  (Ethernet)
        RX packets 865  bytes 6961666 (6.9 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1267  bytes 346544 (346.5 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

vethf3e5e1e: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet6 fe80::3cf6:9bff:fe36:245a  prefixlen 64  scopeid 0x20<link>
        ether 3e:f6:9b:36:24:5a  txqueuelen 0  (Ethernet)
        RX packets 3  bytes 126 (126.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 18  bytes 1752 (1.7 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

````

- 별도의 네트워크를 지정하지 않는 컨테이너는 default bridge 네트워크 docker0에 붙여서 연결
- 컨테이너간 네트워크 연결

#### Ref
https://docs.docker.com/engine/network/