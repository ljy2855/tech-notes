
async io는 python 내에서 thread 기반 비동기 처리를 구현하는 라이브러리

파이썬은 기본적으로 single proccess, single thread이기 때문에 multi


```python
import asyncio

loop = asyncio.get_event_loop()
result = await loop.run_in_executor(None,fn,arg)
```







#### args vs params
Params





## 부록
### GPU job은 CPU job으로 보아야 하는가?
model training 혹은 inference의 경우 CPU 대신 GPU를 통해 처리 속도를 향상 시킬 수 있다.

non blocking job을 async io를 통해 cpu가 idle 상태인 것을 방지하여 성능의 이점을 얻을 수 있다면, GPU job도 같은 효과를 볼 수 있을 까?


