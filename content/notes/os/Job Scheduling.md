
### Concurrency
여러 프로세스들이 하나의 CPU에서 동시에 실행되는 것처럼 보이는 것은 OS가 실행중인 thread들을 관리하며 일정 시간마다 실행되도록 관리하기 때문

Preemptive Kerenl

### CPU Preempt
1 core의 CPU에서 실행되는 thread는 user mode에서
다음 과정을 통해 연산을 진행한다.

1. Instruction fetch from program counter
2. decode opcode
3. execute instruction
4. increase or modify program counter

이 과정 중에, 

- 시스템 내부의 timer가 interrupt을 발생시켜 해당 thread에 부여된 time quanta 확인
- OS 내부의 
### Scheduling


### Priority

### Starvation


