
2.6.23 커널 이전에 사용되던 O(1) scheduler(priority 기반 queue)들에서 CFS 스케줄러로 변경

## CFS scheduler

Completely Fair Scheduler

> “Ideal multi-tasking CPU” is a (non-existent :-)) CPU that has 100% physical power and which can run each task at precise equal speed, in parallel, each at 1/nr_running speed. For example: if there are 2 tasks running, then it runs each at 50% physical power --- i.e., actually in parallel.

이를 구현하기 위해 프로세스가 실행된 vruntime을 기준으로 모든 프로세스가 공평하게 CPU를 점유할 수 있도록 함.

- ready 상태의 가장 적은 vruntime을 가진 프로세스 실행
- 점유한 CPU time에 따라 vruntime 증가
- 이후 다음 vruntime을 


### RBtree

![[Pasted image 20250607161300.png]]

프로세스들은 vruntime에 따라 정렬된 상태를 유지하고, 가장 작은 vruntime인 프로세스 선택


- balanced tree로 프로세스가 많아져도 logN으로 선택가능
- 메모리 기반 자료구조로 빠른 탐색 가능


### 
convoy effect는 해결되었나?
