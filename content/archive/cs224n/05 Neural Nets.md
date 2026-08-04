
#### A binary logistic regression unit
![[Pasted image 20250319171236.png]]

- 사람 뉴런과 비슷하게 생겼다~
	- bias?
	- weight?
-

#### Neural Nets
![[Pasted image 20250319171420.png]]

- weight, bias 모두 matrix로 표현한다~


#### Gradient
- activation fuction의 W,b를 조절하기 위해 얼마만큼 이동할지 gradient로 결정

![[Pasted image 20250319172253.png]]


#### 결과
![[Pasted image 20250319173448.png]]


![[Pasted image 20250324163619.png]]
- h : hidden vector
- s : 


![[Pasted image 20250324164223.png]]


![[Pasted image 20250324163831.png]]
![[Pasted image 20250324164234.png]]

![[Pasted image 20250324164312.png]]

![[Pasted image 20250324164352.png]]

### Backpropagation

#### Forward Propagation

![[Pasted image 20250324164548.png]]
- 앞선 노드에서 계산한 output을 다음 노드에게 전달함
- 

#### Backpropagation

**Overview**
![[Pasted image 20250324164755.png]]

**Single node**
![[Pasted image 20250324164938.png]]


- Bprop -> input의 gradient을 전달
- `upstream * local = downstream`

![[Pasted image 20250324170019.png]]
- max의 경우 indicator function 이므로 range에 따라 local gradient 찾기
- y의 경우 다수의 input을 진행하므로 gradient sum 진행

![[Pasted image 20250324170601.png]]

- 공통으로 pass되는 gradient(downstream)를 저장해두었다가 쓰자

#### 실제?
- Done correctly, big O() complexity of fprop andbprop is the same
- In general, our nets have regular layer-structure and so we can use matrices and Jacobians…
- forward , backward 연산량은 비슷함

![[Pasted image 20250324172055.png]]
- gradient를 직접 구하기 힘들면 체크용도로 이렇게 근사를 써도?
- 지금은 쓸일이 없다~