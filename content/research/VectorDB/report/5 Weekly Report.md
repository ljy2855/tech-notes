

### 금주 수행한 내용

#### DiskANN 논문 리뷰


motivation
- ANN의 목표인 정확도 (recall), 지연시간 (latency), 적은 메모리 사용량을 모두 만족하기 위한 방법 제시
- HNSW와 같은 방법은 높은 recall을 보여주지만, 메모리 상주로 인한 대규모 데이터셋 처리엔 한계


#### DiskANN
- 원본 벡터와 이웃 벡터는 SSD에 저장, 압축된 벡터(product quantization)은 메모리에 저장
- 탐색 depths를 줄여 disk 접근을 적게 만듦
- DiskANN can index and serve a billion point dataset in 100s of dimensions on a workstation with 64GB RAM, providing 95%+ 1-recall@1 with latencies of under 5 milliseconds.

#### Vamana 알고리즘

**Indexing**

memory
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

한계
- 원본 벡터 + 인접 리스트를 4kb 디스크블록에 저장하면, 1024 차원(4kb)이상 벡터는 저장이 안되지 않나?
	- 4.1 We compared Vamana with HNSW and NSG on three commonly used public benchmarks: SIFT1M (128-dimensions) and GIST1M (960-dimensions)
	- RAG시스템에서 활용할 고차원 벡터 인덱싱으로 사용하기에 적합한가? 
	- By default, the length of the embedding vector is `1536` for `text-embedding-3-small` or `3072` for `text-embedding-3-large` (OpenAI embedding model)

실제 코드를 확인해보

