
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
- adaptive hash index
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

MMU (memroy management unit)
![[Pasted image 20250520155436.png]]
- 실제 page table