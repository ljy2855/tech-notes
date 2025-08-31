---
Done: false
---

### 기술 문서 정리

```dataview
table replace(string(file.folder), "content/", "") as "category"

from "content"

sort file.mtime desc
```


```base
filters:
  and:
    - file.ext == "md"
views:
  - type: table
    name: Table
    filters:
      and:
        - file.ext == "md"
    order:
      - file.name
      - file.folder
    sort:
      - property: file.mtime
        direction: DESC
  - type: table
    name: View
    order:
      - file.name
      - file.folder
    sort:
      - property: file.mtime
        direction: DESC
    columnSize:
      file.name: 369

```
