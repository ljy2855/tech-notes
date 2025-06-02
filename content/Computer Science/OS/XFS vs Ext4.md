
리눅스에서 가장 많이 사용되는 파일시스템 종류

이외에 다양한 파일시스템이 존재하지만, VFS(virtual filesystem) layer에서 같은 파일 조작 시스템콜 인터페이스을 통해서 다양한 파일시스템(NFS, FUSE)을 제어


![[Pasted image 20250601164027.png]]

그중에서 disk block을 포맷하고, 관리하기 위한 가장 많이 사용되는 ext4, xfs에 대해서 확인


### Ext3

현재 많이 사용되는 ext4 이전 버전으로 처음 저널링이 도입된 파일시스템이다

- ext disk layout
![[Pasted image 20250601164450.png]]

- ext3 journal
![[Pasted image 20250601164458.png]]


주요 특징으로
#### Indirect 기반 block 할당
![[Pasted image 20250320163107.png]]

파일 생성 시, direct block으로 실제 데이터 작성. 이후 파일 데이터 **증가 시에, indirect 블록을 통해 추가 할당**

#### 단일 파일 (2TB), 파일시스템 크기 (32TB) 제한

bitmap, inode의 제한으로 인해 최대로 저장할 수 있는 크기 제한


#### 저널링
![[Pasted image 20250416161338.png]]
WAL을 통해, 파일에 데이터를 write하거나 메타데이터가 변경될 경우, 바로 Disk에 쓰지 않고, 저널에 transaction들을 저장함.

이후 transaction을 처리하면서, commit하면서 실제로 disk block에 write.
**default로는 메타데이터(inode)만 저널링하고, 옵션을 통해 data block도 적용 가능**
-> **fsck를 통해서 복구를 하더라도 정합성을 보장하나 무결성은 보장하지 않음**

부팅시에, e2fsck를 통해 해당 저널을 우선적으로 확인하고, 이후 superblock에 메타데이터와 bitmap간 정합성 확인 

**만약 정합성에 문제가 발생 시, 롤백 진행**

### Ext4
현재 가장 많이 사용되는 파일시스템

#### Extent 기반 블록 할당
![[Pasted image 20250416161017.png]]
기존 Indirect block 기반 할당의 경우, 파일 사이즈가 커질 경우, 데이터 접근 step 증가 (disk IO 증가)와 삭제 시에, 오버헤드가 더욱 커지게 된다.

이를 해결하기 위해, index를 통해 leaf node들에 블록이 아닌, 연속된 할당 단위로 (extent) 매핑

-> 파일 사이즈가 커져도 일관적인 Disk IO 보장
-> 삭제 시에도, extent 단위로 제한 가능


```bash
mkfs.ext4 -O ^extent /dev/sdX
```

ext4는 ext3에서 migration을 지원하기에, extent 기능을 끄고 사용도 가능함.
*ext3에서 마이그레이션하는 경우 기존 indirect와 extent 둘 다 사용가능*


#### Multi & Delayed Allocation

**Multi Allocation**
파일의 데이터 블록이 추가로 할당되어야할 경우, 한번에 여러 블록을 할당하여 block 할당에 대한 Overhead를 제거 
-> 블록의 경우 4KB단위이다 보니, 실제 파일의 경우 많은 추가 할당이 발생함

**Delayed Allocation**
write 수행 시에, 할당이 추가로 필요한 경우 블록 할당까지 기다리지 않고, buffer (page cache)에 저장 한 이후 flush
-> 연속적인 block 할당에 이점을 가져갈 수 있음 fragmentation


### XFS

enterprise의 환경에서의 대용량 스토리지와 고성능 서버 환경을 고려하여 설계


#### B+ Tree 기반 공간 및 메타데이터 관리

![[Pasted image 20250601172512.png]]

기존 ext 계열의 **bitmap 구조**와 달리, XFS는 거의 모든 메타데이터 관리에 **B+ Tree 구조**를 사용

- **inode, extent, free space 등 모든 메타데이터**를 B+ Tree 구조로 관리
- 디스크 단편화 감소 및 **빠른 검색/할당** 가능
- 트리 기반이기 때문에 대용량 파일, 디렉터리, 블록 할당에서도 효율적


#### Extent 기반 블록 할당

XFS 역시 ext4와 마찬가지로 extent 기반 블록 할당을 사용하지만, 내부적으로 더욱 정교한 allocation group과 B+ Tree 기반으로 분산 처리

- 파일 크기가 커져도, 연속된 블록을 하나의 extent로 처리 → 성능 우수
- extent들을 B+ Tree로 관리하여 빠른 접근 보장
- **다수의 allocation group을 병렬로 활용하여 다중 CPU, I/O에 최적화**

#### Allocation Group 기반 병렬 I/O

XFS는 파일시스템을 **여러 개의 allocation group (AG)**으로 분할하여 관리

- 각 AG는 별도 공간처럼 동작하며 **병렬 I/O와 동시 블록 할당 가능**
- 멀티 코어 환경에서, 서로 다른 AG를 병렬 처리하여 **멀티스레드 I/O 성능 향상**
- ext 계열 대비 **대형 파일/디렉터리 처리에 유리**


> [!note] 왜 XFS이 EXT보다 병렬성이 좋을까?
> ext4의 경우 block group으로 나누어져 있긴하지만, inode/block bitmap을 사용하기에, 접근 시 BG당 lock을 잡아야함
> **XFS의 경우 B tree 기반 자료구조에 저장하기에, 트리 노드당 lock을 잡아 경합 최소화**



---

#### MongoDB

MongoDB 사용 시에, XFS를 사용하도록 권장

storage engine인 WiredTiger가 데이터와 저널데이터를 **WAL으로 저장하기에, 빈번한 IO 발생**
-> 병렬 IO 처리가 우수한 XFS 활용



![[Pasted image 20250601175200.png]]

https://www.mongodb.com/ko-kr/docs/manual/administration/production-checklist-operations/

https://docs.kernel.org/filesystems/ext4/index.html