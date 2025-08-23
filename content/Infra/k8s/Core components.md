
![[Pasted image 20250823234549.png]]
![[Pasted image 20250823234952.png]]


### Control Plane

컨트롤 노드에 배치되는 서비스들로 worker 노드에는 없고 control plane 노드들에만 존재

control plane에서는 pod의 스케줄링등을 수행하며, 클러스터 내부의 서비스들을 관리함

각 components들은 다른 host들에 배치될 수는 있으나, 관리포인트와 병목 가능성을 위해 하나의 호스트에게 전담한뒤, 해당 노드에는 container를 띄우지 않게하는 것이 좋음 

Why? 
container가 cpu와 memory를 물리적으로 격리하는 것이 아니기 때문에, core component에도 영향을 줄 수 있음


- kube-apiserver
container들의 

- etcd


- kube-scheduler
- kube-controller-manager
- cloud-controller-manager (optional)



### Node
- kubelet
- kube-proxy
- Container runtime

