---
title: "Late arrival to the fuss of LLMs"
date: "2024-01-21"
draft: false
tags: [AI, LLM, ML, research]
---

# Late Arrival to the Fuss of LLMs
> From zero to zero-point-one in a few resources

After spending some time reading about the [state of AI](./2023-12-07-state-ai.md) at a high-level, it was time to dive into the details. For obvious reasons, I decided LLMs were a good first-stop for my AI enlightenment. __What are LLMs and how they work (because apparently the why is still a burning open question)?__.

Rivers of digital ink have been spilled lately with gentle introductions and deep illustrations of how LLMs and their underlying transformer architectures work. The good thing about this? There is a lot of information available to learn about them. The bad thing? Filtering the best resources to get you to a good understanding with the lower overhead may be time consuming. Consequently, I decided that instead of writing yet another introductory post about transformers and LLMs, it may be more useful to just share the curated list of resources that have helped me the most on this humble quest. I hope you enjoy it (and if you find any good resource worth including to this list, feel free to send it my way and I'll edit this post). 

![A person arriving late to a party where there is a lot going on](../images/llm-arrive-late.png)
*A person arriving late to a party where there is a lot going on - SDXL*

##  LLMs
Large Language Models (LLMs) are this amazing family of NLP (Natural Language Processing) models that have taken the Internet by storm. The core idea is simple, it is a type of sequence-to-sequence deep learning model based on an architecture called the transformer that is __trained to predict the most probable next sequence of words, given some sequence as an input__. Trained over a large enough dataset (like a dataset with all the content in the Internet), leads to the intelligent-like behaviors that we are seeing in systems like OpenAI's, Mixtral or Anthropic's models.

On my journey to gain a better understanding of LLMs, the best introductory resources I've come across are:
- Andrej Karpathy's amazing ["1hr Intro to Large Language Models"](https://www.youtube.com/watch?v=zjkBMFhNj_g) with __an overview of how LLMs work, their current state of development, and interesting ideas__ for future work and open problems (like LLM security, tree of thoughts, self-improvement, prompt injection, or the idea of LLM OS). If you have a bit more of time, also worth watching Karpathy's [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY), with a 2h walkthrough of how to write a transformer from scratch, and train it to speak like Shakespeare.

- From one renowned deep learning expert to another, Jeremy Howard's ["A Hacker's Guide to Language Models"](https://www.youtube.com/watch?v=jkrNMKz9pWU) is the best way to __get your hands dirty programmatically__ interacting with ChatGPT, or running an open-source LLMs like Llama. Actually, I used this resource as a base to start tinkering with LLMs myself and run Microsoft's new [phi-2](https://www.microsoft.com/en-us/research/blog/phi-2-the-surprising-power-of-small-language-models/) in a Google Colab notebook. 

- Finally, I would recommend Will Thompson's ["What We Know About LLMs (Primer)"](https://willthompson.name/what-we-know-about-llms-primer). It was written in July 2023 but it has pointers to a lot of good resources around buzzword in the world of LLMs like LoRa, InstructGPT, or RLHF. I will write more about these in the future, but this article really helped me understand some of the techniques used to fine-tuning open-source LLMs that I was reading about (and didn't understand). Some of these techniques are the ones that enabled Llama to be run in a Mac without requiring an expensive GPU and loads of memory, or why there are already open-source models that outperform ChatGPT 3.5.

I feel that the resources from above were all that I needed to get a good grasp of LLMs at a high-level, but let me share a few more that I found quite interesting and (in one case thought provoking).
- [Training and deploying open-source LLMs](https://www.youtube.com/watch?v=Ma4clS-IdhA): Good high-level overview of the state of open-source models from end 2023.
- [Getting started with Llama](https://ai.meta.com/llama/get-started/) has an overview of Llama2 and how to start playing with it
- [Large Language Models and the End of Programming](https://www.youtube.com/watch?v=JhCl-GeT4jw) from Matt Welsh's Fixie.ai. The thing that I liked about this talk is how closely related it is with the concept of software 2.0, and using LLMs and agents as CPUs to orchestrate larger systems.

## The Transformer
After going through the previous section, it may be obvious that _"attention is all you need"_, and that one of the key responsible for the operation of LLMs is the transformer architecture. If I wanted to get a good intuition of how LLMs work, I felt like I first had to understand deeply how transformers worked (and I had literally no idea). In this regard, these were the resources that helped me the most and that I highly recommend.
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) visually presents their operation while sharing useful links about core concepts like [the context and attention of a seq2seq model](https://machinelearningmastery.com/what-are-word-embeddings/) and [word embeddings](https://machinelearningmastery.com/what-are-word-embeddings/).
- [The annotated transformer](https://nlp.seas.harvard.edu/2018/04/03/attention.html) walks you through the __original transformer paper with code and examples__, and [Transformer Architecture: The Positional Encoding](https://kazemnejad.com/blog/transformer_architecture_positional_encoding/) is the best explanation I could found to what of the parts of the transformer architecture that I understood the least after I read the previous articles.
- But I have to say, __the key resource that really helped me to (finally) understand what transformers are all about__ is Theia Vogel's ["I made a transformer by hand"](https://vgel.me/posts/handmade-transformer/) and her sequel ["How to make LLMs go fast"](https://vgel.me/posts/faster-inference/). 
- In line with the above, I also went through [Llama from scratch](https://blog.briankitano.com/llama-from-scratch/) to get a better sense of the implementation of more complex transformer architectures.

Finally, for those looking to go the extra mile, [The Transformer Family Version 2.0](https://lilianweng.github.io/posts/2023-01-27-the-transformer-family-v2/), [Understanding and Coding Self-Attention, Multi-Head Attention, Cross-Attention, and Causal-Attention in LLMs](https://magazine.sebastianraschka.com/p/understanding-and-coding-self-attention), and this post about quantization [LLM.int8() Emergent Features](https://timdettmers.com/2022/08/17/llm-int8-and-emergent-features/) dive into more complex topics, but they really helped me consolidate the basics.

## Learning path
And this is just the start, throughout the festive season I've been crafting a personal AI learning roadmap to start getting up to speed on this field. I want it to be as hands-on as possible. I also want to share my progress publicly so others as illiterate as me in the world of ML can benefit from it. Ready to dive into the world of AI? Let the coding fun begin! 🎉
