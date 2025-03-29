- 금주 수행한 내용

1. **vectorDB HNSW 인덱싱 메모리 이슈 문제 실험 및 수치화**
	- HNSW 그래프가 메모리에 상주해야 하는 구조적 특성으로 인한 서비스 상의 문제점 정리
	- 예상 시나리오:
	    - 다수의 샤드/노드에 대용량 벡터 인덱스를 분산 배치했을 때의 메모리 소비 패턴
	- 실험 계획:
	    - 벡터 개수, dimension, 파라미터별 메모리 사용량 및 검색 latency 수치화
	    - 벡터 수 증가에 따른 메모리 사용량 곡선 도출 (e.g., 1M, 10M, 100M vectors)
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