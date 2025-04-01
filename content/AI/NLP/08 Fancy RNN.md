
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

- 더욱 **복잡한 표현이 가능하도록 함 (higher-level features)**
	- CV의 경우 아래 layer에서는 low한 task(엣지 찾기), 위에는 눈 찾기 같은 layer 설계
	- NLP의 경우 형태소 분석 -> 문장 -> 문맥 처럼 다양한 layer로 처리가능
- 너무 층이 높아지면, 문제가 생김
	- 더 깊은 RNN (예: 8층)을 학습시키려면 skip-connection 같은 구조가 필요
	- 너무 많은 레이어를 쌓으면 학습이 어려워짐 (그래디언트가 흐르지 않음)
	- 이를 해결하기 위해 ResNet처럼 층을 건너뛰는 연결을 넣어줌

### Machine Translation

전통적인 MT는 rule based로 진행함 -> 문장을 그냥 대체하는 방식

**Statistical Machine Translation**

![[Pasted image 20250331173705.png]]
- 통계를 사용해서 적용해보자
	- translation model: 기존 번역된 문장을 통해 확률이 높게 번역을 진행
	- language model: 변환된 언어가 자연스러운가 확인

- 시스템이 각자 작은 task로 나눠서 활용


#### NMT (Neural Machine Translation)
sequence to sequence model

기존 NER, word prection task와 다르게, input, output 모두 sequence


**Encoder Layer**
input 문장의 의미를 추출하는 layer
![[Pasted image 20250331174319.png]]
- `attention? 특정 단어를 기반으로 ..? (다음시간에)`
**Decoding Layer**

![[Pasted image 20250331174336.png]]

