
 - 연구 지도를 위해, 연구실에 있는 학생들은 쉽게 나와 미팅을 할 수 있지만, 그러지 못한 학생들도 있고, 바쁜 주에는 미팅이 어려운 경우도 있으므로, 각자 연구 진행상황에 대한 노트를 다음과 같은 형식으로 **전체** **회신(교과수강생 + 대학원생 멘토)으로 매주 일요일 밤 12시까지 아래 형식으로 Weekly report를 작성해서 보내주세요. 

  

- 금주 수행한 내용

1. OpenSearch based `Faiss`  HNSW 인덱싱 로직 분석
	- OpenSearch KNN 플러그인에서 FAISS 엔진을 사용한 HNSW 기반 인덱스 구조 확인
	- 벡터 인덱싱 시 그래프 구조가 디스크에 저장되며, 검색 시 메모리에 적재되는 방식 확인
	- 인덱싱 파라미터 (`m`, `ef_construction`) 및 검색 시 파라미터 (`ef_search`)가 성능과 메모리 사용량에 미치는 영향 분석

2. Production 환경에서 vector DB serving시, 고려해야하는 요소 확인
	- 실서비스 환경에서의 주요 고려 사항 파악:
		- 벡터 인덱스의 메모리 상주 여부    
		- 벡터 갱신/삭제의 처리 방식 (mutable vs immutable index)
		- 샤딩 전략 및 부하 분산
		- latency, throughput, 메모리 효율 간 트레이드오프 
	- HNSW 인덱스의 메모리 상주 특성과 대규모 벡터 데이터셋에서의 scale-out 어려움에 주목


- 내주 수행할 내용
1. production vectorDB HNSW 메모리 이슈 문제 구체화
	1. production에서 어느정도의 문제가 발생하는지 수치화
2. Flat vs Product Quantization 으로 해결 가능한건가?
	1. Performance(search or index speed, accuracy) 상관 관계 확인

