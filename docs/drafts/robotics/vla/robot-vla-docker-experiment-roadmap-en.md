---
title: "Robot VLA Paper Reading Roadmap: From Understanding Models To Designing Reproducible Experiments"
description: "A paper-first roadmap for robot VLA models: understand models, datasets, evaluation, and humanoid systems first, then keep Docker reproduction work in separate experiment notes."
date: 2026-05-15
tags: [Robotics, VLA, Paper Reading, LeRobot, Model Experiments]
lang: en
translationKey: robotics/vla/robot-vla-docker-experiment-roadmap
pinned: false
draft: true
---

I originally framed this series as a Docker experiment track, but the better structure is:

```text
Main articles = paper reading and technical understanding
Experiment notes = Docker reproduction, commands, environments, and failure logs
```

The reason is practical. If the main articles are full of installation commands, the paper ideas get buried. If the articles only discuss concepts, they never become usable. So this series separates the two layers: first understand the papers, then verify selected claims in dedicated experiment notes.

## Writing Principles

Each main article should answer six questions:

- What problem does the paper or system address?
- What are the inputs, outputs, and action representation?
- What data does it use, and how does data shape its limits?
- What are the key modeling or training choices?
- How is it evaluated, and how should the results be read?
- What are its limitations, and what should experiments verify later?

Docker, the local M1 Pro, cloud GPUs, commands, and dependency issues still matter, but they belong in experiment notes. The main articles only keep a short “reproduction note” section.

![Robot VLA reading route map](/images/robotics/vla/vla-route-map.svg)

*Self-drawn map for the whole series: action-token models, flow-matching models, evaluation, fine-tuning, and humanoid VLA systems in one frame.*

## Paper-Reading Quality Bar

Each main article should pass this stricter review before it is treated as polished:

| Check | Standard |
| --- | --- |
| Original figures/tables | Embed key original figures when the paper/source license clearly permits reuse, with source and license in the caption; otherwise link the original and use self-drawn explanatory diagrams |
| Equations | Use the paper's notation when possible; mark simplified teaching equations as abstractions |
| Hard facts | Parameter counts, dataset sizes, task counts, memory, and evaluation settings must trace back to the paper or official docs |
| Route comparison | Explain how the paper differs from at least one neighboring route such as OpenVLA, π0, SmolVLA, LIBERO, or GR00T |
| Experiment boundary | Separate paper understanding from later Docker reproduction claims |

## Where M1 Pro And Docker Fit

My local machine is a MacBook Pro M1 Pro. It is useful for:

- Reading papers and code.
- Inspecting configurations.
- Loading small data samples.
- Checking observation/action schemas.
- Writing experiment scripts and logs.

It is not the main target for large VLA inference, full LIBERO evaluation, LoRA fine-tuning, or openpi training. Apple Silicon PyTorch acceleration uses native macOS MPS, which is not the same as CUDA inside a regular Linux Docker container.

The experiment notes will use a two-layer compute route:

```text
M1 Pro Docker
  -> data, schemas, lightweight checks

Cloud NVIDIA GPU Docker
  -> inference, LIBERO eval, LoRA/post-training
```

The main articles will not repeat those commands.

## The 9 Main Articles

### 1. VLA Introduction: From VLM To Robot Policy

Goal: build the mental model for reading VLA papers. The focus is why VLA is not just a normal VLM, and why action representation is the first thing to inspect.

### 2. Robot Dataset Papers: Open X-Embodiment, DROID, And LeRobotDataset

Goal: understand how data shapes VLA capability. Open X-Embodiment emphasizes cross-embodiment learning, DROID emphasizes real-world robot data collection, and LeRobotDataset provides a reproducibility interface.

### 3. LeRobot: From VLA Papers To Reproducible Robot Learning Tooling

This is not an installation tutorial. It explains how dataset, processor, policy, training, and evaluation interfaces map paper concepts into runnable code.

### 4. OpenVLA Paper Reading: How An Open VLM Becomes A Robot Policy

OpenVLA is an important open baseline for the action-tokenization route. The focus is VLM backbone, robot data, action tokens, and evaluation.

### 5. SmolVLA Paper Reading: Why Low-Cost VLA Matters

SmolVLA helps frame affordable and efficient robotics. The focus is not merely whether it runs on smaller hardware, but how lower cost changes research iteration.

### 6. π0 / π0.5 / openpi Paper Reading: The Flow-Matching Route For VLA

This article covers a different action modeling route: a VLM provides context, while an action expert uses flow matching to generate continuous action chunks.

### 7. LIBERO Paper Reading: Why VLA Evaluation Cannot Be Just Demo Videos

This article explains benchmark design and evaluation protocol: lifelong learning, knowledge transfer, success rate, and failure analysis.

### 8. VLA Fine-Tuning And Post-Training: LoRA, Small-Data Adaptation, And Norm Stats

This article explains the post-training pattern without turning into a training command guide. The key difference from LLM fine-tuning is action, coordinate frames, normalization, and evaluation.

### 9. GR00T Paper Reading: The System Route For Humanoid VLA

GR00T expands the view from tabletop manipulation to humanoid VLA systems. The focus is dual-system architecture, data generation, humanoid embodiment, and deployment boundaries.

## How Experiment Notes Will Attach

After the main paper-reading articles, experiment notes can be written separately:

```text
E1. Load LeRobotDataset in M1 Pro Docker
E2. Print observation/action/language schemas
E3. Minimal OpenVLA inference
E4. Small SmolVLA evaluation
E5. openpi dummy inference
E6. Small LIBERO evaluation
E7. Minimal LoRA/post-training loop
```

Each experiment note records the environment, command, output, failure, and next step without interrupting the paper explanation.

## References

- [RT-2](https://arxiv.org/abs/2307.15818)
- [Open X-Embodiment](https://arxiv.org/abs/2310.08864)
- [DROID](https://arxiv.org/abs/2403.12945)
- [OpenVLA](https://arxiv.org/abs/2406.09246)
- [SmolVLA](https://arxiv.org/abs/2506.01844)
- [π0](https://arxiv.org/abs/2410.24164)
- [π0.5](https://arxiv.org/abs/2504.16054)
- [LIBERO](https://arxiv.org/abs/2306.03310)
- [GR00T N1](https://arxiv.org/abs/2503.14734)
- [LeRobot docs](https://huggingface.co/docs/lerobot/main/index)
- [openpi](https://github.com/Physical-Intelligence/openpi)
