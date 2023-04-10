---
title: "My vision for a new Internet"
date: 2020-09-13T18:16:08+01:00
draft: false
tags: [ideas, web3]
---
@adlrocha - My vision for a new Internet
========================================

### Where everyone can become an ISP

| [Alfonso de la Rocha](https://adlrocha.substack.com/people/3137214-alfonso-de-la-rocha)

[![photo of outer space](https://cdn.substack.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2Ffd321da8-410f-4b63-9a3a-4157ae598c69_1000x665.jpeg)](https://cdn.substack.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2Ffd321da8-410f-4b63-9a3a-4157ae598c69_1000x665.jpeg)

I was skimming through [this paper (A Public Option for the Core)](https://storage.googleapis.com/jellyposter-store/1fb104613a0cd93669370886a8614451.pdf), when I read the following sentence in the abstract: *"In this paper we discuss both the challenges and the opportunities that **make this an auspicious time to revisit how we might best structure the Internet's infrastructure."** *And I said, well this may be something worth reflecting on and discussing in my newsletter.

I kept reading and I came across this: *"we propose the creation of a "public option" for the Internet's core backbone (...) This public option core, would run **an open market for backbone bandwidth so it could leverage links offered by third-parties**".* Opening the core of the Internet to new actors so that we don't have to rely on a small number of companies responsible for the whole infrastructure? This sounds like something worth exploring as it would really benefit the Internet and it's users (apart from being something I've been thinking about on and off for several years, but more about this in a moment).

**The current structure of the Internet**
-----------------------------------------

> *"The structure of the current Internet infrastructure -- as opposed to its architecture -- is largely an accident of history, rather than a premeditated design."*

Do you know what happens with the packets you send every time you try to watch a funny cat video? The packets leave your device through your LAN connection towards your regional ISP. From there, it goes to the backbone of the Internet. **This backbone is composed by several big ISPs responsible for forwarding packets from one point of the globe to another**, until they reach their destination (data centers connected to the backbone or other user devices in other LANs) allowing you to play your beloved videos.

[![](https://cdn.substack.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F4be4fb99-6de2-439e-b1a6-5b35cfe01980_510x424.png)](https://cdn.substack.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F4be4fb99-6de2-439e-b1a6-5b35cfe01980_510x424.png)

In the early days of the Internet, interconnection between ISPs were largely bilateral, but with the invention of BGP, a Turkish ISP didn't need to be connected to the Mexican ISP to forward packets, it could use a Spanish ISP as transient ISP to reach the packets' final destination. As a result, **the path of a typical packet would start at the originating domain, continue through one or more transit domains, and then arrive at the destination domain.**

Even more, in the early days of the Internet wide-area bandwidth was extremely expensive, so not everyone could afford to become one of these big ISPs of the backbone forwarding traffic around the world. This has also changed in recent years.

> *"Over the past five years, long-haul bandwidth has become cheaper and easily leasable: median monthly lease prices across a selection of critical city-pairs declined an average of 27% and 24% (for 10Gbps and 100Gbps links, respectively). Of course, long-haul bandwidth is still far more expensive than bandwidth inside an enterprise campus or data center, but our point (which we elaborate on below) is that it **no longer dominates the costs of ISPs.** Several large cloud and application providers -- such as Google, Amazon, and Facebook -- have gone further and built their own global high-bandwidth backbones to interconnect their data centers and to reach various colocation facilities."*

**Why change now?**
-------------------

Bandwidth has become cheaper, so now potentially anyone can become an ISP, why resorting to these big ISPs to forward our traffic when **we could build a public market of ISPs reducing our reliance on a small number of entities, making the infrastructure more resilient?**

Many of you may have heard about this but [BGP hijacking](https://en.wikipedia.org/wiki/BGP_hijacking) is a thing, and there have been several incidents in which a misbehavior or unintentional mistake over BGP prefix announcements have led to outages in the Internet (if you want to learn a bit more about this, [I wrote this paper](https://hal.inria.fr/hal-01684192/document) a few years ago on inter-domain routing protocols and securing BGP which can be a good entry point to the topic).

Even more, there are already projects that [help you start your own ISP](https://startyourownisp.com/), and in the 5G architecture already considers a [Open RAN (Radio-Access Network) interface](https://www.allaboutcircuits.com/news/what-is-open-ran-technolog-and-what-does-it-mean-for-5g/) anyone can deploy radio access infrastructure, **so why not considering the design a more open and decentralized structure for the Internet, from ISP to radio access?**

> *"[O-RAN Alliance's whitepaper](https://static1.squarespace.com/static/5ad774cce74940d7115044b0/t/5bc79b371905f4197055e8c6/1539808057078/O-RAN+WP+FInal+181017.pdf) says will allow smaller vendors to introduce their own services and allow operators to customize the network as needed. It will also allow multiple vendors to deploy their technology on the network, thereby enabling competition and reducing costs."*

These are some valid reasons to consider now the perfect time for a change in the Internet, but if you are not yet satisfied with this claim, the paper presents some other strong reasons:

-   **Outdated BGP peering policies:** "*This is not merely an academic concern. For instance, the mismatch between value flow and current peering relationships has resulted in several disputes involving Netflix traffic. In one, Netflix contracted with Cogent for transit because of its low prices, but then Comcast complained when Cogent tried to transfer that data to Comcast's network. Comcast was seen as violating network neutrality, when the more relevant dynamic was a failure of modern peering policies and their transitive nature".*

-   **[Network Neutrality](https://en.wikipedia.org/wiki/Net_neutrality)** (you may have heard a bit about this, right?)

-   **Competition in the ISP,** i.e. regulations requiring telecommunication operators to allow other service providers to use (at a fair price) their last mile lines into homes. This means that **new service providers can enter the market without building their own last-mile infrastructure.** I don't know how this is in other countries but this is a thing in Spain. We have Telefónica investing millions in next-generation infrastructure only to have other operators come and get that infrastructure (they chose not to invest in) at a low price. I can read the minds of Telefónica high managers right now seeing [the price of the stock](https://finance.yahoo.com/quote/TEF) *"Why the f*k we invested in infrastructure in the first place? We should have left others do it"*. You may think this is beneficial for end users, but **for me the lack of competition is making companies not bother to invest in innoovation and better infrastructure** (I know, I know, this is not the purpose of this publication, let's leave this discussion for some other day).

**The paper's view of the new Internet**
----------------------------------------

> *"For transit, we propose the creation of a global Public Option for the Core (POC). The **POC would be run by an international nonprofit organization that initially leases bandwidth from a set of Bandwidth Providers (BPs) and charges the users of its infrastructure to recoup these costs.** That is, while the POC is a nonprofit, it is not a charity, so we expect it to break even financially. The nonprofit nature is necessary to ensure that it focuses on its mission of providing global transit, rather than moving into more lucrative markets (such as last-mile-delivery or content and services) or avoiding poorly served areas. The initial use of leased links allows the POC to start without massive capital expenditures, but the POC might eventually acquire some links of its own.*
>
> ***For servicing the last mile, a new generation of ISPs we call LastMile-Providers (LMPs) use the POC for their transit, so they need not build a core of their own nor use transit provided by a competing ISP.** These LMPs could be existing access-oriented ISPs or newly created access providers; what is new is that they rely on the POC for transit. In addition, content and service providers (CSPs) could either directly attach to the POC (which would be the case for large CSPs), or make use of an LMP to reach the POC."*

The payment structure suggested by the authors is fairly straightforward. **Each entity pays hierarchically for what it receives.** The non-profit company pays to lease the links in the backbone network; each last-mile provider pays the POC for the network access, and customers pay the last-mile provider they are connected to. However, this structure is still fairly static, and a user wouldn't be able to attach to the last-mile giving the better service or the cheapest at different points in time according to its needs.

Finally, for the lease of links by the POC what authors suggest is **the use of auctions similar to what is done in the electricity markets.** Actually, this is something I have also been reflecting on for a while now, **the Internet has become as critical for our lives as electricity itself, so it should be treated as a critical infrastructure in the same way.** So the auction thing is not that crazy. However, this does not detract from the fact that I believe we need to decentralize more both markets ---and their corresponding infrastructures--- to make them more resilient.

> "*VCG auctions are widely used in many market and allocation mechanisms. The use of VCG auction for electricity markets (in the US and elsewhere) is probably the closest to the bandwidth auction discussed here;".*

[![man sitting on concrete brick with opened laptop on his lap](https://cdn.substack.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2Fc1d2d3d8-c67b-4c2b-af81-643de35e31da_1000x750.jpeg)](https://cdn.substack.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2Fc1d2d3d8-c67b-4c2b-af81-643de35e31da_1000x750.jpeg)

**My view of the new Internet**
-------------------------------

I completely agree with many of the proposals of the paper (I highly recommend reading it in full because it gives a lot of interesting insights I left out for the sake of brevity). **However, for me the new structure of the Internet needs to be way more open and dynamic.** In the end, it all comes to the design and implementation of a set of protocols to orchestrate and secure this complex system (like Bell Labs did with the telephone system but more open and at a global scale).

Instead of having a non-profit POC company orchestrating backbone links, **can't we have a protocol that orchestrates packet forwarding and the incentive model (i.e. payment structure) of the network?** We open the market to everyone, and we let entities compete in any of the layers proposed in the paper.

**If you are a big company and you want to invest in backbone links and infrastructure, do so. You will become a "backbone bandwidth miner" offering your bandwidth resources and global forwarding powers to other entities. If you are a last-mile provider that only wants to focus on mobile access and not household fixed connections? Go for it. If you are a mobile provide with RAN infrastructure, share your resources with other entities. And if you are an end user with spare bandwidth in your local connection that you want to share to get some profit from passers-bys? That's also possible. **

Over this architecture we would build an incentive model embedded in the Internet orchestration protocol (analogous to the auction suggested in the paper) so that all the infrastructure in the network is aggregated and offered in an open market. "Last-mile access miners" would request interconnection services to "Backbone bandwidth miners" that give service to end users. There won't be more "ISP lock-in" or access networks with better coverage, because at every time your device would be able to ask for the best service available. 

Even more, we may be able to remove the current limitation of the Internet where you need to go to the backbone of the Internet in order to communicate with the guy living in the same block. **If "last-mile access miners" can forward you packets without the help of "backbone bandwidth miners", why having to resort to them?** It would potentially solve many scalability problems.

Once again, this is quite an idealistic and science fiction vision. But let's shoot for the stars and then settle for Mars (isn't this kind of what Elon Musk did? *---Really bad pun, I apologize---*). Since I read the paper I have developed a complete thought experiment in my notebook exploring this idea and how this architecture of the Internet would work. There are several things that would need to be figured out to make this a reality (if this is even feasible), such as the final architecture; the incentive model; how to ensure fairness and quality of service; how to ensure a minimum level of service at all time for someone using this universal access, etc, etc, etc. **In the end how to make this open Internet work as good or better than our current Internet.**

To be honest, I've become very attached to this idea, and I don't rule out using some of my limited free time to explore it a bit more in depth and publicly share a first rough draft of how this new vision of the Internet would work in order to gather some feedback for my crazy ideas.

**Is such a change possible?**
------------------------------

The authors ask themselves this question in their paper, and this is a valid question I also like to ask myself every time I reflect on my visions for a new Internet, a new financial system, or a new energy system. **Maybe it is because I am (kind of) young and naïve, but with a lot of hard work, an amazing team of talented individuals, funds, and focus, I really think the change is possible.** What do you think?