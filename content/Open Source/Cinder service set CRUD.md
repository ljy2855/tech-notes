
v2/test_service / `openstack volume service set`


### Cinder란?

VM에 **블록 스토리지 볼륨**을 제공해주는 서비스

VM에 붙힐 Block storage를 제공해주는 서비스

![[Pasted image 20250808200336.png]]

이 때, 각 호스트들 별로 cinder-volume 데몬이 뜨게 되고, 이를 각 서비스별로 나누어서 제공

vm을 생성시에, 어떤 서비스의 스토리지를 붙일지 선택할 수 있는데, 해당 service의 list 조회 및 enable, disable 시키는 cli가 구현되어 있음

다만 sdk에는 disable, enable 외에  `commit`, `failover` , `thaw`, `freeze`


![[Pasted image 20250808201753.png]]

- cinder-scheduler
	- control node에 volume 관련 요청을 처리해주는 서비스 
	- 볼륨 생성 요청을 보내면, 스케줄러가 여러 `cinder-volume` 서비스 중에서 가장 적합한 곳을 찾아 요청을 할당
- cinder-volume : 
	- 실제 스토리지 백엔드와 통신하여 볼륨을 생성, 삭제, VM에 연결하는 등의 작업을 수행
	- 현재 devstack에서는 LVM(Logical Volume Manager)이라는 인터페이스를 통해 디바이스를 제어

![[Pasted image 20250808202051.png]]


![[Pasted image 20250808202532.png]]

VM에게 block storage를 연결을 보여주는데, 해당 iSCSI 외에 다른 프로토콜도 지원가능함 ex) FC,  NVME-oF


### volume service set
해당 service들을 enable, disable 가능한데, `volume service set` command를 통해 각 호스트에 있는 서비스들을 제어할 수 있음

```
openstack volume service set --disable <host> <service>
openstack volume service set --enable <host> <service>
```