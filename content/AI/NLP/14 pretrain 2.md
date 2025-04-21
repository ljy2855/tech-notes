
![[Lec14-pretraining-2.pdf]]


챕터 목표
- bert 이후에 어떤 녀석들이 나왔나?
- chatgpt까지의 발전
- 그녀석들의 한계

### Post Bert

**RoBERTa**
- BERT가 더욱 학습할 여지가 남아있다고 생각
- next sentence prediction loss를 제거함 ->
- data size, batch size를 올릴수록 성능이 올라갔다..!

![[Pasted image 20250421164457.png]]



ALBERT
- 다른 레이어의 모델의 파라미터를 공유해볼까?
- 임베딩 사이즈를 줄여보자
![[Pasted image 20250421164726.png]]

**Distill, Tiny, Mobile BERT**
- Distillation : teacher를 따라하게 만듬 -> 모델을 압축한다
- BERT의 성능의 97퍼까지 따라옴
![[Pasted image 20250421164856.png]]

**ELECTRA**
- Generator
	- 생성하는 모델 (BERT) -> **마스크에 있는 단어를 생성**
	- discriminator를 더 잘 속이기 위해, 더욱 더 real 한 데이터를 생성 
- Discriminator
	- 생성한 데이터를 판단(진짠가..?)
	- 단어들을 input으로 받아서 이게 **masked되었는지 아닌지 판단**

![[Pasted image 20250421165108.png]]

- downstream task 수행에 좋았다

**Text-to-text models**
- BERT can’t be used to generate text
- 아예 text to text를 뽑아내는 모델을 만들자
- 

T5 (Text to Text Transfer Transformer)
![[Pasted image 20250421170126.png]]

### GPT3
transformer decoder만 들고 와서 훈련시키자


