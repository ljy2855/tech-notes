

# 1. Introduction — Why VectorDB Matters

- **Modern AI applications** such as recommendation systems, semantic search, multimodal retrieval, and RAG workflows all depend on fast nearest-neighbor search over **hundreds of millions** of high-dimensional vectors.
- **Vector Databases (VectorDB)** sit on the critical path, and latency at this stage directly impacts user experience and model performance.
- Recent works [Manu, 2022] emphasize that retrieval latency is no longer a secondary concern but a primary bottleneck in real-world AI deployment.

---

# 2. Dataset Scale & Infrastructure Constraints

## 2.1 Wikipedia-scale Example
- Wikipedia corpus: ~6.7M articles
- Assuming OpenAI embeddings (1,024 dimensions), total ≈ **7.7M vectors** after accounting for long articles.

Storage footprint:

7.7M \times 4\ \text{KB} \approx 30.8\ \text{GB}

## 2.2 Cloud Environment Reality
| Dimension | On-premises Assumption       | Cloud Reality (256 GB RAM Instances) |
| :-------- | :--------------------------- | :----------------------------------- |
| Storage   | Local NVMe (μs latency)      | EBS / S3 (ms latency)                |
| Memory    | 512 GB–1 TB nodes affordable | High-cost 256 GB limits              |
| Scaling   | Static servers               | Elastic scaling & failure handling   |
- **Key Insight**: Billion-scale vector search requires architectural adaptations under cloud storage and memory constraints.



---

# 3. Limitations of Traditional HNSW

- **Memory Usage**:
  - RAM required = Vectors (~30.8 GB) + Graph (~6.4 GB) + Build-time overhead (~20–40 GB).
  - Practical 256 GB RAM instance handles ~25–28M vectors max.
- **Disk Access Patterns**:
  - mmap paging over networked storage introduces 10ms+ p99 latency per page miss.
- **Cost Explosion**:
  - High-RAM instances (256 GB+) are expensive ($1,500+/month).

### latency 실험
```
FAISS HNSW 10K 1024D fvecs
2vcpu 4GB

EBS GP3
[Timing] Indexing (add): 140.187 seconds
[Timing] File write: 0.0244686 seconds
[Timing] File read: 0.0223393 seconds
[Timing] Search: 0.00204095 seconds


local NVME
[Timing] Indexing (add): 111.614 seconds
[Timing] File write: 0.0182051 seconds
[Timing] File read: 0.0152163 seconds
[Timing] Search: 0.000734166 seconds


```


> **Conclusion**:  
> HNSW, while powerful, is not feasible for billion-scale search without significant system rethinking.

---

# 4. Alternatives: IVF and PQ (Brief)

- **IVF (Inverted File Index)**:
  - Reduces search space via coarse quantization.
  - Memory-light but may sacrifice recall at low *nprobe*.
- **Product Quantization (PQ/OPQ)**:
  - Compresses vectors ~16×, enabling cheap storage.
  - Reconstruction errors introduce a trade-off between accuracy and speed.

> These methods improve scalability but still **fall short of HNSW recall (0.98+)**, which is critical for applications like RAG.

---

# 5. DiskANN — What It Solved (Detailed)

## 5.1 Core Idea
- Move most vector and graph data to SSD.
- Only minimal metadata stays in RAM.
- Organize data into **4 KB blocks** for I/O efficiency.

## 5.2 DiskANN Performance on Local NVMe

| Dataset | RAM Usage | SSD QPS  | p99 Latency |
| :------ | :-------- | :------ | :--------- |
| 1B vectors (96 dims) | 30 GB | 4000 QPS | ~5 ms |

## 5.3 Key Techniques
- **Block Prefetch Queue**.
- **Euclidean Pruning**.
- **Thread-local Hot Caches**.

---

# 6. DiskANN Gap in Cloud-Native Environments

## 6.1 Block Size Mismatch
- 4 KB blocks designed for NVMe.
- EBS/S3 optimal at ≥64 KB, causing IOPS bottlenecks.

## 6.2 Blind Prefetching
- Uniform prefetching leads to prefetch congestion under IOPS-limited environments.

## 6.3 Lack of Compression
- Raw float32 storage results in large SSD footprints and increased egress cost.

## 6.4 Single-Node Assumption
- No built-in sharding, replication, or failover mechanisms.

---

# 7. Starling — Beyond DiskANN: Towards Cloud-Native Vector Search

## 7.1 Key Innovations
- **Segmented Graph Layout** for better sequential disk access.
- **I/O-Optimal Search** to minimize random disk reads.
- **Data-Aware Indexing** improves locality at indexing time.
- **Segment-Level Prefetching** enhances throughput.

## 7.2 Performance Gains

| Metric              | DiskANN | Starling | Improvement |
| :------------------ | :------ | :------- | :---------- |
| I/O ops per query    | 8–10    | 5–6      | ~40% lower  |
| p99 Latency (1M vec) | 10 ms   | 6–7 ms   | ~30–40% faster |

## 7.3 Relevance to Cloud

- Designed for cloud disks (EBS, S3).
- Prefetch optimized for IOPS constraints.
- Better tail-latency and lower operational cost.