
연구 내용을 기반으로 하여 한학기 동안 수행할 연구 내용의 범주에 대한 정의와 함께, 연구 proposal을 하는 것으로 하겠습니다. 각자 20분 정도 발표 준비를 하기 바랍니다.

- 연구배경
- 연구목표
- 향후 연구 계획 (주별로 작성)

---


# Cloud‑Native Vector Search: Detailed Motivation 

---

# 1. Introduction — Why VectorDB Matters

## 1.1 AI Service Dependency
- **Modern AI pipelines**—including recommendation systems, semantic search, multimodal retrieval, and RAG—*all* begin with a nearest-neighbor query against **hundreds of millions** of high-dimensional vectors.
- A **Vector Database (VectorDB)** sits on the critical path: milliseconds won or lost here directly impact user-perceived latency, search relevance, or LLM token generation speed.

> As highlighted in recent studies [Manu, 2022], retrieval performance is no longer an optimization, but a critical enabler for real-world AI deployment.

---

## 1.2 Vector Dataset Size

| Category         | Calculation                               | Result               |
| :--------------- | :---------------------------------------- | :------------------- |
| Short articles (90%) | 6.7M × 0.9 × 1 vector              | 6.03M vectors        |
| Long articles (10%)  | 6.7M × 0.1 × 2.5 vectors           | 1.675M vectors       |
| **Total**         | 6.03M + 1.675M                          | **7.705M vectors**   |

- Assumes no chunking; each document up to 8192 tokens (OpenAI embedding model limit).
- Using 1,024-dimensional embeddings, this results in a raw storage requirement of ~30 GB (float32 format).

---

## 1.3 Cloud Reality Check

| Dimension | Traditional Assumption         | Cloud Reality                                          |
| :-------- | :----------------------------- | :---------------------------------------------------- |
| Storage   | Local NVMe (μs latency)         | **Network-attached** EBS / persistent disks (ms latency) |
| Memory    | 512 GB–1 TB RAM affordable once | Per-hour billing; 1 TB RAM ≈ \$6–7k per month         |
| Scaling   | Single rack, static provisioning | **Elastic scaling and auto-recovery** expected        |

> **Key takeaway:**  
> Most vector search systems (e.g., Faiss, HNSW, DiskANN) were optimized for on-premises NVMe-based servers,  
> but **cloud-native deployments face fundamentally different cost and latency trade-offs**.

---

# 2. HNSW Recap — Strengths & Inner Workings

## 2.1 Concept
- **HNSW (Hierarchical Navigable Small-World Graph)** constructs a multi-layer graph structure:
  - Sparse layers on top
  - Dense base layer (level 0)
- Query proceeds via greedy graph walks, descending layers until a local optimum is found.

## 2.2 Why It Shines

| Property                | Effect                                    |
| :---------------------- | :--------------------------------------- |
| **Logarithmic search paths** | Sub-millisecond CPU even at billion scale |
| **Strong graph locality**    | High recall (> 0.98) without exhaustive scan |
| **Purely in-memory**         | No decompression, no disk access, minimal latency |

## 2.3 Internal Parameters Cheat-Sheet

| Symbol           | Typical Range | Purpose                          |
| :--------------- | :------------ | :------------------------------- |
| *M*              | 16–32          | Maximum neighbors per node       |
| *efConstruction* | 200–400        | Graph quality vs build time trade-off |
| *efSearch*       | 32–128         | Recall vs query CPU cost          |

---

# 3. HNSW Cloud Pain-Points

## 3.1 Full-RAM Requirement
- **Memory footprint estimation** (float32 format):
  
  \[
  N \times d \times 4\ \text{bytes} + N \times M \times 4\ \text{bytes}
  \]

  Example for Wikipedia-scale:
  - 7.7M vectors × 1024 dimensions → ~30 GB for vectors
  - +6.4 GB for graph structure
  - ⇒ **~36.4 GB total**

- Cloud RAM beyond 256 GB is extremely expensive, leading to massive OPEX at scale.

## 3.2 Random Access Pattern
- HNSW graph traversal involves **non-sequential** memory accesses.
- Under mmap, each miss triggers a **page fault** → 4–64 KB random reads on EBS volumes.
- Empirical results:
  - 1000 random 4 KB reads on AWS gp3 ≈ **10 ms p99** latency (vs <200 μs on NVMe).

## 3.3 Cost Explosion

| Instance        | RAM Size | On-demand Cost (2025 AWS) |
| :-------------- | :------- | :------------------------ |
| r6i.2xlarge      | 64 GB    | \$340/month               |
| r6i.32xlarge     | 1 TB     | \$5,500–7,000/month        |

> **Observation:**  
> Keeping the full HNSW index resident in RAM is **economically infeasible** for billion-scale datasets in cloud environments.

---

# 4. IVF & PQ Quick Glance — Alternative Trade-offs

## 4.1 IVF (Inverted File Index)
- Clusters vectors using k-means into √N centroids.
- Search probes a small number (*nprobe*) of closest clusters only.
- **Pros:** Great memory efficiency; scalable to billions of vectors.
- **Cons:** Missed centroids lead to sharp recall drops.

## 4.2 Product Quantization (PQ/OPQ)
- Compresses vectors by dividing into *m* subspaces, quantizing each separately.
- 16× compression typical (128-dim → 8 bytes).
- **Pros:** Massive memory savings.
- **Cons:** Approximate distances introduce errors; decoder overhead (~50–100 ns per comparison).

## 4.3 Why IVF-PQ Doesn't Fully Replace HNSW
- Even optimized IVF-PQ setups achieve only **0.92–0.95 recall**, falling short of HNSW (~0.98+).
- Retrieval error can propagate, degrading downstream tasks like answer generation in RAG systems.

---

# 5. DiskANN — What It Solved

## 5.1 Core Idea
- Move most of the vector data and graph structure to **SSD**, leaving only entry points and coarse metadata in RAM.
- Layout vectors into **4 KB blocks** sorted by node ID for sequential access.
- Prefetch relevant blocks during search to minimize random I/O.

## 5.2 Performance on Local NVMe

| Dataset               | RAM Usage | SSD QPS  | p99 Latency |
| :--------------------- | :-------- | :------ | :--------- |
| 1B vectors (96 dim)     | 30 GB (vs 320 GB RAM) | 4000 QPS | ~5 ms |

## 5.3 Key Techniques
1. **Block Prefetch Queue:** Asynchronously load predicted graph blocks.
2. **Euclidean Pruning:** Skip blocks if current best distance suffices.
3. **Thread-local Hot Caches:** Keep frequently accessed nodes resident.

---

# 6. DiskANN Gap in Cloud-Native Environments

## 6.1 Fixed 4 KB Block Size
- EBS and S3 favor sequential reads ≥64 KB.
- 4 KB blocks cause **excessive fragmentation** and **IOPS throttling** in cloud disks.

## 6.2 Blind Prefetch Strategy
- Uniform priority prefetch without IOPS-aware scheduling leads to **prefetch congestion**.

## 6.3 Missing Compression Path
- Raw float32 vectors occupy large storage.
- For 10M vectors: ~40 GB storage cost (before replication or backup overhead).

## 6.4 Single-Node Assumption
- No built-in shard management, replication, or recovery.
- Unsuitable for Kubernetes, multi-zone HA, or dynamic cloud scaling.

## 6.5 Summary Table

| Aspect              | DiskANN (Original)  | Cloud-Native Requirement  | Gap |
| :------------------ | :------------------ | :------------------------- | :-- |
| Block Size           | 4 KB fixed           | Tunable (≥64 KB)             | ⚠  |
| Prefetch Policy      | Uniform frontier prefetch | Priority-aware, IOPS-sensitive | ⚠  |
| Compression          | None                 | FP16, PQ optional compression | ⚠  |
| Deployment Model     | Single host          | Multi-node sharding + HA     | ⚠  |

> **Motivation Statement:**  
> *To enable billion-scale vector search in cloud-native environments, DiskANN must evolve: embracing dynamic storage layouts, smarter prefetching, compression strategies, and elastic multi-node deployment while preserving HNSW-level recall.*

---
