
### 배경
저번 세미나 리마인드 [[Bad logging]]

>  uvicorn이 request를 처리하는 방식(비동기) 때문에 해당 문제가 발생한게 아닌가여?


```python
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

```

### Uvicorn

#### starlette 

ASGI server를 구현하기 위한 프레임워크

```python
# starlette.routing
def request_response(
    func: typing.Callable[[Request], typing.Awaitable[Response] | Response],
) -> ASGIApp:
    """
    Takes a function or coroutine `func(request) -> response`,
    and returns an ASGI application.
    """
    f: typing.Callable[[Request], typing.Awaitable[Response]] = (
        func if is_async_callable(func) else functools.partial(run_in_threadpool, func)  # type:ignore
    )

    async def app(scope: Scope, receive: Receive, send: Send) -> None:
        request = Request(scope, receive, send)

        async def app(scope: Scope, receive: Receive, send: Send) -> None:
            response = await f(request)
            await response(scope, receive, send)

        await wrap_app_handling_exceptions(app, request)(scope, receive, send)

    return app
```

- async def가 아닌 일반 def는 thread connection pool에서 처리함
	- 이는 일반적인 wsgi app 처리 방식과 동일
	- tomcat or gunicorn

### uvloop

- asyncIO 와 event loop을 통해 비동기 처리를 구현한 것은 동일
	- 다만 Python으로 구현된 AsyncIO와 달리 Cython으로 구현됌 -> 성능 굳
	- 



### libuv
https://docs.libuv.org/en/v1.x/design.html
- Full-featured event loop backed by epoll, kqueue, IOCP, event ports.


![[Pasted image 20250404021610.png]]

- 요놈이 nodejs 

#### multiplexing I/O




#### epoll (kqueue, IOCP)



---
#### Java 진영은?

#### Tomcat vs Netty
