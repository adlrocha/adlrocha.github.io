---
title: "Finisterra Labs: A New Beginning"
date: "2024-07-25"
draft: false
tags: [entrepreneurship, personal, ideas]
---

Let me tell you the story of how, by chance, __I found myself building a new company with two amazing ex-colleagues.__ As many of you may know by now, I spent the last four years of my career working at Protocol Labs. Throughout this time I had the opportunity to contribute to a lot of exciting projects, learn more than I could have hoped for, and work in the process with incredibly talented and kind human beings. Many of which have ended up becoming really good friends.

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXdkVwO0-L5FdZ0p_wr4vrdxzDXtYKvoQbkMIa9w_ZBqz5LoDK42_6f1q92i_BWZyvOSJhovb6SjHABrSMejSj0xcq0Ci-dls-ZSAB9V-5PCwTlmZysArMfzpFOsRBK-QYIQl7VtJvxUSZLv6sA-6qXWEYXT?key=2RiSpzKW0jawvTl6h447mw)

## Thank you, PL

While I was working at PL, I didn't just get to [work on awesome research projects ](https://research.protocol.ai/authors/alfonso-delarocha/)and tackle tough problems in blockchains and distributed systems. I also got to be a big part of different open-source projects, like:

-   [Beyond Bitswap](https://github.com/protocol/beyond-bitswap), where I explored improvements to file-exchange in Filecoin and distributed systems.

-   [ResNetLab](https://github.com/protocol/resnetlab), where we focused on building resilient distributed systems, by creating and operating a platform where researchers can collaborate openly and asynchronously on deep technical work.

-   Filecoin's indexing system, with core contributions to projects like [storetheindex](https://github.com/ipni/storetheindex) and the underlying database system, [storethehash](https://github.com/ipld/go-storethehash).

-   [Go-f3](https://github.com/filecoin-project/go-f3), the golang implementation of the Fast Finality (F3) protocol for Filecoin. 

-   And my baby, [InterPlanetary Consensus (IPC)](https://github.com/consensus-shipyard/ipc), which ended up becoming a framework to scale Filecoin (and blockchain networks in general) enhancing their functionality with new VMs, custom syscalls, etc.

These past four years have been intense and fun. Especially the last two, where almost all of my waking hours have been spent thinking or writing code to scale the IPC project from a research project to an actual production system _(thank you ConsensusLab and the IPC team, you are amazing!)_. __Yet, at the beginning of this year, a foreseen event changed everything more than I originally expected.__

## A Sudden turn of events

In January of this year I had my first kid and I went on parental leave for a few months. For the first time in four years I wasn't spending all my conscious waking hours thinking about work (and most recently, the IPC project). During my regular sleepless nights and the free time between diaper changes and naps, I had the opportunity to think deeply about life, work, and what the future holds. __And guess what? It hit me like a ton of bricks, but it was time for a change.__

My original plan before going on leave was to come back to "business as usual" joining the IPC team, and continue helping to move the project forward. And if it hadn't been for those few months of leave that was probably what I would have ended up doing. However, all of this thinking about the future planted the seed in my head that it was time for me to find a new project that excited me, and where I could keep growing  like in my early days at PL.

Even more, I wanted to see if I could bootstrap something by myself. __I sought to address issues that resonated with me, rather than merely conforming to externally imposed priorities.__ I wanted to contribute (even if narrowly and in a limited way) to the kind of utopian futures that I was imagining.

## Figuring out what's next

Making the decision of leaving PL after so long, and leaving behind such a group of talented individuals and the amazing things that we had built together wasn't an easy task. I remember asking myself immediately after committing to the decision, "and now what?".

The only thing that was clear to me was that I wasn't ready to join another company as a regular employee right away. For this I could have just stayed at PL. __It was time for me to try and build something of my own, and thanks to PL I was in a privileged position that allowed me to explore this possibility for a few months without having to worry about my runway.__

I explored several ideas throughout this time:

-   I am one of those people who really thinks that the development of AGI could become an existential risk. So I started soaking up knowledge about the e/acc movement, AI alignment, AI safety, etc. to __see if I could contribute in any way to the problem of AI risk.__ Unfortunately, I felt like I would have to do a lot of learning before I could effectively contribute to this problem _(thank you, Evan, for your endless patience educating me about the problem)_.

-   All that reading about AI made me realize how the __control over computational resources (mainly GPU cores) and the energy sources required to power them__ offers the leverage for centralized parties to develop AI under their own terms, increasing the existential risk of AI.

-   Open-source and decentralized systems seemed like good candidate solutions to lower the barriers for individuals and small players to have access to the use and development of this technology, lowering the leverage of big actors (I understand that this can be a double-edged sword, and that lowering the barriers for everyone is also doing so for malicious actors, but being aligned with my background and my interests, I wanted to explore the idea further). 

-   So __I started developing this idea of "bringing dark computing into light"__, i.e. to connect to an open network every possible device there is --including end user appliances if possible-- so they could be offered for anyone to run AI jobs (I may write my thesis around this one day, but it involved building computational graph of AI models, distributing the kernels for execution to different providers, and collecting the results). Being more aligned with my background, it looked like an endeavor that I could have some success exploring.

	-   Side-note: I just came across [this project](https://github.com/exo-explore/exo) that is doing something technically similar to the first prototype I was building.

## The Stars Align

In parallel to giving shape to the ideas above, I was trying to keep in touch with some of my ex-colleagues at ConsensusLab (especially the ones that decided to move on into something else) not only because I really liked them, but also (selfishly) to get a sense of what a life post-PL looked like.

One of these people was Henrique. He had left PL at the end of last year, and since then __he had been tinkering with this idea of building a universal database for structured data.__ As he described then, _"like Google indexes all the websites in the world, but for structured data"_. I have to admit that I fell in love with the idea from the beginning, but then he showed a working prototype of the project and I was like... _"wow, this is amazing!"_.

Under the hood, it had some of the basic technical ingredients that I was currently exploring myself in a different context: an open network, an execution tree that is distributed to different processors in order to perform the overall execution, data-intensive applications, a potential impact to the future of AI, etc. __I came out of that call really excited with the impact a project like this could have__, and seeing it work in real life was definitely a bonus.

A few days later, we had a follow-up call to chat a bit more about the project, and he mentioned that he was starting to look for seed investment to bootstrap the project. They were currently two co-founders, and __Henrique mentioned that they were open to onboard me as the third one if I was interested__. I honestly wasn't expecting it, I would have been fine joining the project as a potential early hire, but joining as a co-founder was just what I was looking for. And like every good TV show, he finished the call with the following cliff-hanger: _"Actually, if it helps make up your mind, and for what is worth, I think you are going to really love my other co-founder..."_

A really cool idea with the potential of having a huge impact, a "secret" co-founder that I was going to really like, the opportunity to become a co-founder and the opportunity to contribute to shape something from scratch, __what is not to love about all of this? :)__ It didn't take me long to make the decision. This was exactly the opportunity that I was looking for.

A few days later I learnt that the "secret" co-founder was Jorge, one of my first interviewers in my hiring process at PL, one of the heavy-weights behind PL Research, and my people manager for the last two years at PL. __So Henrique was right, I really liked that guy.__ And as Jorge recently posted, this how I _"found myself signing the incorporation documents for Finisterra Labs alongside Henrique and him"._

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXd1yTIHnQGawrWLKH-KHDXeSUVpIZaxaSfVigVUcoeLoOxKE2waWYVjvrZ39ex68-IA2W_xd86Y1o4NGa1ZToUgAFH7wgVh1TkkuMWfX-12hzdxuKYjV3_M35Y4tn3Cy_y9YdbdDgn8KHr4BWK72mgtXPqX?key=2RiSpzKW0jawvTl6h447mw)

## Enter Finisterra Labs

So now you know the story of how I found myself in this endeavor with these two beautiful and talented human beings. __When I made the hard decision of not joining the IPC team back after my leave, I couldn't have hoped for a better outcome for my decision.__ Now is the time to go roll up our sleeves and build something that people will love.

If you are curious about what we are doing you can check out our [website](https://finisterra.ai/), or [follow](https://x.com/FinisterraLabs) us on [social media](https://www.linkedin.com/company/103884795/). There is not much public yet, as we navigate our first investment and the first release of the project, but stay tuned for future updates.

I want to close this post with a big shoutout (again) to all of my ex-colleagues at Protocol Labs (hard to mention all of you here, so I won't risk leaving any of you out by not pointing fingers). If it wasn't for PL and all of you, this new exciting adventure wouldn't have become a reality. Thank you!