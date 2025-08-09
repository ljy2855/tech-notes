
v2/test_service / `openstack volume service set`


### Cinder란?

VM에 **블록 스토리지 볼륨**을 제공해주는 서비스
![[Pasted image 20250808200336.png]]

이 때, 각 호스트들 별로 cinder-volume 데몬이 뜨게 되고, 이 데몬이 스토리지 백엔드와 통신하여 실제 볼륨 관리를 수행

Nova에서 VM을 생성할 때 Cinder 볼륨을 연결할 수 있는데, Cinder는 `cinder-scheduler`를 통해 적절한 `cinder-volume` 서비스를 찾아 볼륨을 생성하고 연결


![[Pasted image 20250808201753.png]]

- cinder-scheduler
	- control node에 volume 관련 요청을 처리해주는 서비스 
	- 볼륨 생성 요청을 보내면, 스케줄러가 여러 `cinder-volume` 서비스 중에서 가장 적합한 곳을 찾아 요청을 할당
- cinder-volume 
	- 실제 스토리지 백엔드와 통신하여 볼륨을 생성, 삭제, VM에 연결하는 등의 작업을 수행
	- 현재 devstack에서는 LVM(Logical Volume Manager)이라는 driver를 통해 디바이스를 제어

### Architecture
![[Pasted image 20250808202051.png]]
- cinder-api가 메시지 큐를 통해 `cinder-scheduler` 또는 `cinder-volume` 서비스로 요청을 전달 **RPC(Remote Procedure Call)** 

### Storage 
![[Pasted image 20250808202532.png]]

VM에게 block storage를 연결을 보여주는데, 해당 iSCSI 외에 다른 프로토콜도 지원가능함 ex) `FC`,  `NVME-oF`

이는 각 벤더별 driver별로 지원하는 프로토콜이 다름 
https://docs.openstack.org/cinder/latest/drivers.html
### volume service set
service들을 enable, disable 가능한데, `volume service set` command를 통해 각 호스트에 있는 서비스들을 제어할 수 있음

```
openstack volume service set --disable <host> <service>
openstack volume service set --enable <host> <service>
```


![[Pasted image 20250808204653.png]]

disable을 요청하면 cinder-api로 요청이 보내지고, 해당 서비스는 disabled 즉 task queue를 linsten 하지 않게 변경

scheduler는 해당 volume service로는 생성 요청을 보내지 못함

####  볼륨 생성 테스트
![[Pasted image 20250808205042.png]]


![[Pasted image 20250808205115.png]]



![[Pasted image 20250808205637.png]]

scheduler를 disable 하게 되면 아예 cli의 요청에 413 에러를 반환함

![[Pasted image 20250808205944.png]]

### ETC. cinder 내부로직

#### set status

```python
# cinder/api/contrib/services.py
def update(self, req, id, body):
        """Enable/Disable scheduling for a service.

        Includes Freeze/Thaw which sends call down to drivers
        and allows volume.manager for the specified host to
        disable the service rather than accessing the service
        directly in this API layer.
        """
        context = req.environ['cinder.context']
        context.authorize(policy.UPDATE_POLICY)

        support_dynamic_log = req.api_version_request.matches(mv.LOG_LEVEL)
        ext_loaded = self.ext_mgr.is_loaded('os-extended-services')
````

- 아예 데몬을 다운시키는게 아니라, task(volume create ..)를 스케줄링 on/off 하기 위한 용도

#### volume create

```python
# cinder/cinder/volume/api.py
try:
	sched_rpcapi = (self.scheduler_rpcapi if (
					not cgsnapshot and not source_cg and
					not group_snapshot and not source_group)
					else None)
	volume_rpcapi = (self.volume_rpcapi if (
					 not cgsnapshot and not source_cg and
					 not group_snapshot and not source_group)
					 else None)
	flow_engine = create_volume.get_flow(self.db,
										 self.image_service,
										 availability_zones,
										 create_what,
										 sched_rpcapi,
										 volume_rpcapi)
 ```



```python
#cinder/cinder/volume/flows/api/create_volume.py
def get_flow(db_api, image_service_api, availability_zones, create_what,
             scheduler_rpcapi=None, volume_rpcapi=None):
    """Constructs and returns the api entrypoint flow.

    This flow will do the following:

    1. Inject keys & values for dependent tasks.
    2. Extracts and validates the input keys & values.
    3. Reserves the quota (reverts quota on any failures).
    4. Creates the database entry.
    5. Commits the quota.
    6. Casts to volume manager or scheduler for further processing.
    """

    flow_name = ACTION.replace(":", "_") + "_api"
    api_flow = linear_flow.Flow(flow_name)

    api_flow.add(ExtractVolumeRequestTask(
        image_service_api,
        availability_zones,
        rebind={'size': 'raw_size',
                'availability_zone': 'raw_availability_zone',
                'volume_type': 'raw_volume_type'}))
    api_flow.add(QuotaReserveTask(),
                 EntryCreateTask(),
                 QuotaCommitTask())

    if scheduler_rpcapi and volume_rpcapi:
        # This will cast it out to either the scheduler or volume manager via
        # the rpc apis provided.
        api_flow.add(VolumeCastTask(scheduler_rpcapi, volume_rpcapi, db_api))

    # Now load (but do not run) the flow using the provided initial data.
    return taskflow.engines.load(api_flow, store=create_what)
```
