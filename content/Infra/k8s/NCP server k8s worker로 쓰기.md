

### 배경

기존에 집에 pc 두대로, on-premise 환경에서 k8s 클러스터를 구축해두었다.

추가로 리소스가 필요한 경우가 일부 있었는데, 이때마다 추가로 서버를 구매하기엔 부담되어서 public cloud 환경의 server를 필요할때마다 증설할 수 있는 방법을 찾아보자


### 왜 다 Cloud로 안 옮기나?

사실 모든 리소스를 public cloud로 옮기는게 가장 편하긴 하다. 전력, HW fault같은 이슈들을 관리를 cloud에게 맡기면 편하다.

다만 그렇기에 기존의 인프라 리소스들을 모두 대체하기엔 비용이 너무 비싸다..

기존 home infra
- Storage -> block storage, object storage
- PC 2ea -> Server instance
- Public IP -> Elastic IP


> 그래서 기존 인프라를 유지한 상태로, scale-out이 용이한 방향으로 구성을 진행한다.


### 요구사항

**on-premise Network 연동**
내부 환경에서는 172 대역의 사설 대역을 사용하고, gateway겸 SNAT 를 통과하여 외부와 통신이 이루어진다.

만약 외부 Cloud 서버가 해당 사설 대역과 통신이 필요한경우 IPsec과 같은 터널이 필요하다.

기존 K8s Cluster 

## 구성 방안

일단 가능한 방향 모두 생각해보자

### on-premise wireguard 



