
### Transaction

```sql
BEGIN;

UPDATE users SET point = point - 1000 WHERE id = 1;
INSERT INTO orders (user_id, amount) VALUES (1, 1000);
UPDATE products SET stock = stock - 1 WHERE id = 99;

COMMIT;

```

#### Atomic
- Transaction 내의 쿼리들이 모두 중간만 반영되지 않고 원자단위로 이루어짐
- 전부 롤백 or 완성
#### Consistency
- 

#### Isolation
- 동시에 수행되는 트랜잭션은 서로 간섭 없이 독립적으로 처리
- transaction마다 lock을 거는게 아니라 row별로 걸어서 동시에 처리해도 문제없게


**격리 단계**
Read Uncommitted	커밋 안 된 데이터도 읽음	Dirty Read 가능
Read Committed	커밋된 데이터만 읽음	Non-repeatable Read 가능 -> postgres
Repeatable Read	트랜잭션 동안 같은 쿼리는 동일 결과 보장	Phantom Read 가능 -> InnoDB
Serializable	가장 강력, 트랜잭션 간 완전 순차적 실행	없음 (성능↓)

#### Durability





#### 처리 순서


1. Undo에 이전 값 저장
2. Redo에 변경 내용 기록
3. 메모리에서 변경
4. 커밋
5. 나중에 실제 디스크 반영 (flush)
