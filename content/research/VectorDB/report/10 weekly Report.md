
### 금주 수행한 내용

#### Local NVMe vs SAN NVMe

MEMORYBRIDGE 논문 리뷰를 통해 얻은 인사이트
- 클라우드에서의 디스크 I/O는 로컬 NVMe 대비 지연이 큼
- GNN 학습 또는 vector 검색 시, 디스크 접근 병목이 bottleneck
- 메모리-연산 분리 구조(MemoryBridge)는 클라우드 환경에서 오히려 비용/성능 측면에서 더 효율적임


Cloud Service의 Storage는 왜 local NVMe보다 느린걸까?
-> 실제로 클라우드 서비스들은 VM에 유동적으로 storage를 붙일 수 있게, SAN 구조로 스토리지를 붙임


SAN (Storage Attached Network)
![[Pasted image 20250518183814.png]]
- 실제로 aws상에서 **Fibre Channel 기반 SAN** 을 사용하는지, **Ethernet 기반의 스토리지 네트워크**를 쓰는지는 확인이 어려움

| 항목       | Local NVMe     | AWS EBS (Cloud Block Storage)              |
| ------------ | ------------------ | ---------------------------------------------- |
| 물리적 연결   | 서버 내부 PCIe 직결      | Nitro Hypervisor ↔ ENA NIC ↔ EBS 스토리지 네트워크     |
| IO 경로    | CPU ↔ NVMe (직접 연결) | CPU ↔ Nitro ↔ ENA NIC ↔ EBS 서버 (네트워크 기반 블록 장치) |
| Latency  | 수십 µs 수준           | 수백 µs ~ ms (EBS 타입 및 네트워크 상태에 따라 다름)           |
| IOPS     | 수백만 IOPS 가능        | gp3: ~16K IOPS / io2: ~64K IOPS                |
| 멀티 테넌시   | 없음                 | 있음 (스토리지 I/O 경합 발생 가능)                         |
| 사용 인터페이스 | NVMe               | NVMe (Nitro 기반 인스턴스), 또는 emulated SCSI 인터페이스   |
- AWS 공식 문서에 따르면, EBS는 EC2 인스턴스에 **NVMe 또는 SCSI 인터페이스**로 노출됨

#### Insight
- 클라우드 환경에서는 디스크 I/O latency와 경합이 빈번하므로, **연산 노드와 I/O 캐시 노드의 분리 구조**는 매우 유효함
- HNSW, DiskANN, FAISS와 같은 벡터 검색 구조도
    - 고빈도 노드 pre-caching
    - tiered memory architecture
    - batch pipeline 전송
등의 구조로 확장 가능함

### 차주 수행할 내용
- EBS (gp3) vs 로컬 NVMe 간 4KB random read latency 및 throughput 비교