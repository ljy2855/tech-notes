
### Background

**용어 정리**
- 인증 (Authenticate) : 해당 사용자가 누구인지 신원을 확인
- 인가 (Authorization) : 해당 사용자가 어떤 권한을 가지는 확인하고 부여
- 대칭키 (Symmetric Key) : 암호, 복호에 같은 키를 사용
- 비대칭키 (Asymmetric Key) : 암호, 복호에 다른 키를 사용
- Root CA : 신뢰가능한 인증서 발급 기관 (GeoTrust)


**인증서는 왜 쓰는건가?**

우리가 인터넷망을 통해 패킷을 주고받는 과정에서 다음과 같은 문제가 발생할 수 있음

- L2 스위칭, L3 라우팅 중에 패킷을 훔쳐본다면?
- Dst 주소가 정상적인 목적지가 아니라면?
- 중간에 패킷이 변조된다면?

기밀성(Confidentiality), 무결성(Integrity)을 보장하기 위해 통신 프로토콜에 보안 계층을 추가

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
6. 양측은 pre-master secret + 랜덤 값으로 session key 생성
7. session key로 이후 패킷 암호화

### 인증서 생성 및 등록

보통 서버(웹서버, LB, ..)에 SSL 인증서를 등록하고 이를 활용함

letsencrypt 와 같은 오픈소스도구를 사용하면 해당 과정을 통해서 인증서를 발급 받음

1. key pair 생성
    - **private key / public key** pair 생성 
    - private key는 서버 내부에만 저장, public key는 인증서 
    
2. **CSR (Certificate Signing Request) 생성**
    - public key + 도메인 정보(CN=example.com 등)를 포함한 요청 생성
    - 이 CSR을 CA(Certificate Authority)에 제출
        
3. **CA의 서명**
    - CA는 신청자의 도메인 소유권을 검증(DNS TXT 레코드, 이메일, HTTP 파일 ..)
    - 검증이 끝나면 CA는 서버의 public key에 **자신의 private key로 서명**한 인증서를 발급
        
4. **서버에 인증서 등록**
    - 서버는 CA가 서명한 인증서(=서버 인증서)와 private key를 함께 보관
    - 필요하다면 중간 인증서(Intermediate CA) 체인도 설치

https://cocopam.tistory.com/43

### 인증서 계층

인터넷에서 쓰이는 인증서는 단일 구조가 아니라 계층적으로 신뢰를 이어가는 구조를 가짐. 이를 **Chain of Trust**라고 부름.

![[Pasted image 20250916155110.png]]
1. **Root CA (최상위 인증 기관)**
    - 신뢰의 최상단에 위치
    - 전 세계적으로 공신력 있는 기관들이 운영, 브라우저/운영체제에 기본 내장됨
    - 보안을 위해 Root CA는 직접 서버 인증서를 발급하지 않고 대부분 Intermediate CA를 통해 위임
        
    
2. **Intermediate CA (중간 인증 기관)**
    - Root CA로부터 서명받은 인증서로 서버 인증서를 발급하는 역할
    - 만약 보안 사고가 발생하더라도 Root CA를 보호하기 위한 중간 단계
    - 실제 서버가 전송하는 인증서 체인에 포함되어, 클라이언트가 Root CA까지 신뢰를 이어갈 수 있게 함
        
    
3. **Server Certificate (서버 인증서)**
    - 실제 서비스 도메인(CN=example.com)에 발급되는 인증서
    - 서버 public key + 도메인 정보 포함
    - Intermediate CA의 private key로 서명됨
    - TLS handshake 과정에서 클라이언트에게 제시되는 인증서가 바로 이 부분
        
### 검증 과정


클라이언트가 서버와 TLS 연결을 맺을 때는 다음 순서로 검증이 진행됨

1. 서버가 자신의 **서버 인증서**와 함께 **Intermediate CA 인증서**를 전송
2. 클라이언트는 서버 인증서를 확인하고 → ICA가 서명했는지 검증
3. ICA 인증서를 확인하고 → Root CA가 서명했는지 검증
4. Root CA가 로컬(브라우저/OS)에 내장된 신뢰 저장소에 존재하는지 확인
    

### client 패킷 확인

https 요청을 보낼때, 어떤 과정이 일어나는지 확인

1. TCP handshake
![[Pasted image 20250916160207.png]]


2. hello 이후, 서버 인증서 전달
![[Pasted image 20250916160530.png]]

![[Pasted image 20250916161123.png]]
issuer의 정보를 보고 상위 인증서를 찾음

![[Pasted image 20250916161419.png]]
브라우저에서는 해당 인증서를 로컬에서 확인 (여기서는 바로 root)

3. client는 서버의 인증서를 확인하고, 키 교환 방식 전달
![[Pasted image 20250916160812.png]]

이후 session key 생성 과정은 생략


