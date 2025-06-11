---
title:
  "Baselight Letters Volume 1: Project Titanic, your personal assistant, and a flagship dataset"
date: "2025-06-10"
draft: false
tags: [baselight, entrepreneurship, startup, data, LLM]
---

## Baselight Letters Volume 1: Project Titanic, your personal assistant, and a flagship dataset

We've been heads down pushing new features every week
to[ Baselight](https://c.vialoops.com/CL0/https:%2F%2Fbaselight.ai%2F%3Futm_source=loops%26utm_medium=email%26utm_campaign=lfcto1/1/010001975b424eed-5a4da8d6-e0a2-460e-bfbd-d36775aefc03-000000/UfwWxMvxjF9hhLNIqHF8FYdhG9xJ1YMR1ooc6ZPAhq0=408)!
As the Baselight CTO, I want to make sure everyone knows all that we've been cooking, and the new
capabilities that these features would bring to them.

This is my attempt to show you, a bi-weekly product update for Baselight. You've probably come
across
these[ Baselight Builder](https://c.vialoops.com/CL0/https:%2F%2Fx.com%2FBaselightDB%2Fstatus%2F1929922621107261887/1/010001975b424eed-5a4da8d6-e0a2-460e-bfbd-d36775aefc03-000000/xZalc8MoCYafKKBe-2Gs55OKn6qIvStx360QNAzo32E=408)
and[ Baselight is Data](https://c.vialoops.com/CL0/https:%2F%2Fx.com%2FBaselightDB%2Fstatus%2F1928149865042715116/1/010001975b424eed-5a4da8d6-e0a2-460e-bfbd-d36775aefc03-000000/wCdDfn_RWeLqZXpVmSVh24BOSKWT2GJSB5hALuANNwU=408)
updates. Well, these posts unpack what's behind these updates and what's to come.

## A dataset for soccer enthusiasts

We have a bunch of sport enthusiasts in the team, and they insisted that Baselight could have a role
in the way analytics are done in sports, and they were right! Data sources are fragmented, require
handling several paid subscriptions, it is not homogeneous, and many other frictions. Baselight is
able to fix all of that, and we are working on showing how Baselight can become the de-facto
platform for sports analytics starting from
the[ Ultimate Soccer dataset](https://c.vialoops.com/CL0/https:%2F%2Fbaselight.app%2Fu%2Fblt%2Fdataset%2Fultimate_soccer_dataset/1/010001975b424eed-5a4da8d6-e0a2-460e-bfbd-d36775aefc03-000000/gw5XVCYrK6r_Y7DDDhQ6bPI2HTbVXiOMWMdgIFbMeAk=408).

This dataset already includes:

- 5K+ teams
- 120K+ players
- 95K matches
- 1.6M+ player stats
- 400K+ transfers
- 500K+ odds

And we are already seeing
pretty[ cool insights](https://c.vialoops.com/CL0/https:%2F%2Fbaselight.app%2Fu%2Fpjsousa%2Fquery%2Fcristiano-ronaldo-scoring-rate-by-age/1/010001975b424eed-5a4da8d6-e0a2-460e-bfbd-d36775aefc03-000000/ma3PJZw7KcRcUaYov1KhuDWcxh--9h3ls88c04rbdYE=408)
from our team and beyond leveraging this data.

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXeh4W02gmgdjbfO9i6Nb8cAKuQCNTWmaSt3sCsxMQsugXFEgrFWPK6TyjfyCWy6NOGFMnUkA-Tqe1rKaK1tr1G_j-qRt5RcGsrQXUD4Ybg7Pj6tPXbn5b9cv9I3x_NIXj1_kSU0?key=qpwcwKWkgSCXF4oicPGfEg)

But are we only planning to do soccer data? No way! The NFL is coming soon. The NBA already has some
data on Baselight. And we are evaluating growing into other traditional sports, and even e-sports.
If you have some data that you want to provide or specific data that you would like to see in
Baselight hit us up!

## Heading to an Iceberg

One of the big projects that we kicked-off a few weeks ago is the implementation of the Apache
Iceberg REST API for the Baselight catalog. Once this is shipped, you will be able to query all
Baselight datasets through any of your query engines and tooling that has support for Iceberg REST
catalogs:
from[ DuckDB](https://c.vialoops.com/CL0/https:%2F%2Fduckdb.org%2Fdocs%2Fstable%2Fcore_extensions%2Ficeberg%2Ficeberg_rest_catalogs.html/1/010001975b424eed-5a4da8d6-e0a2-460e-bfbd-d36775aefc03-000000/Qp2IIAM2WCfVXTvlx3CeyPpgxWJQ46nfuiEn3b4FXjE=408),
to[ Trino](https://c.vialoops.com/CL0/https:%2F%2Ftrino.io%2Fdocs%2Fcurrent%2Fconnector%2Ficeberg.html/1/010001975b424eed-5a4da8d6-e0a2-460e-bfbd-d36775aefc03-000000/W9uaVBRasanB9xgOIb8IYHXXZkavcZDGxLqSVNH3Y9s=408),[ Spark](https://c.vialoops.com/CL0/https:%2F%2Ficeberg.apache.org%2Fspark-quickstart%2F/1/010001975b424eed-5a4da8d6-e0a2-460e-bfbd-d36775aefc03-000000/oc8AhDMPDenAmgFw1vBb1YMaL2nMPk_8sa8CFREQO9E=408)
or language libraries
like[ PyIceberg](https://c.vialoops.com/CL0/https:%2F%2Fpy.iceberg.apache.org%2F/1/010001975b424eed-5a4da8d6-e0a2-460e-bfbd-d36775aefc03-000000/dmKYrgbb3kTZEmrmyrjFcqa0WokHc2cQn6dEP9VfssU=408).

Those of you less familiar with the data space may be wondering
what[ Apache Iceberg](https://c.vialoops.com/CL0/https:%2F%2Ficeberg.apache.org%2F/1/010001975b424eed-5a4da8d6-e0a2-460e-bfbd-d36775aefc03-000000/VjiE1_gCMN5EckPAkE6xcmyYStoWkENsuGmnJU1HHEo=408)
is: _"Iceberg is a high-performance format for huge analytic tables. Iceberg brings the reliability
and simplicity of SQL tables to big data"_. Really briefly, what are the kind of things that Apache
Iceberg enables?

- Snapshots: Take snapshots of your tables at any time, allowing you to preserve the state of your
  data.
- Time Travel: Query data as it existed at a specific point in the past.
- Atomic Operations: Ensures data changes are either fully applied or not at all, preventing
  corruption.
- Schema Evolution: Supports changes to the table structure (schema) without causing issues to
  existing queries or processes.
- Partitioning: Allows you to organize data for efficient queries, and adjust partitioning schemes
  over time.
- Data Compaction: Optimizes data storage to improve query performance and reduce costs.
- Row-level Updates and Deletes: Enables precise modification of data within tables.

This is why we are so excited about supporting this table format for our datasets. It unblocks a
great gamut of new possibilities. With this,  not only can consumers bring Baselight datasets closer
to their data stack, but data suppliers can leverage their existing pipelines to easily contribute
their datasets to Baselight. I will start sharing some tutorials and cool use cases in the coming
weeks once we have this feature shipped. So stay tuned!

## Lowering the barriers to insights

A recurring point of feedback that we are receiving from some of our users is that they would feel
more comfortable if they could describe the query that they would like to make using natural
language instead of having to come up with an SQL query. I hear you, LLMs have made me lazier, and I
feel the same!

This is why, one of the lines of work that we've been prioritising lately is the implementation of
our very own LLM-powered (of course) Baselight assistant. I am personally pretty opinionated about
how LLMs should be integrated in a platform like ours, so this is why the Baselight assistant will
be a set of narrow agents that will (eventually) be able to translate what you want to do in
Baselight into the underlying operations.

And we are kicking off the release of these narrow agents for the Baselight assistant through an
error assistant. We are still not making queries for you in autopilot mode, but at least it should
help you track down those annoying SQL errors that are sometimes hard to fix.

The way it works is pretty straightforward, if you run an SQL query that includes errors, the
assistant will inspect the error and suggest a fix. You can either apply the fix or reject it. No
more headaches for a misspelled table.
![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXfoNYk1Lw0EH3FhNGHzrC71yFsMAQsyYvSIPqPXmL6ovcuH1BMYy1oGiRyLbEQpedkYBAnZ5czZb0UbmeNGEVn1BoHBynRYKoMLa2qH8gYeV7AY25XAiIGYofXASlc3v9ghUr55?key=qpwcwKWkgSCXF4oicPGfEg)
And with that! See you in two weeks!
