
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

![[Pasted image 20250416161338.png]]

주요 특징으로

#### Indirect 기반 block 할당
![[Pasted image 20250320163107.png]]

파일 생성 시, direct block으로 실제 데이터 작성. 이후 파일 데이터 **증가 시에, indirect 블록을 통해 추가 할당**

#### 단일 파일 (2TB), 파일시스템 크기 (32TB) 제한

bitmap, inode의 제한으로 인해 최대로 저장할 수 있는 크기 제



#### Ext4
현재 가장 많이 사용되는 파일시스템

#### Extent 기반 블록 할당
![[Pasted image 20250416161017.png]]
기존 Indirect block 기반 할당의 경우,


