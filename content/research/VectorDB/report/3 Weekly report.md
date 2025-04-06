
### 금주 수행한 내용

#### OpenSearch에서 Indexing시 메모리 이슈 수치화
production 환경에서 발생했던 이슈를 local에서 재현하며 문제점 확인

- 인덱싱 시, 많은 Disk I/O 발생 확인

인메모리 구조의 HNSW알고리즘 특성상 `Search`, `Indexing` 시 메모리에 그래프 자료구조를 모두 올려야 함

OpenSearch의 경우 JNI를 통해 C++로 구현된 faiss 이용 
faiss에는 HNSW 인덱스를 file로 write,read하는 Interface 제공

```cpp
void write_index(const Index* idx, const char* fname, int io_flags = 0);
void write_index(const Index* idx, FILE* f, int io_flags = 0);
void write_index(const Index* idx, IOWriter* writer, int io_flags = 0);
```

이 때

- 
![[Pasted image 20250406204901.png]]




### 내주 수행할 내용