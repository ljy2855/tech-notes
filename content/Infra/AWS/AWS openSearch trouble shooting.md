
### CDK provisioning
VPC, AZ,  IAM 정책, 

### 인스턴스 설정
#### Compute resource
주로 Vector Search 작업중에 
- c6g.large.search : 2 vcpu, 4GB memory

#### Storage
- EBS : GP2, GP3 사용 가능 but 일부 Compute 타입에 따라 GP3 강제

##### 노드 종류
- data node
- master node
- ultra warm node

##### instance 종류


##### 선택 기준



#### volume resource
- gp3
- gp2
- 

### 보안 정책

#### 마스터 사용자 지정



#### 도메인 수준 접근 제어




### Haystack Integration




### 레퍼런스
https://opensearch.org/blog/boost-vector-search-with-css/