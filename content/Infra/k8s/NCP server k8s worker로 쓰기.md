

### 배경

기존에 집에 pc 두대로, on-premise 환경에서 k8s 클러스터를 구축해두었다.

추가로 리소스가 필요한 경우가 일부 있었는데, 이때마다 추가로 서버를 구매하기엔 부담되어서 public cloud 환경의 server를 필요할때마다 증설할 수 있는 방법을 찾아보자


### 왜 다 Cloud로 안 옮기나?

사실 모든 리소스를 public cloud로 옮기는게 가장 편하긴 하다. 전력, HW fault같은 이슈들을 관리를 cloud에게 맡기면 편하다.

다만 그렇기에 기존의 인프라 리소스들을 모두 대체하기엔 비용이 너무 비싸다..

기존 home infra
- Storage -> block storage, object storage
- PC 2ea -> Server instance
- Public IP -> Elastic IP


> 그래서 기존 인프라를 유지한 상태로, scale-out이 용이한 방향으로 구성을 진행한다.


### 요구사항

**on-premise Network 연동**
내부 환경에서는 172 대역의 사설 대역을 사용하고, gateway겸 SNAT 를 통과하여 외부와 통신이 이루어진다.

만약 외부 Cloud 서버가 해당 사설 대역과 통신이 필요한경우 IPsec과 같은 터널이 필요하다.

**기존 K8s Cluster와 통합**

k8s cluster에 포함되어있는

- Internal DNS
- Storage
- cilium CNI
- monitoring stack




## 구성 방안

일단 가능한 방향 모두 생각해보자

### IPsec Service

NCP는 VPC용 관리형 IPsec VPN Gateway 상품을 제공한다. 다만 이건 온프레미스 데이터센터급 연동을 상정한 구성이라, 집 쪽에도 고정 공인 IP를 가진 IPsec 피어 장비가 있어야 한다.

우리집 회선은 공유기 포트포워딩으로 버티는 구조라 고정 IP가 아니고, 게이트웨이 이중화 같은 기능도 워커 노드 하나 붙이는 용도로는 과하다. 그래서 기각.

### 기존 wireguard(wg-easy) 재사용 시도

집에는 이미 `soyo`에서 [[Cloudflare Tunnel을 활용한 k8s Ingress 대체|외부 접속용]] wg-easy 컨테이너가 떠있었다. 여기에 NCP 서버를 피어로 추가하면 될 줄 알았는데, 까보니 안 되는 구조였다.

```bash
docker exec wg-easy iptables -t nat -S POSTROUTING
# -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
```

wg-easy는 브리지 네트워크 안에서 도는 컨테이너고, VPN 클라이언트 트래픽을 전부 MASQUERADE(SNAT)한다. 개인이 노트북으로 집에 들어올 때는 완벽한 구성이지만, k8s 노드 간 통신에는 치명적이다.

- soyo → NCP 방향(`kubectl exec`, kubelet 10250) 라우팅이 없음 — NAT는 단방향
- NCP → 클러스터 방향도 SNAT 때문에 kubelet/Cilium이 보는 소스 IP가 실제 노드 IP와 달라짐

컨테이너를 개조해서 우회할 수도 있었지만, 재시작마다 규칙이 날아가고 업데이트에 깨지기 쉬워서 포기했다. wg-easy는 개인 VPN 용도로 그대로 두고, 클러스터 전용 네이티브 WireGuard 인터페이스를 하나 더 올리기로 했다.

### 최종 구성: soyo가 initiator인 별도 WireGuard 터널

```mermaid
flowchart LR
    subgraph Home["집 (soyo)"]
        wg1["wg1<br/>192.168.250.1"]
    end
    subgraph NCP["NCP (k8s-ncp-worker)"]
        wg0["wg0<br/>192.168.250.2<br/>203.0.113.10:51820"]
    end
    wg1 -->|"outbound, keepalive 25s"| wg0
    wg0 -.->|"응답 트래픽"| wg1
```

NCP 서버는 공인 IP를 갖고 있으니 그쪽을 리스너로 두고, soyo가 클라이언트로 접속하는 방향을 택했다. 이렇게 하면:

- 공유기 포트포워딩을 새로 열 필요가 없다 (soyo가 outbound로 붙으니까)
- 집 공인 IP가 유동이어도 `PersistentKeepalive`로 알아서 재연결된다
- `wg1`이 soyo 호스트 네임스페이스에 그대로 있어서 홈 LAN ↔ NCP 노드가 NAT 없이 라우팅된다

```ini
# NCP: /etc/wireguard/wg0.conf
[Interface]
Address = 192.168.250.2/24
PrivateKey = <ncp-private-key>
ListenPort = 51820

[Peer]
PublicKey = <soyo-public-key>
AllowedIPs = 192.168.250.1/32, 172.16.0.0/16, 192.168.50.0/24
```

```ini
# soyo: /etc/wireguard/wg1.conf
[Interface]
Address = 192.168.250.1/24
PrivateKey = <soyo-private-key>

[Peer]
PublicKey = <ncp-public-key>
Endpoint = 203.0.113.10:51820
AllowedIPs = 192.168.250.0/24
PersistentKeepalive = 25
```

NCP 콘솔의 ACG(방화벽)는 집 공인 IP에서만 `UDP/51820`, `TCP/22`를 열어뒀다.

### kubeadm join

터널이 붙은 뒤엔 평범한 kubeadm 워커 조인이다. 다만 API 서버 엔드포인트는 WireGuard IP가 아니라 원래 advertise 주소(`172.16.1.10:6443`)를 그대로 써야 kubeadm 인증서 SAN 검증에 걸리지 않는다.

```bash
# soyo에서 토큰 발급
kubeadm token create --print-join-command

# NCP 노드에서 실행, kubelet node-ip는 WireGuard IP로 고정
echo 'KUBELET_EXTRA_ARGS="--node-ip=192.168.250.2"' > /etc/default/kubelet
kubeadm join 172.16.1.10:6443 --token ... --discovery-token-ca-cert-hash ...
```

### Terraform으로 IaC화

NCP 서버를 매번 콘솔에서 만들다 보니, 다음 번 스케일아웃 때는 코드로 관리하고 싶어졌다. NCP는 공식 Terraform 프로바이더(`NaverCloudPlatform/ncloud`)를 제공한다.

```hcl
resource "ncloud_subnet" "k8s_worker" {
  vpc_no         = data.ncloud_vpc.main.vpc_no
  subnet         = var.subnet_cidr   # 10.0.90.0/24
  zone           = "KR-1"
  network_acl_no = data.ncloud_vpc.main.default_network_acl_no
  subnet_type    = "PUBLIC"
}

resource "ncloud_access_control_group_rule" "k8s_worker" {
  access_control_group_no = ncloud_access_control_group.k8s_worker.id

  inbound {
    protocol   = "UDP"
    ip_block   = "${var.home_public_ip}/32"
    port_range = "51820"
  }
  # ...
}

resource "ncloud_server" "k8s_worker" {
  subnet_no            = ncloud_subnet.k8s_worker.id
  server_image_number  = local.ubuntu_base_image_number  # ubuntu-24.04-base
  server_spec_code     = data.ncloud_server_specs.worker.server_spec_list[0].server_spec_code
  login_key_name       = ncloud_login_key.k8s_worker.key_name
}
```

VPC/서브넷 CIDR을 데이터소스로 조회해서 겹치지 않는 대역을 계산하고, `terraform plan`으로 미리 확인한 뒤 apply하는 흐름이라 다음 서버 증설부터는 콘솔 클릭 없이 진행할 수 있다.

## trouble shooting

### 서브넷 CIDR이 Cilium 파드 대역과 충돌

Cloud Server들은 대부분 VM들과 overlay Network(VPC) 위에서 제공된다. 처음 NCP 서버를 붙였던 서브넷이 `10.0.1.0/24`였는데, 확인해보니 클러스터의 Cilium 설정과 정면으로 겹쳐 있었다.

```bash
kubectl -n kube-system get cm cilium-config -o yaml | grep cluster-pool
# cluster-pool-ipv4-cidr: 10.0.0.0/8
# cluster-pool-ipv4-mask-size: "24"

kubectl get ciliumnodes -o custom-columns='NAME:.metadata.name,PODCIDRS:.spec.ipam.podCIDRs'
# k8s-worker-1   [10.0.1.0/24]   <- NCP VPC 서브넷과 완전히 동일
```

Cilium은 원격 파드 대역으로 가는 라우트를 호스트 라우팅 테이블에 직접 설치한다(`ip route`에 `10.0.1.0/24 via ... dev cilium_host`). 이 상태로 NCP 노드를 그 서브넷에 붙이면, NCP 노드 입장에서 자기 VPC 게이트웨이로 가야 할 패킷이 파드 라우트로 잘못 들어가서 통신 자체가 끊긴다.

해결은 단순했다 — 파드 대역과 절대 겹치지 않는 `10.0.90.0/24`로 새 서브넷을 파서 서버를 옮겼다. Cilium `cluster-pool`이 `/8`을 쓰는 클러스터라면, NCP처럼 사설 클라우드 서브넷도 `10.0.0.0/8` 안에서 뽑히는 경우가 흔하니 미리 겹치는지 확인하는 게 좋다.

### WireGuard AllowedIPs 비대칭 문제 (Cilium 크래시루프)

서브넷을 옮기고 조인했더니 Cilium 파드가 계속 `CrashLoopBackOff`에 빠졌다.

```
level=error msg="Unable to contact k8s api-server" ipAddr=https://10.96.0.1:443
error="dial tcp 10.96.0.1:443: i/o timeout"
```

API 서버 서비스 IP(`10.96.0.1`)로 가는 트래픽인데 타임아웃이 난다. tcpdump로 까보니 원인은 라우팅 순서였다.

- NCP 노드에서 서비스 IP로 나가는 패킷은 **DNAT되기 전에** 라우팅 결정이 먼저 일어나서, 소스 주소가 NCP 노드의 실제 IP(`10.0.90.6`)로 찍힌 채 나간다
- 이 패킷이 WireGuard 터널을 타고 soyo에 도착하는데, soyo의 `wg1` 설정에는 `AllowedIPs`에 `192.168.250.0/24`만 있어서 `10.0.90.6`발 패킷을 거부(drop)하고 있었다

```ini
# 수정 전
AllowedIPs = 192.168.250.0/24

# 수정 후 — NCP 서브넷 대역을 추가해야 서비스 트래픽이 통과한다
AllowedIPs = 192.168.250.0/24, 10.0.90.0/24
```

WireGuard의 `AllowedIPs`는 "이 피어가 보낼 수 있는 출발지 대역"이자 "이 피어로 보낼 수 있는 목적지 대역" 양쪽으로 다 쓰인다는 걸 몸으로 배웠다. 클러스터 서비스/파드 트래픽처럼 소스 IP가 여러 대역을 오가는 경우, 상대 노드의 전체 서브넷을 열어줘야 한다.

### MTU

WireGuard 위에 Cilium VXLAN(오버레이 위에 오버레이)이 얹히면서 MTU를 낮춰야 했다.

- WireGuard 기본 MTU: 1420
- VXLAN 헤더 오버헤드: 50바이트
- 계산상 여유치: `1420 - 50 = 1370`

```bash
kubectl -n kube-system patch cm cilium-config -p '{"data":{"mtu":"1370"}}'
kubectl -n kube-system rollout restart ds/cilium
```

값을 감으로 잡고 끝내지 않고, 실제로 파드 두 개(홈 쪽 / NCP 쪽)를 띄워서 페이로드 크기를 이진탐색으로 검증했다.

```bash
kubectl exec home-nettest -- ping -c 2 -s 1292 -W 2 $NCP_POD_IP   # 0% loss
kubectl exec home-nettest -- ping -c 2 -s 1293 -W 2 $NCP_POD_IP   # 100% loss
```

IP 헤더(28바이트)를 더한 1320바이트가 실제 임계값이었고, 설정한 1370(파드 인터페이스 MTU 기준)과 정확히 맞아떨어졌다. TCP는 MSS 협상 덕에 문제가 없었지만, ICMP나 단편화가 필요한 UDP 트래픽은 이 값을 넘으면 조용히 드롭되니 실측 검증이 필요하다.

### Harbor 레지스트리 TLS (containerd 버전 차이)

사설 Harbor(`harbor.home.internal`)는 자체 서명 인증서를 쓰고 있어서, 기존 노드들은 `containerd`의 `certs.d/hosts.toml`로 `skip_verify`를 설정해뒀다.

```toml
# soyo (containerd 2.2.1) — 정상 동작
server = "https://harbor.home.internal"
[host."https://harbor.home.internal"]
  capabilities = ["pull", "resolve"]
  skip_verify = true
```

NCP 노드(Ubuntu 24.04 기본 저장소 containerd, 1.7.x)에 똑같이 설정했는데 계속 인증서 오류가 났다.

```
x509: certificate is valid for ...traefik.default, not harbor.home.internal
```

containerd 1.7 계열은 `certs.d` 기반 `hosts.toml`의 `skip_verify`가 CRI 경로에서 제대로 안 먹는 이슈가 있었다. 결국 레거시 방식인 `config.toml`의 `registry.configs` 섹션으로 우회했다.

```toml
[plugins."io.containerd.grpc.v1.cri".registry.configs."harbor.home.internal".tls]
  insecure_skip_verify = true
```

같은 클러스터라도 노드마다 containerd 버전이 다르면 레지스트리 신뢰 설정 방식이 달라질 수 있다는 걸 확인한 케이스. `crictl pull`로 실제 이미지 하나를 당겨서 성공하는지까지 확인하고 넘어갔다.

## 노드 격리

NCP 노드는 스토리지(NFS)나 MetalLB에 의존하는 워크로드를 태울 수 없다. NFS는 터널을 타고 왕복하면 느리고, MetalLB L2 광고는 애초에 홈 LAN 밖으로 안 나간다. 그래서 기본적으로는 아무것도 스케줄되지 않게 막아뒀다.

```bash
kubectl taint nodes k8s-ncp-worker node.home-infra/remote=true:NoSchedule
kubectl label nodes k8s-ncp-worker \
  node.home-infra/location=ncp \
  topology.kubernetes.io/zone=ncp-kr1
```

모니터링(cadvisor, node-exporter)처럼 모든 노드에 반드시 떠야 하는 DaemonSet에는 toleration을 추가해서 예외를 뒀다.

```yaml
spec:
  template:
    spec:
      tolerations:
        - key: node.home-infra/remote
          operator: Exists
          effect: NoSchedule
```

## 검증

```bash
kubectl get nodes
# k8s-ncp-worker   Ready    <none>          v1.30.14
# k8s-worker-1     Ready    <none>          v1.30.14
# soyo             Ready    control-plane   v1.30.14
```

- 파드 간 레이턴시: soyo ↔ NCP 파드 왕복 약 5ms (인터넷 경유치고 나쁘지 않다)
- Harbor 이미지 pull: `imagePullSecret` + 위 TLS 설정으로 정상 pull, 파드 `Running` 확인
- 모니터링 커버리지: `cadvisor`/`node-exporter`가 3개 노드 전부에 떠서 Grafana에서 동일하게 조회됨

```mermaid
flowchart LR
    subgraph Home["집 (172.16.0.0/16)"]
        soyo["soyo<br/>control-plane"]
        w1["k8s-worker-1"]
    end
    subgraph NCP["NCP VPC (10.0.90.0/24)"]
        w2["k8s-ncp-worker<br/>taint: remote=true"]
    end
    soyo <-->|Cilium vxlan| w1
    soyo <-->|"WireGuard(wg1↔wg0)<br/>+ Cilium vxlan, MTU 1370"| w2
```

## 마무리

관리형 IPsec VPN 상품 없이도, 이미 떠있는 서버 하나 + 네이티브 WireGuard로 하이브리드 워커를 붙일 수 있었다. 다만 "클러스터 확장"이라기보다는 "터널로 이어붙인 원격 연산 노드"에 가깝다고 보는 게 정확하다 — 스토리지, LoadBalancer, 레지스트리 신뢰 관계는 전부 홈 인프라 쪽에 남아있고, NCP 노드는 taint로 격리된 순수 연산 자원일 뿐이다.

다음에 노드를 더 늘린다면 이번에 만든 Terraform 모듈에 서버 개수만 늘리면 되니, 스케일아웃 자체는 한결 가벼워졌다. 