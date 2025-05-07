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