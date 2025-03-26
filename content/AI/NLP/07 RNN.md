
![[Lec07-RNN.pdf]]


lecture key point
- 왜 RNN이 등장했을까?
- RNN의 문제점이 뭐였을까?


### Language Model
언어모델은 현재 문맥에서 `다음 단어가 뭐가 나올지 예측`하는 모델

![[Pasted image 20250326163751.png]]
#### usage
- Predictive typing
- Speech recognition
- Handwriting recognition
- Spelling/grammar correction
- Authorship identification
- Machine translation
- Summarization
- Dialogue


#### next-word prediction으로 무슨 태스크를 수행할 수 있을까?
- trivia
- syntax
- coreferene
- lexical semantics/topic
- sentiment
- reasoning (hard...)
- basic arithmetic


#### GPT2
Stylistically correct, content wise, questionable


#### GPT3
in-context learning이 가능해졌다!
backround로 정보를 미리 가지고 question에 대답이 가능해짐

#### N-gram Language Model
GPT 전에 아주 고전적인 모델들

확률은 어캐 구하는데요?
corpus에서 개수 세요... ㅁㅊ

뭐가 문제였을까요?

**sparsit problem**

- 자주 등장하지 않는 단어들(count가 적은)은 확률이 0임 -> smoothing으로 개선
- 애초에 context가 없었다면? -> backoff (n-1 gram으로 처리)

**storage problem**
corpus를 확장하면 할수록, 문장이 길어질 수록, count를 저장하기 어려워짐


**generating text은 어떨까?**

incoherent. We need to consider more than three words at a time if we want to model language well.

But increasing n worsens sparsity problem, and increases model size…

**evaluation metric**
- perplexity : 낮으면, corpus에서 해당 context가 나올 확률이 높다! -> 모델링 잘했네~

**neural language model은 어땟는감**

- window-based neural model
![[Pasted image 20250326165529.png]]


A fixed-window neural Language Model
![[Pasted image 20250326165738.png]]
- 가운데 단어가 아닌, 앞선 단어로 window input으로 넣는다!
- NER이랑 뭐가 다름? -> output이 실수였던 거랑 다르게 얘는 vector
- **`sparsity problem이 해결되엇음`** -> 왜 why???
- storage 문제 해결
- **fixed window 가 커지기 어려움 (flexible한 input은 안됌)**
- input의 순서가 보장되지 않는다.


### RNN
![[Pasted image 20250326170427.png]]
- **현재 시점에 들어온 input을 처리하는데, 이전 context도 반영한다!**
	- I have fruit -> `fruit` 처리시에 `I have`도 같이 반영됌

![[Pasted image 20250326170711.png]]

- word embedding을 위한 E metric
- hidden layer는 옛날엔 sigmoid나 hyper tanh썻음
- 