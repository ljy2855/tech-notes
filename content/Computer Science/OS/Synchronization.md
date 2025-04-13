
thread가 동시에 같은 resource(메모리 or file)에 접근할 때 발생하는 문제상황


### Mutex

### Semaphore

### Counting Variables



multi-process에서는 문제가 안될까?

파일의 경우
file descriptor가 ref하고 있는 실제 open table 데이터에는 lock이 있어서 한번에 하나의 접근만 가능하도록 os가 관리함

메모리
Shared Memory, mmap 등 메모리를 공유하는 경우도 발생 가능