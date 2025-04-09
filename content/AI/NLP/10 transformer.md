![[Lec10-transformers.pdf]]



self attention이 뭐가 문제일까


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