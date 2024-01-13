---
title: "Remember `to('cpu')` in Pytorch to release GPU memory"
date: "2024-01-11"
draft: true
tags: [LLM, AI, pytorch, propgramming, python]
---

# Remember `to('cpu')` in Pytorch to relase GPU memory
- I was trying Phi-2 in Google Colab (enough memory free version)
- Shared the code and it worked.

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

torch.set_default_device("cuda")

# Phi 2
# https://huggingface.co/microsoft/phi-2
model = AutoModelForCausalLM.from_pretrained("microsoft/phi-2", torch_dtype="auto", trust_remote_code=True)
tokenizer = AutoTokenizer.from_pretrained("microsoft/phi-2", trust_remote_code=True)

def phi2_input(text: str):
  inputs = tokenizer(text, return_tensors="pt", return_attention_mask=False)
  outputs = model.generate(**inputs, max_length=300)
  text = tokenizer.batch_decode(outputs)[0]
  return text
```

```diff
def phi2_input(text: str):
  inputs = tokenizer(text, return_tensors="pt", return_attention_mask=False)
  - outputs = model.generate(**inputs, max_length=300).to('cpu')
  + outputs = model.generate(**inputs, max_length=300).to('cpu')
  text = tokenizer.batch_decode(outputs)[0]
  return text
```

