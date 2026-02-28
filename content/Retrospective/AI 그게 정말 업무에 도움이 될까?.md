요즘 AI를 둘러싼 논의는 대체로 두 갈래다.

1. "정말 혁명이다"
2. "과장됐다"

둘 다 일부는 맞다.  


**1) 돈은 이미 크게 들어갔다**

- Stanford AI Index 2025에 따르면, 2024년 **기업 AI 투자 규모는 2,523억 달러**다.  
  민간투자는 전년 대비 **44.5% 증가**, 생성형 AI 민간투자는 **339억 달러**다.  
  ([Stanford HAI](https://hai.stanford.edu/ai-index/2025-ai-index-report/economy))

**2) 도입은 빠르지만, 전사 ROI는 아직 초기다**

- McKinsey 2025 설문에서 **88%**의 조직이 최소 1개 기능에서 AI를 사용 중이라고 답했다.
- 하지만 **약 2/3는 아직 전사 스케일 단계에 도달하지 못했다.**
- **39%만** 전사 EBIT 영향이 있다고 답했고, 그마저도 다수는 영향이 낮은 구간이다.
- AI 사용 조직의 **51%**는 최소 1건 이상의 부정적 결과를 경험했고, 그중 대표가 정확도 이슈였다.  
  ([McKinsey State of AI 2025](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai))

**3) 생산성 개선은 "특정 업무"에서 이미 관측된다**

- NBER(고객지원 5,179명) 연구: AI 도구 도입 후 평균 생산성 **+14%**, 저숙련/저경력 그룹은 **+34%**.  
  ([NBER w31161](https://www.nber.org/papers/w31161))
- NBER 2026 무작위 실험(1,174명): AI 사용 시 교육수준 간 생산성 격차가 **0.548 SD -> 0.139 SD**로 감소(약 3/4 축소).  
  ([NBER w34851](https://www.nber.org/papers/w34851))
- GitHub 실험(95명): Copilot 사용 그룹이 과제를 **55% 더 빠르게** 완료.  
  ([GitHub Research](https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/))

**4) "개발 직군에서 먼저 체감"되는 이유도 데이터와 맞아떨어진다**

- Anthropic Economic Index에 따르면 Claude 사용의 **37.2%**가 컴퓨터/수학(소프트웨어 포함) 직무에 집중되어 있다.
- 사용 형태도 완전 자동화보다 **증강(57%)**이 자동화(43%)보다 높다.  
  ([Anthropic Economic Index](https://www.anthropic.com/news/the-anthropic-economic-index))

**5) 고용은 "대체"보다 "재구성" 신호가 강하다**

- IMF: 전 세계 고용의 **약 40%**가 AI 영향권, 선진국은 **약 60%** 영향 가능성.  
  ([IMF Blog, 2024-01-14](https://www.imf.org/en/blogs/articles/2024/01/14/ai-will-transform-the-global-economy-lets-make-sure-it-benefits-humanity))
- WEF 2025: 2030년까지 **1억7천만 개 일자리 생성**, **9,200만 개 대체**, 순증 **7,800만 개** 전망.  
  ([WEF, 2025-01-08](https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/))
- IMF 2026: 선진국 채용공고의 **10%**가 최소 1개 신규 스킬을 요구하며, 신규 스킬 포함 공고는 임금 프리미엄이 관측된다.  
  ([IMF Blog, 2026-01-14](https://www.imf.org/en/blogs/articles/2026/01/14/new-skills-and-ai-are-reshaping-the-future-of-work))

**6) 인프라 제약(전력)은 실제 병목이 될 수 있다**

- IEA: 데이터센터 전력소비는 2024년 **약 415TWh(글로벌 전력의 1.5%)**.
- 같은 IEA 분석에서 2030년 **약 945TWh**로 2배 이상 증가 전망.  
  ([IEA Energy and AI](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai), [IEA News, 2025-04-10](https://www.iea.org/news/ai-is-set-to-drive-surging-electricity-demand-from-data-centres-while-offering-the-potential-to-transform-how-the-energy-sector-works))

---

### **일하면서 느낀 AI**

나는 IT 인프라 엔지니어링 영역에서 일하고 있다.  
실제 업무에서 AI를 붙여보면, 다음과 같은 생각이 든다.

- 아직은 AI도구들이 코딩외에 태스크에 많이 미성숙하다
- 특정 도메인에 맞게 본인이 AI와 기존 시스템을 통합하고 튜닝해야함
- 이부분은 AI가 발전한다고 해결되는 영역이 아님

AI는 지금 "사람을 통째로 대체"하기보다, "사람의 처리량과 속도를 끌어올리는 보조도구"로 가장 강하다.

**바로 효과가 나는 영역**

- 문서 요약/검색
- 초안 작성(가이드, 보고서, 커뮤니케이션)
- 반복 스크립트 작성
- 새로운 도메인 러닝 커브 단축

**아직 막히는 영역**

- 사내 컨텍스트 연결(보안/권한/내부 데이터)
- 실행 인터페이스(SSH, 사내망, 승인 프로세스)
- 정확도/책임성(할루시네이션, 감사 추적)

즉, 현재 시점의 현실적인 프레이밍은 이것이다.

> "대체 도구"가 아니라 "증강 도구"

**그래서 미래의 업무 Role은?**

미래에는 "누가 더 많이 직접 만들었는가"보다, 아래 역량이 더 중요해질 가능성이 높다.

- 문제를 구조화하는 능력
- AI 결과를 검증하고 리스크를 통제하는 능력
- 업무 컨텍스트(데이터/정책/권한)를 설계하는 능력

결국 승부는 "AI를 쓰느냐"가 아니라  
"AI를 업무 시스템 안에서 얼마나 신뢰 가능하게 굴리느냐"로 갈 것이다.


