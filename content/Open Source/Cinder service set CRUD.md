
v2/test_service / `openstack volume service set`


### Cinder란?

VM에 **블록 스토리지 볼륨**을 제공해주는 서비스

![[Pasted image 20250808200336.png]]

이 때, 각 호스트들 별로 cinder-volume 데몬이 뜨게 되고, 이를 각 서비스별로 나누어서 제공

vm을 생성시에, 어떤 서비스의 스토리지를 붙일지 선택할 수 있는데, 해당 service의 list 조회 및 enable, disable 시키는 cli가 구현되어 있음

다만 sdk에는 disable, enable 외에  `commit`, `failover` , `thaw`, `freeze`


![[Pasted image 20250808201753.png]]

- cinder-scheduler
	- control node에 volume 관련 요청을 처리해주는 서비스 
	- 볼륨 생성 요청을 보내면, 스케줄러가 여러 `cinder-volume` 서비스 중에서 가장 적합한 곳을 찾아 요청을 할당
- cinder-volume 
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


![[Pasted image 20250808204653.png]]

disable을 요청하면 핻

scheduler는 해당 volume service로는 생성 요청을 보내지 못함

볼륨 생성 테스트
![[Pasted image 20250808205042.png]]


![[Pasted image 20250808205115.png]]



![[Pasted image 20250808205637.png]]

scheduler를 disable 하게 되면 아예 cli의 요청에 413 에러를 반환함

![[Pasted image 20250808205944.png]]

### Cinder 내부로직
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

- 아예 driver를 다운시키는게 아니라, task(volume create ..)를 스케줄링 on/off 하기 위한 용도
- 

#### Volume Create

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

- cinder-api 는 volume create 요청을 보내면 해당 


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
