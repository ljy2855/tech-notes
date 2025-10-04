### Accces / Aggregation / Core

전통의 토폴로지

과거 N-S 트래픽 (서버 <-> client)가 많았던 시기에서 주요 아키텍처로 사용


aggregation까지 L2 연결을 하다보니 agg layer에서 ARP, STP에 영향을 받음
-> access <-> aggregation 사이에 STP block

서버에서 게이트웨이로 통신을 할때, Agg 스위치에서 ARP 요청을 처리해주어야 하기에, 해당 처리에 부담이 되기도함

추가적으로 단일 Agg 스위치 장애시, 해당 


단점
- Server to Server 통신시에, path가 agg를 타고 대역폭 제한
- 추가 대역폭을 늘리고 싶으면 링크를 추가하는 방법 밖에없음
	- AGG는 두대 이상 집선시, STP로 사용불가
- VLAN으로 분리할수 있는 Pod의 한정적인 개수
### Clos (leaf spine)

![[Pasted image 20251004141921.png]]

기