
이전에 SSL vpn에 대해 정리했는데, 실제 어떤식으로 통신이 되는지 Docker를 통해 실험


실험 환경 
Ubuntu 24.04


### Docker network

```yaml
version: "3.8"

services:
  openvpn-as:
    image: openvpn/openvpn-as
    container_name: openvpn-as
    restart: always
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    devices:
      - /dev/net/tun:/dev/net/tun
    ports:
      - "943:943/tcp"    # Admin/User Web UI
      - "9443:9443/tcp"  # OpenVPN TCP
      - "1194:1194/udp"  # OpenVPN UDP
    environment:
      - INTERFACE=eth0
      # 초기 admin 비밀번호 지정 (최초 실행 시에만 적용)
      - ADMIN_USER=vpnadmin
      - ADMIN_PASSWORD={password}
    volumes:
      - ovpn-data:/openvpn
    networks:
      intranet_net:
        ipv4_address: 172.28.0.2

  intranet-web:
    image: nginx:alpine
    container_name: intranet-web
    restart: unless-stopped
    command: >
      sh -c "echo '<h1>Hello from intranet web</h1>' > /usr/share/nginx/html/index.html
      && nginx -g 'daemon off;'"
    networks:
      intranet_net:
        ipv4_address: 172.28.0.10
    # 포트 매핑 없음: VPN 경유로만 접근

volumes:
  ovpn-data:
    external: true   # 기존 볼륨 사용 (이미 생성되어 있다면)

networks:
  intranet_net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
````


### Docker Network


해당 docker compose stack을 만들면, 도커 네트워크가 생성된다.

도커 네트워크 드라이버는 다음과 같이 설정할 수 있음

| Driver    | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `bridge`  | The default network driver.                                              |
| `host`    | Remove network isolation between the container and the Docker host.      |
| `none`    | Completely isolate a container from the host and other containers.       |
| `overlay` | Overlay networks connect multiple Docker daemons together.               |
| `ipvlan`  | IPvlan networks provide full control over both IPv4 and IPv6 addressing. |
| `macvlan` | Assign a MAC address to a container.                                     |

- bridge : default로 설정된 네트워크 드라이버, bridge 처럼 작동하여 컨테이너의 가상 인터페이스를 연결
- host: bridge 없이 host의 docker0 인터페이스를 사용
- none : 네트워크 연결 x
- overlay : 

```sh
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


### DNS




#### Ref
https://docs.docker.com/engine/network/