
fedora image 등록


### 문제 1. horizon https 

공인 IP로 HOST_IP를 등록해놓으면 외부에서 https 요청을 처리할때, CSRF 토큰 문제가 발생함 -> django wsgi 로 apache2로 배포중

