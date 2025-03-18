### Overview
유저에서 프로세스 관리, device 제어 등 기능을 수행할 때, System call을 사용하여 커널로 요청을 보낸다.
[[Kernel vs. User]]

이때 `Trap`이라는 software Interrupt을 걸어 진행중인 flow를 커널 mode로 변경한다.
kernel에서 작업이 끝나면 레지스터를 통해 return을 반환하고 user mode로 변경된다.

Pintos를 기준으로 system call을 알아본다.
### User Invoke
print와 같이 stdout으로 출력 또는 stdin 입력은 standard library 내부에서  `write` system call wrapper로 구현되어 있다.

해당 system call은 실제로 다음과 같은 어셈블리 코드로 구현된 매크로로 구현되어있다.

```C
#define syscall0(NUMBER) \

({ \

	int retval; \
	
	asm volatile \
	
		("pushl %[number]; int $0x30; addl $4, %%esp" \
		
			: "=a" (retval) \
			
			: [number] "i" (NUMBER) \
			
			: "memory"); \
	
	retval; \

})
```

1. Push system call number
2. Set parameter
3. Interrupt 0x30
4. Pop stack (revert stack pointer)

같은 매크로로 여러의 system call을 구분하기 위해 Number를 stack에 push하여 커널에서 읽도록 한다.

해당 예제는 parameter가 없는 매크로로, 아키텍처에 따라 calling convention에 따라 stack에 push 혹은 레지스터에 push하도록 한다. 

이후 interrupt을 발생시키는데, 커널 Interrupt handler에서 0x30 index에 해당하는 system call interrupt임을 나타낸다.

커널에서 작업이 끝나면 다시 해당 asm 코드로 flow가 넘어와 stack을 원래대로 돌려놓는다.

### Kernel Process
user에서 interrupt를 걸면 해당 index에 해당하는 handler가 호출된다.

```C
void exception_init(void)
{
   /* These exceptions can be raised explicitly by a user program,
      e.g. via the INT, INT3, INTO, and BOUND instructions.  Thus,
      we set DPL==3, meaning that user programs are allowed to
      invoke them via these instructions. */
   intr_register_int(3, 3, INTR_ON, kill, "#BP Breakpoint Exception");
   intr_register_int(4, 3, INTR_ON, kill, "#OF Overflow Exception");
   intr_register_int(5, 3, INTR_ON, kill,
                     "#BR BOUND Range Exceeded Exception");

   /* These exceptions have DPL==0, preventing user processes from
      invoking them via the INT instruction.  They can still be
      caused indirectly, e.g. #DE can be caused by dividing by
      0.  */
   intr_register_int(0, 0, INTR_ON, kill, "#DE Divide Error");
   intr_register_int(1, 0, INTR_ON, kill, "#DB Debug Exception");
   intr_register_int(6, 0, INTR_ON, kill, "#UD Invalid Opcode Exception");
   intr_register_int(7, 0, INTR_ON, kill,
                     "#NM Device Not Available Exception");
   intr_register_int(11, 0, INTR_ON, kill, "#NP Segment Not Present");
   intr_register_int(12, 0, INTR_ON, kill, "#SS Stack Fault Exception");
   intr_register_int(13, 0, INTR_ON, kill, "#GP General Protection Exception");
   intr_register_int(16, 0, INTR_ON, kill, "#MF x87 FPU Floating-Point Error");
   intr_register_int(19, 0, INTR_ON, kill,
                     "#XF SIMD Floating-Point Exception");

   /* Most exceptions can be handled with interrupts turned on.
      We need to disable interrupts for page faults because the
      fault address is stored in CR2 and needs to be preserved. */
   intr_register_int(14, 0, INTR_OFF, page_fault, "#PF Page-Fault Exception");
}

void syscall_init(void)
{
   intr_register_int(0x30, 3, INTR_ON, syscall_handler, "syscall");
}

```

커널 시작시에 위와 같은 interrupt과 handler가 등록된다. 이후 exception과 같은 예외상황에서 커널의 작업들이 수행되도록 한다. ex) page fault

user에서 `int $0x30` 을 호출하면 커널로 [[Context Switching]] 이 발생하고 syscall_handler가 호출된다.

#### Check User Pointer
system call에서는 주소값을 파라미터로 넘기는 경우가 있다. 해당 경우 kernel에서는 user에서 정상적인 값을 넘겼는지 확인해야한다.

유저 메모리 영역인지, read only segment에 write 시도했는지, valid한 page에 접근했는지 등등 확인하게 된다.

![[Pasted image 20240601170316.png]]

> [!NOTE] 왜  커널에서 확인해야할까?
> 각 process는 메모리를 모두 쓸 수 있음을 가정하고 각각의 프로세스들의 메모리 영역이 격리되어 있다. 때문에 프로그래머의 실수로 잘못된 주소값이 넘어가 다른 프로세스의 영역을 침범하거나 커널영역을 접근할 경우가 있다.
> kernel은 유저가 사용하는 메모리 영역(page)을 page table에 저장하고 이는 커널 메모리내 PCB에 저장하기에 커널에서 확인해주어야 한다.

#### Syscall Handler
handler가 호출되면 앞선 number를 확인하여 유저에서 요청한 작업을 처리해준다.

1. **프로세스 관리**:
    - 프로세스 생성 및 종료
    - 프로세스간 통신 (IPC)
    - 프로세스 스케줄링 및 관리
2. **파일 관리**:
    - 파일 생성, 삭제, 열기, 닫기
    - 파일 읽기 및 쓰기
    - 파일 속성 변경
3. **장치 관리**:
    - 하드웨어 장치 접근
    - 장치 드라이버와의 통신
    - 장치의 상태 관리
4. **메모리 관리**:
    - 메모리 할당 및 해제
    - 메모리 보호 및 접근 제어
    - 주소 변환
5. **입출력 관리**:
    - 다양한 입출력 장치를 통한 데이터 전송
    - 버퍼 관리, 스풀링


작업이 끝나면, eax 레지스터 return값을 저장하여 유저에 전달해준다.

### Application
prod 환경에서 system call이 호출되는 경우는 아래와 같다.

- 네트워크 통신
- 파일 입출력
- process, thread 관리

system call은 일반적인 instruction보다 커널로의 context switching 때문에 cost가 높다. 때문에 성능이 중요한 상황에서는 system call을 최대한 줄이는 게 좋다. 
#### Network 
보통의 웹서버는 [[HTTP]] 프로토콜을 활용하여 데이터를 송수신한다. 소켓관리 및 데이터 read, write를 시스템 콜을 통해서 진행한다.

#### IO
로그를 stdout으로 출력하거나 file로 저장할때, `write` 을 사용하게 된다. 때문에 너무 많은 로그 저장시에 io blcok되어 성능이 떨어질 수 있다.

DB의 경우 보통 웹서버와 분리되어 있고 network를 통해 웹서버와 통신하기에 Network, IO 두개의 과정에서 많은 System call이 사용된다.

웹서버 내부에서 DB에서 데이터를 조회, 수정 시에 해당 요청이 완료되까지 기다리기에 block되는 시간이 길어진다.
#### Manage Process, Thread
다수의 client의 요청을 처리할때, 병렬적으로 task를 처리하기 위해 웹서버들은 대부분 multi-thread(node) or multi-process(apache) 환경으로 구현되어 있다.
client의 요청이 올 때, thread, process pool을 미리 생성하여 처리할 수 있도록 한다. 
