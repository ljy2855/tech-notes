![[Lec10-transformers.pdf]]


attention
- sequence x를 통해서 hidden layer로 정보 전달함
- 그럼 아예 RNN을 없애볼까?
- **Cross attention**: paying attention to the input x to generate 𝑦𝑡


self attention
to generate 𝑦𝑡, we need to pay attention to $𝑦_{<𝑡}$
- rnn과 다르게 $y_t$를 생성하기 위해서 이전 $𝑦_{<𝑡}$ 를 참고한다!




position embedding


sinusoids

from scratch
- 정해진 index 밖은 표현이 안됌
- 


Decoder

![[Pasted image 20250409164756.png]]
- 미래 정보는 Masking으로 0으로 만듬
- 여러 Block을 쌓아서 만듬
- Next token의 distr

Encoder
![[Pasted image 20250409164809.png]]
- bidirectional하기 위해 No masking 진행


![[Pasted image 20250409164934.png]]

- croess attention