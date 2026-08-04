
연구 내용을 기반으로 하여 한학기 동안 수행할 연구 내용의 범주에 대한 정의와 함께, 연구 proposal을 하는 것으로 하겠습니다. 각자 20분 정도 발표 준비를 하기 바랍니다.

- 연구배경
- 연구목표
- 향후 연구 계획 (주별로 작성)
### 1. Introduction — Why VectorDB Matters


#### 1.1 Vector Dataset Size

VectorDB usage in RAG system. Assumption knowledge base like wikipedia

| Category             | Calculation              | Result             |
| :------------------- | :----------------------- | :----------------- |
| Short articles (90%) | 6.7M × 0.9 × 1 vector    | 6.03M vectors      |
| Long articles (10%)  | 6.7M × 0.1 × 2.5 vectors | 1.675M vectors     |
| **Total**            | 6.03M + 1.675M           | **7.705M vectors** |

- Assumes no chunking; each document up to 8192 tokens (OpenAI embedding model limit).
- Using 1,024-dimensional embeddings, each vector occupies **4 KB** (float32).
- Storage requirement for raw vectors:  
  
  $7.705M \times 4\ \text{KB} \approx 30.8\ \text{GB}$


### 1.2 Cloud Reality Check

| Dimension | Traditional Assumption           | Cloud Reality (256 GB RAM Instance)                      |
| :-------- | :------------------------------- | :------------------------------------------------------- |
| Storage   | Local NVMe (μs latency)          | **Network-attached** EBS / persistent disks (ms latency) |
| Memory    | 512 GB–1 TB RAM affordable once  | RAM constrained to **256 GB**, high per-hour costs       |
| Scaling   | Single rack, static provisioning | **Elastic scaling and auto-recovery** expected           |

> **Key takeaway:**  
> Existing vector search engines, optimized for abundant RAM and fast local disks, face significant cost and latency constraints in 256 GB cloud environments.


### 2. HNSW Recap — Strengths & Inner Workings

#### 2.1 Concept
- **HNSW (Hierarchical Navigable Small-World Graph)** builds multi-layer graphs:
  - Sparse upper layers
  - Dense base layer
- Greedy graph traversal from top layers to bottom achieves efficient approximate search.

#### 2.2 Why It Shines

| Property                     | Effect                                           |
| :--------------------------- | :----------------------------------------------- |
| **Logarithmic search paths** | Sub-millisecond CPU even at large scale          |
| **Strong graph locality**    | High recall (> 0.98) without exhaustive scanning |
| **Purely in-memory design**  | No decompression or disk access during search    |

#### 2.3 Internal Parameters Cheat-Sheet

| Symbol           | Typical Range | Purpose                              |
| :--------------- | :------------ | :----------------------------------- |
| *M*              | 16–32         | Max neighbors per node               |
| *efConstruction* | 200–400       | Graph construction quality trade-off |
| *efSearch*       | 32–128        | Search recall vs latency             |


### 3. HNSW Cloud Pain-Points

#### 3.1 Full-RAM Requirement

Memory footprint estimation (float32 format):

$N \times d \times 4\ \text{bytes} + N \times M \times 4\ \text{bytes}$

Example for Wikipedia-scale:

- 7.7M vectors × 1024 dimensions → ~30.8 GB raw vectors
- +6.4 GB for graph structure (M=32)
- ⇒ **~37.2 GB total RAM** required

- In practice, indexing additionally requires ~1.5–2× RAM due to working buffers, meaning peak RAM usage can reach **60–80 GB**.


#### 3.2 Random Access Pattern

- HNSW graph traversal is non-sequential.
- Each memory miss under mmap triggers a **page fault**, causing **4–64 KB random reads** on network-attached EBS volumes.
- Empirical results show:
  - 1000 random 4 KB reads on AWS gp3 ≈ **10 ms p99 latency** (vs <200 μs on NVMe).

> Random disk I/O dominates latency unless the full graph resides in memory.


#### 3.3 Cost Explosion

| Instance    | RAM Size | On-demand Cost (2025 AWS) |
| :---------- | :------- | :------------------------ |
| r6i.2xlarge | 64 GB    | \$340/month               |
| r6i.8xlarge | 256 GB   | \$1,350–1,600/month       |
|             |          |                           |

> **Observation:**  
> Even with 256 GB RAM instances, full in-memory indexing and search is feasible only for mid-scale datasets (e.g., ~7–25M vectors at 1024 dims).  
> Billion-scale indexes become impractical without disk-resident augmentation.


#### 3.4 RAM Overhead During Index Building — FAISS Example

Even if the saved HNSW index is ~37 GB,  
**index construction** phase uses far more RAM.

Breakdown during FAISS HNSW indexing:

| Component                 | Description                    | Size Estimate (7.7M vectors) |
| :------------------------ | :----------------------------- | :--------------------------- |
| Raw vectors (float32)     | Full vector set                | ~30.8 GB                     |
| Neighbor links (graph)    | HNSW edges                     | ~6.4 GB                      |
| Candidate pools and heaps | Search buffers for each thread | 10–20 GB                     |
| Other malloc overhead     | Allocator slack, fragmentation | 10–15 GB                     |
| **Peak RAM usage**        | -                              | **~60–80 GB**                |

Thus, **indexing typically demands 1.5–2× the final saved size**.


#### 3.5 Key Reasons for High RAM Usage During FAISS HNSW Indexing

- **Dynamic Graph Construction:**  
  - Insertions dynamically modify neighbor lists, requiring mutable in-memory structures.
- **Multiple Working Buffers:**  
  - Multi-threaded search and insertion use separate candidate buffers and priority queues.
- **Low-Latency Full Dataset Access:**  
  - Distance computations must happen in-memory for speed.
- **Temporary RAM Peaks:**  
  - RAM usage drops after build but peaks significantly during indexing.


#### 3.6 RAM Budget Estimation for 256 GB Instances

Given 256 GB RAM:

- **50%** reserved for raw vectors (~128 GB)
- **Remaining** accommodates graph links, candidate buffers, and overhead

Thus:

- Each 1024-dim float32 vector (4 KB) means:

$\frac{128\ \text{GB}}{4\ \text{KB}} \approx 32M\ \text{vectors}$

- Considering safety margins for working memory:
  - Practical safe capacity ≈ **25–28M vectors**

| Component              | Estimate            |
| :--------------------- | :------------------ |
| 1 vector size          | 4 KB                |
| Max vectors (raw math) | 32M                 |
| Practical limit        | **~25–28M vectors** |

> **Conclusion:**  
> On a 256 GB RAM instance, indexing up to ~28 million 1024-dimensional vectors is feasible with FAISS HNSW.  
> Beyond that, hybrid disk-resident approaches become necessary.


### 4. IVF & PQ Quick Glance — Alternative Trade-offs

#### 4.1 IVF (Inverted File Index)
- Clusters vectors using k-means into √N centroids.
- Search probes a small number (*nprobe*) of closest clusters only.
- **Pros:** Great memory efficiency; scalable to billions of vectors.
- **Cons:** Missed centroids lead to sharp recall drops.

#### 4.2 Product Quantization (PQ/OPQ)
- Compresses vectors by dividing into *m* subspaces, quantizing each separately.
- 16× compression typical (128-dim → 8 bytes).
- **Pros:** Massive memory savings.
- **Cons:** Approximate distances introduce errors; decoder overhead (~50–100 ns per comparison).

#### 4.3 Why IVF-PQ Doesn't Fully Replace HNSW
- Even optimized IVF-PQ setups achieve only **0.92–0.95 recall**, falling short of HNSW (~0.98+).
- Retrieval error can propagate, degrading downstream tasks like answer generation in RAG systems.


### 5. DiskANN — What It Solved

#### 5.1 Core Idea
- Move most of the vector data and graph structure to **SSD**, leaving only entry points and coarse metadata in RAM.
- Layout vectors into **4 KB blocks** sorted by node ID for sequential access.
- Prefetch relevant blocks during search to minimize random I/O.

#### 5.2 Performance on Local NVMe

| Dataset             | RAM Usage             | SSD QPS  | p99 Latency |
| :------------------ | :-------------------- | :------- | :---------- |
| 1B vectors (96 dim) | 30 GB (vs 320 GB RAM) | 4000 QPS | ~5 ms       |

#### 5.3 Key Techniques
1. **Block Prefetch Queue:** Asynchronously load predicted graph blocks.
2. **Euclidean Pruning:** Skip blocks if current best distance suffices.
3. **Thread-local Hot Caches:** Keep frequently accessed nodes resident.


### 6. DiskANN Gap in Cloud-Native Environments

#### 6.1 Fixed 4 KB Block Size
- EBS and S3 favor sequential reads ≥64 KB.
- 4 KB blocks cause **excessive fragmentation** and **IOPS throttling** in cloud disks.

#### 6.2 Blind Prefetch Strategy
- Uniform priority prefetch without IOPS-aware scheduling leads to **prefetch congestion**.

#### 6.3 Missing Compression Path
- Raw float32 vectors occupy large storage.
- For 10M vectors: ~40 GB storage cost (before replication or backup overhead).

#### 6.4 Single-Node Assumption
- No built-in shard management, replication, or recovery.
- Unsuitable for Kubernetes, multi-zone HA, or dynamic cloud scaling.

#### 6.5 Summary Table

| Aspect           | DiskANN (Original)        | Cloud-Native Requirement       |
| :--------------- | :------------------------ | :----------------------------- |
| Block Size       | 4 KB fixed                | Tunable (≥64 KB)               |
| Prefetch Policy  | Uniform frontier prefetch | Priority-aware, IOPS-sensitive |
| Deployment Model | Single host               | Multi-node sharding + HA       |

#### 6.6 Improve DiskANN on Cloud Environment
- DiskANN are optimized prefetch with request small size IO (4kb block size)
- frequent small size IO can be bottleneck on cloud storage like `EBS gp3`

![[Pasted image 20250504164023.png]]

- How about bigger block packing to segment?  
```
(example segment)
┌────────────────────────────────────────────┐
│ **Node 1**                                 │
│ Full-precision Vector (128D float32)       │ → 512B
│ Neighbor List (R=64, Node IDs)             │ → 256B
│ Padding / Reserved Space                   │ → 256B (alignment to 1KB)
├────────────────────────────────────────────┤
│ **Node 2**                                 │
│ Full-precision Vector (128D float32)       │ → 512B
│ Neighbor List (R=64, Node IDs)             │ → 256B
│ Padding / Reserved Space                   │ → 256B (alignment to 1KB)
├────────────────────────────────────────────┤
│ **Node 3**                                 │
│ Full-precision Vector (128D float32)       │ → 512B
│ Neighbor List (R=64, Node IDs)             │ → 256B
│ Padding / Reserved Space                   │ → 256B (alignment to 1KB)
├────────────────────────────────────────────┤
│ ... (More Nodes)                           │
├────────────────────────────────────────────┤
│ **Metadata**                               │
│ Node IDs included in segment               │ → e.g., {Node 1, Node 2, Node 3..}
│ Segment Offset Map                         │ → {Node 1 @ 0B, Node 2 @ 1KB, ...}
│ Checksum / Validation Data                 │ → For data integrity
│ Reserved Space for future use              │
└────────────────────────────────────────────┘
```

