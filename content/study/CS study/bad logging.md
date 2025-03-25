
PS 사이트(백준 or 프로그래머스) 에서 알고리즘의 효율성을 기준으로 점수를 매김

- **시간 복잡도** : 얼마나 적은 연산을 했나 (실행시간)
- **공간 복잡도** : 얼마나 적은 메모리를 사용했나

가끔 이런 상황이 생길 때가 있어요
### 문제 상황

```python
def solution(n, stations, w):
    answer = 0
    start = 1
    
    for station in stations:
        count = station - w - start
        if count > 0:
            answer += math.ceil(count / (2 * w + 1))
        start = station + w + 1
    
    if start <= n:
        count = n - start + 1
        answer += math.ceil(count / (2 * w + 1))
    
    return answer
```

디버깅을 위해 print 출력 코드를 남겨놓은 채로 답을 제출하면, 이런 결과를 확인하게 되는데
![[Pasted image 20250225001323.png]]

프로그래머스를 기준으로 좌측이 `실행시간`, 우측이 `메모리 사용량`을 의미

채점 환경마다 다를 수 있지만, 보통의 경우 실행시간을 통해 해당 모듈이 얼마나 효율적으로 작성되었는지를 판단


print 코드를 제거하고 다시 제출을 해보면 다음과 같음

![[Pasted image 20250225001339.png]]
### 결과

실행 시간이 절반 넘개 단축된 것을 확인할 수 있어요. 알고리즘을 변형한 것이 아니라 단순히 **print 하나만 없앴더니 이정도의 성능 향상을 이뤄낸거죠**

왜 이런 일이 일어난걸까요? 한번 하나하나 파헤쳐가 봅시다.
### 파이썬이 느려서 아닐까요?

들어본 말로는 "**파이썬은 다른 언어에 비해서 느리다**" 라고 들어본 것 같아요.
그럼 같은 로직을 훨씬 빠른 저수준 언어로 작성해볼까요?

```cpp
int solution(int n, vector<int> stations, int w)
{
    int answer = 0;
  
    int start = 1;
    for (int i = 0 ;i < stations.size() ; i++){
	    
        float count = stations[i] - start - w;
        if(count <= 0){
            start = stations[i] +w+1;
            continue;
        }
        cout << count;
            
        answer += ceil(count/(2*w+1));
        start = stations[i] +w+1;
    }
    cout << start <<endl;
    if(start <= n){
        float count = n - start+1;
        answer += ceil(count/(2*w+1));
    }


    return answer;
}
```

![[Pasted image 20250225002403.png]]

결과를 보면 오히려 **시간 초과가 발생**해 버리네요. 그렇다면 단순히 "**파이썬이 느려서**" 그런 것은 아닌 것 같아요.

#### Python Interpreter

실제로 Python의 구현체 중 가장 유명한 것은 **CPython**으로, 파이썬 코드를 실행하는 **인터프리터는 C로 작성**되어 있어요.


```c
builtin_print_impl(PyObject *module, PyObject *args, PyObject *sep,
                   PyObject *end, PyObject *file, int flush)
{
	// ...
	for (i = 0; i < PyTuple_GET_SIZE(args); i++) {
	        if (i > 0) {
	            if (sep == NULL) {
	                err = PyFile_WriteString(" ", file);
	            }
	            else {
	                err = PyFile_WriteObject(sep, file, Py_PRINT_RAW);
	            }
	            if (err) {
	                return NULL;
	            }
	        }
	        err = PyFile_WriteObject(PyTuple_GET_ITEM(args, i), file, Py_PRINT_RAW);
	        if (err) {
	            return NULL;
	        }
	    }
	}

```
https://github.com/python/cpython/blob/v3.11.2/Python/bltinmodule.c#L1986



```c
static Py_ssize_t
_Py_write_impl(int fd, const void *buf, size_t count, int gil_held)
{
	// ...
	if (gil_held) {
        do {
            Py_BEGIN_ALLOW_THREADS
            errno = 0;
#ifdef MS_WINDOWS
            // write() on a non-blocking pipe fails with ENOSPC on Windows if
            // the pipe lacks available space for the entire buffer.
            int c = (int)count;
            do {
                _doserrno = 0;
                n = write(fd, buf, c);
                if (n >= 0 || errno != ENOSPC || _doserrno != 0) {
                    break;
                }
                errno = EAGAIN;
                c /= 2;
            } while (c > 0);
#else
            n = write(fd, buf, count);
#endif
            /* save/restore errno because PyErr_CheckSignals()
             * and PyErr_SetFromErrno() can modify it */
            err = errno;
            Py_END_ALLOW_THREADS
        } while (n < 0 && err == EINTR &&
                !(async_err = PyErr_CheckSignals()));
    }

}

```

https://github.com/python/cpython/blob/main/Python/fileutils.c#L1934

때문에 실제 Python에서 호출된 `print()` 함수는 내부적으로 C의 `_Py_write_impl` 함수를 거쳐 `write` 함수를 통해 실행되게 됩니다!

![[Pasted image 20250325184651.png]]


### 출력 연산은 다른 연산보다 느린건가?

위에서 확인해본 바와 같이 실제로 Python이 실제로 C가 구현체인 `write`를 호출한다는 걸 알았어요. (cpp 코드 마찬가지)

그럼 `write` 함수는 왜 다른 연산과 다르게 느린건가요?

#### Sharing Resource

확인해보기에 앞서, 어떻게 **개별 프로세스에게 공유한 자원(파일, 메모리)에 접근 가능하도록 허용**할까요?

프로세스들은 실행 중에 **파일 또는 디바이스에 접근 시, 메모리를 우선적으로 참조해 접근**하게 돼요. 

**virtual memory layout**
![[Pasted image 20250302141721.png]]

다른 프로세스에 접근하지 못하도록 프로세스 별로 고유의 메모리 영역을 가지고 **잘못된 접근 시, page fault를 발생**시켜요.
(물론 정상적인 접근시에도 page fault가 발생할 수 있어요)

![[Pasted image 20250325142022.png]]
때문에 프로세스가 **자원을 점유중인지 판단, 할당하는 작업은 중앙의 커널이 모두 처리하고 있어요**

#### System call

각 프로세스들은 각각의 자원들(파일, 메모리, 디스크, 네트워크 ...)을 공유하면서도 다른 프로세스들의 정보는 모르기 때문에, **[[System Call]]을 사용하여 운영체제에게 확인 및 처리를 요청하게 돼요.**

우리가 익숙한 **출력창도 실제론 stdout이라는 파일**로, 우리가 실행하는 프로그램이 해당 파일에 쓰기를 진행하고, 파일에 써진 내용이 출력되는 거죠!

1. 프로세스 실행 시, system call
2. software interrupt(trap) 호출
3. 커널 모드로 권한 사승
4. 커널에서 요청한 작업 수행
5. 실행 중인 process의 context로 돌아와서 다음 instruction 실행 

#### Trap (software Interrupt)

시스템 콜 호출시, 프로세스 실행 중 커널 모드로 전환된다고 했는데, `Interrupt`을 통해 ISR로 등록된 system call handler를 호출하게 돼요.


Interrupt가 발생하게되면, CPU는 지금 진행중인 연산을 멈추고, 현재 상태를 Interrupt frame에 잠시 저장 후, handler를 우선적으로 처리해요

**Interrupt Overhead**
1. **인터럽트 발생**
    - 프로세스가 실행 중일 때, 인터럽트가 발생하면 CPU는 현재 수행 중인 연산을 멈추고 인터럽트 처리 루틴을 실행

2. **현재 상태 저장 (Interrupt Frame)**
    - CPU는 현재 상태를 **인터럽트 프레임**에 저장합니다. 이는 현재 작업 중인 프로세스의 상태(레지스터 값 등)를 포함
        
3. **인터럽트 서비스 루틴 (ISR) 호출**
    - 인터럽트가 발생하면, CPU는 해당 인터럽트를 처리하는 **인터럽트 서비스 루틴 (ISR)**을 실행
        
4. **instruction pipeline break **
    - CPU가 파이프라인을 사용하고 있다면, 인터럽트가 발생하면 현재 진행 중인 명령어들을 멈추고, 파이프라인이 깨짐. 이로 인해 실행 중인 명령어들을 다시 가져오고 실행해야 하므로 오버헤드가 발생
        
5. **인터럽트 프레임 메모리 저장**
    - 인터럽트가 발생하면, 레지스터 등의 상태를 메모리나 스택에 저장해야 하므로 메모리 접근이 추가
        
6. **핸들러 명령어 재실행**
    - 인터럽트가 처리되고 나면, 원래 실행하던 명령어를 다시 실행하거나, 새로 가져와서 처리해야 할 수도 있습니다. 이로 인해 추가적인 비용이 발생
    
7. **인터럽트 프레임 로딩**
    - ISR 실행 후, 원래 상태로 돌아가려면 인터럽트 프레임에서 저장된 상태를 로드해야 합니다. 이 과정 역시 시간이 걸리며, 인터럽트 처리에서 발생하는 추가 비용에 포함됩니다.

![[Pasted image 20250301195935.png]]

+ instruction당 fecthing, execute까지 필요한 cycle 단위 비교
+ Kernel call(system call)이 일반 연산보다 100배정도 큼

#### IO blocking
IO device 작업을 완료될까지 기다리는게 되는데, 이를 IO blocking이라고 해요.

CPU에서 코드가 실행되고 있는 도중에 IO 작업시에는 I/O bus를 타고 작업을 요청하고 해당 프로세스는 blocking(sleep) 상태에 빠지게 돼요. 

이후 I/O 작업이 완료되면, CPU로 Interrupt를 통해 해당 프로세스를 깨우게 되고, 다음 instruction을 수행하게 돼요.

![[Pasted image 20250301200836.png]]

![[Pasted image 20250301200117.png]]


![[Pasted image 20250325144836.png]]
### 문제 개선

#### 비동기처리
그렇다면 위와 같은 문제를 개선해봐요.
기존 작업이 아래와 같다면, IO 처리에 CPU는 놀고 있는 경우가 발생해요
![[Pasted image 20250301203936.png]]
IO 작업을 요청만 보내고 완료를 기다리지 않고 다음 작업을 처리한다면 
(IO response를 다음 로직에 사용하지 않는다면)

![[Pasted image 20250301204227.png]]
IO waiting 하는 시간에 다른 CPU job을 실행하며, 성능 개선을 이뤄낼 수 있지 않을까요?
이러한 방법을 non-blocking asynchronous라고 해요. 

#### 관련 키워드
- 파이썬 비동기처리 package
	- asyncio
	- uvloop
- coroutine


### 실제로 적용해볼까요?

#### 실험 세팅
docker-compose.yaml
```yaml
version: "3"

services:
  uvicorn_app:
    build: .
    ports:
      - "8000:8000"
    deploy:
      resources:
        limits:
          cpus: "0.5"       # 최대 0.5코어
          memory: "256M"    # 최대 256MB 메모리

```

`docker-compose --compatibility up --build -d`

main.py
```python
app = FastAPI()
# 동기 로깅 설정 (기본 logging 모듈 사용)
sync_logger = logging.getLogger("sync-logger")
sync_logger.setLevel(logging.INFO)

# 비동기 로거 설정 (aiologger 사용)
async_logger = AsyncLogger.with_default_handlers(name="async-logger",level=LogLevel.INFO)


@app.get("/sync")
def sync_endpoint():
    """동기 방식으로 로그 출력"""
    sync_logger.info(f"Sync log: {random.randint(0, 100)}")
    return {"message": "Synchronous logging to Elasticsearch complete"}

@app.get("/async")
async def async_endpoint():
    """비동기 방식으로 로그 출력"""
    async_logger.info(f"Async log: {random.randint(0, 100)}")
    return {"message": "Asynchronous logging to Elasticsearch complete"}

### raw한 로깅 endpoint
@app.get("/sync-raw")
def sync_raw_endpoint():
    """동기 방식으로 로그 출력 (sys.stdout.write 사용)"""
    sys.stdout.write(f"Sync log: {random.randint(0, 100)}\n")
    return {"message": "Synchronous logging to stdout complete"}

@app.get("/async-raw")
async def async_raw_endpoint():
    """비동기 방식으로 로그 출력 (sys.stdout.write 사용)"""
    async def write_log(buffer):
        sys.stdout.write(buffer)
        await asyncio.sleep(0)

    loop = events.get_running_loop()
    task = loop.create_task(write_log(f"Async log: {random.randint(0, 100)}\n"))
    
    return {"message": "Asynchronous logging to stdout complete"}

```

간단한 fastapi 서버를 만들어 보고 두가지 방식의 logger를 통해서 비교를 해봐요

####  부하테스트 
**Client Side** (apache benchmark)
```sh
~ ❯ ab -n 10000 -c 100 http://127.0.0.1:8000/sync
Percentage of the requests served within a certain time (ms)
  50%     92
  66%     94
  75%     96
  80%     97
  90%     99
  95%    101
  98%    104
  99%    107
 100%    159 (longest request)
```

```sh
~ ❯ ab -n 10000 -c 100 http://127.0.0.1:8000/async
Percentage of the requests served within a certain time (ms)
  50%     73
  66%     77
  75%     77
  80%     78
  90%     80
  95%     83
  98%     84
  99%     87
 100%     88 (longest request)
```


**Response time**
낮을수록 좋음

| Percentile | /sync  | /async | /async-raw | /sync-raw |
| :--------: | :----: | :----: | :--------: | :-------: |
|  **50%**   | 92 ms  | 73 ms  |   69 ms    |   91 ms   |
|  **66%**   | 94 ms  | 77 ms  |   75 ms    |   93 ms   |
|  **75%**   | 96 ms  | 77 ms  |   76 ms    |   94 ms   |
|  **80%**   | 97 ms  | 78 ms  |   76 ms    |   95 ms   |
|  **90%**   | 99 ms  | 80 ms  |   79 ms    |   98 ms   |
|  **95%**   | 101 ms | 83 ms  |   82 ms    |  102 ms   |
|  **98%**   | 104 ms | 84 ms  |   83 ms    |  106 ms   |
|  **99%**   | 107 ms | 87 ms  |   83 ms    |  109 ms   |
|  **100%**  | 159 ms | 88 ms  |   88 ms    |  162 ms   |

**Server Side**
Sync
![[Pasted image 20250302161652.png]]
Async
![[Pasted image 20250302161712.png]]



**cswch (context switch)**

**스스로 CPU 사용을 포기**(yield)하거나, 블로킹 연산을 호출하여 **자발적으로 CPU를 내놓는** 상황에서 발생

- **I/O 요청**(디스크, 네트워크 등)을 하여 프로세스가 “데이터가 도착할 때까지 기다린다”고 선언 → CPU를 내놓고 대기 상태로 전환
- **`sleep()`** 같은 시스템 호출로 의도적으로 기다림

| 실험군       | Count | Min    | P50    | P90    | P95    | P99    | Max    | Mean   |
| --------- | ----- | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| **sync**  | 80    | 248.51 | 580.00 | 700.00 | 745.00 | 813.50 | 853.00 | 577.95 |
| **async** | 52    | 0.00   | 0.00   | 1.98   | 2.44   | 4.98   | 6.00   | 0.44   |


**nvcswch (involuntary context switch)**

**운영체제의 스케줄러**가 **프로세스를 강제적으로** CPU에서 밀어내는 경우 발생
- **타임 슬라이스**(time slice, time quantum)가 끝나서 커널이 프로세스를 중단하고 다른 프로세스로 교체
- **더 높은 우선순위**를 가진 프로세스가 준비 상태가 되어, 현재 프로세스를 강제로 중단하고 CPU를 가져감 (preemption)
- **인터럽트**로 인해 커널이 현재 프로세스를 중지하고, 인터럽트 처리나 다른 작업을 우선 수행

| 실험군       | Count | Min  | P50   | P90   | P95    | P99    | Max   | Mean  |
| --------- | ----- | ---- | ----- | ----- | ------ | ------ | ----- | ----- |
| **sync**  | 80    | 4.00 | 10.00 | 94.00 | 100.00 | 129.00 | 175.0 | 34.53 |
| **async** | 52    | 7.00 | 14.00 | 15.00 | 15.45  | 16.00  | 16.00 | 13.90 |

#### 결과 분석

**SYNC**

-  **로그를 남길 때마다** 파일 I/O 또는 네트워크 I/O(예: 외부 로깅 시스템) **블로킹**이 발생
- 프로세스가 I/O가 끝날 때까지 **자발적(Voluntary)으로 CPU를 반환**하고 대기
- 따라서 “**자발적 컨텍스트 스위치(`cswch/s`)**” 횟수가 많이 증가
- 또한 로깅 시점에 잠시 멈춰야 하므로, **응답 처리**에도 지연이 생길 수 있음
- 프로세스가 로그 I/O 때문에 자주 멈춤 → 자발적 컨텍스트 스위치 급증
- 요청 처리에 지연이 생길 수 있고, 부하가 커질수록 병목이 심화

**ASYNC**

- 로깅이 별도 비동기 처리로 빠져, 본 로직(엔드포인트 처리) 입장에서는 I/O 대기가 최소화
- 높은 처리량(Throughput)과 낮은 응답 지연(Latency)을 기대할 수 있음
- 실제 측정에서도 자발적 CS가 거의 없고, CPU 스케줄러에 의한 강제 스위치만 발생


### 주절주절
#### CPU bound vs IO bound

I/O 작업 시에, context switching 비용 + I/O waiting이 발생하기에, 워크로드에서 어느 작업이 많이 차지하는지를 확인해야 해요.

만약 I/O waiting 시간이 짧은 워크로드의 경우, 비동기로 처리하면 오히려 불필요한 context switching 비용이 증가할 수 있어요.  
따라서 해당 워크로드가 **CPU-intensive**한지, **I/O-blocking**이 어느 정도 지연되는지를 판단할 수 있어야 해요.

#### 비동기는 만능일까?

비동기 처리가 마치 만능 해법처럼 보이지만, 실제로는 트레이드오프가 존재해요.

- **스레드**나 **이벤트 루프**를 잘못 관리하면, 의도치 않게 리소스를 잠식하거나 더 큰 병목을 일으키기도 해요.
- **I/O가 매우 빠르게 끝나는 작업**이라면, 비동기 오버헤드(태스크 전환, context switching) 때문에 성능이 오히려 떨어질 수 있어요.

결국 “비동기”가 항상 더 좋은 해법은 아니고, **업무 로직**과 **실제 I/O 특성**을 고려한 후 선택해야 해요.

#### print 외 IO 작업

- **네트워크 I/O (HTTP, 소켓, DB, 메시지 큐 등)**
- 파일 read, write(disk, [AWS EBS](https://planetscale.com/blog/io-devices-and-latency))
- 디바이스 I/O (직접 입력 장치, 센서, 시리얼 포트 등)
- 메모리 매핑 I/O (mmap 등)
- 스트리밍/파이프 I/O (대용량 미디어, IPC 등)
- 로그(Log) 출력 (파일, 스트림, 원격 전송 등)


이처럼 **다양한 I/O 시나리오**를 어떻게 처리하느냐에 따라, 애플리케이션 성능과 구조가 달라질 수 있어요.  
비동기 방식으로 옮겨간다고 해서 무조건 성능이 좋아지진 않으니, **워크로드 특성**을 파악한 뒤에 선택하는 게 중요해요.


### Python GIL
```c

#define Py_BEGIN_ALLOW_THREADS PyThreadState *_save; \
_save = PyEval_SaveThread();

#define Py_END_ALLOW_THREADS PyEval_RestoreThread(_save);

static Py_ssize_t
_Py_write_impl(int fd, const void *buf, size_t count, int gil_held)
{
	// ...
	if (gil_held) {
        do {
            Py_BEGIN_ALLOW_THREADS
            errno = 0;
#ifdef MS_WINDOWS
            // write() on a non-blocking pipe fails with ENOSPC on Windows if
            // the pipe lacks available space for the entire buffer.
            int c = (int)count;
            do {
                _doserrno = 0;
                n = write(fd, buf, c);
                if (n >= 0 || errno != ENOSPC || _doserrno != 0) {
                    break;
                }
                errno = EAGAIN;
                c /= 2;
            } while (c > 0);
#else
            n = write(fd, buf, count);
#endif
            /* save/restore errno because PyErr_CheckSignals()
             * and PyErr_SetFromErrno() can modify it */
            err = errno;
            Py_END_ALLOW_THREADS
        } while (n < 0 && err == EINTR &&
                !(async_err = PyErr_CheckSignals()));
    }

}

```
1. GIL 잡혀있는지에 확인
2. Save the thread state in a local variable.
3. Release the global interpreter lock.
4. blocking IO (write)
5. Reacquire the global interpreter lock.
6. Restore the thread state from the local variable.

https://docs.python.org/ko/3.13/c-api/init.html#releasing-the-gil-from-extension-code


