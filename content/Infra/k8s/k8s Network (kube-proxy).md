
전통적인 모노리틱 구조에선 서버가 가지고 있는 고유의 IP (or VIP)로 어플리케이션의 IP, Port로 매핑하여 연결함

![[../../Assets/Pasted image 20251214172937.png]]

하지만 k8s 클러스터에서는 overlay network 위에 어플리케이션(container, pod)들을 띄우기 때문에 underlay( baremetal 서버, 스위치)의 입장에서는 트래픽을 어떻게 전달하는지 모르게 됨

k8s에는 이를 CNI를 통해 해결하게 되는데 기본적으로 kube-proxy

K8s cluster network에서 발생할 수 있는 트래픽

1. container to container 
2. pod to pod
3. pod to service
4. external service
