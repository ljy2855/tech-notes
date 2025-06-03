
### NVMe vs SCSI

NVMe (Non-Volatile Memory Express) 와 SCSI (Small Computer System Interface) 는 모두 스토리지 장치와 CPU 사이의 통신을 위한 프로토콜

- SCSI는 주로 HDD와 같은 기계식 저장장치를 가정하여 설계되었고, 단일 큐 구조로 인해 **병렬 I/O 처리 성능이 낮음**
- AHCI(Advanced Host Controller Interface)는 SCSI 기반 명령을 SATA 인터페이스에서 사용하도록 설계된 버전으로, **PCIe 환경에서 AHCI를 사용하는 경우 병목이 발생**
    - AHCI는 **단일 명령 큐**, **최대 32개 명령 제한**, **인터럽트 기반 처리 방식** → 현대 고속 SSD의 처리량을 활용하기 어려움
        
- 반면 NVMe는 **플래시 메모리 기반 SSD**의 낮은 latency와 높은 병렬성을 전제로 설계됨
    - **PCIe 인터페이스를 직접 사용**하고, **최대 64K 개의 I/O 큐**, **각 큐마다 64K 개의 명령** 처리 가능 → CPU 멀티코어 환경과 병렬 처리에 최적화됨

![[Pasted image 20250603155554.png]]

### Local NVMe vs SAN NVMe

> [!NOTE] Cloud Service의 Storage는 왜 Local NVMe보다 느릴까?
> 클라우드 환경에서는 VM에 스토리지를 유연하게 연결하고 관리하기 위해, 로컬 디스크 대신 **SAN 기반 스토리지**를 네트워크를 통해 연결


**Local NVMe = DAS (Direct-Attached Storage)**

![[Pasted image 20250603154103.png]]
- 서버 **내부 PCIe 슬롯에 직접 장착**된 NVMe SSD 사용
- 일반적으로 **OS 부팅 디스크**, **고성능 로컬 워크로드 (예: DB, AI 연산)**에 사용
- Hypervisor 우회 없이 **CPU ↔ NVMe**로 **직접 접근**, latency 최소화
- 고성능이 필요한 경우 **Bare-metal 서버 구성**에서 사용


**SAN (Storage Attached Network)**

![[Pasted image 20250518183814.png]]
- 서버와 물리적으로 분리된 **외부 스토리지 어플라이언스에 네트워크로 연결**
- 클라우드에서는 일반적으로 **Fibre Channel 기반 SAN** 또는 **Ethernet 기반 스토리지 네트워크 (iSCSI, NVMe-oF)** 사용
- VM ↔ Hypervisor ↔ 네트워크 ↔ 스토리지 경로를 거침
- **스토리지 자원을 논리적으로 분리해 멀티 테넌시 지원** 가능


| **항목**      | **Local NVMe (DAS)**            | **Cloud Block Storage (SAN 기반)**               |
| ----------- | ------------------------------- | ---------------------------------------------- |
| **물리 연결**   | 서버 내부 PCIe 슬롯에 NVMe 디스크 직접 연결   | 하이퍼바이저 ↔ 가상 NIC ↔ 스토리지 네트워크 (Ethernet or FC)   |
| **I/O 경로**  | CPU ↔ NVMe (직접 연결, 버스 우회 없음)    | CPU ↔ 하이퍼바이저 ↔ 네트워크 ↔ 외부 스토리지 백엔드              |
| **Latency** | 수십 마이크로초(µs) 수준                 | 수백 마이크로초 ~ 수 밀리초(µs~ms), 네트워크 및 스토리지 상태에 따라 변화 |
| **IOPS**    | 수백만 IOPS까지 가능 (로컬 디스크 병렬 처리)    | 수천 ~ 수만 IOPS (서비스 등급에 따라 제한, 일반적으로 제한된 QoS)    |
| **멀티 테넌시**  | 없음 (단일 서버에 종속된 디스크)             | 있음 (스토리지 공유로 인해 I/O 경합 가능성 존재)                 |
| **유연성**     | 낮음 (디스크 이동/재사용 어려움, 서버 단위로 고정)  | 높음 (가상 서버에 유동적 할당, 스냅샷/백업/복제 등 부가 기능 제공)       |
| **장애 복원**   | 디스크 자체 장애 발생 시 교체 어려움, 수동 조치 필요 | 고가용성 지원 가능 (스토리지 백엔드 이중화 및 복제 지원)              |


### NVMe-over-Fabrics

- **NVMe 명령어를 네트워크를 통해 전송**하여, 원격에 있는 스토리지를 NVMe 디바이스처럼 사용할 수 있게 해주는 프로토콜
- **PCIe 기반 로컬 NVMe SSD의 고성능 구조를 네트워크 스토리지로 확장**
- 사용되는 전송 계층
    - **RDMA (RoCE, iWARP)**
    - **TCP**
    - **Fibre Channel (FC-NVMe)**

![[Pasted image 20250526005626.png]]

![[Pasted image 20250526005804.png]]


**클라우드 환경에서의 활용 예시 (AWS, NCP 등)**

- 대부분의 퍼블릭 클라우드는 **네트워크 기반 블록 스토리지(SAN)**를 사용하여 VM 인스턴스와 스토리지를 유연하게 분리 및 연결
- 고성능 워크로드 대응을 위해 일부 클라우드는 **NVMe-over-Fabrics(NVMe-oF)** 기술을 부분적으로 도입
    

**예시 1: AWS**

- 고성능 블록 스토리지(**io2 Block Express**)는
    → **SRD (Scalable Reliable Datagram)** 기반의 **NVMe-oF over SRD** 사용
    
- 일반 블록 스토리지(**gp3, io1**)는
    → **iSCSI over TCP** 유사 구조로 동작
    
- 전송 계층으로는 **TCP, RoCE, iWARP**, 또는 **AWS 독자 프로토콜(SRD)** 사용
- 참고: [AWS SRD 소개 블로그](https://aws.amazon.com/ko/blogs/tech/srd/)
    

**예시 2: NCP (Naver Cloud Platform)**

- **블록 스토리지는 네트워크 기반 SAN 구조**로 연결됨
    → 내부적으로는 **iSCSI over TCP** 방식으로 구현된 것으로 추정됨 (용량에 따라 최대 16,000 IOPS 제공)
- VM 생성 시 **블록 스토리지 제품 코드(SW.BSST.BLCK.STAND.C002)** 를 지정하여 연결
- 스토리지는 **물리적 스토리지 서버와 분리된 별도 네트워크 경로**를 통해 VM에 연결됨
    

> ⚠️ 대부분의 클라우드 벤더는 **스토리지 전송 계층의 내부 구현을 공개하지 않으며**, 고성능 스토리지 옵션일수록 **독자적인 최적화 방식 또는 프로토콜**을 사용하는 경향이 있음
> 따라서 정확한 I/O 경로 분석은 공식 문서 + 실측 기반 성능 분석이 병행되어야 함

