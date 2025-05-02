
연구 내용을 기반으로 하여 한학기 동안 수행할 연구 내용의 범주에 대한 정의와 함께, 연구 proposal을 하는 것으로 하겠습니다. 각자 20분 정도 발표 준비를 하기 바랍니다.

- 연구배경
- 연구목표
- 향후 연구 계획 (주별로 작성)

### 연구 배경
- **높은 메모리 요구량**:  
    HNSW와 같은 그래프 기반 인덱스는 전체 벡터와 인덱스 구조를 메모리에 적재해야 하므로, 수십 GB~수백 GB의 RAM이 필요하다.
    
- **디스크 접근 지연 (Disk Latency)**:  
    클라우드 환경에서는 NVME SSD가 아닌 EBS, S3 같은 네트워크 스토리지를 사용할 때가 많아, 디스크 읽기 지연(latency)이 높아진다.
    
- **운영비용 증가**:  
    고성능 인스턴스 (대용량 메모리/저지연 디스크)를 사용할 경우 비용이 급격히 증가하여 서비스 운영이 비효율적이 된다.


- 이를 해결하기 위한 연구
	- 별도의 ANN 알고리즘 (IVF, HNSW, DiskANN)
	- Vector product quntazation





### 연구 목표




### 향후 연구 계획



## 1. 문제 정의 (Problem Statement)

- **Context**  
    VectorDB에서 대규모 벡터 검색은 . DiskANN은 “SSD + RAM” 하이브리드 구조로 메모리 부담을 크게 줄였지만 **클라우드 환경**에 바로 적용하기에는 세 가지 한계가 있다.
    
- **Observed Limitations of DiskANN**
    
    1. **Static Block Layout**  
        ‑ 인덱스 빌드 시 결정된 4 KB 고정 블록이 클라우드‑disk(EBS, S3) 특성과 맞지 않아 tail‑latency가 커진다.
        
    2. **Blind Prefetch**  
        ‑ 탐색 시 모든 후보 블록을 동일 priority로 prefetch → I/O 버스트 발생.
        
    3. **No Compression Path**  
        ‑ 그래프 링크와 벡터를 그대로 SSD에 저장해 storage 비용이 높다.
        
    4. **Single‑node Assumption**  
        ‑ 논문은 “billion points on a single server”를 가정해 클러스터‑level 확장이나 장애 처리 논의가 없다.
        

---

## 2. 연구 목표 (Research Objectives)

| Obj‑ID | Objective (English term)        | Korean 설명                                                                                     |
| ------ | ------------------------------- | --------------------------------------------------------------------------------------------- |
| **O1** | Adaptive Block Layout           | 디스크 페이지 크기, access locality를 고려해 인덱스 빌드 시 **block size & grouping**을 최적화 → random I/O 50 % 감소 |
| **O2** | Priority‑aware Prefetch         | HNSW 확장 단계의 **frontier‑score 예측**을 이용해 중요한 블록만 선제적 prefetch → P99 latency 2×↓                 |
| **O3** | Inline Vector Compression       | 벡터를 **FP16 + optional PQ(4×)** 로 저장, 실시간 decode 경량화 → SSD 공간 60 %↓, RAM copy 2×↓              |
| **O4** | Cloud‑ready Sharding & Failover | 데이터/그래프를 **consistent hashing**으로 분할, 재‑shard 비용 최소화 → multi‑node 탄력 확장 지원                    |

---

## 3. 개선 아이디어 상세 (How to Improve DiskANN)

1. **Adaptive Block Layout**
    
    - Build 단계에서 _k‑means_로 벡터를 그룹화 후, 한 블록에 “anchor‑neighbor” 세트를 함께 배치.
        
    - 목표: 한 번의 SSD read가 평균 3.5 graph hop을 커버하도록 설계.
        
2. **Frontier‑Aware Prefetch Scheduler**
    
    - 탐색 queue(priority‑queue)에서 pop 직전 노드들의 잠재 거리(score)를 이용해 **prefetch score** 계산.
        
    - 높은 score 블록만 `io_uring` async read, 나머지는 on‑demand.
        
3. **Dual‑Path Compression**
    
    - **Graph 영역**: Δ‑encoding(+varint) → 1.8× shrink.
        
    - **Vector 영역**: FP16 기본, `pq_m` 파라미터에 따라 선택적 PQ.
        
4. **Cluster Mode**
    
    - gRPC‑based router가 쿼리를 shard에 분산.
        
    - 비동기 replication으로 hot shard 복제, 장애 시 자동 hand‑off.
        

---

## 4. 연구 질문 (Research Questions)

1. **RQ1**: Block size(4 KB vs 32 KB)와 locality‑aware 레이아웃이 SSD random‑read latency에 미치는 정량적 영향은?
    
2. **RQ2**: Prefetch score 임계값(θ)을 조정할 때 Recall@10과 P99 latency 사이의 trade‑off는 어디서 최적화되는가?
    
3. **RQ3**: FP16+PQ 조합이 다양한 LLM 세대(768 dim vs 4096 dim)에서 품질 저하 없이 적용 가능한 범위는?
    
4. **RQ4**: Consistent‑hash re‑sharding 시 데이터 마이그레이션이 tail‑latency에 미치는 영향은?
    

---

## 5. 연구 방법 (Methodology)

|단계|실험 내용|도구/환경|
|---|---|---|
|**Build Profiling**|원본 DiskANN vs Adaptive Layout I/O 추적|eBPF `io_snoop`, AWS gp3|
|**Prefetch Simulation**|탐색 로그로 offline 시뮬레이션 → θ 최적화|Python + Rust proto|
|**Compression Ablation**|FP32, FP16, FP16+PQ(8,16) 비교|FAISS decoder micro‑bench|
|**Cluster Stress**|YCSB‑style mixed workload(90R/10W)|4 × m6i.8xlarge, EKS|

---

## 6. 기대 기여 (Expected Contributions)

1. **DiskANN‑A**: Adaptive, Compressed, Cloud‑native 버전의 오픈소스(ASF 2.0) 공개.
    
2. **Latency‑Cost Pareto Curve**: 메모리/RAM/SSD 비용 대 P99 latency 관계 최초 실측.
    
3. **Frontier‑Aware Prefetch Heuristic**: 그래프 탐색 score를 활용한 범용 I/O 스케줄러 제안.
    
4. **Sharding Guide**: RAG 시스템에서 “point 수 ↔ shard 수” 산정 공식 제공.
    

---

## 7. 향후 계획 (Timeline, 6 months)

- **M1** : DiskANN 코드베이스 분석 + adaptive layout 프로토타입
    
- **M2** : Compression 모듈 통합, micro‑benchmark 완료
    
- **M3** : Prefetch scheduler 구현, trace‑drive 튜닝
    
- **M4** : Sharding layer + router 개발, single‑node 논문 실험 재현
    
- **M5** : Multi‑node stress / ablation study, Draft 작성
    
- **M6** : 논문 제출(VLDB/SIGMOD) + GitHub 공개 & 블로그 포스팅