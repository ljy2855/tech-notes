
이전에 SSL vpn에 대해 정리했는데, 실제 어떤식으로 통신이 되는지 Docker를 통해 실험


실험 환경 

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

