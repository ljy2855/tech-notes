
### 금주 수행한 내용

#### Local NVMe vs SAN NVMe

MEMORYBRIDGE 논문 리뷰을 통해서 얻은 인사이트
- cloud storage의 경우 local NVMe보다 더욱 느려 memory bridge를 따로 두는 것이 오히려 성능 향상에 도움이 됌


Cloud Service의 Storage는 왜 local NVMe보다 느린걸까?
-> 실제로 클라우드 서비스들은 VM에 유동적으로 storage를 붙일 수 있게, SAN 구조로 스토리지를 붙임


SAN (Storage Attached Network)
![[Pasted image 20250518183814.png]]

| **항목**      | **Local NVMe**      | **Cloud Storage (EBS/SAN 기반)**      |
| ----------- | ------------------- | ----------------------------------- |
| **물리적 연결**  | 서버 내부 PCIe로 직결됨     | 네트워크(SAN, iSCSI) 기반 블록 장치 연결        |
| **IO 경로**   | CPU ↔ NVMe (단일 호스트) | CPU ↔ NIC ↔ SAN Switch ↔ Storage 서버 |
| **Latency** | 수십 µs 수준            | 수백 µs ~ ms (네트워크, 멀티 홉 경유)          |
| **IOPS**    | 수백만 IOPS            | 일반 EBS는 수천~수만 IOPS                  |


NVMe driver를 통해서 접근할 때, TCP, HBA