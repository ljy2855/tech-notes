
프로덕션 환경 설명

목적:
- 170만건의 논문을 임베딩
- 실시간 vector search가 1s 이내로 가능
- indexing시, search request에서 가용성 보장



### solution
**AWS opensearch**
vector engine: faiss


**indexing props**
indexing : HNSW
distance : Euclidean distance
ef_construction : 100
ef_search: 100
m : 16
encoder : flat
dimension = 1024
node = 1.7M



```
1.1 * (4 * dimension + 8 * m)
```

knn indexing memory cost
7.89888 GB
-> shading backup -> 15GB

### Environment


### 개선
## Using Faiss scalar quantization





