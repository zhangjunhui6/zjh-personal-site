---
title: 机器人 VLA 论文精读路线：从看懂模型到设计复现实验
description: 以论文讲解为主线梳理机器人 VLA：先读懂模型、数据、评估和系统路线，再把 Docker 复现实验拆成单独实验篇。
date: 2026-05-15
tags: [机器人, VLA, 论文精读, LeRobot, 模型实验]
lang: zh
translationKey: robotics/vla/robot-vla-docker-experiment-roadmap
pinned: false
draft: true
---

我最初想把这组内容写成 Docker 实验连载，但更合理的结构应该是：

```text
主文 = 论文精读和技术路线理解
实验篇 = Docker 复现、环境、命令、失败记录
```

原因很简单：VLA 还在快速发展，如果主文堆太多安装命令，读者很容易被环境细节带偏；但如果只讲概念，不做实验，又会停留在纸面理解。所以这组文章分两层：先把论文讲清楚，再用独立实验篇验证。

## 写作原则

每篇主文优先回答六个问题：

- 这篇论文或系统想解决什么问题。
- 它的输入、输出和 action representation 是什么。
- 它用什么数据，数据如何影响能力边界。
- 它的模型结构或训练目标有什么关键取舍。
- 它如何评估，结果应该怎么读。
- 它的局限是什么，后续实验该验证什么。

Docker、本机 M1 Pro、云 GPU、命令和依赖仍然重要，但它们放在实验篇。主文只保留一小节“复现实验另篇”，说明后续要验证哪些点。

## 每篇主文怎么读

精修后的主文都会先给一张“论文地图”。它不是摘要，而是读论文时的抓手：

| 模块 | 作用 |
| --- | --- |
| 快速读法 | 先判断本文是不是你当前要读的那一层 |
| 论文地图 | 把核心问题拆成可检查的变量 |
| 原论文图表导航 | 指出原文哪些 Figure / Table / Section 必须看，以及每张图解决什么问题 |
| 自绘结构图 | 用简化图重画模型、数据或评估流程，避免只堆文字 |
| 核心公式 | 尽量对齐论文原符号；如果是教学抽象，必须明确说明 |
| 机制讲解 | 解释模型、数据、训练或评估为什么这样设计 |
| 局限与实验边界 | 明确哪些结论需要后续 Docker 实验验证 |

你可以先读每篇的“快速读法”和“论文地图”，确认自己知道这篇文章的工作；再对照原论文图表读“自绘结构图”和“核心公式”；最后把“复现实验另篇”当作后续实验清单。

原图策略也要讲清楚：凡是原论文或官方来源明确给出可复用授权，例如 arXiv 页面标注 CC BY 4.0 的图，我会把关键原图放进站内，并在图注里写明论文名、Figure 编号、来源链接和许可；授权不清的图不会直接落地到本站，而是给出原文链接，再配自绘结构图和逐图讲解。这样既能保留论文精读的专业性，也不把文章变成来源不明的截图合集。

![Robot VLA reading route map](/images/robotics/vla/vla-route-map.svg)

*自绘图：整套连载的阅读地图，把 action-token、flow-matching、evaluation、fine-tuning 和 humanoid VLA 放在同一个坐标系里。*

## 精修验收规则

每篇主文后续按下面规则检查：

| 检查项 | 合格标准 |
| --- | --- |
| 原图锚点 | 至少写出关键 Figure / Table / Section 的编号或标题 |
| 公式 | 论文有明确公式时优先对齐原符号；教学公式要标注“抽象版” |
| 硬事实 | 参数量、数据量、任务数、显存、评估设置必须能追溯到论文或官方文档 |
| 对照关系 | 至少说明它和前后文章中一种技术路线的差异 |
| 实验边界 | 明确哪些只是论文理解，哪些后续 Docker 实验验证 |

## M1 Pro 和 Docker 的位置

我的本机是 MacBook Pro M1 Pro。它适合做：

- 读论文和代码。
- 看配置。
- 加载小数据样本。
- 检查 observation/action schema。
- 写实验脚本和日志模板。

它不作为大 VLA 正式推理、LIBERO 大规模评估、LoRA 微调或 openpi 训练的主力环境。Apple Silicon 的 PyTorch MPS 是 macOS 原生加速路线，不等同于普通 Linux Docker 容器里的 CUDA。

所以实验篇采用两层路线：

```text
M1 Pro Docker
  -> 数据、schema、轻量检查

Cloud NVIDIA GPU Docker
  -> inference、LIBERO eval、LoRA/post-training
```

这个判断会在实验篇展开，主文不反复写命令。

## 9 篇主文路线

### 1. VLA 入门：从 VLM 到 robot policy

目标是建立读 VLA 论文的心智模型。重点讲 VLA 为什么不是普通 VLM，为什么 action representation 是第一关键。

读完应该能回答：

- VLA 的输入和输出是什么。
- 动作为什么比文本更难。
- 论文中应该优先看哪些字段和指标。

### 2. 机器人数据集论文：Open X-Embodiment、DROID 与 LeRobotDataset

目标是理解数据如何决定 VLA 能力边界。Open X-Embodiment 讲跨 embodiment，DROID 讲真实世界采集，LeRobotDataset 讲复现接口。

读完应该能回答：

- 跨机器人数据为什么困难。
- action schema 和 metadata 为什么重要。
- 社区可复现数据格式有什么价值。

### 3. LeRobot：从 VLA 论文到可复现机器人学习工具链

这篇不是安装教程，而是工具链解读。重点讲 dataset、processor、policy、training、evaluation 如何把论文概念落到代码接口。

读完应该能回答：

- 论文里的 dataset 在工具链里对应什么。
- processor 为什么是 VLA 复现的关键层。
- policy 接口如何连接模型和环境。

### 4. OpenVLA 论文精读：开源 VLM 如何变成 robot policy

OpenVLA 是 action tokenization 路线的重要开放基线。重点讲 VLM backbone、robot data、action token 和评估方式。

读完应该能回答：

- 为什么 OpenVLA 要把动作转成 token。
- Open X-Embodiment 对它有什么作用。
- 它作为开源基线的价值和局限在哪里。

### 5. SmolVLA 论文精读：为什么低成本 VLA 很重要

SmolVLA 用来理解 affordable and efficient robotics。重点不只是“能不能在小机器上跑”，而是小模型如何改变研究迭代方式。

读完应该能回答：

- 低成本 VLA 的研究意义是什么。
- 社区数据和小模型分别解决什么。
- 低成本路线牺牲了哪些能力。

### 6. π0 / π0.5 / openpi 论文精读：VLA 的 flow matching 路线

这篇讲另一条动作建模路线：VLM 负责理解，action expert 用 flow matching 生成连续 action chunk。

读完应该能回答：

- π0 为什么不只把动作当 token。
- action expert 和 flow matching 分别做什么。
- π0.5 的 open-world generalization 关注什么。

### 7. LIBERO 论文精读：VLA 评估为什么不能只看 demo

这篇讲 benchmark 和评估协议。重点是 lifelong learning、knowledge transfer、success rate 和失败类型。

读完应该能回答：

- LIBERO 在测什么能力。
- success rate 应该怎么拆开读。
- 为什么失败分析比单个总分更重要。

### 8. VLA 微调与 post-training：LoRA、小数据适配和 norm stats

这篇讲后训练范式，不写训练命令。重点是 VLA 微调和 LLM 微调的差异：动作、坐标系、归一化和评估闭环。

读完应该能回答：

- LoRA 在 VLA 里解决什么，不解决什么。
- 数据映射和 norm stats 为什么危险。
- 小数据适配实验应该如何设计对照。

### 9. GR00T 论文精读：人形机器人 VLA 的系统路线

GR00T 用来把视野从桌面 manipulation 扩展到 humanoid VLA。重点讲双系统架构、数据生成、人形 embodiment 和部署边界。

读完应该能回答：

- 人形机器人 VLA 为什么更像系统论文。
- System 1 / System 2 分工如何理解。
- GR00T N1、N1.5、N1.7 这类版本应该怎么追踪。

## 实验篇怎么接

等主文读清楚后，再单独写实验篇。实验篇可以按下面结构展开：

```text
E1. M1 Pro Docker 加载 LeRobotDataset
E2. 打印 observation/action/language schema
E3. OpenVLA 最小 inference
E4. SmolVLA 小规模 eval
E5. openpi dummy inference
E6. LIBERO 少量 episode 评估
E7. LoRA/post-training 最小闭环
```

每篇实验篇都记录环境、命令、输出、失败和下一步，但不挤进论文主文。

## 参考资料

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
