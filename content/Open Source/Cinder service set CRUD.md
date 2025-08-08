
v2/test_service / `openstack volume service set`


### Cinder란?

volume을 제공해주는 컴포넌트

VM에 붙힐 Block storage를 제공해주는 서비스

![[Pasted image 20250808200336.png]]

이 때, 각 호스트들 별로 cinder-volume 데몬이 뜨게 되고, 이를 각 서비스별로 나누어서 제공

vm을 생성시에, 어떤 서비스의 스토리지를 붙일지 선택할 수 있는데, 해당 service의 list 조회 및 enable, disable 시키는 cli가 