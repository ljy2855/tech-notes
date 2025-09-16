
### Background

용어 정리
- 인증 (Authenticate) : 해당 사용자가 누구인지 신원을 확인
- 인가 (Authorization) : 해당 사용자가 어떤 권한을 가지는 확인하고 부여
- 대칭키 (Symmetric Key) : 암호, 복호에 같은 키를 사용
- 비대칭키 (Asymmetric Key) : 암호, 복호에 다른 키를 사용
- Root CA : 신뢰가능한 인증서 발급 기관 (GeoTrust)


인증서는 왜 쓰는건가?

우리가 인터넷망을 통해 패킷을 주고받는 과정에서 다음과 같은 문제가 발생할 수 있음

- L2 스위칭, L3 라우팅 중에 패킷을 훔쳐본다면?
- Dst 주소가 정상적인 목적지가 아니라면?
- 중간에 패킷이 변조된다면?

기밀성(Confidentiality), 무결성(Integrity), 가용성(Availability)을 보장하기 위해 통신 프로토콜에 보안 계층을 추가한다.


### SSL/TLS

L4 layer (TCP)에서는 암호화나 보안 기능을 제공하지 않음.
(L3, UDP 는 [[IPSec]]을 적용가능)

L4위에 SSL (Secure Sockets Layer)를 통해서 TCP 세션을 암호화 및 인증을 진행함


TLS는 이전의 암호화 프로토콜 [SSL](https://www.cloudflare.com/learning/ssl/what-is-ssl/)에서 발전한 버전으로, 실제로 현재는 TLS가 표준으로 사용되고 있음. 다만 개념적으로 용어를 SSL과 섞어서 사용

#### TLS hand shake

![[Pasted image 20250916125931.png]]


1. TCP hand shake 진행
2. client는 