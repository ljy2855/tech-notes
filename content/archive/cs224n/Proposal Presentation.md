### Goals
- The main goal of this project is to understand the mechanism of recent large language models and related tasks. Then, formalize your own research questions and conduct experiments.
- There are _**two types**_ of project tracks:
    - **Undergraduate track**
        - This track for those who are taking _CSEG321_
        - You will firstly train GPT-2 by yourself based on given skeleton codes.
        - Additionally, you will set your own research questions or downstream tasks with different datasets, and then explore it.

- **Step 1. Train GPT-2 by your own hands.**
    - In this project, **students implement parts of the GPT-2 architecture and use it to tackle 3 downstream tasks**. Similar to previous years, the code is in PyTorch.
        
        - The three downstream tasks: Sentiment Analysis, Paraphrase Detection, and Sonnet Generation.
    - Please refer the document `CS224n: Default Final Project: Build GPT-2`
        
        [CS_224n__Default_Final_Project__Build_GPT_2.pdf](attachment:f80f876c-70e1-4d2d-8d5b-0ababcb6a467:CS_224n__Default_Final_Project__Build_GPT_2.pdf)
        
        [https://web.stanford.edu/class/cs224n/project_w25/CS_224n__Default_Final_Project__Build_GPT_2.pdf](https://web.stanford.edu/class/cs224n/project_w25/CS_224n__Default_Final_Project__Build_GPT_2.pdf)
        
    - The skeleton code is given at [https://github.com/cfifty/public_cs224n_gpt](https://github.com/cfifty/public_cs224n_gpt)
        
        - Clone the project GitHub repository and implement it with own your hands.
        - _There are several empty sections that need to be completed._
    - As for the GPU machines,
        
        - Please use Colab or Google Cloud Platform.
            - If you need additional help, please contact TAs.
        - Develop your code your local machine, using PyTorch without GPUs, and move to your Colab or GCP only after you’ve debugged your code and are ready to train. You can use a private GitHub repository to manage your codebase and sync files between the machines and teammates.
    
- **Step 2. Additionally, you will set your own research questions or downstream tasks with different datasets, and then explore it.**
    - You can set small research questions, but let’s do creative and critical thinking!
    - What is your hypothesis? And how will you set up the experiment setting to show your hypothesis?
    - It’s okay if you fail to verify it. If your results does not look good, then let’s find the reasons.
    - Some example research questions:
        - How to improve the downstream task performance?
        - How to extend Korean downstream tasks?
        - Please also refer to Sec 7.4 of the above instruction document and discussion questions in our class.

## 5-minute Team Presentations

Each team should include the following **4 components** in their proposal presentation:

1. **Problem Statement**
    - What is the problem you're trying to solve?
    - Why is this problem important? (real-world application, social value, etc.)
2. **Proposed Approach**
    - What is your strategy to solve the problem?
    - Which model, technique, or methodology will you use?
3. **Data & Resources**
    - What dataset will you use?
    - Any plans for data collection or preprocessing?
4. **Execution Plan & Expected Outcomes**
    - Key milestones, task distribution, and timeline
    - What are your expected outcomes?
    - How will you measure success?

### Evaluation Criteria

Based on a 10-point scale (weights can be adjusted):

| Criteria                      | Description                                                               | Points |
| ----------------------------- | ------------------------------------------------------------------------- | ------ |
| Clarity of Problem Definition | Is the problem well-defined and relevant?                                 | 2 pts  |
| Appropriateness & Creativity  | Is the proposed approach suitable and does it show creativity?            | 3 pts  |
| Feasibility                   | Is the project feasible given the timeframe, team, and data availability? | 2 pts  |
| Presentation Quality          | Is the presentation clear, within the time limit, and well-structured?    | 2 pts  |
| Outcome & Evaluation Plan     | Are the expected results and evaluation methods clearly stated?           | 1 pt   |

---


# CS224n Project Proposal: [Your Team Name or Creative Project Subtitle]

---

## Slide 1: Title Slide

**(Approx. 15 seconds)**

*   **Project Title:** Robust Intent Classification for **Short User Queries** Using Our Implemented GPT-2
    *   *(Alternative: GPT-2 for Understanding **Concise User Intents**) *
*   **Team:** [Your Team Name / Member Names]
*   **Course:** CS224n (CSEG321 Affiliated)
*   **Date:** [Presentation Date]

---

## Slide 2: Project Overview & Motivation

**(Approx. 45 seconds)**

*   **Our Project Journey (Two-Fold Mission):**
    1.  **Foundation (CS224n Core):**
        *   Implement GPT-2 from scratch based on the provided skeleton code.
        *   Understand the model by tackling 3 default tasks (Sentiment Analysis, Paraphrase Detection, Sonnet Generation).
    2.  **Research Exploration (Our Focus):**
        *   Leverage our implemented GPT-2 to improve **Intent Classification specifically for Short User Queries**.
*   **Why is this Project Important? (Motivation):**
    *   In real-world interactions, users often use **very brief, concise queries** (e.g., voice commands, quick mobile searches).
    *   These **short utterances** often lack explicit contextual cues, making intent recognition challenging.
    *   **Our Goal:** To investigate if our self-implemented GPT-2 can effectively and robustly understand user intent even from these **short, potentially ambiguous inputs**.

---

## Slide 3: Problem Statement - The Challenge of Short User Queries

**(Approx. 60 seconds)**

*   **What is Query Intent Classification?**
    *   Identifying the user's goal or purpose from their text input.
    *   (e.g., "Weather today?" → Informational Intent)
    *   Crucial for chatbots, virtual assistants, search engines.
*   **The Core Challenge: Ambiguity and Context Scarcity in Short Queries**
    *   Many real-world user inputs are **terse and lack rich context**.
        *   Examples: "Pizza places?", "Timer 10 min", "Next song".
    *   This brevity can lead to **ambiguity**, making it difficult for models to accurately determine the user's true intent.
    *   Poor understanding of short queries leads to frustrating user experiences.
*   **Our Research Focus: Enhancing GPT-2's Understanding of Short Utterances**
    *   How well can a sophisticated model like GPT-2, which we will implement, capture the underlying intent from minimal textual input?
    *   **Significance:**
        *   Improves **real-world usability** of AI systems (especially voice assistants, on-the-go searches).
        *   Enhances model **robustness** to varied input lengths.
        *   Contributes to a more **natural and efficient human-computer interaction**.

---

## Slide 4: Proposed Approach - Tackling Short Queries with Our GPT-2

**(Approx. 75 seconds)**

*   **Core Idea:** Fine-tune **our self-implemented GPT-2** to specialize in, or at least perform robustly on, intent classification for short user queries.
*   **Our Research Question:**
    > How effectively can our self-implemented GPT-2, when fine-tuned on the MASSIVE dataset (containing queries of varying lengths), discern user intent from **short utterances** (e.g., queries with N or fewer tokens) compared to longer, more explicit queries?
*   **Hypothesis:**
    > GPT-2's pre-trained ability to capture nuanced semantic meaning, even from limited surface-level context (which we'll understand deeply through implementation), will allow it to perform robustly on short query intent classification, potentially outperforming simpler baselines or showing specific strengths/weaknesses.
*   **Methodology:**
    1.  **Base Model:** Our **self-implemented GPT-2 model** (Outcome of CS224n Step 1).
    2.  **Dataset & Focus:**
        *   Utilize the `SetFit/amazon_massive_intent_en-US` dataset.
        *   **Primary Analysis on Short Queries:**
            *   Define "short query" (e.g., based on token count percentile or a fixed threshold N).
            *   Segment the test set into "short queries" and "longer queries" for comparative evaluation.
    3.  **Model Training:**
        *   Fine-tune our GPT-2 on the **full training set** from MASSIVE (to learn from diverse examples).
    4.  **Evaluation Strategy:**
        *   Evaluate performance (Accuracy, F1-Score) on:
            *   The standard (full) test set.
            *   The **dedicated subset of short queries**.
            *   The subset of longer queries (for comparison).
    5.  **(If time permits) Further Exploration:**
        *   Analyze common error types specifically for short queries.
        *   Investigate if specific fine-tuning tweaks (e.g., oversampling short examples if a clear imbalance exists and is detrimental) could improve performance on short queries.

---

## Slide 5: Data & Resources

**(Approx. 30 seconds)**

*   **Primary Dataset:**
    *   `SetFit/amazon_massive_intent_en-US` (English subset of the MASSIVE dataset).
        *   Contains user queries of varying lengths and their intent labels.
*   **Data Preprocessing & Setup for Analysis:**
    *   Standard tokenization for our GPT-2.
    *   **Segmentation of test data by query length** (e.g., identify queries <= N tokens).
*   **Resources to be Used:**
    *   **Codebase:** Our self-implemented GPT-2 (based on CS224n skeleton).
    *   **Libraries:** PyTorch, Hugging Face `datasets` (for dataset loading & manipulation).
    *   **Compute:** Google Colab (with GPU support).

---

## Slide 6: Execution Plan & Expected Outcomes

**(Approx. 60 seconds)**

*   **Execution Plan (Key Milestones):**
    *   **Phase 1 (GPT-2 Implementation & Base Tasks):**
        *   Weeks 1-X: Implement GPT-2 core components; debug.
        *   Weeks X-Y: Train/evaluate on 3 default downstream tasks.
    *   **Phase 2 (Short Query Intent Classification Research):**
        *   Week Y+1: Preprocess MASSIVE dataset; define and implement short query segmentation logic.
        *   Week Y+2: Fine-tune our GPT-2 on the full dataset; conduct initial evaluation on full and segmented test sets.
        *   Week Y+3: Systematic performance analysis (short vs. long queries); error analysis for short queries.
        *   Week Y+4: Finalize analysis, document insights, prepare report & presentation.
*   **Expected Outcomes:**
    1.  A functional, self-implemented GPT-2 model demonstrating reasonable performance on default tasks.
    2.  Quantitative comparison of our GPT-2's intent classification performance on **short queries versus longer queries** from the MASSIVE dataset.
    3.  Insights into the types of short queries where GPT-2 excels or struggles.
    4.  A better understanding of GPT-2's robustness to variations in query length for this task.
*   **Measuring Success (for Short Query Analysis):**
    *   Accuracy & Macro F1-Score, compared between short query subset, long query subset, and the full test set.
    *   Qualitative analysis of misclassifications on short queries.

---

## Slide 7: Q&A

**(Approx. 15 seconds)**

*   **Thank You!**
*   **Questions?**

---


**Slide 1: Title Slide**

- **Title:** Robust Intent Classification for Short User Queries with Our GPT-2
    
- **Team:** [Team Name/Members]
    
- **Course:** CS224n (CSEG321)
    
- **Date:** [Date]
    

---

**Slide 2: Project Overview & Motivation**

- **Our Mission (2-Part):**
    
    1. **Build GPT-2:** Implement from scratch (CS224n Core).
        
    2. **Our Research:** Use our GPT-2 for **Short Query Intent Classification**.
        
- **Why Short Queries Matter?**
    
    - Users often use **brief, concise inputs**.
        
    - Short queries are **ambiguous**, hard for models.
        
    - **Goal:** Test our GPT-2's ability to understand these short, tricky inputs.
        

---

**Slide 3: Problem: The Challenge of Short User Queries**

- **Intent Classification:** Understanding user's goal from text.
    
- **The Problem:** Users type **short, context-poor queries** (e.g., "Weather?", "Pizza nearby").
    
    - This leads to **ambiguity** & misinterpretation by AI.
        
    - Results in poor user experience.
        
- **Our Focus:** Can our GPT-2 overcome this ambiguity in short queries?
    
- **Significance:** Better real-world AI, robust models, improved user interaction.
    

---

**Slide 4: Proposed Approach: Our GPT-2 for Short Queries**

- **Core Idea:** Fine-tune **our self-built GPT-2** to robustly handle short queries.
    
- **Research Question:**
    
    - How well does our GPT-2 classify intent for **short queries** vs. longer ones on the MASSIVE dataset?
        
- **Hypothesis:**
    
    - Our GPT-2's deep semantic understanding (gained via implementation) will enable strong performance on short, ambiguous queries.
        
- **Methodology:**
    
    1. **Model:** Our implemented GPT-2.
        
    2. **Data:** MASSIVE dataset.
        
    3. **Focus:** Analyze performance specifically on **short query subset** of test data.
        
    4. **Training:** Fine-tune on full MASSIVE training set.
        
    5. **Evaluation:** Compare Accuracy/F1 on short vs. long query test subsets.
        

---

**Slide 5: Data & Resources**

- **Dataset:** SetFit/amazon_massive_intent_en-US.
    
    - User queries of varying lengths.
        
- **Data Setup:**
    
    - Standard tokenization.
        
    - **Segment test data by query length** (short vs. long).
        
- **Resources:**
    
    - **Our GPT-2 Codebase** (CS224n skeleton).
        
    - PyTorch, Hugging Face datasets.
        
    - Google Colab (GPU).
        

---

**Slide 6: Execution Plan & Expected Outcomes**

- **Execution Plan:**
    
    - **Phase 1 (Weeks 1-Y):** Implement GPT-2 & default tasks.
        
    - **Phase 2 (Weeks Y+1 - End):**
        
        - MASSIVE data prep & short query segmentation.
            
        - Fine-tune & evaluate (full & segmented test sets).
            
        - Analyze short query performance, errors.
            
        - Report & presentation.
            
- **Expected Outcomes:**
    
    1. Working self-implemented GPT-2.
        
    2. **Performance comparison:** Short vs. long queries for our GPT-2.
        
    3. Insights: Where GPT-2 excels/struggles with short queries.
        
- **Measuring Success:**
    
    - Accuracy & F1-score on short vs. long query subsets.
        
    - Qualitative error analysis for short queries.
        

---

**Slide 7: Q&A**

- **Thank You!**
    
- **Questions?**




### Script

---

**Slide 1: Title Slide** (약 15초)

*   "저희 프로젝트의 제목은 'Robust **Intent Classification** for Short User Queries Using Our Implemented GPT-2'입니다."

---

**Slide 2: Project Overview & Motivation** (약 45초)

*   "저희 프로젝트는 두 가지 주요 목표를 가지고 진행됩니다. 첫 번째는 CS224n 수업의 핵심 과제로, GPT-2 모델을 직접 구현하고 기본적인 **NLP tasks** (과제들)를 수행하며 모델의 내부 동작을 이해하는 것입니다."
*   "두 번째는 이렇게 구현한 저희의 GPT-2 모델을 활용하여, 특히 'Short User Queries', 즉 짧은 사용자 쿼리에 대한 **Intent Classification** 성능을 집중적으로 탐구하는 것입니다."
*   "그렇다면 왜 Short Queries가 중요할까요? 실제 사용 환경에서 사용자들은 매우 짧고 간결한 형태로 질문이나 명령을 입력하는 경우가 많습니다. 하지만 이러한 짧은 **utterances** (발화)는 **contextual information** (문맥 정보)이 부족하여 모델이 의도를 파악하기 어렵고, 이는 사용자 경험 저하로 이어질 수 있습니다."
*   "따라서 저희의 최종 목표는, 직접 구현한 GPT-2가 이렇게 까다로운 Short Inputs, 짧은 입력 속에서도 사용자의 **intent** (의도)를 얼마나 정확하게 이해할 수 있는지 테스트하고 분석하는 것입니다."

---

**Slide 3: Problem: The Challenge of Short User Queries** (약 60초)

*   "먼저 **Intent Classification**이란, 보시는 바와 같이 사용자의 입력 텍스트로부터 그 목표나 의도를 파악하는 핵심적인 **NLP** 기술입니다."
*   "하지만 여기서 발생하는 주요 문제는 바로 'Short User Queries'입니다. 사용자들은 '오늘 날씨?'나 '피자 찾아줘'처럼 매우 짧고 **context-poor queries** (문맥 정보가 부족한 쿼리) 형태로 질문하는 경우가 많습니다."
*   "이러한 Short Queries는 다양한 의미로 해석될 수 있는 **ambiguity** (모호성)를 내포하고 있어, AI 모델이 사용자의 진짜 의도를 잘못 해석할 가능성이 큽니다. 이는 결국 부정확한 응답이나 서비스로 이어져 사용자 경험을 해치게 됩니다."
*   "그래서 저희는 '과연 우리가 구현할 GPT-2 모델이 이러한 Short Query의 **ambiguity**를 극복하고 정확한 **intent**를 파악할 수 있을까?'라는 질문에 집중하고자 합니다."
*   "이 문제를 해결하는 것은 실제 AI 서비스의 사용성을 크게 향상시키고, 다양한 입력 길이에 대해 모델이 **robust** (강인하게)하게 작동하도록 하며, 궁극적으로 더 자연스러운 **Human-Computer Interaction**을 가능하게 할 것입니다."

---

**Slide 4: Proposed Approach: Our GPT-2 for Short Queries** (약 75초)

*   "이러한 문제를 해결하기 위한 저희의 핵심 아이디어는, 저희가 직접 구현한 GPT-2 모델을 활용하여 Short User Queries에 대한 **Intent Classification**을 수행하고 그 성능을 면밀히 분석하는 것입니다."
*   "구체적인 **Research Question**은 '우리가 직접 구현한 GPT-2 모델이, 다양한 길이의 쿼리를 포함하는 MASSIVE 데이터셋으로 학습했을 때, 특히 Short Queries에 대해서는 Long Queries와 비교하여 얼마나 효과적으로 **intent**를 분류할 수 있는가?' 입니다."
*   "저희의 **Hypothesis** (가설)는 이렇습니다: GPT-2는 **pre-training** (사전 학습)을 통해 깊이 있는 **semantic understanding** (문맥적 의미 이해) 능력을 갖추고 있으며, 저희가 직접 구현하는 과정을 통해 이 능력을 더 깊이 이해하게 될 것입니다. 이러한 이해를 바탕으로, 표면적인 정보가 부족한 Short, Ambiguous Queries에 대해서도 강력한 성능을 보일 것이라고 예상합니다."
*   "이를 검증하기 위한 **Methodology** (방법론)는 다음과 같습니다. 첫째, 저희 팀이 CS224n 스켈레톤 코드를 기반으로 GPT-2 모델을 직접 구현합니다. 둘째, 공개된 MASSIVE 데이터셋을 사용하되, 특히 **test phase** (테스트 단계)에서 쿼리 길이를 기준으로 'Short Queries'와 'Long Queries' 그룹으로 나누어 분석할 것입니다. 셋째, 모델은 전체 **training dataset** (학습 데이터셋)으로 **fine-tuning** (미세 조정)합니다. 마지막으로, 전체 테스트셋뿐만 아니라, 분할된 Short Query 및 Long Query 테스트셋 각각에 대해 **Accuracy**와 **F1-Score**를 측정하여 성능을 비교 분석할 계획입니다."
*   "(만약 시간이 허락한다면, Short Queries에서 자주 발생하는 **error types** (오류 유형)을 분석하거나, **data augmentation** (데이터 증강) 또는 Short Query 예시를 학습 시 더 강조하는 **oversampling** 같은 추가적인 실험도 고려하고 있습니다.)"

---

**Slide 5: Data & Resources** (약 30초)

*   "저희 연구에 사용할 주요 **Dataset**은 SetFit에서 제공하는 'amazon_massive_intent_en-US' 입니다. 이 데이터셋은 보시는 바와 같이 다양한 길이의 실제 사용자 질의와 해당 **intent labels** (의도 레이블)을 포함하고 있습니다."
*   "**Data Preprocessing** (데이터 전처리) 및 분석을 위해서는, 먼저 저희가 구현할 GPT-2에 적합한 표준적인 방식으로 텍스트를 **tokenization** (토큰화)할 것입니다. 그리고 가장 중요한 부분으로, 테스트 데이터를 쿼리 길이에 따라 'Short'와 'Long'으로 명확히 **segmentation** (분할)하여 분석할 준비를 할 것입니다."
*   "활용할 주요 **Resources**는 저희가 직접 작성할 GPT-2 Codebase, PyTorch와 Hugging Face `datasets` 라이브러리, 그리고 GPU 지원이 가능한 Google Colab 환경입니다."

---

**Slide 6: Execution Plan & Expected Outcomes** (약 60초)

*   "저희 프로젝트 실행 계획은 크게 두 단계로 나뉩니다. 첫 번째 단계는 약 1-2주 동안 GPT-2의 핵심 구성요소를 구현하고, 주어진 3가지 기본 **NLP tasks**를 수행하는 것입니다."
*   "두 번째 단계는 약 3-4주차에 MASSIVE 데이터셋을 준비하고 Short Query **segmentation logic** (분할 로직)을 구현합니다. 이후 저희가 구현한 GPT-2 모델을 전체 데이터셋으로 **fine-tuning**하고, 전체 및 분할된 테스트셋에 대한 초기 **evaluation** (평가)을 진행합니다. 
* 마지막 5주차에는 Short Queries와 Long Queries 간의 성능을 체계적으로 비교 분석하고, 특히 Short Queries에서 발생하는 **errors** (오류)를 심층적으로 분석하여 최종 보고서와 발표를 준비할 예정입니다."
*   "이를 통해 저희는 첫째, 성공적으로 작동하는 자체 구현 GPT-2 모델을 확보하고, 둘째, 이 모델이 Short Queries와 Long Queries에 대해 어떤 성능 차이를 보이는지에 대한 정량적인 비교 결과를 얻을 수 있을 것으로 기대합니다. 마지막으로, 어떤 유형의 Short Queries에서 GPT-2가 강점을 보이거나 어려움을 겪는지에 대한 **insights** (통찰)를 얻을 수 있을 것입니다."
*   "저희 연구의 성공 여부는 주로 Short Query **subset** (부분집합)과 Long Query **subset**, 그리고 전체 테스트셋에서의 **Accuracy** 및 **F1-Score**를 비교하여 측정할 것이며, Short Queries에 대한 **qualitative error analysis** (정성적 오류 분석) 또한 중요한 평가 기준이 될 것입니다."

---

**Slide 7: Q&A** (약 15초)

*   "지금까지 저희 프로젝트 제안 발표를 들어주셔서 감사합니다."
*   "**Questions?** (질문 있으시면 편하게 해주시기 바랍니다.)"

---

**발표 후 질의응답 예상 질문 및 답변 준비 (영어 용어 사용):**

*   Q: How will you define the threshold for "Short Queries"?
    *   A: We plan to first analyze the overall query length distribution in the dataset. Then, we'll set a threshold based on statistical criteria (e.g., bottom 25th percentile) or a fixed number of **tokens** (e.g., 5 or fewer). We will explore to find an appropriate threshold during our experiments.
*   Q: Don't large models like GPT-4 already handle short queries well?
    *   A: That's a great point. While large models like GPT-4, potentially using architectures like **Mixture of Experts (MoE)**, might implicitly handle various input types, our project focuses on understanding the mechanisms of a model we implement ourselves – GPT-2. We aim to explicitly evaluate its performance on a defined **Intent Classification task**, specifically under the challenging condition of "Short Queries," and quantify this robustness. This is a different dimension of exploration compared to the general capabilities of massive, black-box models.
*   Q: Do you have specific methodologies to improve performance on short queries?
    *   A: For this proposal, our primary focus is on the analysis and understanding of GPT-2's performance on short queries. However, if time and resources permit, we could explore additional techniques such as **data augmentation** for short queries or **oversampling** them during training. But the main goal for this project is in-depth analysis.
