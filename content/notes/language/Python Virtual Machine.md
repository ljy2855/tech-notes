---
tags:
  - Python
Done: true
---
### Interpreter

파이썬은 [[Interpreter]]를 통해 실행된다. 

**![](https://lh7-rt.googleusercontent.com/slidesz/AGV_vUfsLUzDFwtfl1XF-OqaQVQyRxjQxk8IGvfSef-bRSgVcFcUspM1m7hr6QZg22V9_kdpn1CBRi8zWi8BKlat98-8z86mjtwZMeW45okUCUGS2OHbhOfnrEVzvxq4rORMknsvw_oryt6RWi-3fXaEqxYiJfhg6wYf=s2048?key=N9N6zgE9cznxhWNKY6PeDg)**

```bash
❯ python
Python 3.9.13 | packaged by conda-forge | (main, May 27 2022, 17:00:33)
[Clang 13.0.1 ] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

`python`을 실행하면 interactive shell이 실행되는데, 한줄 씩 코드를 입력하고 독립적으로 코드를 실행하고 결과를 출력한다.

C, Java 기반의 컴파일 언어보다 유연하게 코드 작성 및 실행이 가능하지만, 성능적인 부분에서 trade off가 발생한다.


> [!NOTE] 왜 C, Java보다 성능이 떨어질까?
>**Overhead 발생**
> 파이썬은  line마다 byte code로 컴파일되어, runtime(PVM)에서 실행된다. 바로 binary file을 실행하는 imperative Language보다 한단계를 더 거치에 여기서 overhead가 발생한다.
> 
>**하드웨어 최적화의 제한**
> CPU가 이해할 수 있는 instruction으로 컴파일되는 `C`와 `Java`는 `pipelining`, `branch optimization`등 하드웨어 내의 최적화가 가능하지만, `Python`은 PVM내에서 Complier 단계의 최적화만 가능하다.
> 
>**컴파일 최적화**
> Java의 경우, 자바 가상 머신(JVM)은 Just-In-Time(JIT) 컴파일러를 통해 실행 시점에 바이트 코드를 기계어로 컴파일하고 최적화한다. 이 방법은 초기 실행 속도는 느릴 수 있지만, 장기적으로는 실행 속도를 크게 향상 가능하다. Python도 PyPy와 같은 대안적인 구현체에서 JIT 컴파일을 지원하여 성능을 개선하고 있으나, 기본적인 CPython 구현체는 이러한 기능을 제공하지 않는다.


### Script Run

```python
i = 3
print(i)
```

다음과 같은 Script를 실행시킬 때, 아래의 step대로 코드를 실행한다.

1. **parsing, syntax analysis** : code string parsing, syntax analysis 진행 
2. **byte code complier** : `PVM`이 실행가능한 형태의 byte code(IR)로 컴파일을 진행한다. 주로 pyc 확장자 파일로 생성되며 `__pycache__` 폴더에 저장된다. 만약 같은 script를 실행시킬 때, 기존의 컴파일된 byte code를 실행시키도록 cache한다.
3. **execution** : 바이트 코드는 파이썬 가상 머신(`PVM`)에 의해 실행된다. `PVM`은 스택 기반의 인터프리터로, 바이트 코드를 한 줄씩 읽어 실행하며 필요한 연산을 수행된다. 여기서 실제 프로그램의 로직이 수행된다.

### PVM (Python Virtual Machine)

앞선 **Script Run**을 수행하는 프로그램이 PVM이다. 주로 C로 작성된 `CPython이` 사용되고 이외에 `PyPy`, `Jython` 등 다양한 PVM이 존재한다.

#### 메모리 관리
##### Stack
C와 마찬가지로 함수 stack frame을 저장하는데 여기엔 local variable, parameter, return address를 저장한다. 
##### Heap
이외에 리스트와 같은 Object들은 heap영역에 저장하게 되는데, 할당된 Object들은 `del` 또는 [[Garbage Collector]] 에서 reference count가 0이되면 자동으로 메모리 해제를 진행한다.
추가적으로 instance, global variable도 heap영역에 저장된다

![[Pasted image 20240505191143.png]]
##### Trade off
파이썬은 PVM이 메모리 관리를 수행하기에 간단하게 코드를 작성할 수 있다. 다만 GC를 사용함으로써 서버 프로그램 구동 시, 문제가 발생할 수 있다.

> [!NOTE] 서버 프로그램에서 문제
> 
> **실시간 처리 제한**
> GC를 작동하는 순간(순환 참조 확인, ref count update)은 PVM이 결정하기에, 웹서버에서 reqeust를 처리할 때 성능 문제가 발생할 수 있다. (response time 증가)
> 오랜시간 프로세스 구동 시 GC가 관리할 메모리 블럭들이 늘어나고 그 만큼 연산시간이 증가한다.
> 

#### 코드 실행
##### 명령어 실행
PVM은 스택 기반의 실행 모델을 사용합니다. 각 바이트 코드 명령어는 특정 작업(예: 변수 할당, 산술 연산, 객체 접근 등)을 수행하며, 이는 스택을 통해 관리된다. 예를 들어, 두 수의 덧셈 연산은 두 수를 스택에 푸시한 후, 덧셈 명령어를 실행하여 결과를 스택에 저장한다.

##### 조건문
조건이 참인지 거짓인지 평가한 후, 해당 결과에 따라 실행 흐름을 분기한다.

##### 반복문
`while` 문은 조건이 참인 동안 계속해서 코드 블록을 반복 실행하고, `for` 문은 시퀀스의 각 항목에 대해 코드 블록을 실행한다. PVM은 내부적으로 루프 카운터와 종료 조건을 관리하여 루프의 실행을 제어한다.

##### Trade off
PVM은 C로 작성되었기에 byte 코드를 실행시킬때, line별로 C코드를 실행시키는 것과 같다. 때문에 실제 CPU가 실행하는 assembly code는 `pipelining`, `Optimization` 이 line별로만 가능하다. 따라서 성능적으로 최적화된 어셈블리 코드를 직접 실행하는 것에 비해 일정 부분 성능 저하가 발생할 수 있다. 마찬가지로, 조건문이나 반복문과 같은 분기 코드를 처리할 때도 성능적인 제약이 따른다.