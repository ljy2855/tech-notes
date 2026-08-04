### 배경
- 서비스를 하나 추가할때마다 필요한 작업들
	- 서비스 Domain Name에 해당하는 TLS 인증서 발급
	- webserver or ingress에서 해당 서비스 프록시 추가


TLS 인증서 자체를 관리하는것도 번거롭고, 서비스별로 프록시를 추가하고 관리하는 것도 상당히 귀찮음

물론 wildcard 도메인으로 발급받아서 공통으로 쓰는것도 가능하지만, 프록시를 추가하거나, 인증서를 갱신하는 과정은 필요함


Cloudflare에서 TLS termination도 지원하니까, 아예 TLS 인증 자체를 cloudflare에 넘겨버리고, 
도메인 -> pod, service로 매핑만 할 수 있는 방법을 고민


### Cloudflare Tunnel

> Cloudflare Tunnel provides you with a secure way to connect your resources to Cloudflare without a publicly routable IP address. With Tunnel, you do not send traffic to an external IP — instead, a lightweight daemon in your infrastructure (`cloudflared`) creates [outbound-only connections](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/#outbound-only-connection) to Cloudflare's global network.

![[Pasted image 20250927133225.png]]

공식적인 설명은 다음과 같음

k8s의 private network에 cloudflared를 띄워, cloudflare의 global network과 outbound tunnel을 맺는다.

이렇게 맺어진 터널은 외부에서 접근하는 트래픽이 cloudflare를 거쳐 cloudflared가 private 네트워크로 프록시하는데 쓰인다.


![[Pasted image 20250927164416.png]]

k8s에 cloudflared 띄우기

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloudflared
  namespace: edge
spec:
  replicas: 1
  selector:
    matchLabels: { app: cloudflared }
  template:
    metadata:
      labels: { app: cloudflared }
    spec:
      containers:
      - name: cloudflared
        image: cloudflare/cloudflared:latest
        args: ["tunnel","--no-autoupdate","run"]
        env:
        - name: TUNNEL_TOKEN
          valueFrom:
            secretKeyRef:
              name: cloudflared-token
              key: token
        resources:
          requests: { cpu: "50m", memory: "64Mi" }
          limits:   { cpu: "500m", memory: "256Mi" }
        securityContext:
          runAsNonRoot: true
          readOnlyRootFilesystem: true
      restartPolicy: Always
````



cloudflare 대시보드에서 도메인 -> 타겟 서비스 설정
![[Pasted image 20250927152327.png]]
바로 service로 연결해도 되는데, 중간에 traefik을 배치해서 IngressRoute를 통해서 관리

이미 배포된 deployment에 해당 내용 
```
# edge 네임스페이스에 배포
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: n8n
  namespace: edge
spec:
  entryPoints: ["web"]                           # 터널 → Traefik(HTTP)
  routes:
  - match: Host(`n8n.cocopam.dev`)
    kind: Rule
    services:
    - name: n8n
      namespace: tools                  
      port: 5678

````

### 트래픽 모니터링
![[Pasted image 20250927152238.png]]
cilium hubble을 통해서 트래픽이 흐르는 것을 확인해보면, 외부 Cloud network outbound tunnel이 맺어진 것을 확인할 수 있음

그리고 cloudflared로 들어온 트래픽을 traefik을 통해 타겟 서비스로 넘겨줌

![[Pasted image 20250927153547.png]]

실제 외부 트래픽이 ingress를 통해서 들어오는게 아니라 내부의 cloudflared로부터 들어오기때문에 Ingress traffic에 대한 모니터링이 안됌
