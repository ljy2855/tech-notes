
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

xfs는 ext4에서 부족한 enterprise의 환경에서 사용하도록 만든 파일시스템

- ext4에 비해 더욱 큰 파일 크기 제공
- 

