커널에서 [[System Call]]을 통해서 file/IO 등을 처리


### Architecture
![[Pasted image 20250414172937.png]]

![[Pasted image 20250320154929.png]]

### File
유저의 관점에서 가장 작은 할당 단위

#### 속성(metadata)
- Name
- Identifier
- Type
- Location
- Size
- Protection
- Time


### Inode (Unix)
파일의 메타데이터+ file block의 pointer를 저장하는 블럭(FCB) 




### Directory
디렉토리도 사실상 파일로 `attribute`로 구분

![[Pasted image 20250320155453.png]]

- Inode은 disk에 저장
- 다만 memory에 cache 시켜 속도를 향상시키기도 함


### File descriptor

- 프로세스는 각자의 파일 디스크립터 테이블(접근하고 있는 파일 리스트)을 가짐
- 접근 시에는 integer로 접근하게 함(커널이 직접 주소로 접근하기 위해)
- 커널이 접근할 때는 inode의 주소로 통해 접근
- 해당 방식을 통해 여러 프로세스가 동시에 같은 파일에 접근 가능하게 하며, **동시성 문제 해결**
![[Pasted image 20250320155836.png]]

### Soft Link vs Hard Link

**Hard Link**
![[Pasted image 20250320160454.png]]

- 서로 다른 directory entire가 같은 Inode의 주소를 갖고 있음
- 같은 파일시스템 내에서만 가능함
- 원본 파일을 지워도 ref count만 변해서 상관없음

**Soft Link (Symbolic Link)**

![[Pasted image 20250320160705.png]]

- 원본 파일을 ref하는 새로운 파일 생성
- 기존 원본 파일 지우면 문제 생김
- 다른 파일시스템을 통해서도 가능

### Mounting File System 
커널파일이 포함된 기본 root 파일시스템에 tree 형태로 특정 위치에 다른 파일시스템을 마운트할 수 있다.


### Virtual File System
file system의 추상 레이어를 통해 여러 타입의 파일시스템을 제어할 수 있도록 함

제어할 때 같은 system call interface를 사용하지만 파일시스템 별로 다른 구현체를 사용함

### Disk
파일시스템은 일단 디스크에 저장된다.

기본적으로 디스크는 할당할 수 있는 단위인 block으로 관리되고 파일시스템은 블럭에 해당 내용을 저장한다.

- Boot Control Block
- Volume Control Block (Superblock)
	- 해당 group에 있는 block 정보들
	- 복구에도 이걸보고 사용
- Directory structure
- File Control Block (Inode)
- Blocks for free area
![[Pasted image 20250320162921.png]]
### Block Allocation

file create, write할 때, 새로운 block을 할당해서 저장하게 되는데 

- 파일의 크기에 따라 block 추가 할당 가능해야함
- 그렇다고 너무 큰 사이즈를 초기 할당하면 internal fragment가 너무 큼

![[Pasted image 20250320163107.png]]
### 저널링 파일시스템
- 두 파일시스템 모두 durability를 보장하기 위해서 저널링이라는 로그를 활용
- 디스크에 저널링을 위한 구역을 

### XFS vs Ext4
![[Pasted image 20250416161338.png]]


#### Ext4
linux 커널에서 가장 많이 사용되는 파일시스템

Extent tree vs Indirect
![[Pasted image 20250416161017.png]]

### Performance

Disk의 read, write는 굉장히 느리기 때문에 어떻게 성능을 향상시킬까?

- Disk cache : 자주 접근하는 block의 정보를 memory에 cache함
- asynchronous write : write 즉시 disk에 쓰는게 아니라 버퍼에 있다가 flush 시킴
- Improve PC performance by using virtual disk, or RAM disk.
