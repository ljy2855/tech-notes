

### 금주 수행한 내용

#### DiskANN 논문 리뷰


motivation
- ANN의 목표인 정확도 (recall), 지연시간 (latency), 적은 메모리 사용량을 모두 만족하기 위한 방법 제시
- HNSW와 같은 방법은 높은 recall을 보여주지만, 메모리 상주로 인한 대규모 데이터셋 처리엔 한계


DiskANN 알고리즘
- 원본 벡터와 이웃 벡터는 SSD에 저장, 압축된 벡터(product quantization)은 메모리에 저장
- disk 접근





