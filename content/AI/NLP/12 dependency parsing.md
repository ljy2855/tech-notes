
문장의 문법 구조에 대한 것
- 품사, 문장 형식?

특정 언어에 종속적임! 영어 != 한국어


### Constituency

- 문장을 어떤 구조로 쪼갤 것인가?
- context-free grammars (CFGs)
- words -> phrases -> bigger phrases


### Dependency structure
- 단어 사이의 의존관계를 확인


*Look in the large crate in the kitchen by the door*

**Look in** 의 target : **the large crate**
**large crate** 의 describe : **in the kitchen by the door**

이런식으로 각 


왜 문장 구조를 분석해야할까?
- 사람은 자연스럽게 문장을 쪼개서 Constituency와 Dependency를 파악함
- Model이 이러한 구조를
- sequence를 token으로 쪼개기 위해서?

그런데 문제는 없을까?

**Prepositional phrase attachment ambiguity**
- 같은 단어여도 문맥에 따라 ambiguity를 가질 수 있음

**PP attachment ambiguities multiply**
- attach를 어떻게 할지, 애매하게 생성될 수 있는 조합들이 늘어남
	- Catalan numbers: $Cn = (2n)!/[(n+1)!n!]$


**Coordination scope ambiguity**
*(Shuttle veteran and longtime NASA executive) Fred Gregory appointed to board*

*(Shuttle veteran) and (longtime NASA executive Fred Gregory) appointed to board*


Doctor: (No Heart), (cogintive issues)

Doctor: No (Heart, cogintive) issues

- Coordination에 따라 달라짐


**Verb Phrase (VP) attachment ambiguity**

### Dependency paths

![[Pasted image 20250414171247.png]]
![[Pasted image 20250414171603.png]]

- 단어들 사이의 관계로 이어져있는지 명시함
- cyclic하지 않음 (트리 구조)


**annotated data & Universal Dependencies treebanks**
- 실제 parse tree를 만들기 위한 data는 직접 만들어놓음..
- NLP 시스템을 평가하는데도 사용함



Preferences
1. Bilexical affinities : 
2. Dependency distance : 가까이에 있는 단어들이 관계가 있음
3. Intervening material : 문장을 넘어서까지 관계가 거의 없음
4. Valency of heads: 