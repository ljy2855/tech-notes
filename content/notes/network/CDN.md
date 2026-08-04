
### 정의
Content Delivery Network

### Why?
#### 서버 부하 감소
- client가 server로 static file(이미지, css) 요청하면 이것도 부하가 됌
- 서버로 요청하지 않고 캐싱된 static 서빙 서버로 요청을 보내면 트래픽 부하가 줄어듬

#### 빠른 응답
- 서버의 RTT가 길때
	- client와 서버의 물리적 거리가 멈 (글로벌 리전)
	- 서버까지의 네트워크가 부하(congestion)
- 네트워크 곳곳에 Static Serving Server를 두어서 client거리가 가깝게 한다!



### 어떻게 구현해요?
- 간단히 구현하자면 L7 LB를 달아서 요청하는 리소스를 확인하고 서버가 아닌 Static file serving으로 프록시 하기


### 라우팅은 어떻게 이루어지나?
같은 DNS를 쓰는데 어떻게 다른 서버에 이동하는지

[[DNS]] 라우팅 참조
1. root DNS 확인
2. 

### Cache Invalidation


