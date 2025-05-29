
### Ext3







![[Pasted image 20250416161338.png]]


#### Ext4
linux 커널에서 가장 많이 사용되는 파일시스템

Extent tree vs Indirect
![[Pasted image 20250416161017.png]]

### Performance

Disk의 read, write는 굉장히 느리기 때문에 어떻게 성능을 향상시킬까?

- Disk cache : 자주 접근하는 block의 정보를 memory에 cache함
- asynchronous write : write 즉시 disk에 쓰는게 아니라 버퍼에 있다가 flush 시킴
- Improve PC performance by using virtual disk, or RAM disk.
