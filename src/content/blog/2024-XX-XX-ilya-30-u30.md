---
title: "Ilya u30"
date: "2024-01-31"
draft: true
tags: [Wasm, runtimes, programming, Typescript]
---

► Information theory, algorithmic complexity theory, and other relevant background
----------------------------------------------------------------------------------

### [A Tutorial Introduction to the Minimum Description Length Principle](https://w.laudiacay.cool/2024/05/11/Tutorial-Introduction-to-MDL.html) [(Tutorial/Paper)](https://arxiv.org/pdf/math/0406077)

Friendly! Go read it!

### [Kolmogorov Complexity And Algorithmic Randomness](https://www.lirmm.fr/~ashen/kolmbook-eng-scan.pdf) from page 434 onwards (Textbook)

Oh this one is way less friendly haha

### [The First Law of Complexodynamics](https://scottaaronson.blog/?p=762) (Blog post) and [Quantifying the Rise and Fall of Complexity in Closed Systems: The Coffee Automaton](https://arxiv.org/pdf/1405.6903) (Paper)

TODO God I love Scott.

### [Keeping Neural Networks Simple by Minimizing the Description Length of the Weights](https://www.cs.toronto.edu/~hinton/absps/colt93.pdf) (Paper)

TODO

► Generalized Architectures and Techniques (With A Philosophical Bent) (Meatiest Section)
-----------------------------------------------------------------------------------------

### [Understanding LSTM Networks](https://w.laudiacay.cool/2024/05/09/Understanding-LSTM-Networks.html) [(Paper)](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)

### [The Unreasonable Effectiveness of Recurrent Neural Networks](https://karpathy.github.io/2015/05/21/rnn-effectiveness/) (Blog)

TODO

### [Recurrent Neural Network Regularization](https://arxiv.org/pdf/1409.2329) (Paper)

TODO

### [Relational recurrent neural networks](https://arxiv.org/pdf/1806.01822) (Paper)

TODO

### [A simple neural network module for relational reasoning](https://arxiv.org/pdf/1706.01427) (Paper)

TODO

### [Neural Turing Machines](https://arxiv.org/pdf/1410.5401) (Paper)

TODO

### [Variational Lossy Autoencoder](https://arxiv.org/pdf/1611.02731) (Paper)

TODO

### [Identity Mappings in Deep Residual Networks](https://arxiv.org/pdf/1603.05027) (Paper)

TODO

### [Order Matters: Sequence to Sequence for Sets](https://arxiv.org/pdf/1511.06391) (Paper)

TODO

### [Pointer Networks](https://arxiv.org/pdf/1506.03134) (Paper)

TODO

► Techniques and Architectures for Computer Vision
--------------------------------------------------

### [Convolutional Neural Networks for Visual Recognition](https://cs231n.github.io/) (Stanford Course Notes)

TODO

### [Multi Scale Context Aggregation By Dilated Convolutions](https://arxiv.org/pdf/1511.07122) (Paper)

TODO

### [Deep Residual Learning For Image Recognition](https://arxiv.org/pdf/1512.03385) (Paper)

TODO

### [ImageNet Classification with Deep Convolutional Neural Networks](https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf) (Paper)

TODO

► Techniques and Architectures for NLP
--------------------------------------

### [Attention is all you need](https://arxiv.org/pdf/1706.03762) (Paper) and [The Annotated Transformer](https://nlp.seas.harvard.edu/annotated-transformer/) (Jupyter Notebook/Blog)

Attention Is All You Need is the 2017 paper that introduces the transformer. The key innovation is in the title: A transformer is a model architecture that works over sequences and uses encoders and decoders. However, unlike previous architectures, it is neither RNN nor CNN. Instead, it uses an attention mechanism to take a global view of the input and focus appropriately on elements and connections between them.

The Annotated Transformer is a very useful post to read alongside the transformer paper. It does what it says on the label, walking you through the transformer, alternating between Jupyter snippets of implementation and explanations of what's going on.

Intuitively, it makes a lot of sense that this works better than an LSTM or GRU, if you just reflect on what happens when you read anything complex. Imagine how difficult a time you'd have if you couldn't move around freely to focus on different areas of the subject matter, but instead had to move through it rigidly one word at a time.

Key insight: how does a transformer work?

1.  Embeds the inputs and adds a "positional encoding" feature to them (more about this mechanism later- it's really nifty)
2.  Perform multi-head attention on the inputs (this picks out what's important)
3.  .... TODO ... finish

TODO

### [Deep Speech 2: End-to-End Speech Recognition in English and Mandarin](https://arxiv.org/pdf/1512.02595) (Paper)

TODO

### [Scaling Laws for Neural Language Models](https://arxiv.org/pdf/2001.08361) (Paper)

TODO

### [Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/pdf/1409.0473) (Paper)

TODO

► Grab Bag
----------

### [Machine Super Intelligence](https://www.vetta.org/documents/Machine_Super_Intelligence.pdf) (PhD Thesis)

TODO

### [Neural Message Passing for Quantum Chemistry](https://arxiv.org/pdf/1704.01212) (Paper)

TODO

### [GPipe: Easy Scaling with Micro-Batch Pipeline Parallelism](https://arxiv.org/pdf/1811.06965) (Paper)

TODO
