---
title: "Remember `to('cpu')` in Pytorch to release GPU memory"
date: "2024-01-11"
draft: true
tags: [LLM, AI, pytorch, propgramming, python]
---

# Remember `to('cpu')` in Pytorch to relase GPU memory

When I saw that Microsoft had released [phi-2](https://www.microsoft.com/en-us/research/blog/phi-2-the-surprising-power-of-small-language-models/), a 2.7B parameters LLM, I thought: _"this is the perfect excuse to get my hands dirty with LLMs"_. The model was small enough to test it directly inside Google Colab, as it would fit the 15GiB memory GPUs provided in the free plan.

So without further ado, I opened Google Colab, `pip install`ed HF's `transformers` library, and wrote the following code snippet to test the model:

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

The first call to the model worked like a charm:
```python
test = '''
Instruct: Would you be able to help me with code written in Rust or Go? Please only answer to my question and tag as <end> when you have finished answering my specific question.
Output:
'''
print(phi2_input(test))
```
But if I called the code from above again, __it was failing with the following `OutOfMemoryError` from CUDA__:
```console
OutOfMemoryError: CUDA out of memory. Tried to allocate 38.00 MiB. GPU 0 has a total capacty of 14.75 GiB of which 15.06 MiB is free. Process 4265 has 14.73 GiB memory in use. Of the allocated memory 14.47 GiB is allocated by PyTorch
```
I had no idea why, my GPU memory wasn't being released between calls, and I had to restart the runtime in order to get a fresh GPU with all its memory if I wanted to prompt the model again. What could be happening?

After reading some docs, inspecting the GPU memory, and a bit of wandering around, I realized that `model.generate` was storing __the output tensors of the model generation in GPU memory__, immediately filling the precious memory of my free Google Colab GPU.

The fix was quite simple, I just needed to __send the output tensors back to CPU__ when the generation is done ([relevant docs](https://pytorch.org/docs/stable/tensors.html#torch.Tensor.to)). With this, I was able to prompt the model as much as I wanted without filling up the memory of the GPU.

```diff
def phi2_input(text: str):
  inputs = tokenizer(text, return_tensors="pt", return_attention_mask=False)
- outputs = model.generate(**inputs, max_length=300)
+ outputs = model.generate(**inputs, max_length=300).to('cpu')
  text = tokenizer.batch_decode(outputs)[0]
  return text
```

The morale of the story? When using a framework that abstracts you from the low-level details of a technology, is still really important to have a good understanding of what is happening under the hood. In this case, this was a "noob" mistake from someone that is taking its first baby steps with Pytorch.

