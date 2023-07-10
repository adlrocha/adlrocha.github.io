---
title: "Reducing the size of Solidity contracts"
date: "2023-07-10"
draft: true
tags: [blockchain, solidity, Ethereum, smart-contract]
---

# Reducing the size of Solidity contracts
I am currently working on a project that we call IPC (InterPlanetary Consensus). We are now implementing the core logic of the protocol in a set of Solidity contracts. Unfortunately, the implementation of one of the contracts of the protocol, the `Gateway`, was too large to be deployed (over the `24KB` limit), so we had to figure out ways to reduce its size. [This post](https://ethereum.org/en/developers/tutorials/downsizing-contracts-to-fight-the-contract-size-limit/), is a great introduction of the different approaches to fight the contract size limit. And in this quick write-up I will share chronologically how we used each of these approaches and the practical impact they had.  

## Optimize the code

## Separate the code through libraries

## EIP-2535: Diamond contract

### Important references
- [Understand how storage and state is laid out in contracts](https://docs.soliditylang.org/en/v0.8.20/internals/layout_in_storage.html)
- [Understand how delegated calls work](https://eip2535diamonds.substack.com/p/understanding-delegatecall-and-how)