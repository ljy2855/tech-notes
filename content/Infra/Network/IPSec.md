
기업에서 사설망을 구성하여, 외부 네트워크간의 분리를 진행한다.

만약 새로운 sites(Office, IDC ..)에서 동일한 사설 네트워크를 사용하려면 다음과 같은 대안이 있음

1. 전용회선 연결
2. IPsec VPN 연결

전용회선의 경우, 통신사들과 회선을 계약해, 다음과 같이 직접 스위치에 연결함 (실제론 앞단에 xconn같은 장비 필요)

![[Pasted image 20250831180324.png]]


하지만 전용회선을 계약하기에 비용이 상당히 많이 들음
- 거리, 대역폭에 따라 더욱 비싸짐
- 만약 해외 Office에서 연결이 필요하다면?


때문에 대안으로 IPsec VPN을 통해 다른 sites간 네트워크 연결을 진행함


### IPsec VPN
![[Pasted image 20250831180825.png]]

기존 IP packet에 추가로 인증 헤더(AH)를 추가해서, 수신 VPN 장비에서 해당 헤더를 읽고, 패킷의 인증을 진행


이 때, 라우팅은 사설 IP인 10.10.10.10으로 가기 위해 특정 헤더를 담아서 VPN장비까지 패킷을 전달하고, 이후 VPN에서 decapsulation을 통해 packet의 원복을 진행함
### AH
#### Transport vs Turnel mode

![[Pasted image 20250831184111.png]]

두 가지 모드가 존재하는데, Transport는 IP header 자체의 인증은 불가능함
-> 중간에 패킷을 spoofing해도 문제 발생


떄문에 일반적으로 Turnel mode을 통해 헤더르 포함한 IP packet 자체를 인증 가능하도록 사용


다만 AH는 해당 패킷의 인증만 하지, 암호화는 진행하지 않음


### ESP


![[Pasted image 20250831184646.png]]