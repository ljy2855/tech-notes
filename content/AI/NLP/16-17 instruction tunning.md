![[Lec-16-17-instruction-tunining-rlhf.pdf]]

LM은 점점 더 커지고 있다
scale ? -> train data, flops, parameter

pretrain시, 학습에 필요한 데이터
![[Pasted image 20250514163956.png]]


기존 next word prediection에서 점점 확장된 task를 수행하도록 바뀜
- Language modeling ≠ assisting users

fine tunning의 목적
- down stream 태스크를 더 잘하게 만든다던가
- task domain 전환 (object detection -> 암세포 detection)

LM이 many task를 동시에 잘하게 하려면 어떻게 해야할까?

#### Instruction finetuning
다양한 태스크에 대해서 instruction , ouput pair를 통해 학습시킴

이후에 unseen tasks에 대해서 평가함

#### Instruction pretraining?
그냥 아예 pretrain 할 때, 하면 안되나?

Massive Multitask Langauge Understanding (MMLU)

