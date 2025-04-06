
### 금주 수행한 내용

#### OpenSearch에서 Indexing시 메모리 이슈 수치화
production 환경에서 발생했던 이슈를 local에서 재현하며 문제점 확인

- 인덱싱 시, 많은 Disk I/O 발생 확인

인메모리 구조의 HNSW알고리즘 특성상 `Search`, `Indexing` 시 메모리에 그래프 자료구조를 모두 올려야 함

faiss 기반의 OpenSearch, 



### 내주 수행할 내용