
보통 캐시를 어디에 사용해야할까?

- memory 계층적 접근 비용이 큰 곳
- 동일 접근 데이터가 빈번할 때,
- read-heavy한 workload가 많을 때,
![[Pasted image 20250520154240.png]]
https://gist.github.com/jboner/2841832#file-latency-txt

캐시를 적용한 모든 부분을 찾아보자

**hardware**
- CPU L1, L2, L3 cache
- physical address cache (TLB)

**OS**
- filesystem page cache
- Buffer cache / dentry cache / inode cache

**DB**
- DBMS Buffer Pool
- **adaptive hash index**
- Write-Ahead Log 
- Memtable

**Application**
- in-memory storage (Redis, Memcached)
- browser cache

**Network**
- CDN
- DNS resolve
- ARP
- TLS
- HTTP reverse proxy cache

이 중에서 서비스레벨에서 알아야하는 캐시들과, 어떤 데이터들을 퇴출시킬지 알아보자 (캐시에 모든 데이터를 담을 수 없기에) 


### TLB

> [!NOTE] TLB가 필요한 배경
> 운영체제는 VM을 통해서 프로세스간 메모리 공간을 격리하고 프로세스가 물리적인 메모리를 모두 사용할 수 있는 것처럼 제공
> 하지만 프로세스는 메모리에 접근하기 위해 page table로부터 physical address를 찾아와야함 (메모리 접근 overhead)
> 

#### MMU (memroy management unit)
![[Pasted image 20250520155436.png]]
- 실제 page table는 page directory로 구현되어있어, 더 많은 단계를 거침

```
+-----+
| PGD | **Page Global Directory**
+-----+
   |
   |   +-----+
   +-->| P4D | **Page Level 4 Directory** (optional)
       +-----+
          |
          |   +-----+
          +-->| PUD | **Page Upper Directory**
              +-----+
                 |
                 |   +-----+
                 +-->| PMD | **Page Middle Directory**
                     +-----+
                        |
                        |   +-----+
                        +-->| PTE | **Page Table Entry**
                            +-----+
```

- 해당 page table들도 모두 메모리에 (4kb page 단위로) 올라가있음
- 변환시에 최소 4번의 메모리 접근을 해야함
- 때문에 TLB에 physical memory를 저장해서 메모리 접근을 줄인다!


#### tlb cache 정책은 어떻게 해야할까?

- 프로세스 context switching 시에, TLB를 통째로 flush 시켜야하지 않을까? (프로세스들의 실제 physical address는 다르기에)
- 최근 접근한 메모리 영역들을 남겨둘까? -> **Temporal locality**
- 인접한 메모리 영역들을 남겨둘까? -> **Spatial locality**

하나씩 실제 커널이 어떻게 해결했는지 확인해보자

**context switch flush overhead**
- TLB entry에 PCID (process context ID)를 저장해서 구분함

**Temporal Locality**
- LRU 알고리즘을 통해서 오래된 entry를 추출 (최근에는 `MGLRU` 활용)

**Spatial Locality**
- 4kb 페이지 단위로 인접한 메모리 영역 가져옴
- 가상 메모리상 인접한 page들을 prefetch하기도 함


### Adaptive hash index



