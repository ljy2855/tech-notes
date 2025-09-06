
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


```
networks:
  intranet_net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
````

해당 docker compose stack을 만들면, 도커 네트워크가 생성된다.

```sh
cocopam@soyo:~/vpn$ docker compose up -d
cocopam@soyo:~/vpn$ ifconfig
br-c9234b05d1ca: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.28.0.1  netmask 255.255.0.0  broadcast 172.28.255.255
        inet6 fe80::786b:2eff:fed9:a1eb  prefixlen 64  scopeid 0x20<link>
        ether 7a:6b:2e:d9:a1:eb  txqueuelen 0  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
````


### Linux Network Interface


리눅스에서 **네트워크 인터페이스(Network Interface)** 는 네트워크 계층에서 데이터를 송수신하기 위해 커널이 제공하는 논리적 장치

하드웨어/소프트웨어 구현에 따라 물리 인터페이스와 가상 인터페이스로 나뉨

  
 **물리 인터페이스 (Physical NIC)**

- 서버나 PC에 장착된 실제 네트워크 카드 (ex. eth0, enp2s0)
- 하드웨어 MAC 주소를 가지며 스위치/라우터 같은 물리 네트워크 장비와 직접 연결
- 외부 네트워크와 통신하기 위한 기본 경로
    

### **가상 인터페이스 (Virtual NIC)**

  

리눅스 커널은 소프트웨어적으로 여러 종류의 가상 인터페이스를 제공합니다.

대표적인 예:

- **loopback (lo)**: 자기 자신과 통신하기 위한 인터페이스. 항상 127.0.0.1 로 연결됨.
    
- **bridge (docker0, br-xxxxxx)**: 소프트웨어 스위치 역할. 여러 NIC을 묶어 같은 네트워크 세그먼트에 두는 기능. Docker가 네트워크를 만들면 여기 붙습니다.
    
- **veth**: 가상 이더넷 페어. 한쪽 끝은 컨테이너 내부로, 다른 끝은 호스트 네임스페이스에 남습니다.
    
- **tun/tap**: 사용자 공간과 커널 네트워크 스택을 연결하는 가상 장치. VPN에서 사용.
    
- **macvlan/ipvlan**: 가상으로 별도의 MAC/IP를 가진 인터페이스를 호스트 NIC 위에 올려서, 컨테이너가 외부 네트워크에 직접 붙은 것처럼 동작하게 함.
    

---

### **인터페이스와 IP**

  

각 인터페이스는 **IP 주소**, **netmask**, **gateway** 등을 설정할 수 있습니다.

- 물리 NIC: 외부 네트워크와 직접 연결되므로 ISP나 내부 DHCP 서버에서 IP를 받음.
    
- 가상 NIC: Docker나 K8s, VPN 같은 소프트웨어가 IPAM(IP Address Management)을 통해 주소를 할당함.

### Docker DNS




#### Ref
https://docs.docker.com/engine/network/