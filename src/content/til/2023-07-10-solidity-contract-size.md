---
title: "Reducing the size of Solidity contracts"
date: "2023-07-10"
draft: true
tags: [blockchain, solidity, Ethereum, smart-contract]
---

# Reducing the size of Solidity contracts
I am currently working on a project that we call [IPC (InterPlanetary Consensus)](https://ipc.space/). We are now implementing the core logic of the protocol in a set of Solidity contracts. Unfortunately, the implementation of one of the contracts of the protocol, the `Gateway`, was too large to be deployed (over the `24KB` limit), so we had to figure out ways to reduce its size. [This post](https://ethereum.org/en/developers/tutorials/downsizing-contracts-to-fight-the-contract-size-limit/), is a great introduction of the different approaches to fight the contract size limit. In this quick write-up I will share chronologically how we leveraged each of these approaches to try and make our contract _"deployable"_.

- [Optimize the code](https://ethereum.org/en/developers/tutorials/downsizing-contracts-to-fight-the-contract-size-limit/#remove-functions): It may seem like an obvious one, but optimizing the code it can sometimes have a huge impact in the size of the contract. This is the first thing we tried. We removed functions, duplicate code, enabled the compiler's optimizer (yep, we compile with the `--via-ir` flag), declared custom errors, etc. We definitely reduced the size a lot, but the gateway contract was still to large to be deployed.

- [Separate the contracts](https://ethereum.org/en/developers/tutorials/downsizing-contracts-to-fight-the-contract-size-limit/#separate-your-contracts): The second approach we followed was to separate as much of the contract logic as we could into different libraries. But once again, there was a limit in the level of _"downsizing"_ that we achieved if we wanted a clean separation between libraries and the core logic.

## EIP-2535: Diamond contract
At this point we decided to embark ourselves into more complex contract separation architectures. While reading through different solutions and EIPs, we came across this [Introduction to EIP-2553 diamonds](https://eip2535diamonds.substack.com/p/introduction-to-the-diamond-standard) that perfectly illustrated what we were after, and I quote: 
> "I wanted one storage space for all state variables and one Ethereum address from which I could design and implement all functions without bytecode size limitation. And I wanted all functions to read and write to state variables directly, easily and in the same way. It would also be nice to have optional, seemless upgrade functionality: to be able to replace functions, remove them and add new functionality without needing to redeploy everything. To be able to extend the smart contract system in a consistent, systematic way after it is deployed."

It seemed like the Diamond pattern was a perfect fit for us. A diamond appears to be a single smart contract with a single Ethereum address. But internally and hidden from the outside it utilizes a set of contracts called facets for its external functions. The following two images depicts the implementation of a diamond under the hood: 

![](https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F2c35c90b-9755-4aea-93fd-58e97f38f32f_554x725.png)

![](https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F796bcd50-8c08-408a-8fb2-45fc044cd5ac_640x360.png)

Cool, right? And now instead of paraphrasing a lot of the resources we went through for the implementation to explain how they work, let me collect all of these resources and let you navigate them at will.
- [ERC-2535: Diamonds, Multi-Facet Proxy](https://eips.ethereum.org/EIPS/eip-2535)
- Sample implementation of diamond contracts ([1](https://github.com/mudgen/diamond-1-hardhat/tree/main), [2](https://github.com/mudgen/diamond-2-hardhat/tree/main), [3](https://github.com/mudgen/diamond-3-hardhat/tree/main))

I will also leave you here PR where we move from a raw contract to a diamond pattern implementation for reference: 
- [IPC subnet actor and gateway diamond implementations PR](https://github.com/consensus-shipyard/ipc-solidity-actors/pull/138)

### Important references
Finally, here I leave a bunch of interesting resources about Solidity fundamentals that may come handy if you decide to dive deep into the implementation of a diamond contract: 
- [Understand how storage and state is laid out in contracts](https://docs.soliditylang.org/en/v0.8.20/internals/layout_in_storage.html)
- [Understand how delegated calls work](https://eip2535diamonds.substack.com/p/understanding-delegatecall-and-how)
- [Layout of State in Storage variables](https://docs.soliditylang.org/en/v0.8.20/internals/layout_in_storage.html)

And this one is an interesting consequence you realize after tinkering with the diamond pattern, and is [that libraries can actually have state](https://dev.to/mudgen/solidity-libraries-can-t-have-state-variables-oh-yes-they-can-3ke9), despite what the Solidity docs say :).
