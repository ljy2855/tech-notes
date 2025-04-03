
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

- `uvloop` 라는 event loop을 쓰네?

### uvloop





### libuv
https://docs.libuv.org/en/v1.x/design.html
- Full-featured event loop backed by epoll, kqueue, IOCP, event ports.


#### epoll (kqueue, IOCP)



### Multi processing

###


#### loop create
```c
int uv__platform_loop_init(uv_loop_t* loop) {
  uv__loop_internal_fields_t* lfields;

  lfields = uv__get_internal_fields(loop);
  lfields->ctl.ringfd = -1;
  lfields->iou.ringfd = -2;  /* "uninitialized" */

  loop->inotify_watchers = NULL;
  loop->inotify_fd = -1;
  loop->backend_fd = epoll_create1(O_CLOEXEC);

  if (loop->backend_fd == -1)
    return UV__ERR(errno);

  uv__iou_init(loop->backend_fd, &lfields->ctl, 256, 0);

  return 0;
}

```


### 