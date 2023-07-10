---
title: "Why do we need a new Internet?"
date: "2023-06-27"
draft: false
tags: [decentralization, ideas, edge computing]
---

# Why do we need a decentralized Internet?
Today I had what we could call a crisis of faith. After so many years working in the web3 space, and seeing so much speculation and cool tech solving artificial problems, I was wondering _"do we really need a new Internet? Or is it just another artificial problem we are creating to have an excuse to attract investment and work in cool tech?_. So I decided to write down a list of reasons why a company or an individual would choose to deploy their applications or services over a decentralized Internet over our current one.

As I was writing the list, I realized that whatever I came up with would be quite biased, as it is coming from someone that has been working in the space for years, and has that mindset of _trying to find a nail for the hammer_. However, if I made the list public, and others could contribute to it, I would collect useful feedback, and valuable insights about the reality of the problem. So without further ado, here's the list...

## Reasons why a decentralized Internet may be a good idea
- __Prevent cloud providers vendor lock-in.__
  - _Why?_ Many of the new services offered by cloud providers are close sourced and/or extremely tailored for their infrastructure, making really hard the migration or interoperability of services deployed over them. The immediate ones that come to mind are serverless infrastructure (like Amazon lambda), or AI-specific offering. In the end, _the_ cloud doesn't exist. There is no single cloud infrastructure where developers can deploy their digital services seamlessly without having to worry about the infrastructure. What we have is a set of siloed cloud infrastructures that can be rented to deploy these services, but there is no _single global and interoperable cloud_ enabling the deploying of heterogeneous services on top of all of the available infrastructure from cloud providers.

- __Remove the corporate-owned silos of data__, enabling seamless data migration (and potentially returning users the control of their data).
  - _Why?_ Our data is scattered all over the Internet. Different social networks, different email providers, different storage services, etc. I don't know about you, but this is a complete mess. There is no way to migrate your tweets easily from Twitter to Farcaster. What the heck, I don't even know one can even download all of their tweets to back them up in case Twitter ends up disappearing. But even if we could, the data format in which we download them may not even be compatible with other services, so there is a limit in what we can do with them. Building a global cloud maintained by heterogeneous infrastructure would require a decentralized data representation system that abstracts services from handling data hosted in this infrastructure as if it was stored in a single machine. All the innovation for this could build many of the _pipes_ required to finally address one of the issues that frustrates me the most about the current Internet... _data management._

- __Building a [Greener](https://fission.codes/blog/building-a-greener-internet/)__ (and potentially more efficient) __Internet__
  - _Why?_ A decentralized infrastructure would enable decentralized data storage and reduced data transfer through local-first edge apps, caching by design, and location aware data exchange. All of this contributes to the implementation of energy efficient computing and reducing a lot of the _"waste"_ introduced by the current Internet architecture. 

- __Reducing costs of compute and storage infrastructure.__
  - _Why?_ Cloud services are expensive. Once you've _married_ with a cloud provider for your application or service they have all the leverage. They set high barriers for you to migrate so you are locked with them, independently of how much they rise their prices. Even more, your future is locked to theirs to the point that they may get you [bankrupt](https://www.forbes.com/sites/forbestechcouncil/2022/04/19/cloud-costs-may-bankrupt-you-heres-how-to-fight-back/). An heterogeneous pool of infrastructure providers increases the competition and developers' leverage.

- Pooling investment for new infrastructure and innovation.
  - _Why?_ If a cloud provider wants to increase their footprint, and deploy infrastructure to users in, let's say, Africa, they need to make an investment to deploy a data center or other support infrastructure there. This costs a lot of money and takes time. However, a decentralized Internet could benefit from the infrastructure that is already deployed in the area, or from pooling new infrastructure deployed by corporations and individuals that ends up becoming part of the network. For this to be feasible, we need to move towards that vision of a _single cloud_ and not a _cloudy sky with a lot of infrastructure silos_.

- __Support for offline-first applications__
  - _Why?_ And this may require a post of itself, as we may ask ourselves not only why a decentralized Internet favors offline-first applications, but also [why would we need offline-first applications in the first place](https://fission.codes/blog/benefits-local-first-web-app-development). Let me leave you with a few headlines of why may want offline-first applications: of course, the ability to work without an Internet connection, faster potential performance, seamless UX and collaboration, and data portability.
