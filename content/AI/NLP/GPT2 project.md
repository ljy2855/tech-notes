
### Model Architecture


#### Tokenization
![[Pasted image 20250422133510.png]]

#### Embedding Layer

The input embeddings that are used in later portions are the sum of the token embeddings and the position embeddings

#### Attention

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

