### Memory Management
프로그램이 실행될 때, 메모리상에 저장이 필요한 변수, 인스턴스들 위해 할당 및 해제가 발생한다.

C의 경우
- Global variable
- Local variable
- Dynamic allocated

등이 메모리상에 올라가게 되며, 전역변수는 code segment, 지역 변수는 stack frame 내에, 동적할당은 heap 영역에 저장된다.

이중에 heap과 stack이 메모리 할당 및 해제를 런타임마다 수행하는데, stack은 함수 호출 및 return으로 관리하고 heap은 malloc과 free로 구현된다.
따라서 개발자는 동적 할당 및 해제의 책임을 갖게되며 잘못된 메모리 접근 및 메모리 누수를 고려해야 한다.

### Garbage Collector
이러한 직접적인 메모리 할당 및 해제를 프로그램을 실행하는 Interpreter 또는 VM이 수행하는 것이 Garbage Collector이다.

해당 로직의 아이디어는 더 이상 해당 메모리에 접근이 불가능할 때, 해당 메모리를 해제하게 된다.

#### Reference Counting

