
![[Lec13-pretraining.pdf]]

Contextualized Word Embeddings

![[Pasted image 20250416163728.png]]

**word2vec 만으로도 충분하지 않았나?**
- 단순히 단어만으로만 의미를 표현하기엔 애매함
- 문맥에 따라 단어가 다른 의미로 사용

![[Pasted image 20250416163811.png]]


### ELMo 
Embeddings from Language Models

- LSTM based 언어 모델을 사용

![[Pasted image 20250416164047.png]]


![[Pasted image 20250416164215.png]]


1. forward, backward vector concat
2. weighed sum (hyper-parameter)

![[Pasted image 20250416164338.png]]
- 문맥을 같이 반영하니까 task를 잘 수행했다~

왜 bidirectional하게 썼을까?

왜 weighted sum을 할까?
- 각각의 다른 layer에서는 다른 정보들을 들고 있을 수 있기에 이걸 반영하기 위해?
- task마다 특정 layer의 성능이 달랐기에!

![[Pasted image 20250416165049.png]]

### Pre-training
사전 학습!

새로운 corpus등을 가지고 학습을 시키는것

### Finetuning
