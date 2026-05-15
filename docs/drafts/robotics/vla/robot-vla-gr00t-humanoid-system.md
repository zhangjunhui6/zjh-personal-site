---
title: "GR00T 论文精读：人形机器人 VLA 的系统路线"
description: "从 GR00T N1 的双系统架构、数据来源、人形机器人 embodiment、合成数据和部署边界理解 humanoid VLA。"
date: 2026-05-15
tags:
  - robotics
  - gr00t
  - humanoid
  - vla
  - paper-reading
lang: zh
translationKey: robot-vla-gr00t-humanoid-system
draft: true
---

## 快速读法

- 本文定位：GR00T 论文与系统路线精读，不展开容器部署。
- 本文任务：理解人形机器人 VLA 为什么不是桌面机械臂 VLA 的简单放大。
- 读完要能回答：GR00T 的双系统架构、人形 embodiment 和数据策略分别解决什么。
- 实验另篇：后续只做接口理解和公开 checkpoint 调研，不宣称本机复现完整系统。

GR00T 系列把 VLA 问题推到人形机器人尺度。桌面机械臂通常关注单臂 manipulation，人形机器人还要面对全身协调、双手操作、移动、平衡、传感器同步和安全部署。

这篇文章以 GR00T N1 论文为主，结合 NVIDIA 后续公开资料理解系统路线。

## 本篇读完要形成的系统地图

读 GR00T 不能只看模型名。更稳的读法是把它拆成一个 humanoid robot stack：

| 层级 | 读论文时看什么 |
| --- | --- |
| 语义推理 | 如何理解图像、语言、任务上下文 |
| 动作生成 | 如何把高层意图转成连续全身或上肢动作 |
| 数据系统 | 真机、仿真、合成数据如何组合 |
| Embodiment | 不同人形平台的动作空间和控制接口如何适配 |
| 部署边界 | 哪些能力由模型负责，哪些交给低层控制和安全系统 |

这张表能防止一个常见误读：把 GR00T 当成“更大的 VLA 模型”，而不是一个面向人形机器人的系统路线。

## 原论文图表导航

GR00T N1 论文要按系统论文读，建议优先看：

| 原文图表 | 重点看什么 | 为什么重要 |
| --- | --- | --- |
| Figure 1 数据/训练路线 | human videos、simulation / neural-generated data、real robot demonstrations 如何组成训练来源 | GR00T 的核心不是单一真机数据，而是 humanoid data flywheel |
| Figure 2: GR00T N1 Model Overview | image observation 和 language instruction 进入 VLM，VLM 输出再和 robot state/action encodings 一起进入 DiT policy | 这是 dual-system design 的总览图 |
| Figure 3: GR00T N1 Model Architecture | Eagle-2 VLM、embodiment-specific state/action encoder、DiT blocks、action decoder、noised action、cross-attention | 这是判断它是否真的支持多 embodiment 的关键图 |
| 数据混合/实验表 | real robot trajectories、human videos、synthetic datasets、simulation benchmark、Fourier GR-1 / 1X 真机结果 | 判断它是否只是仿真有效 |
| 后续版本资料 | N1、N1.5、N1.7 的公开差异 | 追踪路线演进，而不是只记一个模型名 |

GR00T 的图要和 π0 一起看：二者都强调连续动作生成，但 GR00T 把问题扩大到人形机器人系统和部署栈。

## 原图精读：dual-system design 到多 embodiment 接口

<figure>
  <img src="/images/robotics/vla/original/groot-fig2.png" alt="GR00T N1 paper Figure 2 model overview" />
  <figcaption>原图：GR00T N1 Figure 2, Bjorck et al. / NVIDIA, <a href="https://arxiv.org/abs/2503.14734">GR00T N1: An Open Foundation Model for Generalist Humanoid Robots</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

Figure 2 是 GR00T N1 的系统总览。它不是简单的“图像 + 语言 -> 动作”，而是把输入分到两个时间尺度：System 2 的 VLM 负责把 image observation 和 language instruction 变成语义 token，System 1 的 Diffusion Transformer 接收 VLM 输出、robot state 和 action encodings，生成连续 motor actions。读这张图时要把“语义理解”和“动作生成”分开，否则会把人形机器人 VLA 误读成普通 VLM 的输出头。

<figure>
  <img src="/images/robotics/vla/original/groot-fig3.png" alt="GR00T N1 paper Figure 3 model architecture" />
  <figcaption>原图：GR00T N1 Figure 3, Bjorck et al. / NVIDIA, <a href="https://arxiv.org/abs/2503.14734">arXiv:2503.14734</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

Figure 3 要重点看 embodiment-specific state/action encoder 和 decoder。人形机器人、多指手、双臂平台、单臂机械臂的 state/action 维度都可能不同；GR00T N1 不是假设它们天然共享同一个 action space，而是用 embodiment-specific adapters 把不同身体接口映射到共享 DiT policy。这里是论文最像“系统论文”的地方：模型结构本身在处理机器人本体差异。

![GR00T N1 dual-system architecture](/images/robotics/vla/groot-dual-system.svg)

*自绘图：对应 GR00T N1 Figure 2 和 Figure 3。原图展示完整系统，自绘图只保留 System 2 / System 1 的读图主线。*

## 自绘系统图

```text
camera / language ──> System 2: vision-language reasoning ──┐
                                                             ├─> System 1: diffusion transformer ──> humanoid actions
robot state / history ───────────────────────────────────────┘

real robot data + simulation + synthetic data ───────────────> joint training / adaptation
```

这张图的重点是时间尺度：System 2 更偏语义和规划，System 1 更偏实时动作生成。人形机器人动作空间更高维，因此这两个系统之间的接口比桌面机械臂更关键。

## 核心公式：人形 VLA 的条件动作生成

GR00T N1 可以抽象成条件 action chunk 生成问题。对人形机器人来说，动作不是单个末端位姿，而是一段高维 motor action：

```text
A_t = [a_t, a_{t+1}, ..., a_{t+H-1}]
H = 16
```

System 2 先把视觉和语言压成上下文：

```text
c_t = Eagle2(images_t, instruction)
```

System 1 则把 robot state、noised action 和 VLM tokens 放进 DiT action module：

```text
state_embed  = E_state^embodiment(q_t)
action_embed = E_action^embodiment(A_t^tau, tau)

v_theta = DiT(action_embed, state_embed, cross_attend=c_t)
```

如果用 flow matching 写成教学版目标，可以表达为：

```text
A_t^tau = tau A_t + (1 - tau) epsilon
L_action = E || v_theta(A_t^tau, q_t, c_t) - (A_t - epsilon) ||^2
```

但读 GR00T 时不能只停在这个公式。真正要问的是：`A_t` 到底覆盖哪些关节？低层控制器承担了什么？安全限制在哪里？不同人形平台是否共享同一个 action space？

## 论文动机：为什么是 humanoid foundation model

人形机器人被期待进入人类环境，因为它的身体结构更接近人类空间：门把手、桌面、工具、双手操作和移动路径都天然为人设计。

## 论文里的硬事实

GR00T N1 的核心事实可以先记成：

| 项目 | GR00T N1 的选择 |
| --- | --- |
| 模型类型 | humanoid VLA foundation model |
| 架构 | dual-system architecture |
| System 2 | NVIDIA Eagle-2 VLM，负责图像和语言理解 |
| System 1 | DiT-based flow-matching policy，生成连续 motor actions |
| 公开模型 | GR00T-N1-2B，约 2.2B 参数 |
| VLM 参数 | 约 1.34B 在 VLM backbone |
| Action chunk | 一次采样 16 个 actions |
| 推理延迟 | L40 GPU bf16 下采样 16-action chunk 约 63.9ms |
| 数据来源 | real-robot trajectories、human videos、synthetic datasets |
| 机器人平台 | 包含仿真多 embodiment 和 Fourier GR-1 真机部署 |
| 任务类型 | language-conditioned bimanual manipulation |

这些事实说明 GR00T 是系统路线，不只是一个单独 policy checkpoint。

## Figure 3 要怎么逐块读

GR00T N1 的 Figure 3 很容易被一眼扫过去，但它其实回答了多 embodiment humanoid VLA 的几个关键问题：

| 模块 | 读法 | 关键问题 |
| --- | --- | --- |
| Eagle-2 VLM | 视觉和语言作为 System 2，通常可冻结或少量适配 | 语义理解来自哪里，是否能泛化到新指令 |
| Embodiment-specific state encoder | 不同机器人 state 维度先映射到共享 embedding | 多机器人是否真的共享 policy，还是只共享一部分表征 |
| Embodiment-specific action encoder/decoder | 不同机器人 action 维度通过专门 MLP 进出 DiT | action space mismatch 是否被显式处理 |
| DiT blocks | noised action tokens 与 state/action tokens 自注意力，并 cross-attend VLM tokens | System 1 如何利用 System 2 的语义上下文 |
| Flow matching sampling | 迭代去噪生成动作 chunk | 连续控制路线与 OpenVLA action token 路线的差别 |

这张图的核心不是“VLM 加 diffusion”，而是：把多 embodiment 的 state/action 接口包在专门 encoder/decoder 里，再让共享 DiT policy 学连续动作生成。

但这也带来巨大复杂性：

- 自由度更多。
- 传感器更多。
- 动作空间更高维。
- 任务更长程。
- 安全要求更高。
- 数据采集更贵。

GR00T 的核心问题是：能否构建一个面向人形机器人的 foundation model，使它具备语言条件下的操作、推理和技能适配能力。

## 双系统架构怎么理解

GR00T N1 论文强调 dual-system architecture。可以用两个系统来理解：

| 系统 | 作用 |
| --- | --- |
| System 2 | 慢速、偏语义推理，理解图像和语言，规划高层意图 |
| System 1 | 快速、偏动作生成，把上下文转成连续机器人动作 |

这和前面 VLA 文章里的分工呼应：VLM 负责理解，action model 负责控制。人形机器人场景下，这种分工更重要，因为高层语义和低层动作的时间尺度差异更大。

## 为什么人形 VLA 更像系统论文

OpenVLA 或 SmolVLA 可以主要作为 model paper 阅读，而 GR00T 更像系统论文。因为它至少涉及：

- foundation model。
- 人形机器人 embodiment。
- 真机与仿真数据。
- 合成数据生成。
- 低层控制器。
- 部署硬件。
- 安全边界。

如果只看 checkpoint，就会低估它的系统复杂性。

## 数据策略：真机、仿真与合成数据

人形机器人数据很贵。GR00T 系列公开资料中反复强调数据生成和仿真工具的重要性，包括真实示范、仿真和合成轨迹。

读这部分时要问：

- 哪些数据有真实机器人 action。
- 哪些数据来自仿真或视频生成。
- 合成数据是否用于覆盖长尾场景。
- 数据如何映射到人形机器人 embodiment。
- 训练时如何避免合成数据和真实部署之间的 gap。

这也是 humanoid VLA 未来竞争的核心：谁能更高效地产生高质量动作数据。

## Embodiment 是最大变量

人形机器人不是一个统一硬件类别。不同平台会有：

- 不同身高和臂长。
- 不同手部自由度。
- 不同传感器布局。
- 不同低层控制接口。
- 不同平衡和移动能力。
- 不同计算平台。

所以读 GR00T 时要看它如何处理 embodiment adaptation。模型是否针对特定平台？是否有 adapter？动作空间是否统一？低层控制是否被论文模型覆盖？

## 和 π0 / OpenVLA 的关系

GR00T 可以放在前面技术地图里理解：

| 技术线 | 关注点 |
| --- | --- |
| OpenVLA | 开源 VLM 到 action token policy |
| SmolVLA | 低成本 VLA 和社区数据 |
| π0 | VLM + flow matching action expert |
| GR00T | 人形机器人 VLA 系统和部署路线 |

GR00T 不只是另一个模型名，而是把 VLA 放进 humanoid robot stack。

## 评估怎么看

人形机器人评估比桌面 manipulation 更难。要看：

- 是否在真实人形机器人上部署。
- 是否评估双手操作。
- 是否评估长程任务。
- 是否有新物体、新场景、新指令。
- 是否报告失败和安全边界。
- 是否区分仿真成功和真机成功。

如果论文只展示精选视频，就不能直接推断稳定能力。

## 后续版本怎么放进阅读地图

截至 2026-05-15，NVIDIA 已公开 GR00T N1、N1.5、N1.7 等资料。主文阅读建议以 GR00T N1 论文为基础，因为它解释了系统架构和研究问题；后续版本可以当作路线演进来追踪：

- backbone 是否变化。
- reasoning 能力是否增强。
- action model 是否变化。
- 数据生成流程是否升级。
- 公开模型和商业授权边界是否变化。

这样读不会被版本号带跑。

## 复现实验另篇

本文不展开容器部署。后续实验或调研篇只做：

- 梳理公开 checkpoint、模型卡和许可证。
- 画输入输出接口图。
- 对比 GR00T N1、N1.5、N1.7 的公开差异。
- 如果有轻量 demo，只记录接口和 shape，不宣称复现人形能力。

## 参考论文与资料

- [GR00T N1 paper](https://arxiv.org/abs/2503.14734)
- [NVIDIA research page: GR00T N1](https://research.nvidia.com/publication/2025-03_nvidia-isaac-gr00t-n1-open-foundation-model-humanoid-robots)
- [NVIDIA GR00T project page](https://developer.nvidia.com/project-GR00T)
- [GR00T N1.7 Hugging Face blog](https://huggingface.co/blog/nvidia/gr00t-n1-7)
- [NVIDIA newsroom: GR00T N1.7 and physical AI models](https://nvidianews.nvidia.com/news/nvidia-expands-open-model-families-to-power-the-next-wave-of-agentic-physical-and-healthcare-ai)

## 本文小结

GR00T 让我们看到 VLA 从桌面操作走向人形机器人系统。它的重点不只是模型结构，而是双系统架构、数据生成、人形 embodiment、低层控制和部署边界。读它要像读一个机器人系统，而不是只读一个多模态模型。
