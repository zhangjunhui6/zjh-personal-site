---
title: "机器人 VLA 入门：从 VLM 到 robot policy"
description: "以论文阅读为主线，理解 Vision-Language-Action 模型如何把图像、语言和机器人状态映射到动作，而不是先陷入本地复现实验。"
date: 2026-05-15
tags:
  - robotics
  - vla
  - embodied-ai
  - paper-reading
lang: zh
translationKey: robot-vla-vision-language-action-intro
draft: true
---

## 快速读法

- 本文定位：论文讲解，不展开本地复现。
- 本文任务：建立读 VLA 论文的最小心智模型。
- 读完要能回答：VLA 为什么不是普通 VLM，robot action 为什么是核心难点。
- 实验另篇：后续单独验证 observation/action schema 和 Docker 环境。

VLA 是 Vision-Language-Action 的缩写。它最重要的变化不是“模型多了一个模态”，而是输出目标发生了变化：普通 VLM 多数输出文本，VLA 要输出机器人能执行的动作。

这也是读 VLA 论文时最容易被标题遮住的地方。真正要追问的不是“它用了什么大模型”，而是：

> 模型如何把视觉和语言理解，落到一个具体机器人、具体控制频率、具体动作空间里？

## 本篇读完要形成的论文地图

这一篇不是综述所有 VLA 模型，而是先建立一个后面反复使用的阅读框架。读完后，你应该能把任何一篇 VLA 论文先拆成四个格子：

| 格子 | 要问的问题 |
| --- | --- |
| 表示 | 输入有哪些模态，输出是什么动作表示 |
| 对齐 | 视觉语言预训练能力如何被对齐到机器人动作 |
| 数据 | 机器人示范来自哪里，是否覆盖目标 embodiment |
| 验证 | 论文如何证明模型真的会执行任务，而不只是离线预测好 |

后面的 OpenVLA、π0、SmolVLA 和 GR00T，本质上都是在这四个格子里做不同选择。

## 先看图，再看文字

真正读 VLA 论文时，不要从 abstract 一路顺读。更高效的顺序是：

| 先看 | 目的 |
| --- | --- |
| Teaser / Figure 1 | 看论文声称解决的是哪类机器人任务 |
| Architecture figure | 看视觉、语言、状态和动作在哪里汇合 |
| Action representation figure/table | 看输出到底是 token、连续动作、chunk 还是技能 |
| Dataset table | 看能力来自什么机器人数据 |
| Evaluation table | 看成功率对应哪些任务和 embodiment |

如果这五个位置没看懂，正文里的“generalist”“foundation”“open-world”都容易变成空词。

## 代表论文先放进同一张地图

入门时不要把 VLA 当成一个统一技术名。更好的读法是先把几条路线分开：

| 代表工作 | 先看哪张图 | 动作路线 | 你要读懂的核心问题 |
| --- | --- | --- | --- |
| RT-2 | teaser / action-as-text 说明 | 把 robot action 表达成 token，让 VLM 直接生成动作 | 视觉语言预训练知识能否迁移到机器人动作 |
| OpenVLA | Figure 1 architecture、Section 3.2 action tokenization | 7-DoF action 逐维 256-bin 离散，再映射到 Llama tokenizer | 开源 VLM 如何变成可 fine-tune 的 robot policy |
| π0 | Figure 3 framework、Section IV flow matching | VLM + action expert，生成连续 action chunk | 连续控制是否比 action token 更适合高频灵巧任务 |
| SmolVLA | Figure 1、Figure 2 async inference | 小型 VLM + flow-matching action expert + 异步执行 | 低成本模型、社区数据和系统延迟如何一起影响可复现性 |
| GR00T N1 | Figure 2 overview、Figure 3 architecture | Eagle-2 VLM + DiT flow-matching policy，人形机器人 action chunk | humanoid VLA 为什么更像系统工程而不只是模型论文 |

这张表的作用是防止入门阶段把所有 VLA 都理解成“看图听指令然后输出动作”。真正读论文时，动作表示、数据来源、评估协议和部署边界比模型名字更重要。

![Robot VLA route map](/images/robotics/vla/vla-route-map.svg)

*自绘图：VLA 入门地图。它不是某篇论文原图，而是把后续 OpenVLA、π0、SmolVLA、LIBERO、fine-tuning、GR00T 的位置先摆出来。*

## 核心公式：VLA 最小抽象

最小 VLA policy 可以写成：

```text
a_t = πθ(o_t, s_t, l, h_t)
```

其中 `o_t` 是视觉观察，`s_t` 是机器人状态，`l` 是语言指令，`h_t` 是历史信息。训练时常见的行为克隆目标是：

```text
L_BC = E[ ℓ(πθ(o_t, s_t, l, h_t), a_t*) ]
```

不同论文的差异在于 `a_t` 的表示：OpenVLA 把它变成 token，π0 / SmolVLA 用 flow matching 生成 action chunk，GR00T 把它放进更复杂的人形机器人系统。

## VLA 论文通常在解决什么问题

机器人学习长期有一个矛盾：真实机器人数据很贵，但视觉语言模型已经从大规模图文和文本数据里学到了很多世界知识。VLA 论文的核心问题就是能不能把这些能力迁移到机器人控制上。

可以把问题拆成三层：

| 层级 | 问题 |
| --- | --- |
| 感知 | 模型能不能识别物体、状态和空间关系 |
| 语言 | 模型能不能理解任务指令和语义约束 |
| 动作 | 模型能不能输出稳定、可执行、符合机器人坐标系的动作 |

前两层是 VLM 的强项。第三层是机器人特有的难点。

## 普通 VLM 到 VLA 的关键跳跃

普通 VLM 的形式可以写成：

```text
(image, text prompt) -> text tokens
```

VLA 的形式更像：

```text
(image, language instruction, robot state) -> robot action
```

这带来三个变化。

第一，输出不再只是语义正确，而要物理可执行。一个回答可以有多种说法，但机器人动作多一点、少一点、方向反一点，任务就可能失败。

第二，动作有时间结构。机器人不是一次性回答问题，而是在闭环里不断观察、决策、执行、再观察。

第三，动作空间依赖机器人本体。Franka、ALOHA、人形机器人、移动机械臂的 action representation 不一样，不能只靠语言模型自然吸收。

## 论文里的 action representation 是第一重点

读 VLA 论文时，我会先看 action 怎么表示，而不是先看模型参数量。

常见路线包括：

- 把连续动作离散化成 token，让 VLM 像生成文字一样生成动作。
- 在 VLM backbone 后接 action head，直接回归连续动作。
- 用 diffusion 或 flow matching 生成一段连续 action chunk。
- 输出高层技能或子目标，再交给低层控制器。

不同路线背后的假设不同。Action token 路线强调复用语言模型生成机制；continuous action expert 路线强调机器人动作本身是连续控制问题；高层技能路线则把 VLA 放进更大的 planning/control 系统。

## 论文里的数据问题

VLA 不是纯模型问题，它高度依赖机器人数据。

一篇 VLA 论文至少要回答：

- 数据来自真机、仿真，还是混合来源。
- 有多少机器人 embodiment。
- 每条数据是否包含图像、语言、状态、动作。
- 语言指令是人工写的、模板生成的，还是从任务标签映射来的。
- action 是否跨机器人统一。
- 训练和评估任务是否有清晰划分。

如果论文说模型“泛化”，要继续问它泛化到了什么：新物体、新任务、新场景、新机器人，还是只是新初始位置。

## 论文里的训练目标

多数 VLA 论文可以先按 imitation learning 来理解：给定专家示范轨迹，学习在某个 observation 下预测专家 action。

简化形式：

```text
minimize loss(policy(observation, instruction), expert_action)
```

不同论文的差异在于 loss 和输出空间：

- token cross entropy：动作被离散成 token。
- regression loss：直接预测连续动作。
- diffusion/flow loss：学习从噪声到动作分布的生成过程。
- 多任务 loss：同时预测动作、语言、状态或高层语义。

看训练目标时要问：这个 loss 是否真的对最终控制有帮助，还是只是让模型在离线数据上看起来更好。

## 论文里的评估问题

VLA 评估不能只看 demo 视频。论文里的评估至少要区分：

- 离线指标：action prediction error、loss、token accuracy。
- 仿真任务：LIBERO、CALVIN、Meta-World 等。
- 真机任务：真实机器人成功率。
- 泛化任务：新物体、新语言、新场景、新组合。

最有信息量的不是一个总分，而是失败分布。模型是看错物体、抓取失败、轨迹不稳，还是能抓到但放不准？这些失败对应不同研究问题。

## 读 VLA 论文的固定问题清单

每读一篇 VLA 论文，先填这张表：

| 问题 | 要填的内容 |
| --- | --- |
| 论文动机 | 它认为前人缺什么 |
| 输入 | 图像、语言、状态、历史帧 |
| 输出 | action token、连续动作、action chunk、技能 |
| 数据 | 数据来源、规模、机器人类型 |
| 模型 | backbone、action head、是否分层 |
| 训练 | loss、pretraining、finetuning、数据混合 |
| 评估 | benchmark、真机任务、泛化设置 |
| 局限 | 失败模式、算力、数据、机器人限制 |

这张表会贯穿后面的 OpenVLA、SmolVLA、π0、LIBERO 和 GR00T。

## 复现实验另篇

本文只建立论文阅读框架。后续单独的实验篇再处理：

- 如何在 Docker 里加载 LeRobotDataset。
- 如何打印 observation/action shape。
- 如何跑 OpenVLA、SmolVLA 或 openpi 的最小 inference。
- M1 Pro 和云端 NVIDIA GPU 的环境边界。

实验篇的目标是验证机制，主文的目标是读懂论文。

## 参考论文

- [RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control](https://arxiv.org/abs/2307.15818)
- [OpenVLA: An Open-Source Vision-Language-Action Model](https://arxiv.org/abs/2406.09246)
- [π0: A Vision-Language-Action Flow Model for General Robot Control](https://arxiv.org/abs/2410.24164)

## 本文小结

VLA 的关键不是“多模态模型接机器人”，而是把视觉语言理解转成可执行动作。读论文时，先抓 action representation、数据来源、训练目标和评估设置，再看模型结构细节。
