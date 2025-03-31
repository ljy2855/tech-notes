
![[Lec08-fancy-rnn.pdf]]


### LSTM
Long Short-Term Memory

![[Pasted image 20250331165514.png]]

- hidden state, cell state 존재
	- cell state에 long-term information을 저장()
	- cell에 read, erase, write가 가능
- gates을 통해서 해당 메모리를 관리함
	- open, close를 통해서 관리
	- 상태가 dynamic 함-> 현재 context에 따라 다른 결과가 나옴

![[Pasted image 20250331170328.png]]

#### 왜 잘할까

- RNN에 비해 이전 timestamp의 gradient가 사라지는 문제 해결

그럼 다른 방법은 없나?

**Residual Connections (Skip Connections)**
![[Pasted image 20250331171116.png]]
**Dense Connection**
![[Pasted image 20250331171420.png]]
**Highway connection**
![[Pasted image 20250331171620.png]]


Attention도 같은 문제를 해결하기 위한 거였음
transformer전에는 이런식으로 해결했었따


#### 실제로 어땟나여

- task 잘했음
	- handwriting recognition, speech recognition, machine translation, parsing, and image captioning


### Bidirectional and Multi-layer RNNs
sentiment classification task

**기존 RNN**
![[Pasted image 20250331172038.png]]
- 뒤에서만 정보를 받다보니 제대로 적용하기 어려웠음
- ex) terribly 까지 보면 안좋았는데, exciting을 보면 개좋음 (단방향으로는 의미를 분석하기 쉽지 않음)



**Bidirectional RNN**
![[Pasted image 20250331172054.png]]

- 양방향으로 output에 영향을 줌


전체 Sequence가 통째로 input으로 들어갈 때 사용가능
다만 Generation task는 쓸 수 없음

- Bert에서도 이러한 방식으로 양방향으로 영향을 받음

**Multi-layer RNNs (stacked RNNs)**
![[Pasted image 20250331172553.png]]

- 더욱 복잡한 표현이 가능하도록 함 (higher-level features)
- 
