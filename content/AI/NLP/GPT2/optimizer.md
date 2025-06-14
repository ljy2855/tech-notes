
### 1.4 AdamW Optimizer 구현

```python

class AdamW(Optimizer):

def __init__(self, params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8, weight_decay=0.01):

defaults = dict(lr=lr, betas=betas, eps=eps, weight_decay=weight_decay)

super().__init__(params, defaults)

  

def step(self):

for group in self.param_groups:

for p in group['params']:

if p.grad is None:

continue

# 1. State 초기화

state = self.state[p]

if len(state) == 0:

state['step'] = 0

state['exp_avg'] = torch.zeros_like(p.data)

state['exp_avg_sq'] = torch.zeros_like(p.data)

  

# 2. Hyperparameter 설정

beta1, beta2 = group['betas']

state['step'] += 1

bias_correction1 = 1 - beta1 ** state['step']

bias_correction2 = 1 - beta2 ** state['step']

  

# 3. Momentum과 Velocity 계산

exp_avg, exp_avg_sq = state['exp_avg'], state['exp_avg_sq']

exp_avg.mul_(beta1).add_(p.grad, alpha=1 - beta1)

exp_avg_sq.mul_(beta2).addcmul_(p.grad, p.grad, value=1 - beta2)

  

# 4. Bias Correction

denom = (exp_avg_sq.sqrt() / math.sqrt(bias_correction2)).add_(group['eps'])

step_size = group['lr'] / bias_correction1

  

# 5. Parameter Update

p.data.addcdiv_(exp_avg, denom, value=-step_size)

  

# 6. Weight Decay 적용

if group['weight_decay'] > 0.0:

p.data.add_(p.data, alpha=-group['lr'] * group['weight_decay'])

```

  

#### 구현 특징

- **State 관리**: 각 파라미터별로 momentum과 velocity를 독립적으로 관리

- **Momentum 계산**: First moment (momentum)와 second moment (velocity) 계산

- **Bias Correction**: 초기 학습 단계에서의 편향을 보정

- **Weight Decay**: L2 regularization을 위한 weight decay 적용

- **In-place 연산**: 메모리 효율성을 위한 in-place 연산 사용

  

## 2. Basic Downstream Tasks

  

### 2.1 Performance Evaluation

다음 세 가지 기본적인 NLP 태스크에 대해 모델의 성능을 평가함:

  

| Task | Dataset | Performance |
|------|---------|-------------|
| Sentiment Analysis | SST (5-class) | 51.3% accuracy |
| | CFIMDB (binary) | 97.6% accuracy |
| Paraphrase Detection | Quora Question Pairs | 75.2% accuracy |
| Sonnet Generation | Shakespeare Sonnets | CHRF: 0.68 |

  

### 2.2 Results Analysis

- **Sentiment Analysis**:

- 5-class SST에서는 중간 정도의 성능

- Binary CFIMDB에서는 매우 높은 정확도 달성

- **Paraphrase Detection**:

- Quora Question Pairs에서 75.2%의 정확도로 합리적인 성능

- **Sonnet Generation**:

- Shakespeare 소네트 생성에서 CHRF 0.68로 구조적 패턴과 의미적 일관성 유지