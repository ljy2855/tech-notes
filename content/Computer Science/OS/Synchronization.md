
thread가 동시에 같은 resource(메모리 or file)에 접근할 때 발생하는 문제상황


이를 위해 동기화하는 과정이 필요함
#### Mutex
```c
struct mutex {
    atomic_t count;
    spinlock_t wait_lock;
    struct list_head wait_list;
    ...
};
```

atomic instruction
```c
int atomic_dec_if_positive(atomic_t *v) {
    int c, old;
    do {
        c = atomic_read(v);
        if (c <= 0)
            break;
        old = atomic_cmpxchg(v, c, c - 1);
    } while (old != c);
    return old;
}

```

- atomic_read : CAS 로 cpu가 실행하는 atomic한 instruction으로 사용

#### Semaphore

#### Counting Variables



multi-process에서는 문제가 안될까?

파일의 경우
file descriptor가 ref하고 있는 실제 open table 데이터에는 lock이 있어서 한번에 하나의 접근만 가능하도록 os가 관리함

메모리
Shared Memory, mmap 등 메모리를 공유하는 경우도 발생 가능