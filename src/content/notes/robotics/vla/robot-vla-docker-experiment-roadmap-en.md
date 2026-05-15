---
title: "Robot VLA Docker Experiment Series: From Reading Models To Running Evaluations"
description: "A Docker-bounded learning route for robot VLA models: lightweight checks on a local M1 Pro, and inference, evaluation, and fine-tuning on cloud NVIDIA GPUs."
date: 2026-05-15
tags: [Robotics, VLA, Docker, LeRobot, Model Experiments]
lang: en
translationKey: robotics/vla/robot-vla-docker-experiment-roadmap
draft: false
pinned: true
---

I want to build a systematic learning line for robot VLA models.

The goal is not just to read papers, and not to pile commands into tutorials. I want a series of notes that connects three questions:

- Where are robot VLA models now?
- How do routes such as OpenVLA, SmolVLA, π0 / π0.5, and GR00T differ?
- How can I run experiments, inspect data, evaluate models, and record failures inside reproducible Docker environments?

This article is the overview. Each later article should keep a steady rhythm: first explain one conceptual judgment, then run a minimal experiment, then record results and failure points.

## Basic Judgment: M1 Pro Is Good For Learning, Not For Main VLA Compute

My local machine is a MacBook Pro M1 Pro. It is useful for many early steps in VLA learning:

- Reading code and configuration.
- Checking LeRobot installation.
- Loading small public datasets.
- Inspecting observation, state, action, and language instruction schemas.
- Running small CPU demos or model-free input/output validation.

But if every experiment has to run inside Docker, the local machine is not the main place for large VLA inference or fine-tuning.

The reasons are direct:

- Docker Desktop on macOS runs a Linux virtualized environment, so it cannot use PyTorch MPS the way native macOS Python can.
- Apple Silicon PyTorch acceleration depends on Metal / MPS, which is better for native local workflows than for a general Linux Docker GPU route.
- Toolchains such as openpi clearly center their main runtime around Ubuntu and NVIDIA GPUs, with inference and fine-tuning designed for CUDA.

So this series uses a two-layer experiment route:

```text
M1 Pro local Docker
  -> environment checks
  -> dataset loading
  -> schema / action shape / config understanding
  -> lightweight CPU validation

Cloud NVIDIA GPU Docker
  -> OpenVLA / SmolVLA / openpi inference
  -> small LIBERO evaluation
  -> LoRA or small-data fine-tuning
  -> record memory, speed, and failure cases
```

This is not a compromise. It splits the path into two stable parts: local work for understanding, cloud work for compute.

## Every Article Needs An Experiment Level

To avoid writing concept notes that merely look runnable, each later article will mark its experiment level:

```text
Experiment level: concept / code reading
Experiment level: local Docker verified
Experiment level: cloud GPU Docker verified
```

If I only read a paper or code, I will say "concept / code reading." If I only ran a dataset check in M1 Pro Docker, I will not package it as model inference. If inference depends on remote CUDA, I will record the cloud machine, GPU, image, and commands.

Each article should leave at least these details:

- Environment: local or cloud, CPU/GPU, Docker image.
- Commands: the actual `docker run`, `docker compose`, or in-container commands.
- Input: dataset, prompt, observation/action fields.
- Output: shapes, logs, metrics, screenshots, or failure examples.
- Failures: dependencies, memory, mismatched fields, speed, unstable benchmarks.

## Series Route

### 1. VLA Introduction: How Robots Output Actions From Images And Language

This first article builds the mental model.

The core of VLA is not "a robot with a chat model attached." It is a model that maps visual observations, language instructions, and robot state into executable actions or action sequences.

It will cover:

- The difference between VLA and VLM.
- What observation, instruction, proprioception, and action chunk mean.
- Why robot actions should not be treated as ordinary text tokens.
- How VLA relates to traditional robot stacks, imitation learning, and reinforcement learning.

The experiment stays local: Docker-based data structure examples, not large-model inference.

### 2. Robot Datasets: Open X-Embodiment, DROID, And LeRobotDataset

Much of the VLA difficulty is in the data, not only in the model.

Different robots have different cameras, joints, grippers, control frequencies, coordinate frames, and action spaces. Open X-Embodiment, DROID, and LeRobotDataset all ask a related question: can robot data be organized, mixed, and reused the way language data can?

Experiment goals:

- Install LeRobot in local Docker.
- Load a public LeRobot dataset.
- Print camera, state, action, and language fields.
- Record action shape and episode metadata.

### 3. Getting Started With LeRobot: Putting The Experiment Environment In Docker

This note is dedicated to the environment.

I will split Docker into two boundaries:

- `arm64` local image for M1 Pro dataset reading and lightweight validation.
- `amd64 + CUDA` cloud image for NVIDIA GPU inference, evaluation, and fine-tuning.

The point is not to chase one universal image. The point is to make boundaries explicit: which commands should run locally, and which commands must move to a cloud GPU.

### 4. Reading OpenVLA: How A VLM Becomes A Robot Policy

OpenVLA is a good entry point for understanding open-source VLA systems.

It connects a vision encoder, LLM backbone, and action tokens, showing how a VLM can become a robot policy. It is also a useful place to discuss LoRA fine-tuning, action discretization, and Open X-Embodiment pretraining.

Experiment route:

- Local Docker: read configuration and organize input/output fields.
- Cloud GPU Docker: run one official inference path or minimal demo.

### 5. SmolVLA: First Low-Cost VLA Experiments

SmolVLA matters because it lowers the entry point for VLA experiments.

This article will focus on:

- Why smaller models matter for personal experimentation.
- How the LeRobot ecosystem organizes policies, datasets, and benchmarks.
- Which checks can happen locally and which evaluations need a cloud GPU.

The goal is to run a minimal evaluation loop, not to chase a high success rate immediately.

### 6. π0 / π0.5 / openpi: Flow-Matching Action Expert

The π0 route is useful for understanding the shift from predicting action tokens to generating continuous action trajectories.

This article will unpack:

- The VLM + action expert structure.
- Why flow matching fits continuous actions.
- The differences between π0, π0-FAST, and π0.5 in openpi.
- Why openpi treats NVIDIA GPUs as the main runtime environment.

The experiment happens in cloud NVIDIA Docker: first dummy inference, then action chunk shape and latency.

### 7. LIBERO Evaluation: How To Tell Whether A VLA Can Actually Do Tasks

VLA demos are persuasive, but experiments have to return to benchmarks.

This article uses LIBERO as the first evaluation target and records:

- Task suite.
- Episode count.
- Success rate.
- Inference latency.
- Failure cases.

The goal is not leaderboard chasing. The goal is a reusable evaluation template.

### 8. Fine-Tuning: LoRA Or Small-Data Post-Training

After data and evaluation are working, fine-tuning can begin.

This article does not expect the model to become strong immediately. It aims to run the full process:

- Data mapping.
- Normalization statistics.
- Checkpoint loading.
- LoRA or lightweight post-training.
- Before/after evaluation.

If compute is limited, the first baseline can use a smaller policy, with the extra cost and complexity of VLA fine-tuning made explicit.

### 9. GR00T: The System Route For Humanoid Robot VLA

GR00T is closer to a systems engineering route.

It is not only about tabletop manipulation. It also includes humanoid robots, two-hand operation, first-person human video, synthetic data, low-level action control, and high-level reasoning.

This note will focus on papers, model cards, and deployment architecture. The experiment will cover container environment, interfaces, and data formats rather than treating GR00T as a large model that can be casually run locally.

## First-Stage Acceptance Criteria

The first stage does not rush into fine-tuning. It makes the learning system stand up first.

```text
Local Docker
  -> Docker starts
  -> LeRobot installs or prints version info
  -> a public dataset loads
  -> action shape can be printed

Cloud GPU Docker
  -> nvidia-smi is visible in the container
  -> a VLA checkpoint can be downloaded
  -> one policy inference run succeeds
  -> one small LIBERO eval runs
```

Only after these pieces work will the OpenVLA, SmolVLA, openpi, and fine-tuning notes avoid becoming castles in the air.

## References

- [Docker GPU support](https://docs.docker.com/desktop/features/gpu/)
- [Apple: Accelerated PyTorch training on Mac](https://developer.apple.com/metal/pytorch/)
- [LeRobot documentation](https://huggingface.co/docs/lerobot/main/index)
- [Open X-Embodiment](https://robotics-transformer-x.github.io/)
- [OpenVLA](https://openvla.github.io/)
- [SmolVLA](https://huggingface.co/blog/smolvla)
- [openpi](https://github.com/Physical-Intelligence/openpi)
- [π0](https://www.pi.website/blog/pi0)
- [π0.5](https://www.pi.website/blog/pi05)
- [π0.7](https://www.pi.website/blog/pi07)
- [NVIDIA GR00T N1.7](https://huggingface.co/blog/nvidia/gr00t-n1-7)
