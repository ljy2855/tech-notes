

### 금주 수행한 내용

#### HNSW 인덱스의 메모리 사용 최적화 가능성 탐색

##### 벤치마크
OpenSearch의 HNSW 인덱싱 문제를 확인하기 위해 OpenSearch의 KNN 인덱싱에 활용되는 FAISS을 통해 **디스크별 인덱스 생성 및 검색, 저장/복원 과정의 성능**평가

```cpp
#include <iostream>
#include <vector>
#include <chrono>
#include <cstdio> 
#include <faiss/IndexHNSW.h>
#include <faiss/index_io.h>

int main() {
    int d = 1024;       // 벡터 차원
    int nb = 50000;    // 벡터 수
    int k = 5;          // topk
    const char* index_file = "hnsw_index.faiss";

    // 벡터 생성
    std::vector<float> xb(d * nb);
    for (int i = 0; i < nb * d; i++) {
        xb[i] = static_cast<float>(drand48());
    }

    int M = 16;
    faiss::IndexHNSWFlat index(d, M);
    index.hnsw.efConstruction = 20;

    // Indexing (add) 시간 측정
    auto start_add = std::chrono::high_resolution_clock::now();
    index.add(nb, xb.data());
    auto end_add = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> add_time = end_add - start_add;
    std::cout << "[Timing] Indexing (add): " << add_time.count() << " seconds" << std::endl;

    // Write (저장) 시간 측정
    auto start_write = std::chrono::high_resolution_clock::now();
    faiss::write_index(&index, index_file);
    auto end_write = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> write_time = end_write - start_write;
    std::cout << "[Timing] File write: " << write_time.count() << " seconds" << std::endl;

    // Read (불러오기) 시간 측정
    auto start_read = std::chrono::high_resolution_clock::now();
    faiss::Index* loaded_index = faiss::read_index(index_file);
    auto end_read = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> read_time = end_read - start_read;
    std::cout << "[Timing] File read: " << read_time.count() << " seconds" << std::endl;

    // 검색용 쿼리 벡터 준비
    std::vector<float> xq(xb.begin(), xb.begin() + d);
    std::vector<faiss::idx_t> I(k);
    std::vector<float> D(k);

    // Search 시간 측정
    auto start_search = std::chrono::high_resolution_clock::now();
    loaded_index->search(1, xq.data(), k, D.data(), I.data());
    auto end_search = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> search_time = end_search - start_search;
    std::cout << "[Timing] Search: " << search_time.count() << " seconds" << std::endl;

    delete loaded_index;
    return 0;
}

```

- NVME

```
[Timing] Indexing (add): 4.81904 seconds
[Timing] File write: 0.006278 seconds
[Timing] File read: 0.00842783 seconds
[Timing] Search: 0.000259917 seconds
```

- RAMDISK

```
[Timing] Indexing (add): 4.7268 seconds
[Timing] File write: 0.0151112 seconds
[Timing] File read: 0.00790933 seconds
[Timing] Search: 0.000222875 seconds
```


- USB
```
[Timing] Indexing (add): 4.83174 seconds
[Timing] File write: 5.10055 seconds
[Timing] File read: 0.00938633 seconds
[Timing] Search: 0.000263083 seconds
```
적당한 지연이 있는 디스크를 통해 추후 재실험 예정

##### 인사이트
- 초기 인덱싱에서는 오히려 file write, read 보다 인덱싱 자체가 지연 -> 추후 데이터 쌓아서 실험
- **faiss가 제공하는 인덱스 저장 방식은 file기반인데, 이걸 메모리 기반 DB에 저장하면 안될까?**
	- LSM tree DB 기반으로 메모리에 중간 stage를 두어 write latency와 flush 효율 개선하면?
- HNSW의 마지막 layer는 노드 수가 많아, 이를 클러스터 기반(IVF) segment 파일로 나누어 저장하면 prefetch 및 partial load가 개선되지 않을까?
- HNSW을 알고리즘을 변경하여 메모리 이슈를 해결한 연구는 없을까?
	- DiskANN, IVFPQ

### 차주 수행할 내용
- cloud disk latency 실험
	- aws or gcp cloud 계정이 별도로 없어, 추후 확인
- 해당 메모리 이슈를 해결한 DiskANN 알고리즘 리뷰
	- https://dl.acm.org/doi/abs/10.5555/3454287.3455520