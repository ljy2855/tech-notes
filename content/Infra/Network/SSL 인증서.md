
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


1. TCP 3-way handshake 진행
2. ClientHello: 클라이언트가 암호 스위트, TLS 버전, 랜덤 값 전달
3. ServerHello: 서버가 암호 스위트 선택, 인증서(공개키 포함) 전달
4. 클라이언트는 인증서 체인을 Root CA까지 검증 → 서버 공개키 유효성 확인
5. (TLS 1.2) RSA 또는 ECDHE로 pre-master secret 교환

   (TLS 1.3) ECDHE 기반 키 교환만 사용

6. 양측은 pre-master secret + 랜덤 값으로 session key 파생

7. session key로 이후 패킷 암호화