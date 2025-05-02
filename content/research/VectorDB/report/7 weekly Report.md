
연구 내용을 기반으로 하여 한학기 동안 수행할 연구 내용의 범주에 대한 정의와 함께, 연구 proposal을 하는 것으로 하겠습니다. 각자 20분 정도 발표 준비를 하기 바랍니다.

- 연구배경
- 연구목표
- 향후 연구 계획 (주별로 작성)

---


# Cloud‑Native Vector Search: Detailed Motivation 

---

## 1. Introduction — Why VectorDB Matters
### 1.1 AI Service Dependency
- **Modern AI pipelines**—recommendation, semantic search, multimodal retrieval, RAG—*all* begin with a nearest‑neighbor query against **hundreds of millions** of high‑dimensional vectors.  
- A **Vector Database (VectorDB)** therefore sits on the critical path: milliseconds won or lost here propagate directly to user‑visible latency or LLM token wait time.


### 1.3 Vector Dataset size 

|구분|계산식|결과|
|:--|:--|:--|
|짧은 문서 (90%)|6.7M × 0.9 = 6.03M 문서 × 1 vector|6.03M vectors|
|긴 문서 (10%)|6.7M × 0.1 = 0.67M 문서 × 2.5 vectors|1.675M vectors|
|**합계**|6.03M + 1.675M|**7.705M vectors**|
- chunking 없이 최대 input 8192 tokens 가정
### 1.2 Cloud Reality Check  
| Dimension | On‑prem Assumption                    | Cloud Reality                                            |
| :-------- | :------------------------------------ | :------------------------------------------------------- |
| Storage   | Local NVMe (μs latency)               | **Network‑attached** EBS / persistent disks (ms latency) |
| Memory    | 512 GB–1 TB RAM nodes affordable once | Per‑hour billing; 1 TB RAM = \$6–7 k / month             |
| Scaling   | Single rack                           | **Auto‑scaling & failover** expected                     |

> **Key takeaway:** Algorithms tuned for on‑prem NVMe & cheap RAM face *new* cost/latency constraints in the cloud.

---

## 2. HNSW Recap — Strengths & Inner Workings
### 2.1 Concept
- **HNSW (Hierarchical Navigable Small‑World Graph)** builds *L* layered graphs; upper layers are sparse, layer 0 is dense.  
- Query: *greedy graph walk* from entry‑point to nearest neighbor, descending the hierarchy.

### 2.2 Why It Shines
| Property | Effect |
| --- | --- |
| **log‑scale path length** | Sub‑millisecond CPU even at billion scale |
| **Locality in graph** | High recall (> 0.98) without exhaustive search |
| **Purely in‑memory** | No decompression / page faults during traversal |

### 2.3 Internals Cheat‑Sheet
| Symbol | Typical Value | Role |
| --- | --- | --- |
| *M* | 16 – 32 | Max neighbors / node on layer 0 |
| *efConstruction* | 200 – 400 | Graph quality / build time trade‑off |
| *efSearch* | 32 – 128 | Recall ↔ CPU cost at query time |

---

## 3. HNSW Cloud Pain‑points
### 3.1 Full‑RAM Requirement
- **Storage math** (float32):  
  $N × d × 4 \text{bytes} + N × M × 4 \text{bytes}$  
  *e.g.* 7.7 M vectors × 1024 dims ⇒ **51.2 GB vectors + 6.4 GB edges ≈ 60 GB**.
- Cloud RAM beyond 256 GB quickly jumps to *memory‑optimized* instance pricing tiers.

### 3.2 Random Access Pattern
- Greedy walk touches neighbors that are *not* sequential in memory.  
- With **mmap**, every miss triggers a page‑fault → **4–64 KB random reads** on EBS.
- Empirical latency: 1000 random 4 KB reads on *gp3* ≈ **10 ms p99** vs < 200 µs on NVMe.

### 3.3 Cost Explosion
| Instance | RAM | On‑Demand \$ / mo (2025‑Q1 AWS) |
| --- | --- | --- |
| r6i.2xlarge | 64 GB | \$340 |
| r6i.32xlarge | 1 TB | \$5 500–7 000 |

> **Observation:** keeping the full HNSW index hot in RAM is **economically infeasible** beyond a few hundred million vectors.

---

## 4. IVF & PQ Quick Glance — Alternative Trade‑offs
### 4.1 IVF (Inverted File Index)
- **Procedure**: k‑means centroids (k≈√N) → search only *nprobe* closest lists.
- **Pros**: Stores only *centroid IDs* in RAM; lists can live on disk.
- **Cons**: If the correct neighbor lies outside probed lists → prec / recall drops.

### 4.2 Product Quantization (PQ/OPQ)
- Splits vector into *m* sub‑spaces; each sub‑vector gets an 8‑bit code → **16×** compression (128 → 8 bytes).  
- **Reconstruction distance** used instead of exact L2 → slight accuracy loss.
- **Decoder cost**: table‑lookup + SIMD; ~50–100 ns per dot‑product.

### 4.3 Why They Don’t Fully Replace HNSW
- Combined IVF‑PQ can reach **0.92–0.95 recall** but still behind HNSW’s 0.98+.  
- Retrieval accuracy gap becomes bottleneck when feeding answers into LLMs (hallucination risk).

---

## 5. DiskANN — What It Solved
### 5.1 Core Idea
- **RAM**: store *sampled navigational graph* (eg. upper layers or “centroids”).  
- **SSD**: store full graph & vectors in **4 KB blocks** sorted by node ID.  
- During search, expected ‹5–10› blocks read thanks to *prefetch on predicted path*.

### 5.2 Local‑NVMe Results
| Dataset | RAM ↓ | SSD QPS | p99 Latency |
| --- | --- | --- | --- |
| 1 B vectors (96 d) | 30 GB (vs 320 GB full RAM) | 4 000 | 5 ms |

### 5.3 Mechanisms
1. **Block Prefetch Queue** : frontier nodes’ blocks are asynchronously fetched.  
2. **Euclidean pruning** : early‑exit if current best distance < block‑level lower‑bound.  
3. **Thread‑local caches** : hot blocks pinned in DRAM.

---

## 6. DiskANN Gap in Cloud‑Native Environments
### 6.1 Fixed 4 KB Block Size
- EBS and GCP PD reach **peak throughput** at 64 KB+ sequential reads.  
- 4 KB causes **fragmentation** → 16× more I/O ops for same logical path.

### 6.2 Blind Prefetch Strategy
- Prefetches every candidate frontier block with equal weight.  
- Under limited cloud IOPS (eg. gp3 base 3 000 IOPS) this triggers *queue congestion* → blocks arrive **after** they are needed.

### 6.3 Missing Compression Path
- Vectors are flushed as raw float32; SSD storage ≈ 60 GB/10 M vec.  
- On S3 tiering, egress and PUT cost dominate TCO.

### 6.4 Single‑Node Assumption
- Original paper targets “single Dell R730 + 8 NVMe”.  
- No built‑in shard router, replication, or failover → incompatible with *Kubernetes / managed DB* deployment norms.

### 6.5 Summary Table
| Design Aspect | DiskANN (orig.) | Cloud‑Native Requirement | Gap |
| --- | --- | --- | --- |
| Block Size | 4 KB fixed | Tunable (≥ 64 KB) | ⚠ |
| Prefetch Policy | BFS frontier, equal pri. | IOPS‑aware, priority queue | ⚠ |
| Compression | None | FP16/PQ optional | ⚠ |
| Deployment | Single host | Elastic shards + HA | ⚠ |

> **Motivation Statement:** *We need to rethink DiskANN’s storage layout and I/O heuristics so they embrace the constraints of networked cloud disks and multi‑node orchestration while preserving HNSW‑level recall.*

---
