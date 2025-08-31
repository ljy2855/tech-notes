---
Done: false
---

### 기술 문서 정리

```dataview
table replace(string(file.folder), "content/", "") as "category"

from "content"
where file.name != "index"
sort file.mtime desc
```
