

### Background 설명

#### RAG 시스템에서 왜 VectorDB로 OpenSearch를 사용하는가?

vector search(semantic) 와 full-text search(lexical) 둘 다 가능하기에,

검색에 대한 정확도를 올리기 위해 해당 과정 필요
https://ieeexplore.ieee.org/abstract/document/10707868

#### Cluster 고가용성 필요
- vector

#### 임베딩 모델
- BAAI/bge-m3
- BAAI/bge-reranker-v2-m3

#### Embedding flow

1. get document from storage
2. get embedding vector with model
3. insert document with vector 

#### Retrieval flow

1. user query embedding
2. vector search from OpenSearch
3. user query full-text search from OpenSearch
4. combine two result sets
5. reranking result sets (with reranker model)
6. return similar documents

### OpenSearch KNN indexing

### 실험 1


일반 index (not knn)
![[Pasted image 20250403151503.png]]

Search

![[Pasted image 20250403152626.png]]


knn index 
![[Pasted image 20250403162019.png]]


![[Pasted image 20250403162239.png]]

cold start
![[Pasted image 20250403162514.png]]
![[Pasted image 20250403162340.png]]


after warm-up
![[Pasted image 20250403165149.png]]
![[Pasted image 20250403164010.png]]


#### 실험2 dataset 크기



#### 실험3 disk latency
400K
![[Pasted image 20250403170736.png]]

![[Pasted image 20250403170817.png]]

600K
![[Pasted image 20250403173614.png]]

![[Pasted image 20250403173705.png]]


