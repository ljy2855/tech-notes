내주 연구할 때는 다음과 같은 메트릭/변수, 들을 고려해서 서로의 상관관계로 인한 query의 latency에 대한 insight를 줄 수 있도록 연구해보세요. 

1) 데이터 셋 크기 
2) (cold start, warm-up)
3) Disk Speed (local setup이니, NVMe SSD에 데이터를 다 저장하고 실험할 듯 한데) 

가령) 데이터 셋이 커지면, query latency가 더 증가할까? index build 시간 (file로 만들고 나중에 메모리로 올리는 시간, 데이터 셋 크기 -> 임베딩 하면, 벡터가 훨씬 커질텐데, 그 크기의 증폭을 고려), 증가는 얼마나 될까? 또는, disk speed가 10배 느려진다면, index build 시간은 어떻게 변할까? 


마지막으로, JVM GC가 주기적으로 발생하는 것 같은데, GC 시행시, query search latency의 변화는? 

위와 같은 다양한 환경/변수 변화에 따른, 성능 변화가 어떻게 되는지를 관찰하면서 실험을 해보세요.


---

### 금주 수행한 내용
