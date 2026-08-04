### ACME dns-01 

Let’s Encrypt는 도메인 소유권을 검증하기 위해 여러 인증 방식을 지원 
그중 **dns-01 challenge**는 다음 절차를 따름

![[Pasted image 20250614223808.png]]

1. 인증 서버가 무작위 토큰을 발급함
2. Certbot은 토큰과 계정 키를 조합해 CERTBOT_VALIDATION 값을 생성
3. 도메인의 _acme-challenge.example.com이라는 위치에 **TXT 레코드**를 등록
4. Let’s Encrypt 서버는 등록된 TXT 레코드를 DNS 쿼리를 통해 직접 조회하여, 해당 토큰 값이 정확히 존재하는지 확인
5. 성공 시 도메인 소유가 인증되고 인증서 발급이 진행

> “Wildcard certificates can only be requested via DNS challenge.”
> — [Let’s Encrypt FAQ](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge)

### 문제 상황  

이 방식은 도메인마다 고유한 CERTBOT_VALIDATION 값을 요구하지만,

`*.example.com`과 `example.com`의 dns-01 challenge는 **둘 다 동일한 TXT 레코드 이름을 사용**

- Certbot이 첫 번째 도메인 `*.example.com`을 인증하기 위해 TXT 레코드를 설정한 후,    
- 두 번째 도메인 `example.com`을 인증하면서 같은 위치의 TXT 레코드를 **덮어쓰게 됨**
- 이로 인해 첫 번째 도메인의 인증값이 사라져 실패하게 되었음

기존 스크립트
```bash
#!/bin/bash
# 현재 디렉토리를 workdir로 설정
workdir="$PWD"
echo "Working directory: $workdir"


# Certbot 갱신
echo "Renewing certificates..."

certbot certonly --non-interactive --quiet --manual \
--preferred-challenges dns \
--manual-auth-hook "$workdir/godaddy-dns-update.py" \
--manual-cleanup-hook 'rm -f /tmp/CERTBOT_VALIDATION' \
-d *.example.com -d example.com

```


```
Script started at: 2025-06-14 12:30:58
Working directory: /root/dns-update
Renewing certificates...
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Renewing an existing certificate for *.example.com and example.com
Encountered exception during recovery: KeyError: KeyAuthorizationAnnotatedChallenge(challb=ChallengeBody(chall=DNS01(token=b"..."), uri='https://acme-v02.api.letsencrypt.org/acme/chall/2315054967/536008867492/ZmF4mA', status=Status(pending), validated=None, error=None), domain='example.com', account_key=JWKRSA(key=<ComparableRSAKey(<cryptography.hazmat.backends.openssl.rsa._RSAPrivateKey object at 0x7d750c42d2e0>)>))
Exiting due to user request.
```

### 제약 조건

- Certbot의 공식 DNS 플러그인을 사용할 수 없는 환경이며, DNS는 GoDaddy를 통해 관리되고 있었기 때문에 `manual-auth-hook`과 `manual-cleanup-hook`을 직접 구현
- 인증서에는 반드시 다음 두 도메인을 포함
    - `*.example.com`
    - `example.com`
        
- 두 도메인은 모두 _acme-challenge.example.com 위치에 TXT 레코드를 작성
- 각각의 도메인 인증에 대해 다른 CERTBOT_VALIDATION 값이 주어졌으며, 이 값들을 동시에 DNS에 유지하지 않으면 인증 실패 발생
- 인증서 파일 경로는 기존 시스템과의 연동으로 인해 /etc/letsencrypt/live/example.com/으로 고정되어야 했고, 도메인별 인증서를 분리할 수 없는 상황

### 해결

기존 manual-auth-hook에서 TXT 레코드를 새로 덮어쓰는 방식 대신, **기존 값을 조회한 뒤 새롭게 받은 값을 함께 등록**하도록 변경함. 이를 통해 `*.example.com`과 `example.com`의 인증 값이 동시에 존재하도록 보장


```bash
#!/bin/bash

# 현재 디렉토리를 workdir로 설정 (절대 경로)
workdir="$(pwd)"
echo "Working directory: $workdir"

# Certbot 갱신
echo "Renewing certificates..."
certbot certonly \
  --manual \
  --preferred-challenges dns \
  --manual-auth-hook "$workdir/godaddy-dns-update.py" \
  --manual-cleanup-hook "$workdir/godaddy-dns-cleanup.py" \
  --non-interactive \
  --force-renewal \
  -d '*.example.com' -d example.com

# 종료 시각 출력
echo "Script ended at: $(date '+%Y-%m-%d %H:%M:%S')"
```
- hook 위치를 절대 경로로 지정해야 renew 시에 해당 위치를 찾음

dns record update
```python
# godaddy-dns-update.py
#!/usr/bin/env python3
import os
import time
import requests
import dns.resolver
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ["GODADDY_API_KEY"]
API_SECRET = os.environ["GODADDY_API_SECRET"]
DOMAIN = os.environ["CERTBOT_DOMAIN"] # pass by certbot manual hook
RECORD_NAME = "_acme-challenge"
VALIDATION = os.environ["CERTBOT_VALIDATION"]# pass by certbot manual hook
TTL = 600

def get_existing_txt_records():
    url = f"https://api.godaddy.com/v1/domains/{DOMAIN}/records/TXT/{RECORD_NAME}"
    headers = {"Authorization": f"sso-key {API_KEY}:{API_SECRET}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        return [r["data"] for r in resp.json()]
    return []

def update_txt_records(values):
    url = f"https://api.godaddy.com/v1/domains/{DOMAIN}/records/TXT/{RECORD_NAME}"
    headers = {
        "Authorization": f"sso-key {API_KEY}:{API_SECRET}",
        "Content-Type": "application/json"
    }
    data = [{"data": v, "ttl": TTL} for v in values]
    requests.put(url, headers=headers, json=data)

def wait_for_propagation(target):
    for i in range(20):
        try:
            result = dns.resolver.resolve(target, 'TXT')
            for rdata in result:
                if VALIDATION in rdata.to_text():
                    print(f"TXT record verified in DNS after {i * 10} seconds.")
                    return
        except Exception:
            pass
        print(f"Still waiting... {i * 10}s")
        time.sleep(10)
    raise RuntimeError("DNS propagation failed")

if __name__ == "__main__":
    target = f"{RECORD_NAME}.{DOMAIN}"
    print(f"TXT record set for {target} → {VALIDATION}")

    existing = get_existing_txt_records()
    if VALIDATION not in existing:
        existing.append(VALIDATION)

    update_txt_records(existing)
    print("Waiting for DNS to propagate...")
    wait_for_propagation(target)
```

- 기존 레코드를 가져와서 새 CERTBOT_VALIDATION 값을 **중복 없이 추가**
- 갱신 중인 도메인이 2개 이상이라도 레코드가 동시에 유효함
- wait_for_propagation() 함수에서 **20초 간격, 최대 200초 대기**하며 propagation 확인

```python
# godaddy-dns-cleanup.py
#!/usr/bin/env python3
import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ["GODADDY_API_KEY"]
API_SECRET = os.environ["GODADDY_API_SECRET"]
DOMAIN = os.environ["CERTBOT_DOMAIN"]
RECORD_NAME = "_acme-challenge"
VALUE_TO_REMOVE = os.environ["CERTBOT_VALIDATION"]

def get_existing_txt_records():
    url = f"https://api.godaddy.com/v1/domains/{DOMAIN}/records/TXT/{RECORD_NAME}"
    headers = {"Authorization": f"sso-key {API_KEY}:{API_SECRET}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        return [r["data"] for r in resp.json()]
    return []

def update_txt_records(values):
    url = f"https://api.godaddy.com/v1/domains/{DOMAIN}/records/TXT/{RECORD_NAME}"
    headers = {
        "Authorization": f"sso-key {API_KEY}:{API_SECRET}",
        "Content-Type": "application/json"
    }
    data = [{"data": v, "ttl": 600} for v in values]
    requests.put(url, headers=headers, json=data)

if __name__ == "__main__":
    existing = get_existing_txt_records()
    updated = [v for v in existing if v != VALUE_TO_REMOVE]
    update_txt_records(updated)
```
- 인증서가 발급된 이후, 인증에 사용했던 txt record를 삭제함



```bash
~/dns-update# ./update_certificate.sh
Script started at: 2025-06-14 12:32:24
Renewing certificates...
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Renewing an existing certificate for *.example.com and example.com
Hook '--manual-auth-hook' for example.com ran with output:
 TXT record set for _acme-challenge.example.com → DCsNlhX36mwzUrTPPFHGieT4P3uitA68kN9uYoIgNWg
 Waiting for DNS to propagate...
 Still waiting... 10s
 Still waiting... 20s
 Still waiting... 30s
 Still waiting... 40s
 TXT record verified in DNS after 40 seconds.

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/example.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/example.com/privkey.pem
This certificate expires on 2025-09-12.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
If you like Certbot, please consider supporting our work by:
 * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
 * Donating to EFF:                    https://eff.org/donate-le
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Script ended at: 2025-06-14 12:33:15
```

- 자동으로 renew cronjob 생성
```
/etc/letsencrypt/renewal/example.com.conf
# renew_before_expiry = 30 days
version = 2.9.0
archive_dir = /etc/letsencrypt/archive/example.com
cert = /etc/letsencrypt/live/example.com/cert.pem
privkey = /etc/letsencrypt/live/example.com/privkey.pem
chain = /etc/letsencrypt/live/example.com/chain.pem
fullchain = /etc/letsencrypt/live/example.com/fullchain.pem

# Options used in the renewal process
[renewalparams]
account = {acount}
pref_challs = dns-01,
authenticator = manual
server = https://acme-v02.api.letsencrypt.org/directory
key_type = ecdsa
manual_auth_hook = /{path}/godaddy-dns-update.py
manual_cleanup_hook = /{path}/godaddy-dns-cleanup.py
```

[source code repo](https://github.com/CSPCLAB/dns-update)