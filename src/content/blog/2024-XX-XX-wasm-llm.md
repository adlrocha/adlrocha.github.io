---
title: "LLM and ML in Wasm"
date: "024-01-31"
draft: true
tags: [Wasm, LLM, ML, research]
---

I came up with an (obvious) idea the other day that led to me to the following question: _"would it be possible to run LLM inference from Wasm?"_. Being able to compile ML models into Wasm would allow to run them in a heterogeneous set of runtimes and devices, including mobile or the browser. However, would running these models in Wasm offer access to the low-level computational resources of the device required for an efficient execution?

And this is how my journey into ML in Wasm started.

## `wasi-nn`
A simple DuckDuckGo search for _"ML in Wasm"_ immediate throws [`wasi-nn`](https://github.com/WebAssembly/wasi-nn?tab=readme-ov-file) as the key result. `wasi-nn` is a WASI API spec proposal for performing ML inference in Wasm. The proposal is not exactly oriented for the execution of ML models inside Wasm, but to expose ML capabilities to Wasm modules. WebAssembly programs that want to use a host's ML capabilities can access these capabilities through wasi-nn's core abstractions: backends, graphs, and tensors.

>  "the nature of ML inference makes it amenable to hardware acceleration of various kinds; without this hardware acceleration, inference can suffer slowdowns of several hundred times. Hardware acceleration for ML is very diverse — SIMD (e.g., AVX512), GPUs, TPUs, FPGAs — and it is unlikely (impossible?) that all of these would be supported natively in WebAssembly".

The best way to understand what `wasi-nn` proposes is to read [the proposed API](https://github.com/WebAssembly/wasi-nn/blob/main/wit/wasi-nn.wit). It basically exposes to Wasm ways to create tensors, load a computational graph from a specific ML framework like Tensorflow or pyTorchh, and triggering inferences against a specific backend, as shown in the API walkthrough from the proposal:
```rust
// Load the model.
let encoding = wasi_nn::GRAPH_ENCODING_...;
let target = wasi_nn::EXECUTION_TARGET_CPU;
let graph = wasi_nn::load(&[bytes, more_bytes], encoding, target);

// Configure the execution context.
let context = wasi_nn::init_execution_context(graph);
let tensor = wasi_nn::Tensor { ... };
wasi_nn::set_input(context, 0, tensor);

// Compute the inference.
wasi_nn::compute(context);
wasi_nn::get_output(context, 0, &mut output_buffer, output_buffer.len());
```
[This post](https://bytecodealliance.org/articles/implementing-wasi-nn-in-wasmtime) is a good walk-through the implementation rationale. And you may wondering, __"is someone already leveraging `wasi_nn` for their application?__ They are.  
Second State has already been tinkering with `wasi-nn` to run LLM inference as shown in [this post](https://www.secondstate.io/articles/wasm-runtime-agi/), [this talk](https://www.youtube.com/watch?v=upNNI_b4tNY), and [`run-llm.sh`](https://www.secondstate.io/articles/run-llm-sh/)

## Re-write in Rust/Wasm
After going through `wasi-nn` I thought __"what if one could rewrite the inference graph of a model in line with what [llama.cpp](https://github.com/ggerganov/llama.cpp) did to run inference over Llama using C++?"__. "Rewriting in Rust" is in some cases not a good idea, and this is one of those. The closes that I could find of running ML inference in rust is [`tch-rs`](https://github.com/LaurentMazare/tch-rs/tree/main), that provides a wrapper around the C++ pyTorch API. However, the backend would still be C++, and this is far from allowing a Wasm compiled inference implementation. Someone has even tried to [re-write a model from scratch from Python into Rust](https://ngoldbaum.github.io/posts/python-vs-rust-nn/) with lower improvements than the ones original expected.

But if we think this through, it actually makes sense. One of the key requirements to do ML inference (or training), is to perform vast quantities of matrix multiplications. For this, to accelerate these operations we use GPUs, and the most amenable language to interact with GPUs is C++. We can write wrappers and bindings for the ML frameworks in many languages but for now, the backend will still be C++-based and compiled to specific hardware. So we may be far from "compiling once and running anywhere" for AI.

![Rewrite in rust](../images/rewrite_rust.jpg)

## ONNX Runtime
Apparently [ONXX Runtime](https://onnxruntime.ai/) may be the de-factor runtime to run models implemented with different frameworks in an heterogeneous set of backends. __" ONNX Runtime is compatible with different hardware, drivers, and operating systems, and provides optimal performance by leveraging hardware accelerators where applicable alongside graph optimizations and transforms"__. ONNX offeres ways to run inference over models in mobile devices and [web browsers](https://www.youtube.com/watch?v=vYzWrT3A7wQ).

How does this runtime works? You train your model in a ML framework like Tensorflow, pyTorchh or even the traditional Scikit-learn, export the model into an ONNX format, and then provide the output to the ONNX runtime to run inferences for it in any of the provided backends supported by the runtime. So basically, as long as your model can be exported into an ONNX format, you can leverage the runtime to run in the cloud, the edge, the browser, etc.

Similar to ONNX runtime, there's a project called [MLC LLM](https://github.com/mlc-ai/mlc-llm) focused on the deployment of LLMs over different runtimes.

## Conclusion
* Runtime hooks to ML frameworks and inference.
* The ML framework (PyTorch, Tinygrad, etc.) handle the compilation of code to run in the specific hardware.
