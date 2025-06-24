---
title: "Baselight Letters Volume 2: Anchor datasets, stars, and our goal to open the platform"
date: "2025-06-23"
draft: false
tags: [baselight, entrepreneurship, startup, data, LLM]
---

# Baselight Letters Volume 2: Anchor datasets, stars, and our goal to open the platform.

It's me again! It is crazy that two weeks have already passed. As promised, here's a rundown of the
highlights from the past two weeks.

### Surfacing high-quality data with stars

As I briefly mentioned in my last letter, two of our main obsessions right now are to make
high-quality datasets easier to find, and to lower the barriers for users to create their own
queries and insights. We crossed the 50K datasets mark, and among all of this data we have datasets
of disparate quality. We want users to be able to identify at first glance the most valuable
datasets without them having to go one-by-one inspecting the data and figuring out if it is what
they need for their insight.

To start tackling this problem, we decided to go with a well-known community-driven approach. Say
hello to dataset favorites!

You now can star those datasets that you love using, or that you find most valuable, to signal the
rest of Baselight the datasets that are worth their time (and also for you to be able to easily come
back to them for future insights). Keep an eye on the top right corner of the dataset page, and be
on the lookout for those beautiful star close to your search results -- we even have a cool
animation for when you star a dataset that you should give a try.

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXcd-KyBadbVsWYx0b2nsSdDZMGuKluDeI2-9zbF2R13cafVHgOjYllaeL0xWHbDaxXL1bTsiwIuxMbbnGahistKziJMrbDOoYdQ73cuMLz0FQsH0_Qe4pgQEzVIZnUmriVwuh7h6w?key=tUsZkBYhj5kTS0FiVWbsXg)

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXd-ctKIK1wzoZ0A_wtugr6huaD39pBaTNGYR3egLcIo2eg3HGxyOHmM3lU2AaPBsLY7mSums1wZJqCbb9WX63UbCJBkG0IoOspuQ_Mv02PCajvcBYD_BWPVQIC3x5RM6mwhcxkZvQ?key=tUsZkBYhj5kTS0FiVWbsXg)

### Lowering the barrier from zero to query with forking

We know that writing a full SQL query from scratch to turn an idea into a Baselight insight can feel
daunting for many users. We are really trying to improve this. The error assistant that I shared in
my last letter goes in line with this, and we've made an additional step towards that goal with a
forking feature for queries.

If you see a Baselight insight in the wild that you like, and you want to tinker with it or modify
it slightly to create your own insight out of it, you don't need to write the whole query,
copy-paste the SQL, and prepare the chart from scratch yourself. You can now just click "fork" and
get a copy of the insight for you to use. This should lower the amount of SQL you need to write, and
thus the time to create your own Baselight insight.

Start looking for that beautiful "Fork" button on the public page of a Baselight insight.

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXdKTMvFm6y9GFIxRCYg5eEpAV-3QjmqY_XZBPJvpGvBZqQIWl6n_ETZLZVREg3C6tFruIW6k71Zt01Xu9To3OqjmXxoQi8jpgpXVW8kDVdUlSHFgAaM27iFWubOgTbk1e0EO0OpKQ?key=tUsZkBYhj5kTS0FiVWbsXg)

### More sports data

The [Ultimate Soccer dataset](https://baselight.app/u/blt/dataset/ultimate_soccer_dataset) that we
released a few weeks ago has become the most popular dataset in the platform, and is now the most
queried dataset from the 50K available. This week the Ultimate Soccer have received an update that
include the following competitions:

- FIFA World Cup Qualifications
- Olympics Men
- Olympics -- Intercontinental Play-offs
- FIFA Intercontinental Cup
- FIFA Club World Cup -- Play-In
- UEFA
- UEFA Euro Championship -- Qualification
- UEFA Super Cup
- Argentina
- Liga Profesional Argentina
- Copa Argentina
- Copa de la Superliga
- Copa de la Liga Profesional
- CONCACAF
- Concacaf Central American Cup
- CONMEBOL
- CONMEBOL Libertadores

And we've released a new flagship dataset for the NFL, the
[NFLVerse dataset](https://baselight.app/u/nflverse/dataset/nfl) that I recommend everyone to have a
look at (it may be competing with the Ultimate Soccer dataset in number of queries in the coming
weeks).

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXfd4JOQQjPReYe_jx0pvSieOtNTvuW8aX9J0T05T7SOS9mGVqsHiFR1z-nZ5uQ4a8gZiijAYP6B-tgg13pj4K8AqeTvpk_WThTfKKaDNsbNYan-33qZGA9v_aTNz67tCtanASwDQw?key=tUsZkBYhj5kTS0FiVWbsXg)

### A public API in progress, and where to meet us!

I would like to close this letter with two more updates:

- The first one is still invisible for Baselight end-users, but we've finalised the implementation
  of the Apache Iceberg REST API for Baselight that I introduced in my last letter. And what is even
  more exciting, we already have a partner that is testing an integration with Baselight through it
  (I hope to be able to announce this partnership officially soon). We are also working hard to
  release a first version of a public API available to all Baselight users so you can also start
  exploring and querying Baselight from your preferred data engineering tooling and Python
  notebooks.

- On another note, if you want to meet us in person, different members of our team will be in
  conference around the globe: we recently attended the Databricks DataAISummit in SF, we will be in
  Paris for the RAISE conference, and I will be speaking myself at the Web3Summit. So if you want to
  know more about Baselight and chat about all things data, AI and Baselight-related feel free to
  reach out.

I really hope you are enjoying these updates, and if you have any suggestions, feedback, or asks
regarding these updates or the product please let us know! See you in two weeks :)
