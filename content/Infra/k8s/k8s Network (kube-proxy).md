
## Why k8s network?

전통적인 모노리틱 구조에서는

서버가 가진 **고유 IP 또는 VIP**에 애플리케이션이 직접 바인딩됨

![[../../Assets/Pasted image 20251214172937.png]]

Kubernetes 클러스터에서는 애플리케이션이

**서버 위가 아니라 Pod 단위**로 배치

![[../../Assets/Pasted image 20251214183221.png]]

- Pod는 클러스터 내부 **Overlay Network** 위에 존재
- Underlay(Baremetal 서버, 스위치, ToR)는 Pod나 컨테이너의 IP/Port를 **직접 인지하지 않음**

즉, 인프라는 단순히 “Pod 네트워크를 전달하는 역할”만 수행

이 추상화를 가능하게 하는 핵심 컴포넌트
- **CNI (Container Network Interface)**
- **kube-proxy**
    

이번 글에서는 **기본 구성(default)** 인 kube-proxy을 기준으로 Kubernetes 네트워크 흐름을 정리

## k8s 통신 종류

Kubernetes 클러스터 네트워크에서 발생하는 주요 트래픽

1. container to container 
2. pod to pod
3. pod to service
4. external service

### Container to Container

같은 Pod 내부 컨테이너 간 통신

Kubernetes에서 **Pod는 네트워크의 최소 단위**
같은 Pod에 속한 컨테이너들은

- 동일한 **Network Namespace** 공유
- 동일한 IP 주소 사용
- 동일한 routing table, iptables 사용

```
Container A ── localhost ── Container B
````
- 127.0.0.1 또는 Pod IP로 접근 가능
- 포트만 다르면 충돌 없음
- Sidecar 패턴이 가능한 이유


### Pod to Pod

이 통신을 가능하게 하는 것은 **CNI 플러그인**

CNI가 수행하는 역할은 다음과 같음

- Pod IP 할당
- veth pair 생성
- 노드 내/노드 간 라우팅 구성
- Overlay(VXLAN) 또는 Underlay(BGP) 처리

Service, NAT, Load Balancing은 개입 x

> Kubernetes 네트워크 모델의 핵심 원칙
> **“모든 Pod는 NAT 없이 서로 통신 가능해야 한다”**

다음 글에서 자세히 다룰 예정
### Pod to Service


Service는 **Pod 집합에 대한 추상화 계층**

- Service는 **가상 IP (ClusterIP)** 를 가짐
- 실제로는 네트워크 인터페이스에 존재하지 않음
- ARP 응답도 하지 않음
    
이 가상 IP를 실제 Pod IP로 변환하는 역할이 **kube-proxy**

자세한 변환 과정은 아래에 작성
### External Service

> cluster 외부로 통신할 때

외부 트래픽은 다음 경로 중 하나를 따른다.
- NodePort
- LoadBalancer
- Ingress

**Inbound**

DNAT를 통해서 Service로 전달

**Outbound**

SNAT를 통해서 외부로 나감

## Kube-proxy 작동

> iptables 기준으로 작성

kube-proxy는 다음을 수행

1. Service / Endpoint 정보를 watch
2. iptables 규칙 생성
3. Service IP로 들어온 트래픽을 **DNAT**
4. 실제 Pod IP로 전달


- kube-proxy는 **라우팅 x**
- Overlay 네트워크 생성 x
- 단순히 **L4 NAT 규칙을 설치**

