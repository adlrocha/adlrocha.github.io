---
title: "Late arrival to the fuss of LLMs"
date: "2024-01-04"
draft: false
tags: [AI, LLM, ML, research]
---

# Late Arrival to the Fuss of LLMs
> From zero to zero-point-one in a few resources

After spending some time reading about the [state of AI](./2023-12-07-state-ai.md) at a high-level, it was time to dig into some of the details. Obviously, my first stop to kick-off my AI enlightenment were LLMs, and what is exactly is underneath LLMs? The transformer architecture.

Rivers of digital ink have been spilled lately with gentle introductions and deep descriptions of how LLMs and transformer models work. The good thing? There is a lot of information available to learn about them. The bad thing? Filtering the best resources to get you to a good understanding may be time consuming. Thus, I decided that instead of writing yet another introductory post about transformers, it may be more useful to just share the curated list of resources that have helped me the most on this humble quest. So here it goes.

![A person arriving late to a party where there is a lot going on](../images/kid-ai.jpeg)
*A person arriving late to a party where there is a lot going on - SDXL*

###  LLMs
- [Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g) and [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY) amazing videos from Andrej Karpathy.
  - Perfect high-level foundation to get some intuition of what LLMs are and how they are implemented.
  - Tree of thoughts, self-improvement.
  - Use of tools
  - Related to above a new good overview: https://willthompson.name/what-we-know-about-llms-primer
- [A Hacker's Guide to Language Models](https://www.youtube.com/watch?v=jkrNMKz9pWU)
  - A few good pointers of where to look if one wants to start writing code with LLMs. An example of a code interpreter and fine-tuning a model.
- [Training and deploying open-source LLMs](https://www.youtube.com/watch?v=Ma4clS-IdhA): Good high-level overview of the state of open-source models from end 2023.


- [Large Language Models and the End of Programming](https://www.youtube.com/watch?v=JhCl-GeT4jw)
  - Matt Welsh Fixie.ai
  - The concept of Software 2.0. from Karpathy.
  - Not much technical but though provoking. 
  - Agents
- [What We Know About LLMs (Primer)](https://willthompson.name/what-we-know-about-llms-primer) is a good overview of the landscape of LLMs from mid-2023 with links to papers and additional resources.

### Transformers
- The Illustrated Transformer: https://jalammar.github.io/illustrated-transformer/
  - Useful links to core concepts like [the context and attention of a seq2seq model](https://machinelearningmastery.com/what-are-word-embeddings/), [word embeddings](https://machinelearningmastery.com/what-are-word-embeddings/), 

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

## Learning path
Throughout the festive season, I've been crafting a personal AI learning roadmap to start getting up to speed on this field. I want it to be as hands-on as possible, and to share my progress publicly so others as illiterate in the world of ML as me can benefit from it.  Ready to dive into the world of AI? Let the coding and festive fun begin!
