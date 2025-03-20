커널에서 [[System Call]]을 통해서 file/IO 등을 처리한다는 것은 확인

### Architecture
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

### Access Control List

