1024 dimension
100k vectors


### cloud


Indexing
```
bin: #pts = 256, #dims = 1024, size = 1048584B
Finished writing bin.
Writing bin: diskann_index/ann_pq_pivots.bin
bin: #pts = 1024, #dims = 1, size = 4104B
Finished writing bin.
Writing bin: diskann_index/ann_pq_pivots.bin
bin: #pts = 513, #dims = 1, size = 2060B
Finished writing bin.
Writing bin: diskann_index/ann_pq_pivots.bin
bin: #pts = 4, #dims = 1, size = 40B
Finished writing bin.
Saved pq pivot data to diskann_index/ann_pq_pivots.bin of size 1058844B.
Opened: diskann_index/ann_vectors.bin, size: 409600008, cache_size: 67108864
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 4, #dims = 1...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 256, #dims = 1024...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 1024, #dims = 1...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 513, #dims = 1...
done.
Loaded PQ pivot information
Processing points  [0, 100000)...done.
Time for generating quantized data: 749.397644 seconds
Full index fits in RAM budget, should consume at most 0.458628GiBs, so building in one shot
L2: Using AVX2 distance computation DistanceL2Float
Passed, empty search_params while creating index config
Using only first 100000 from file..
Starting index build with 100000 points...
0% of index build completed.Starting final cleanup..done. Link time: 159.886s
Index built with degree: max:64  avg:64  min:64  count(deg<2):0
Not saving tags as they are not enabled.
Time taken for save: 0.358325s.
Time for building merged vamana index: 160.654099 seconds
Opened: diskann_index/ann_vectors.bin, size: 409600008, cache_size: 67108864
Vamana index file size=26000024
Opened: diskann_index/ann_disk.index, cache_size: 67108864
medoid: 20633B
max_node_len: 4356B
nnodes_per_sector: 0B
# sectors: 200000
Sector #0written
Sector #100000written
Finished writing 819204096B
Writing bin: diskann_index/ann_disk.index
bin: #pts = 9, #dims = 1, size = 80B
Finished writing bin.
Output disk index file written to diskann_index/ann_disk.index
Finished writing 819204096B
Time for generating disk layout: 1.450715 seconds
Opened: diskann_index/ann_vectors.bin, size: 409600008, cache_size: 67108864
Loading base diskann_index/ann_vectors.bin. #points: 100000. #dim: 1024.
Wrote 10027 points to sample file: diskann_index/ann_sample_data.bin
Indexing time: 914.131
Index built in 914.87 seconds
Loading index for search...
L2: Using AVX2 distance computation DistanceL2Float
L2: Using AVX2 distance computation DistanceL2Float
Reading bin file diskann_index/ann_pq_compressed.bin ...
Opening bin file diskann_index/ann_pq_compressed.bin...
Metadata: #pts = 100000, #dims = 512...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 4, #dims = 1...
done.
Offsets: 4096 1052680 1056784 1058844
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 256, #dims = 1024...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 1024, #dims = 1...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 513, #dims = 1...
done.
Loaded PQ Pivots: #ctrs: 256, #dims: 1024, #chunks: 512
Loaded PQ centroids and in-memory compressed vectors. #points: 100000 #dim: 1024 #aligned_dim: 1024 #chunks: 512
Disk-Index File Meta-data: # nodes per sector: 0, max node len (bytes): 4356, max node degree: 64
Opened file : diskann_index/ann_disk.index
Setting up thread-specific contexts for nthreads: 2
allocating ctx: 0x70284cf78000 to thread-id:123318506388352
allocating ctx: 0x70284cf67000 to thread-id:123318355094336
Loading centroid data from medoids vector data of 1 medoid(s)
done..
Reading (with alignment) bin file diskann_index/ann_sample_data.bin ...Metadata: #pts = 10027, #dims = 1024, aligned_dim = 1024... allocating aligned memory of 41070592 bytes... done. Copying data to mem_aligned buffer... done.
Loading the cache list into memory....done.
Running queries...
Search time for 10 queries: 0.16 seconds
Avg latency per query: 16.37 ms
Top-1 neighbor indices for each query: [23793 66269     2     3     4 99680     6     7     8     9]
Clearing scratch
```

Search
```
Loading index from disk...
L2: Using AVX2 distance computation DistanceL2Float
L2: Using AVX2 distance computation DistanceL2Float
Reading bin file diskann_index/ann_pq_compressed.bin ...
Opening bin file diskann_index/ann_pq_compressed.bin...
Metadata: #pts = 100000, #dims = 512...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 4, #dims = 1...
done.
Offsets: 4096 1052680 1056784 1058844
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 256, #dims = 1024...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 1024, #dims = 1...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 513, #dims = 1...
done.
Loaded PQ Pivots: #ctrs: 256, #dims: 1024, #chunks: 512
Loaded PQ centroids and in-memory compressed vectors. #points: 100000 #dim: 1024 #aligned_dim: 1024 #chunks: 512
Disk-Index File Meta-data: # nodes per sector: 0, max node len (bytes): 4356, max node degree: 64
Opened file : diskann_index/ann_disk.index
Setting up thread-specific contexts for nthreads: 2
allocating ctx: 0x7b6fcbaa9000 to thread-id:135720209939328
allocating ctx: 0x7b6fc9ec2000 to thread-id:135719995845440
Loading centroid data from medoids vector data of 1 medoid(s)
done..
Reading (with alignment) bin file diskann_index/ann_sample_data.bin ...Metadata: #pts = 10027, #dims = 1024, aligned_dim = 1024... allocating aligned memory of 41070592 bytes... done. Copying data to mem_aligned buffer... done.
Loading the cache list into memory....done.
Index load time: 100.9303 seconds
Running search queries...

Search completed.
Total queries: 1000
Index load time: 100.9303 seconds
Total search time: 8.3224 seconds
Average latency per query: 8.32 ms

````

![[Pasted image 20250627164651.png]]
![[Pasted image 20250627164721.png]]
on-prem
Indexing
```
bin: #pts = 256, #dims = 1024, size = 1048584B
Finished writing bin.
Writing bin: diskann_index/ann_pq_pivots.bin
bin: #pts = 1024, #dims = 1, size = 4104B
Finished writing bin.
Writing bin: diskann_index/ann_pq_pivots.bin
bin: #pts = 513, #dims = 1, size = 2060B
Finished writing bin.
Writing bin: diskann_index/ann_pq_pivots.bin
bin: #pts = 4, #dims = 1, size = 40B
Finished writing bin.
Saved pq pivot data to diskann_index/ann_pq_pivots.bin of size 1058844B.
Opened: diskann_index/ann_vectors.bin, size: 409600008, cache_size: 67108864
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 4, #dims = 1...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 256, #dims = 1024...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 1024, #dims = 1...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 513, #dims = 1...
done.
Loaded PQ pivot information
Processing points  [0, 100000)...done.
Time for generating quantized data: 709.606934 seconds
Full index fits in RAM budget, should consume at most 0.458628GiBs, so building in one shot
L2: Using AVX2 distance computation DistanceL2Float
Passed, empty search_params while creating index config
Using only first 100000 from file..
Starting index build with 100000 points...
0% of index build completed.Starting final cleanup..done. Link time: 268.114s
Index built with degree: max:64  avg:64  min:64  count(deg<2):0
Not saving tags as they are not enabled.
Time taken for save: 0.389235s.
Time for building merged vamana index: 269.147522 seconds
Opened: diskann_index/ann_vectors.bin, size: 409600008, cache_size: 67108864
Vamana index file size=26000024
Opened: diskann_index/ann_disk.index, cache_size: 67108864
medoid: 69498B
max_node_len: 4356B
nnodes_per_sector: 0B
# sectors: 200000
Sector #0written
Sector #100000written
Finished writing 819204096B
Writing bin: diskann_index/ann_disk.index
bin: #pts = 9, #dims = 1, size = 80B
Finished writing bin.
Output disk index file written to diskann_index/ann_disk.index
Finished writing 819204096B
Time for generating disk layout: 1.040810 seconds
Opened: diskann_index/ann_vectors.bin, size: 409600008, cache_size: 67108864
Loading base diskann_index/ann_vectors.bin. #points: 100000. #dim: 1024.
Wrote 10049 points to sample file: diskann_index/ann_sample_data.bin
Indexing time: 980.1
Index built in 980.66 seconds
Loading index for search...
L2: Using AVX2 distance computation DistanceL2Float
L2: Using AVX2 distance computation DistanceL2Float
Reading bin file diskann_index/ann_pq_compressed.bin ...
Opening bin file diskann_index/ann_pq_compressed.bin...
Metadata: #pts = 100000, #dims = 512...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 4, #dims = 1...
done.
Offsets: 4096 1052680 1056784 1058844
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 256, #dims = 1024...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 1024, #dims = 1...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 513, #dims = 1...
done.
Loaded PQ Pivots: #ctrs: 256, #dims: 1024, #chunks: 512
Loaded PQ centroids and in-memory compressed vectors. #points: 100000 #dim: 1024 #aligned_dim: 1024 #chunks: 512
Disk-Index File Meta-data: # nodes per sector: 0, max node len (bytes): 4356, max node degree: 64
Opened file : diskann_index/ann_disk.index
Setting up thread-specific contexts for nthreads: 2
allocating ctx: 0x7c78abab1000 to thread-id:136857799117696
allocating ctx: 0x7c78abaa0000 to thread-id:136855636937536
Loading centroid data from medoids vector data of 1 medoid(s)
done..
Reading (with alignment) bin file diskann_index/ann_sample_data.bin ...Metadata: #pts = 10049, #dims = 1024, aligned_dim = 1024... allocating aligned memory of 41160704 bytes... done. Copying data to mem_aligned buffer... done.
Loading the cache list into memory....done.
Running queries...
Search time for 10 queries: 0.17 seconds
Avg latency per query: 17.40 ms
Top-1 neighbor indices for each query: [    0     1     2     3     4     5     6 57614     8 77264]
Clearing scratch
```

Search
```
Loading index from disk...
L2: Using AVX2 distance computation DistanceL2Float
L2: Using AVX2 distance computation DistanceL2Float
Reading bin file diskann_index/ann_pq_compressed.bin ...
Opening bin file diskann_index/ann_pq_compressed.bin...
Metadata: #pts = 100000, #dims = 512...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 4, #dims = 1...
done.
Offsets: 4096 1052680 1056784 1058844
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 256, #dims = 1024...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 1024, #dims = 1...
done.
Reading bin file diskann_index/ann_pq_pivots.bin ...
Opening bin file diskann_index/ann_pq_pivots.bin...
Metadata: #pts = 513, #dims = 1...
done.
Loaded PQ Pivots: #ctrs: 256, #dims: 1024, #chunks: 512
Loaded PQ centroids and in-memory compressed vectors. #points: 100000 #dim: 1024 #aligned_dim: 1024 #chunks: 512
Disk-Index File Meta-data: # nodes per sector: 0, max node len (bytes): 4356, max node degree: 64
Opened file : diskann_index/ann_disk.index
Setting up thread-specific contexts for nthreads: 2
allocating ctx: 0x72ad75e31000 to thread-id:126089394981760
allocating ctx: 0x72ad75e20000 to thread-id:126087164070720
Loading centroid data from medoids vector data of 1 medoid(s)
done..
Reading (with alignment) bin file diskann_index/ann_sample_data.bin ...Metadata: #pts = 10049, #dims = 1024, aligned_dim = 1024... allocating aligned memory of 41160704 bytes... done. Copying data to mem_aligned buffer... done.
Loading the cache list into memory....done.
Index load time: 25.0428 seconds
Running search queries...

Search completed.
Total queries: 1000
Index load time: 25.0428 seconds
Total search time: 7.7803 seconds
Average latency per query: 7.78 ms
````
![[Pasted image 20250627165456.png]]


| **항목**                | **Cloud**                    | **On-Prem**                  |
| --------------------- | ---------------------------- | ---------------------------- |
| **Quantization Time** | 749.40 sec                   | 709.61 sec                   |
| **Graph Build Time**  | 160.65 sec                   | 269.15 sec                   |
| **Disk Layout Time**  | 1.45 sec                     | 1.04 sec                     |
| **전체 Indexing 시간**    | 914.87 sec                   | 980.66 sec                   |
| **Index 파일 크기**       | 819.20 MB                    | 819.20 MB                    |
| **로드 시간 (1차)**        | ≈ 0 sec (측정 안됨)              | ≈ 0 sec (측정 안됨)              |
| **검색 시간 (10개)**       | 0.16 sec (16.37 ms/query)    | 0.17 sec (17.40 ms/query)    |
| **로드 시간 (1000쿼리)**    | **100.93 sec**               | **25.04 sec**                |
| **검색 시간 (1000개)**     | **8.32 sec (8.32 ms/query)** | **7.78 sec (7.78 ms/query)** |





HNSW (ef = 20)
[Timing] Indexing (add): 46.9747 seconds
[Timing] File write: 0.165714 seconds
[Timing] File read: 0.107122 seconds
[Timing] Search: 0.000276 seconds

IVF-PQ
[Timing] Indexing (add): 0.641702 seconds
[Timing] File write: 0.002208 seconds
[Timing] File read: 0.011815 seconds
[Timing] Search: 0.002504 seconds