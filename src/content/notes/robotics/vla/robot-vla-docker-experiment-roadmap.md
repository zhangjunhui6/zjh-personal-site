---
title: 机器人 VLA Docker 实验连载：从看懂模型到跑通验证
description: 为机器人 VLA 模型整理一条以 Docker 为边界的学习路线：本机 M1 Pro 做轻量验证，云端 NVIDIA GPU 做推理、评估和微调。
date: 2026-05-15
tags: [机器人, VLA, Docker, LeRobot, 模型实验]
lang: zh
translationKey: robotics/vla/robot-vla-docker-experiment-roadmap
draft: false
pinned: true
---

我接下来想系统补一条机器人 VLA 的学习线。

目标不是只读论文，也不是把命令堆成教程，而是用一组文章把三个问题串起来：

- 现在机器人 VLA 模型到底发展到哪一步。
- 不同路线，比如 OpenVLA、SmolVLA、π0 / π0.5、GR00T，核心差异是什么。
- 我怎样在可复现的 Docker 环境里真正跑实验、看数据、评估模型、记录失败。

这篇是连载总览。后面的每篇文章都会尽量保持一个固定节奏：先讲一个概念判断，再跑一个最小实验，最后记录结果和失败点。

## 基本判断：M1 Pro 可以学习，但不是 VLA 主力算力

我的本机是 MacBook Pro M1 Pro。它适合做 VLA 学习里的很多前置工作：

- 读代码和配置。
- 跑 LeRobot 安装检查。
- 加载小规模公开数据集。
- 查看 observation、state、action、language instruction 的 schema。
- 做 CPU 小 demo 或无模型的输入输出验证。

但如果把所有实验都放进 Docker，本机就不适合作为大 VLA 模型的主力推理和微调机器。

原因很直接：

- Docker Desktop 在 macOS 上跑的是 Linux 虚拟化环境，不能像原生 macOS Python 一样直接使用 PyTorch MPS。
- Apple Silicon 的 PyTorch GPU 加速依赖 Metal / MPS，更适合本机原生环境，不适合作为 Linux Docker 内的通用 GPU 路线。
- openpi 这类 VLA 工具链明确把主环境放在 Ubuntu + NVIDIA GPU 上，推理和微调都按 CUDA 生态设计。

所以这组文章采用两层实验路线：

```text
M1 Pro 本机 Docker
  -> 环境检查
  -> 数据集读取
  -> schema / action shape / 配置理解
  -> 轻量 CPU 验证

云端 NVIDIA GPU Docker
  -> OpenVLA / SmolVLA / openpi 推理
  -> LIBERO 小规模评估
  -> LoRA 或小数据微调
  -> 记录显存、速度、失败样例
```

这不是退而求其次，而是把学习路径拆成能稳定推进的两段：本机负责理解，云端负责算力。

## 每篇文章都要有实验等级

为了避免把概念文章写成“看起来能跑”的样子，后续每篇都会标注实验等级。

```text
实验等级：概念/代码阅读
实验等级：本机 Docker 已验证
实验等级：云 GPU Docker 已验证
```

如果只读论文或代码，就明确写“概念/代码阅读”。如果在 M1 Pro Docker 里只跑了数据集检查，就不把它包装成模型推理。如果模型推理依赖远端 CUDA，就把云端机器、显卡、镜像和命令写清楚。

我希望每篇文章至少留下这些信息：

- 环境：本机还是云端，CPU/GPU，Docker 镜像。
- 命令：实际运行的 `docker run`、`docker compose` 或容器内命令。
- 输入：数据集、prompt、observation/action 字段。
- 输出：shape、日志、指标、截图或失败样例。
- 失败：依赖、显存、字段不匹配、速度、benchmark 不稳定等问题。

## 连载路线

### 1. VLA 入门：机器人怎么从图像和语言输出动作

这篇先建立心智模型。

VLA 的核心不是“机器人接了一个大语言模型”，而是把视觉观察、语言指令和机器人状态一起送进模型，再输出可执行的动作或动作序列。

重点会讲：

- VLA 和 VLM 的区别。
- observation、instruction、proprioception、action chunk 分别是什么。
- 为什么机器人动作不能只当成普通文本 token。
- VLA 和传统机器人栈、模仿学习、强化学习之间的关系。

实验只做本机 Docker 的数据结构示例，不跑大模型。

### 2. 机器人数据集：Open X-Embodiment、DROID、LeRobotDataset

VLA 的难点很大一部分不在模型，而在数据。

不同机器人有不同相机、关节、夹爪、控制频率、坐标系和 action space。Open X-Embodiment、DROID、LeRobotDataset 这些工作，本质上都在回答一个问题：机器人数据能不能像语言数据一样被组织、混合和复用。

实验目标：

- 在本机 Docker 里安装 LeRobot。
- 加载一个公开 LeRobot 数据集。
- 打印 camera、state、action、language 字段。
- 记录 action shape 和 episode 元数据。

### 3. LeRobot 上手：把实验环境装进 Docker

这篇专门整理实验环境。

我会把 Docker 分成两套：

- `arm64` 本机镜像：面向 M1 Pro 的数据读取和轻量验证。
- `amd64 + CUDA` 云端镜像：面向 NVIDIA GPU 的模型推理、评估和微调。

重点不是追求一个万能镜像，而是把边界写清楚：哪些命令本机应该能跑，哪些命令必须去云端 GPU。

### 4. OpenVLA 精读：VLM 如何变成 robot policy

OpenVLA 是理解开源 VLA 的好入口。

它把视觉编码器、LLM backbone 和动作 token 连接起来，展示了一个 VLM 如何被改造成 robot policy。它也很适合讨论 LoRA 微调、动作离散化和 Open X-Embodiment 预训练。

实验路线：

- 本机 Docker：读配置、整理输入输出字段。
- 云 GPU Docker：跑一次官方 inference 或最小 demo。

### 5. SmolVLA：低成本 VLA 的第一组可跑实验

SmolVLA 的价值在于它把 VLA 实验门槛往下拉。

这篇会关注：

- 为什么小模型对个人实验更重要。
- LeRobot 生态如何组织 policy、dataset、benchmark。
- SmolVLA 在本机能做哪些轻量检查，在云 GPU 上能做哪些正式评估。

实验目标是用 LeRobot 跑一个最小评估，而不是一上来追求高成功率。

### 6. π0 / π0.5 / openpi：flow matching action expert

π0 这条路线很适合理解动作生成从 token 到连续轨迹的转向。

这篇会拆：

- VLM + action expert 的结构。
- flow matching 为什么适合连续动作。
- π0、π0-FAST、π0.5 在 openpi 里的差异。
- 为什么 openpi 官方把 NVIDIA GPU 当作主运行环境。

实验放在云端 NVIDIA Docker：先跑 dummy inference，再看 action chunk 的形状和延迟。

### 7. LIBERO 评估：怎么判断 VLA 真的会做任务

看 VLA demo 很容易被视频说服，但真正做实验必须回到 benchmark。

这篇会用 LIBERO 作为第一组评估对象，记录：

- task suite。
- episode 数。
- success rate。
- 推理延迟。
- 失败样例。

目标不是刷榜，而是建立一个以后能反复复用的评估模板。

### 8. 微调实验：LoRA 或小数据 post-training

等数据和评估都跑通后，再进入微调。

这篇不追求“微调后立刻很强”，而是把流程跑完整：

- 数据映射。
- normalization statistics。
- checkpoint 加载。
- LoRA 或轻量 post-training。
- 评估前后对比。

如果算力不够，就先用更小的 policy 做 baseline，再说明 VLA 微调多出来的成本和复杂度。

### 9. GR00T：人形机器人 VLA 的系统路线

GR00T 更像是一条系统工程路线。

它关注的不只是桌面机械臂，还包括人形机器人、双手操作、人类第一视角视频、合成数据、低层动作控制和高层推理之间的分工。

这篇以论文、模型卡和部署架构为主。实验只做容器环境、接口和数据格式理解，不把 GR00T 当作本机可直接上手的大模型。

## 第一阶段验收标准

第一阶段不急着微调。先让学习系统站起来。

```text
本机 Docker
  -> Docker 能启动
  -> LeRobot 能安装或输出版本信息
  -> 能加载一个公开数据集
  -> 能打印 action shape

云 GPU Docker
  -> 容器内能看到 nvidia-smi
  -> 能下载一个 VLA checkpoint
  -> 能跑一次 policy inference
  -> 能跑一个小规模 LIBERO eval
```

只有这些打通了，后面的 OpenVLA、SmolVLA、openpi 和微调文章才不会变成空中楼阁。

## 参考资料

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
