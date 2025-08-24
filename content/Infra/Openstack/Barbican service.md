
Openstack에서 secrect key value store의 역할을 수행하는 서비스

![[Pasted image 20250823150948.png]]

aws의 `secret manager`와 비슷한 기능을 제공함


Secret 종류
- private key
- certificate
- password
- ssh keys

예를 들어 vm에 접속할 ssh private key를 저장할 때, 

1. **API 레이어**
    
    - 사용자가 접근하는 RESTful API
    - secrets, containers, orders, consumers 같은 엔드포인트를 제공
    - 인증은 OpenStack **Keystone** 토큰을 통해 이뤄짐
        
    
2. **Worker / Queue 레이어**
    
    - 일부 요청(예: 대칭키 생성, 인증서 발급 등)은 시간이 걸리기 때문에 **비동기 처리**를 함.
    - 이 과정에서 **MQ(Message Queue, 예: RabbitMQ)** 를 사용
    - Worker 프로세스가 요청을 꺼내서 Secret Store에 실제 저장·발급을 수행.
        
    
3. **Secret Store Plugin 레이어**
    
    - Barbican이 실제 비밀을 저장/조회하는 부분.
        
    - 플러그인 방식으로 다양한 백엔드 연동 가능:
        
        - **KMIP** (Key Management Interoperability Protocol)
            
        - **HSM** (Hardware Security Module)
            
        - **Software store** (단순 DB 저장, dev/test용)
            
        - **Vault** 같은 외부 Secret Manager와도 연동 가능
            
        
    
4. **Database 레이어**
    
    - Secret의 **메타데이터** 저장
	    - secret 이름, UUID, project ID, ACL 정보 등
    - 실제 Secret의 원본 데이터는 Store Plugin에서 관리

