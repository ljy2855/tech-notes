### static analyzer

![[Pasted image 20240608135844.png]]

작성한 프로그램을 실행하기전에 프로그램의 semantic이 올바른지 확인한다.
이는 interpreter, complier 모두 수행하는 작업으로 이중에서는 type이 정상적으로 사용되는지 확인한다.


#### Sound
program with error is always rejected / never misses an error / if a program passes, it is guaranteed to be error-free

#### Complete
program without error is always accepted / never rejects a safe program / if rejected, there must be an error

Sound하고 complete한 정적분석은 불가능하다. 언어의 철학에 따라 trade off를 진행
F# -> sound, not complete
C -> not sound, not complete

