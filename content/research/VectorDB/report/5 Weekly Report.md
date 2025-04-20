

### 금주 수행한 내용

#### DiskANN 논문 리뷰

**motivation**
- ANN의 목표인 정확도 (recall), 지연시간 (latency), 적은 메모리 사용량을 모두 만족하기 위한 방법 제시
- HNSW은 높은 recall을 보여주지만, 메모리 상주로 인한 대규모 데이터셋 처리엔 한계

#### DiskANN
- 원본 벡터(full-precision)와 neighbor ID는 SSD에 저장, 압축된 벡터(product quantization)은 메모리에 저장
- 각 노드의 데이터는 **SSD의 4KB 블록 단위**로 정렬되어 저장되며,  
    하나의 블록(4kb)에 **full-precision 벡터와 이웃 리스트가 함께 포함**되도록 구성
- 이 구조는 디스크 접근 시 **한 번의 I/O로 필요한 모든 정보**를 가져올 수 있게 하여 latency를 최소화함
- 탐색 depths를 줄여 disk 접근을 적게 만듦

#### Vamana 알고리즘
- 그래프 기반 인덱싱 방식으로, 탐색 직경을 줄이기 위한 **α-parameter 기반 pruning** 전략 사용
- 전체 데이터셋에 대해 두 번의 패스를 진행하여 탐색 품질 개선
    - 첫 번째 패스: α=1로 기본 연결 생성    
    - 두 번째 패스: α>1 (e.g., 1.2)로 long-range edge 추가    
- 인접 노드 선택 시, 거리 기반이 아니라 α-기반 조건으로 **long, diverse connection 확보**
- 결과적으로 SSD 기반 탐색에서 필요한 노드 수, 즉 디스크 접근 횟수를 줄이도록 설계됨

**Indexing**

memory
- 모든 벡터들을 압축한 상태로 저장
- Product Quantization, which encodes the data and query points into short codes (e.g., 32 bytes per data point)

disk
```

[ disk block (4KB aligned) ]
┌────────────────────────────────────────────┐
│ Full-precision vector (e.g., 128D float32) │  → 128 * 4B = 512B
├────────────────────────────────────────────┤
│ Neighbor list (R개 노드 ID)                  │ → R * 4B (e.g., R=64 → 256B)
├────────────────────────────────────────────┤
│ Padding / reserved                         │  → 나머지 공간 (alignment 맞춤)
└────────────────────────────────────────────┘
```

**Search**

- `xq`: 쿼리 벡터
- `L`: 후보 리스트 크기
- `W`: Beam width (한 번에 SSD에서 읽을 노드 수)
- `k`: 찾고자 하는 최근접 이웃 수

```
입력: 쿼리 xq, 시작 노드 s, 후보 리스트 크기 L, Beam Width W

1. 초기화:
   - 후보 리스트 `L ← {s}`
   - 방문한 노드 집합 V ← ∅

2. 반복:
   - 아직 방문 안한 후보 중 쿼리와 가장 가까운 W개 노드를 SSD에서 한 번에 읽음
   - 읽은 각 노드의 이웃 리스트 + full-precision 벡터 함께 가져옴
   - 이웃 노드들의 PQ 벡터를 이용해 거리 계산 후, 후보 리스트에 추가
   - 방문 노드 집합 V에 읽은 노드 추가

3. 후보 리스트가 충분히 수렴하거나 max hops에 도달하면 종료

4. 최종 후보 중 full-precision 벡터로 거리 다시 계산 → top-K 결과 반환

```

#### 평가

**환경**
• z840: a bare-metal mid-range workstation with dual Xeon E5-2620v4s (16 cores), 64GB DDR4 RAM, and two Samsung 960 EVO 1TB SSDs in RAID-0 configuration.

• M64-32ms: a virtual machine with dual Xeon E7-8890v3s (32-vCPUs) with 1792GB DDR3 RAM that we use to build a one-shot in-memory index for billion point datasets.

| 데이터셋     | 차원 수 |
| -------- | ---- |
| **SIFT** | 128D |
| **DEEP** | 96D  |
| **GIST** | 960D |

**recall & latency**

| 데이터셋       | 알고리즘        | 1-recall@1        | Latency (ms)   |     |
| ---------- | ----------- | ----------------- | -------------- | --- |
| **SIFT1B** | DiskANN     | **98.7%**         | **< 5ms**      |     |
|            | FAISS-IVFPQ | 75.8%             | 1.1ms          |     |
|            | HNSW (예상)   | 97~99%            | 1~2ms (RAM 상주) |     |
| **DEEP1B** | DiskANN     | **95.6%**         | **< 5ms**      |     |
| **GIST1M** | Vamana      | HNSW, NSG 대비 더 우수 | -              |     |
![[Pasted image 20250420171902.png]]

**memory footprint**

| 데이터셋       | 차원 수 | 벡터 수 | 알고리즘        | Latency (ms)  | 메모리 사용량                      | 디스크 사용량         |
| ---------- | ---- | ---- | ----------- | ------------- | ---------------------------- | --------------- |
| **SIFT1B** | 128D | 1B   | **DiskANN** | **< 5ms**     | **≤ 64GB** (merged index 기준) | **348GB** (SSD) |
|            |      |      | **HNSW**    | 1~2ms _(RAM)_ | **250GB ~ 1TB 이상 예상**        | RAM-only        |

> “DiskANN can index and serve a billion point dataset in 100s of dimensions on a workstation with 64GB RAM…”  
   “DiskANN serves 5−10x more points per node compared to state-of-the-art graph-based methods such as HNSW and NSG.”
#### 한계
- **원본 벡터 + 인접 리스트를 4kb 디스크블록에 저장하면, 1024 차원(4kb)이상 벡터는 저장이 안되지 않나?**
	- 실험 데이터셋 중 가장 고차원인 GIST1M (960D)까지만 사용됨
	- 1024D 이상 벡터는 벡터 크기만으로도 4KB → 이웃 리스트 포함 불가
- **RAG시스템에서 활용할 고차원 벡터 인덱싱으로 사용하기에 적합한가?** 
	- By default, the length of the embedding vector is `1536` for `text-embedding-3-small` or `3072` for `text-embedding-3-large` (OpenAI embedding model)
	- DiskANN 기본 설계로는 저장 불가능 → PQ 압축 필요
- 실제 구현을 확인해보면 1024차원이 넘으면 압축해서 disk에 저장 -> recall 하락

> DiskANN parameter
	**PQ_disk_bytes** (default is 0): Use 0 to store uncompressed data on SSD. This allows the index to asymptote to 100% recall. If your vectors are too large to store in SSD, this parameter provides the option to compress the vectors using PQ for storing on SSD. This will trade off recall. You would also want this to be greater than the number of bytes used for the PQ compressed data stored in-memory

