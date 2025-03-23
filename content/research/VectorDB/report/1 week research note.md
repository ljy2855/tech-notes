
 - 연구 지도를 위해, 연구실에 있는 학생들은 쉽게 나와 미팅을 할 수 있지만, 그러지 못한 학생들도 있고, 바쁜 주에는 미팅이 어려운 경우도 있으므로, 각자 연구 진행상황에 대한 노트를 다음과 같은 형식으로 **전체** **회신(교과수강생 + 대학원생 멘토)으로 매주 일요일 밤 12시까지 아래 형식으로 Weekly report를 작성해서 보내주세요. 

  

- 금주 수행한 내용

1. OpenSearch based `Faiss`  HNSW 인덱싱 로직 분석
	- OpenSearch KNN 플러그인에서 FAISS 엔진을 사용한 HNSW 기반 인덱스 구조 확인
	- 벡터 인덱싱 시 그래프 구조가 디스크에 저장되며, 검색 시 메모리에 적재되는 방식 확인
		벡터 인덱싱시에 
	- 인덱싱 파라미터 (`m`, `ef_construction`) 및 검색 시 파라미터 (`ef_search`)가 성능과 메모리 사용량에 미치는 영향 분석
		 벡터 노드 하나당 그래프 연결정보를 인덱스에 추가

2. Production 환경에서 vector DB serving시, 고려해야하는 요소 확인
	- 실서비스 환경에서의 주요 고려 사항 파악:
		- 벡터 인덱스의 메모리 상주 여부    
			기본적으로 HNSW 알고리즘의 경우 **그래프 정보**만을 메모리상에 올려놓고 search 진행
		- 샤딩 전략 및 부하 분산
			production 환경에서는 고가용성을 보장하기 위해, 멀티노드 샤딩 전략을 사용, 최소한의 가용성을 보장하기 위해 shard count = node \*2 , replica = 1을 사용
			
	- HNSW 인덱스의 메모리 상주 특성과 대규모 벡터 데이터셋에서의 scale-out 어려움에 주목


- 내주 수행할 내용
1. production vectorDB HNSW 메모리 이슈 문제 구체화
	- HNSW 그래프가 메모리에 상주해야 하는 구조적 특성으로 인한 서비스 상의 문제점 정리
	- 예상 시나리오:
	    - 다수의 샤드/노드에 대용량 벡터 인덱스를 분산 배치했을 때의 메모리 소비 패턴
	    - 노드 장애 시 복구 또는 재적재 과정에서의 latency 증가
	- 실험 계획:
	    - 벡터 개수, dimension, 파라미터별 메모리 사용량 및 검색 latency 수치화
	    - 벡터 수 증가에 따른 메모리 사용량 곡선 도출 (e.g., 1M, 10M, 100M vectors)
2. 해결 방안에 대한 리서치
	- vector qunatization으로 가능한가?
	- disk based indexing으로 해결 가능한가?



참고 논문:
https://arxiv.org/abs/2405.03267
https://proceedings.neurips.cc/paper_files/paper/2019/file/09853c7fb1d3f8ee67a61b6bf4a7f8e6-Paper.pdf