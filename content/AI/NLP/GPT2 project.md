
### Model Architecture
```python
class GPT2Model(nn.Module):
    def __init__(self, config):
        super().__init__()
        # Embedding layers.
	    self.word_embedding = nn.Embedding(config.vocab_size, config.hidden_size, padding_idx=config.pad_token_id)
	    self.pos_embedding = nn.Embedding(config.max_position_embeddings, config.hidden_size)
	    self.embed_dropout = nn.Dropout(config.hidden_dropout_prob)
	
	    # Register position_ids (1, len position emb) to buffer because it is a constant.
	    position_ids = torch.arange(config.max_position_embeddings).unsqueeze(0)
	    self.register_buffer('position_ids', position_ids)
	
	    # GPT-2 layers.
	    self.gpt_layers = nn.ModuleList([GPT2Layer(config) for _ in range(config.num_hidden_layers)])
	
	    # [CLS] token transformations.
	    self.pooler_dense = nn.Linear(config.hidden_size, config.hidden_size)
	    self.pooler_af = nn.Tanh()
	
	    # Final layer norm.
	    self.final_layer_norm = nn.LayerNorm(config.hidden_size, eps=config.layer_norm_eps)
```

#### Tokenization
![[Pasted image 20250422133510.png]]

#### Embedding Layer

The input embeddings that are used in later portions are the sum of the token embeddings and the position embeddings

#### Attention Layer

```python
def attention(self, key, query, value, attention_mask):

    # Calculate the attention scores.
    attn_scores = torch.matmul(query, key.transpose(-1, -2)) / (self.attention_head_size ** 0.5)

    seq_len = attn_scores.size(-1)
    causal_mask = torch.triu(torch.ones((seq_len, seq_len), device=attn_scores.device), diagonal=1).bool()
    attn_scores = attn_scores.masked_fill(causal_mask, float('-inf'))

    # Apply the attention mask to the attention scores.
    attn_scores = attn_scores + attention_mask

    # Normalize the attention scores to get the attention weights.
    attn_probs = nn.Softmax(dim=-1)(attn_scores)
    attn_probs = self.dropout(attn_probs)

    attn_output = torch.matmul(attn_probs, value)
    attn_output = rearrange(attn_output, 'b h t d -> b t (h d)')
    return attn_output
```

##### Multi head attention
![[Pasted image 20250422212705.png]]
- multi head attention의 경우 scaled dot-product attention을 

##### Causal Self Attention

Masked Multiheaded Self-Attention
![[Pasted image 20250422212617.png]]




#### 구현 특징

- **Pre-norm 구조**: Attention과 Feed Forward 레이어 모두 입력에 대해 먼저 Layer Normalization을 적용함

- **Residual Connection**: 각 sub-layer의 출력을 입력과 더하는 residual connection 구현

- **Feed Forward Network**:

- 첫 번째 linear layer로 hidden size를 intermediate size로 확장

- GELU activation function 적용

- 두 번째 linear layer로 다시 hidden size로 축소

- **Dropout**: Attention과 Feed Forward 출력에 각각 dropout 적용

- **Helper Method**: `add` 메소드를 통해 residual connection과 dropout을 효율적으로 구현

  

### 1.3 CausalSelfAttention 구현

```python

class CausalSelfAttention(nn.Module):

def __init__(self, config):

super().__init__()

self.num_attention_heads = config.num_attention_heads

self.attention_head_size = int(config.hidden_size / config.num_attention_heads)

self.all_head_size = self.num_attention_heads * self.attention_head_size

  

self.query = nn.Linear(config.hidden_size, self.all_head_size)

self.key = nn.Linear(config.hidden_size, self.all_head_size)

self.value = nn.Linear(config.hidden_size, self.all_head_size)

  

def transpose_for_scores(self, x):

new_x_shape = x.size()[:-1] + (self.num_attention_heads, self.attention_head_size)

x = x.view(*new_x_shape)

return x.permute(0, 2, 1, 3)

  

def forward(self, hidden_states, attention_mask=None):

# 1. Query, Key, Value 계산

query_layer = self.transpose_for_scores(self.query(hidden_states))

key_layer = self.transpose_for_scores(self.key(hidden_states))

value_layer = self.transpose_for_scores(self.value(hidden_states))

  

# 2. Attention Score 계산

attention_scores = torch.matmul(query_layer, key_layer.transpose(-1, -2))

attention_scores = attention_scores / math.sqrt(self.attention_head_size)

  

# 3. Causal Mask 적용

seq_length = hidden_states.size(1)

causal_mask = torch.triu(torch.ones(seq_length, seq_length), diagonal=1).bool()

causal_mask = causal_mask.to(hidden_states.device)

attention_scores = attention_scores.masked_fill(causal_mask, float('-inf'))

  

# 4. Attention Mask 적용 (padding tokens)

if attention_mask is not None:

attention_scores = attention_scores + attention_mask

  

# 5. Attention Weights 계산

attention_probs = nn.functional.softmax(attention_scores, dim=-1)

  

# 6. Context Layer 계산

context_layer = torch.matmul(attention_probs, value_layer)

context_layer = context_layer.permute(0, 2, 1, 3).contiguous()

new_context_layer_shape = context_layer.size()[:-2] + (self.all_head_size,)

context_layer = context_layer.view(*new_context_layer_shape)

  

return context_layer

```

  

#### 구현 특징

- **Multi-head Attention**: 여러 개의 attention head를 병렬로 처리하여 다양한 관점에서의 attention 계산

- **Scaled Dot-Product Attention**: Attention score 계산 시 scaling factor 적용

- **Causal Masking**: 현재 토큰이 이전 토큰들만 참조할 수 있도록 제한

- **Attention Mask**: Padding 토큰에 대한 attention을 제한

- **Efficient Tensor Operations**:

- `transpose_for_scores`를 통한 효율적인 head 분할

- `permute`와 `contiguous`를 통한 메모리 효율적인 연산

  

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