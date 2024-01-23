---
title: "Hardware for AI (TODO)"
date: "2024-01-31"
draft: true
tags: [AI, LLM, ML, research]
---

# TODO
> TODO

![TODO](../images/llm-arrive-late.png)
*TODO - SDXL*

### Hardware
When I started with this, I was wondering what hardware to use:
https://timdettmers.com/2023/01/30/which-gpu-for-deep-learning/#How_do_GPUs_work
- GPUs are expensive, so is probably better to start with Colab and any of the GPU providers available
- I tried to run a set of models locally to understand what were the capabilities of my hardware.
  - nvidia GT1030 2GiB - Models work out of the box, but not enough memory for image.
  - AMD Ryzen 2023 with integrated graphics - hard to make it work without CUDA.
  - I decided to go with Google Colab and GPU providers.
  - The cheapest providers are: https://www.runpod.io/ and https://cloud.vast.ai/. They both support spot machine for lower prices. Some GPUs at Vast AI are provided by the community.
  - If you destroy a machine there is no GPU charges, but there is still storage charges.

  - When playing with Google Colab, and testing Phi2 (a relatively small model), I reached the limits of GPU memory and need to restart to take them back down.
  - https://colab.research.google.com/drive/1woqimI_x6TyXhgZjQqiAXyCZQ5zKY6wH?usp=sharing
- Colab for exploration, and then GPU providers for long-lasting jobs
- External data to google Colab.

![GPU Recommendation Chart](../images/gpu-decision.png)
*Source: https://timdettmers.com/2023/01/30/which-gpu-for-deep-learning/#Overview*

## Writing some code
Leveraging all the content above, I decided to start writing some code to test LLMS, here's a link to my Google Colab in case you want to tinker with it yourself:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1woqimI_x6TyXhgZjQqiAXyCZQ5zKY6wH?usp=sharing)
