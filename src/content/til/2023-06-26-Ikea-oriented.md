---
title: "Ikea-oriented development"
date: "2023-06-28"
draft: false
tags: [software-dev, design patterns]
---

# Ikea-oriented development
Today I want to share an interesting idea that I feel all software engineers will appreciate in some way (either because they strong agree or disagree): [Ikea-oriented development](https://taylor.town/ikea-oriented-development).

The TL;DR idea behind this approach to software engineering is:

> - Packaging is the product: Delivering data is expensive.
> - Pre-packaged depedencies: If you can’t bundle allen keys for your hex fasteners, stick to screws. Likewise, if you lack the engineering resources to support multiple SDKs, make damn sure your web API is easy enough to access with curl. [...] My MarioKart 64 cartridge probably won’t inform me that Python2.7 was deprecated. If your program isn’t designed to work 20 years from now, it won’t.
> - Make experimentation effortless. If tweaking and testing your codebase is a pain, devs will avoid making changes. Nobody wants to wade through spaghetti then wait 40 seconds for recompilation.
> - Embrace reliable mainstream formats. Use common interfaces like CSV, webhooks, JSON, and RSS. Products are way more useful when you can plug them into GNU utils, IFTTT, Siri Shortcuts, etc.
> - Write code that can be replaced. Writing code is easy, but editing code is hard. Make inputs and outputs extremely clear; everything between is disposable detail. We intuitively call irreplacable code “complicated” or “spaghetti”.
