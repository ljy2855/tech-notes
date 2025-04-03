

### Background 설명

#### RAG 시스템에서 왜 VectorDB로 OpenSearch를 사용하는가?

vector search(semantic) 와 full-text search(lexical) 둘 다 가능하기에,
이를 위한 


#### Cluster 고가용성 필요
- vector

#### 임베딩 모델
- BAAI/bge-m3
- BAAI/bge-reranker-v2-m3

#### Search flow

1. user query embedding
2. vector search from OpenSearch
3. user query full-text search from OpenSearch
4. combine two result sets
5. reranking result sets (with reranker model)
6. return similar documents

### OpenSearch KNN indexing


### 실험
