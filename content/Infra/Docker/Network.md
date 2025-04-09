
도커에서 지원하는 가상화 네트워크 정리

### Background
Container로 가상화되면 밖의 Host와 다른 Container와 격리됨

![[Pasted image 20250409155613.png]]

결국 자신의 interface

#### Network
The Docker daemon performs dynamic subnetting and IP address allocation for containers. Each network also has a default subnet mask and gateway.

#### DNS


#### driver
| Driver    | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `bridge`  | The default network driver.                                              |
| `host`    | Remove network isolation between the container and the Docker host.      |
| `none`    | Completely isolate a container from the host and other containers.       |
| `overlay` | Overlay networks connect multiple Docker daemons together.               |
| `ipvlan`  | IPvlan networks provide full control over both IPv4 and IPv6 addressing. |
| `macvlan` | Assign a MAC address to a container.                                     |

### Practice

```bash
$docker run -dit --name Rock ubuntu
$docker exec -it Rock bash
$ifconfig
```

![[Pasted image 20250409160423.png]]


```
$docker network create -d 
```