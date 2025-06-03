
### NVMe vs SCSI

NVMe (Non-Volatile Memory Express) 와 SCSI (Small Computer System Interface) 는 모두 스토리지 장치와 CPU 사이의 통신을 위한 프로토콜

다만 AHCI host

![[Pasted image 20250603155554.png]]

### Local NVMe vs SAN NVMe

> [!NOTE] Cloud Service의 Storage는 왜 local NVMe보다 느린걸까?
-> 클라우드 서비스들은 VM에 유동적으로 storage를 붙일 수 있게, SAN 구조로 스토리지를 붙임

Local NVMe : DAS

**DAS (Direct Attach Storage)**

![[Pasted image 20250603154103.png]]
host 안에 storage를 붙임
- PCIe로 disk로 연결하여 사용 (SCSI or NVMe) 
- Host OS 부팅을 위한 스토리지로 사용
- disk latency가 매우 중요한 경우 baremetal 물리서버로 제공


**SAN (Storage Attached Network)**

![[Pasted image 20250518183814.png]]
- Cloud 서비스의 실제 구현은 **Fibre Channel 기반 SAN** or, **Ethernet 기반의 스토리지 네트워크** 

| 항목      | Local NVMe         | Cloud Block Storage                            |
| ------- | ------------------ | ---------------------------------------------- |
| 물리적 연결  | 서버 내부 PCIe 직결      | Hypervisor ↔ ENA NIC ↔ 스토리지 네트워크               |
| IO 경로   | CPU ↔ NVMe (직접 연결) | CPU ↔ Nitro ↔ ENA NIC ↔ storage backend server |
| Latency | 수십 µs 수준           | 수백 µs ~ ms (storage 타입 및 네트워크 상태에 따라 다름)       |
| IOPS    | 수백만 IOPS 가능        | gp3: ~16K IOPS / io2: ~64K IOPS                |
| 멀티 테넌시  | 없음                 | 있음 (스토리지 I/O 경합 발생 가능)                         |


### NVMe-over-Fabrics

- NVMe 명령어를 네트워크를 통해 원격 저장소로 전달하는 프로토콜
- PCIe 기반 로컬 디스크의 성능을 네트워크 스토리지로 확장하는 데 목적
- 대표적인 전송 계층: RDMA (RoCE), TCP, Fibre Channel, iWARP

![[Pasted image 20250526005626.png]]

![[Pasted image 20250526005804.png]]


> **AWS의 경우는?**
> 
   퍼블릭 클라우드 환경에서는 **RoCE, iWARP, TCP**, 또는 AWS 독자 프로토콜인 **SRD** 등이 네트워크 전송 계층으로 사용 가능
	- Nitro 기반 io2 Block Express의 경우 SRD전용 고속 전송 프로토콜 사용
	- 일반적인 gp3, io1는 iSCSI over TCP와 유사한 구조일 것으로 추정됨

AWS와 같은 퍼블릭 클라우드는 정확한 내부 구현을 공개하지 않음
다만 EBS와 EC2 간 스토리지 연결에 있어 Ethernet 기반의 전송 계층을 사용하고 있으며, 일부 고성능 스토리지(io2 Block Express 등)는 NVMe-oF over SRD(Scalable Reliable Datagram)와 같은 독자적인 고성능 프로토콜을 사용하는 것으로 알려져 있음

https://aws.amazon.com/ko/blogs/tech/srd/


**단점 및 고려 사항**
- 네트워크 홉 존재 → latency 증가 요인 
- 멀티 테넌시 환경에서 I/O 경합 가능성
- 전송 계층에 따라 성능 편차 발생 (TCP vs RDMA)

**인사이트**
- NVMe-oF는 로컬 PCIe SSD의 구조를 네트워크로 확장한 방식이지만, 클라우드에서는 네트워크 홉, 멀티 테넌시, 프로토콜 선택에 따라 성능 변동성이 큼
- 따라서 vector search workload에서는 캐시 계층, prefetch 전략 등과 함께 **전송 계층 수준에서의 latency 모델링**도 병행되어야 함
