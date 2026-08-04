
**Kernel과 Userspace 간의 통신을 위한 양방향 IPC(Inter-Process Communication)**

socket 인터페이스를 통해 데이터를 주고 받음

```c
fd = socket(AF_NETLINK, SOCK_RAW, NETLINK_GENERIC);
```

- 기존 TCP/UDP 소켓하고 인터페이스는 동일하나 용도가 다름
	- TCP/UDP socket : data packet 전달
	- Netlink socket : controll packet 전달

### 왜 사용하냐?

사실 유저스페이스에서 커널로 요청을 보낼 때, `ioctl`, `sysctl` 와 같은 시스템콜을 사용하는 것이 일반적이지만, 커널 네트워크 스택에 보낼 요청들을 ioctl로 정의해서 보내기엔 너무나 많은 context와 동기화가 어려움


커널 네트워크 스택이 관리하는 것들
- 라우팅 테이블 변경
- ARP table update
- 인터페이스 관리
- 
