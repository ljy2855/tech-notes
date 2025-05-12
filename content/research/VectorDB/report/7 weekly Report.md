
### 금주 수행한 내용

#### MEMORYBRIDGE 논문 리뷰

**motivation**
- 기존의 디스크 기반 GNN 학습 시스템은 local SSD 환경에 최적화되어 있으며, 클라우드에서는 심각한 **I/O 병목과 비용 비효율** 문제가 발생
- GNN은 GPU 자원보다는 **메모리 대역폭, 저장소 I/O, 네트워크 속도**에 더 민감함
- 클라우드에서는 원하는 조합의 자원을 선택할 수 없기 때문에, 비용 효율적으로 GNN을 학습할 수 있는 새로운 구조가 필요함

##### MEMORYBRIDGE
- 저가형 GPU 머신(Training Node)과 **GPU 없이 메모리/대역폭이 풍부한 머신(Memory Node)을 조합한 Two-Level Architecture** 제안
- 클라우드 자원의 비효율을 해결하기 위해, 두 개의 핵심 모듈로 구성
	- `CLUSTERPLANNER`: AMAT 기반 수학 모델로 가장 비용 효율적인 자원 조합을 추천
	- `REMOTEGNN`: 고정 캐싱 + 비동기 파이프라이닝으로 디스크 I/O 병목 완화
- Memory Node에서 데이터를 캐싱/전처리하고, Training Node에 네트워크로 전송하는 구조

**Architecture**
![[Pasted image 20250512134704.png]]

##### **REMOTEGNN**
- **Batch Pipelining**: 메모리 머신에서 생성한 배치를 네트워크로 비동기 전송
- **Fixed Caching**
    - 그래프의 power-law 분포를 이용하여 **고차수 노드**만 캐싱
    - 구조 데이터는 CSR/CSC 형식으로 캐싱 → O(1) 이웃 탐색 가능
    - Feature 벡터는 메모리 여유 공간을 활용해 고차수 순으로 캐싱

**Batch 처리 구조**
1. Memory Machine
    - Batch 생성 (seed node 기반)
    - Blueprint → mmap read → serialize
    - Batch Sender → 네트워크 전송
    
2. Training Machine
    - Batch Receiver → deserialize
    - GPU로 학습 수행
##### 평가

**환경**
- AWS 클라우드 (us-east-1), 다양한 G4dn, R8g 인스턴스 사용
- 최대 3.6B 엣지를 가진 대규모 그래프(Papers100M, MAG240M 등)
- GP3 SSD (125MB/s, 3000 IOPS)

| 인스턴스명        | GPU  | Mem   | Net B/W | $/hr   |
| ------------ | ---- | ----- | ------- | ------ |
| g4dn.8xlarge | V100 | 128GB | 50Gbps  | $2.176 |
| r8g.2xlarge  | -    | 64GB  | 15Gbps  | $0.471 |

**Speed & Cost Efficiency**

| 모델         | 시간(Makespan) | 비용(Cost)             |
| ---------- | ------------ | -------------------- |
| PyG (mmap) | x32.7배 느림    | 9.9배 높음              |
| Ginex      | x26배 느림      | -                    |
| MariusGNN  | 비교적 빠름       | 그러나 네트워크 파이프라인 병목 발생 |

##### Insight

**Cloud 환경에서의 HNSW, DiskANN 한계에 대한 시스템적 대안**

- HNSW는 전적으로 **in-memory** 구조이기 때문에 클라우드에서 RAM이 제한적인 경우 **비용과 확장성 문제가 발생**
- MEMORYBRIDGE는 GNN 학습에서 유사한 I/O 병목을 해결하기 위해 **Two-Level Architecture** 도입
    - **Memory Node**: 대용량 RAM/스토리지 중심, 데이터를 캐시 및 전처리
    - **Training Node**: GPU 중심, 연산만 수행
- 이 구조는 HNSW에서도 적용 가능한 구조로, 탐색 수행 노드와 캐시/디스크 I/O 수행 노드를 분리할 수 있음
    

**Storage I/O 병목에 대응하는 캐싱 전략**

- REMOTEGNN은 **power-law 기반 고정 캐싱**을 사용해 메모리 활용 효율 극대화
- HNSW도 일부 고차수 노드 또는 진입점 노드를 memory-resident로 유지하는 **tiered caching 정책**을 고려 가능

---

### 차주 수행할 내용
-  **AWS 환경에서 랜덤, 순차 I/O 성능 측정 실험 준비**
    - 4KB, 64KB 단위 I/O latency, throughput 비교 (EBS gp3 기준)
- DiskANN cloud 상 disk Latency 실험 (Local NVME와의 차이 중점)