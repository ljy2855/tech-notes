### 금주 수행한 내용

#### vectorDB HNSW 인덱싱 메모리 이슈 문제 실험 및 수치화

`HNSW 그래프가 메모리에 상주해야 하는 구조적 특성으로 인한 서비스 상의 문제점 정리`




#### Env
production 환경과 비슷한 local 실험 환경 재구성

OpenSearch cluster (3 node)
- 호스트에 3개의 container로 opensearch cluster 생성
- Host : 11 core, 36GB
- 


#### Index Create

#### Document Insert (200K)

![[Pasted image 20250330150239.png]]

#### Search
![[Pasted image 20250330152955.png]]



#### Warm up
![[Pasted image 20250330151352.png]]


2. **해결 방안 서치**
	- vector qunatization으로 가능한가?
	- disk based indexing으로 해결 가능한가?



질문#1) Milvus를 사용했나요? VM 노드 세개에 deploy를 한 것 같은데, FAISS를 어떻게 사용했는지, 알려주세요.

Semantic search의 검색 정확도를 향상하기 위해, `OpenSearch` (Elastic Search fork)를 활용했었습니다. 
clustering 및 

plugin으로 `faiss`, `lucene`, `nmslib` 등 vector search engine을 지원하여 이 중 faiss를 사용했습니다.

 



질문#2) Index build 시간도 궁금합니다. 

질문#3) Index build가 된 이후, CRUD 연산 시간 
 - Create: 새로운 embedding 추가시 걸리는 시간
 - Update: Document가 업데이트 된 경우 embedding이 바뀌면, Index rebuild? 를 하는지, 한다면, 걸리는 시간
 - Delete: 위와 동일한 시간




이러한 CURD에 대한 Milvus의 시간이 궁금하네요.