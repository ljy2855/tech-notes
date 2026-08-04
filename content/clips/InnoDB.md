
![[Pasted image 20250510133549.png]]

![[Pasted image 20250510133735.png]]

InnoDB는 secondary index에 변경사항이 발생했을 때 이를 disk에 바로 반영하는 게 아니라 change buffer에 기록합니다. Secondary index를 포함한 페이지가 buffer pool에 로드됐을 때 change buffer에 저장된 secondary index의 변경사항이 buffer pool에 로드된 secondary index 데이터와 병합(merge)됩니다



