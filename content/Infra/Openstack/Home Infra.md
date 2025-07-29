



```
graph TD
    subgraph 인터넷/외부 네트워크
        A[외부 사용자/인터넷]
    end

    subgraph NHN Cloud 호스트 (VM)
        direction LR
        B(클라우드 인스턴스 공인 IP) --- C(NHN Cloud vNIC)
        C --- D(Host OS - 물리 NIC)
        D --- E{iptables: FORWARD & MASQUERADE}
        E --- F(mybr0 - 가상 Provider Bridge)
        F --- G(br-ex - OVS 물리 브리지)

        subgraph OpenStack (DevStack)
            direction TD
            G --- H[Neutron Open vSwitch Agent (q-agt)]
            H --- I[Open vSwitch: VXLAN 터널]
            I --- J[OpenStack VM (Instance)]

            subgraph OpenStack VM (Instance)
                J --> J1(Fixed IP: 10.0.0.x)
                J --> J2(Floating IP: 192.168.100.x)
            end

            J1 --- K[Neutron L3 Agent (q-l3)]
            K --- F

            J2 --- L(Neutron DHCP Agent)
            L --- J1
        end
    end

    A -- 공인 IP로 접근 --> B
    B -- 트래픽 흐름 --> C
    C -- 가상화된 NIC --> D
    D -- OS 네트워크 스택 --> E
    E -- NAT/포워딩 --> F
    F -- mybr0 트래픽 --> G
    G -- OVS 내부 관리 --> H
    H -- 터널링 --> I
    I -- VM으로 전송 --> J

    J -- (내부 통신) --> J
    J1 -- L3 라우팅 --> K
    K -- Floating IP 매핑/NAT --> F
    F -- Public Network 게이트웨이 --> E
    J1 -- DHCP 요청 --> L

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style J fill:#fcc,stroke:#333,stroke-width:2px
    style F fill:#dfd,stroke:#333,stroke-width:2px
    style G fill:#dfd,stroke:#333,stroke-width:2px
    style I fill:#cef,stroke:#333,stroke-width:2px
    style K fill:#ccf,stroke:#333,stroke-width:2px
    style H fill:#ccf,stroke:#333,stroke-width:2px
    style L fill:#ccf,stroke:#333,stroke-width:2px
```


- **외부 사용자/인터넷 (A)**: 외부에서 OpenStack 인스턴스 또는 Horizon 대시보드에 접근하려는 출발점입니다.
    
- **클라우드 인스턴스 공인 IP (B) & NHN Cloud vNIC (C) & Host OS 물리 NIC (D)**:
    
    - NHN Cloud가 할당한 **공인 IP**는 클라우드 인스턴스(VM)의 **가상 NIC(vNIC)**와 연결됩니다.
        
    - 이 vNIC는 호스트 OS의 실제 **물리 NIC**를 통해 외부 네트워크와 연결됩니다.
        
    - **DevStack 설치 전 `sudo ip addr add $할당받은_공인_IP/32 dev lo` 설정 덕분에, OpenStack 서비스는 이 공인 IP로 바인딩되어 외부에서 직접 접근할 수 있습니다.**
        
- **iptables: FORWARD & MASQUERADE (E)**:
    
    - **`FORWARD`**: 클라우드 인스턴스 내부로 들어오거나 나가는 패킷이 호스트를 통과하도록 허용합니다.
        
    - **`MASQUERADE`**: OpenStack 인스턴스의 `192.168.100.0/24` 대역(`mybr0` 연결)에서 외부로 나가는 트래픽에 대해 **Source NAT(SNAT)**를 수행하여, 호스트의 공인 IP 주소로 변환합니다. 이를 통해 OpenStack 인스턴스들이 외부 인터넷에 접근할 수 있습니다.
        
- **mybr0 - 가상 Provider Bridge (F)**:
    
    - **DevStack 설치 전 수동으로 생성하고 IP(`192.168.100.1`)를 할당한 브리지**입니다.
        
    - 이 브리지는 **OpenStack의 Provider Network** 역할을 하며, OpenStack 인스턴스에 할당된 Floating IP 대역(`192.168.100.x`)이 이 브리지를 통해 외부와 연결됩니다.
        
    - OpenStack 설정에서 `PUBLIC_INTERFACE=mybr0` 및 `OVS_BRIDGE_MAPPINGS=public:br-ex`를 통해 Open vSwitch의 `br-ex`와 연결됩니다.
        
- **br-ex - Open vSwitch 물리 브리지 (G)**:
    
    - OpenStack의 Open vSwitch(OVS)가 관리하는 브리지 중 하나입니다.
        
    - `OVS_PHYSICAL_BRIDGE=br-ex` 설정에 따라, OVS가 외부 네트워크와의 연결점으로 사용하는 브리지입니다. 이론적으로 물리 NIC와 연결되지만, 이 환경에서는 `mybr0`라는 가상 브리지와 연결되어 `mybr0`의 역할을 대체합니다.
        
- **Neutron Open vSwitch Agent (q-agt) (H)**:
    
    - OpenStack Neutron의 핵심 에이전트로, 호스트 OS의 Open vSwitch 브리지(`br-ex`)와 포트들을 구성하고 관리합니다.
        
    - 인스턴스의 가상 NIC를 `br-ex` 또는 다른 내부 OVS 브리지에 연결하는 역할을 합니다.
        
- **Open vSwitch: VXLAN 터널 (I)**:
    
    - `tenant_network_types=vxlan` 설정에 따라, OpenStack 인스턴스 간의 **테넌트(내부) 네트워크 통신**은 VXLAN 터널을 통해 이루어집니다.
        
    - VXLAN은 물리적 네트워크 위에 논리적인 오버레이 네트워크를 생성하여 인스턴스 간의 격리된 통신을 가능하게 합니다.
        
- **OpenStack VM (Instance) (J)**:
    
    - 실제 OpenStack에서 생성된 가상 머신입니다.
        
    - **Fixed IP (J1)**: 인스턴스에 할당된 내부 사설 IP(`10.0.0.x` 대역)로, 테넌트 네트워크 내에서 통신에 사용됩니다.
        
    - **Floating IP (J2)**: Public Network 대역(`192.168.100.x` 대역)에서 할당되며, 외부에서 인스턴스에 직접 접근할 수 있도록 하는 공인 IP와 유사한 역할을 합니다 (NAT를 통해 Fixed IP에 매핑됨).
        
- **Neutron L3 Agent (q-l3) (K)**:
    
    - 라우팅 기능을 제공하며, **Fixed IP와 Floating IP 간의 NAT 변환**을 담당합니다.
        
    - 인스턴스에서 외부로 나가는 트래픽을 `mybr0` (Provider Network)를 통해 라우팅하고, 외부에서 Floating IP로 들어오는 트래픽을 해당 인스턴스의 Fixed IP로 전달합니다.
        
- **Neutron DHCP Agent (L)**:
    
    - OpenStack 인스턴스에 Fixed IP, 게이트웨이, DNS 정보 등을 동적으로 할당하는 역할을 합니다.


![[Pasted image 20250729193346.png]]