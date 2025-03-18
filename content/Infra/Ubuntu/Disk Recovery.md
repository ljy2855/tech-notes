---
tags:
  - Disk
  - Filesystem
Done: true
---
### Disk foramt, mount
우분투에서는 disk에서 포맷을 통해 [[File System]]을 생성한다.

이후 특정 디렉토리에 해당 디스크를 mount한다.

### Disk 장애
mount 된 disk가 하드웨어, 소프트웨어 에러로 인해 block이 손상되곤 한다. 해당 block에 접근 시, block에 저장된 파일이 손상되거나 폴더에 접근 및 권한에 문제가 발생한다.

### Solution
우분투에는 disk block을 검사하고 복구하는 솔루션이 있다.

#### e2fsck
먼저 파일 시스템의 `superblock`과 그룹 디스크립터를 읽어 파일 시스템의 기본 정보를 파악한다.

이후 아래의 단계를 따르며 디스크를 복구한다.

- **pass 1**: 모든 인덱스 노드(i-node)를 검사하여 유효성, 타입, 손상 여부를 확인
- **pass 2**: 디렉토리 구조를 검사. 여기서 디렉토리가 올바르게 연결되어 있는지, 부모 디렉토리와의 연결이 유효한지 등을 확인
- **pass 3**: 연결된 디렉토리의 연결성을 검사. 예를 들어, 디렉토리가 두 번 이상 언급되지 않았는지 확인
- **pass 4**: 모든 블록의 참조 횟수를 검사하여 블록이 올바르게 연결되어 있고 중복 참조되지 않았는지 확인
- **pass 5**: 비트맵과 실제 블록의 사용 상태를 비교 검사하여 사용되지 않는 블록이나 오류 체크


```bash
sudo e2fsck /dev/sdX #disk device file
```



> [!Cauption] 만약 superblock이 손상되면 어떻게 할까?
> 파일시스템 meta data를 저장하는 superblock도 disk의 block에 저장한다. 따라서 default superblock이 손상된 경우 e2fsck는 작동하지 않는다
> 
> 해당 상황에서는 backup superblock를 지정하여 복구를 진행한다. 
> ```bash
> sudo dumpe2fs /dev/sdX | grep -i superblock
>  ```
> backup superblock의 위치를 찾는다.
> 
> 만약 superblock을 찾을 수 없다면, filesystem의 default backup superblock의 위치를 찾는
> ```bash
> sudo mke2fs -n /dev/sdc1
>  ```
>  superblock의 위치를 찾는다.
>  
> ```bash
> sudo e2fsck -b {superblock offset} /dev/sdX #disk device file
>  ```
>  옵션을 통해 superblock의 위치를 지정하여 복구한다

 
   
   
   
   
 


