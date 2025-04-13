

### 금주 수행한 내용
- HNSW 인덱스의 메모리 사용 최적화 가능성 탐색
	- **벤치마크 실험**: OpenSearch의 HNSW 인덱싱 문제를 확인하기 위해  FAISS의 `IndexHNSWFlat`을 사용해 인덱스 생성 및 검색, 저장/복원 과정의 성능 및 자원 사용량 측정
		- NVME disk
		- RAM disk
		- USB
	- DiskANN 논문 확인




- cloud disk latency 실험
	- aws or gcp cloud 계정이 별도로 없어, 추후 확인
#### . HNSW 인덱스의 메모리 사용 최적화 가능성 탐색

    
- **벤치마크 실험**: FAISS의 `IndexHNSWFlat`을 사용해 인덱스 생성 및 검색, 저장/복원 과정의 성능 및 자원 사용량 측정

    
    - HNSW 구조 기반이지만, 인덱스를 디스크에 저장한 채 일부만 메모리에 유지하는 방식
        
    - **비동기 I/O**, **우선순위 기반 prefetch**, **block layout 최적화** 등 시스템 수준 최적화 요소 다수 포함
        
    - 기존 알고리즘 중심 연구와 달리, **OS 및 스토리지 계층에서의 성능 병목 완화**에 초점
        

#### 2. Cloud 환경에서의 디스크 I/O 성능 측정 계획

- 향후 확장 실험으로 **AWS / GCP 등에서의 disk latency 및 병렬 I/O 성능** 비교 예정
    
- 현재 별도 클라우드 계정이 없어, 계정 확보 이후 실험 진행 예정