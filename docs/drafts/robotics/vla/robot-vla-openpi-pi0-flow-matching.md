---
title: "π0 / π0.5 / openpi 论文精读：VLA 的 flow matching 路线"
description: "从 action expert、continuous action chunk、flow matching、open-world generalization 和 openpi 工具库理解 π0 系列。"
date: 2026-05-15
tags:
  - robotics
  - openpi
  - pi0
  - flow-matching
  - paper-reading
lang: zh
translationKey: robot-vla-openpi-pi0-flow-matching
draft: true
---

## 快速读法

- 本文定位：π0 / π0.5 论文精读，openpi 只作为后续复现入口。
- 本文任务：理解 VLA 为什么会走向 flow matching action expert。
- 读完要能回答：π0 和 OpenVLA 在动作建模上的关键差异是什么。
- 实验另篇：后续再跑 openpi dummy inference 和 action chunk shape 检查。

OpenVLA 代表了 action tokenization 路线，而 π0 代表了另一条非常重要的路线：把机器人动作看作连续轨迹生成问题，用 flow matching 生成 action chunk。

这篇文章重点讲 π0 / π0.5 的论文思想。openpi 是代码和复现工具库，不是本文主线。

## 本篇读完要形成的论文地图

π0 系列可以先用一个对照来抓：

| 问题 | OpenVLA 式回答 | π0 式回答 |
| --- | --- | --- |
| 动作是不是 token | 尽量变成 token 序列 | 保持连续 action chunk |
| 谁负责动作 | VLM 生成动作表示 | action expert 生成连续轨迹 |
| 训练直觉 | next-token prediction | flow matching / continuous generation |
| 控制关注点 | token 解码是否准确 | chunk horizon、平滑性、采样和延迟 |

所以本文要帮你看懂的不是某个函数入口，而是 VLA 领域里“离散动作生成”和“连续动作生成”这两条路线的分叉。

## 原论文图表导航

π0 论文要优先看三类图：

| 原文图表 | 重点看什么 | 为什么重要 |
| --- | --- | --- |
| Figure 1 | VLM backbone + action expert 的总览，以及 folding / box assembly 等高灵巧任务 | 这是论文的主张：不是短 horizon toy task，而是 general robot control |
| Figure 2 | mobile manipulator folding laundry 的长程流程 | 说明 π0 需要 action chunk、语言跟随和 post-training，而不是单步动作分类 |
| Figure 3 | pre-training mixture、PaliGemma VLM、action expert、cross-embodiment policy 的整体框架 | 这是 π0 的核心系统图 |
| Figure 4 | OXE Magic Soup + π dataset 的数据混合比例和 step 数 | 数据配方是 π0 的关键贡献之一，不是附录细节 |
| Figure 5 | 7 种 robot configurations | 解释为什么它必须处理不同 action/state 维度 |
| Section IV 公式 | `A_t`、`o_t`、flow matching loss、Euler integration | 这是 π0 和 OpenVLA action-token 路线分开的地方 |

尤其要把模型结构图和 OpenVLA 的结构图并排看：OpenVLA 把动作变成语言 token，π0 则保留连续动作并增加专门的 action expert。

## 原图阅读说明

π0 的原图非常值得对照读，尤其是 <a href="https://arxiv.org/abs/2410.24164">arXiv:2410.24164</a> 里的 Figure 2、Figure 3、Figure 4 和 Figure 5。不过这篇论文的 arXiv 授权页不是 CC BY 4.0，我先不把原图复制到本站本地资源里。本文保留原文链接，并用下面的自绘图和公式做机制拆解；如果后续确认项目页或作者授权允许转载，再把对应原图补进来并加来源图注。

读原图时建议这样抓：

| 原图 | 精读问题 |
| --- | --- |
| Figure 2 | 它为什么选择长程、灵巧、真实任务作为 teaser，而不是短 horizon tabletop task |
| Figure 3 | VLM backbone、action expert、pre-training mixture 和 post-training 在同一张图里如何连接 |
| Figure 4 | OXE Magic Soup 与自有 π 数据在数据配方中各自承担什么 |
| Figure 5 | 多 robot configurations 如何迫使模型处理不同 state/action 维度 |

![pi0 flow matching architecture](/images/robotics/vla/pi0-flow.svg)

*自绘图：对应 π0 Figure 3 和 Section IV 的 flow matching 公式。它展示的是机制，不是论文截图。*

## 自绘结构图

```text
image(s), language ──> VLM backbone ──┐
                                      ├─ shared attention/context ──> action expert ──> action chunk
robot state, noisy action, τ ─────────┘
```

VLM backbone 负责语义理解，action expert 负责连续动作分布。这个拆分比“把动作 token 化”更贴近机器人控制，但也引入了采样步数、延迟、chunk horizon 等新问题。

## 核心公式：flow matching action chunk

π0 论文里先把未来动作写成 action chunk：

```text
A_t = [a_t, a_{t+1}, ..., a_{t+H-1}]
```

其中 `H=50`。观察 `o_t` 由多路 RGB 图像、语言指令和机器人 proprioceptive state 组成：

```text
o_t = [I_t^1, ..., I_t^n, l_t, q_t]
```

论文使用 conditional flow matching。按论文符号，先从标准高斯采样噪声：

```text
epsilon ~ N(0, I)
```

再构造 noisy action：

```text
A_t^tau = tau A_t + (1 - tau) epsilon
```

目标向量场是从噪声指向真实动作：

```text
u(A_t^tau | A_t) = A_t - epsilon
```

action expert 训练目标为：

```text
L_tau(theta) =
  E || v_theta(A_t^tau, o_t) - u(A_t^tau | A_t) ||^2
```

推理时从纯噪声 `A_t^0` 开始，用 Euler integration 走到 `tau=1`：

```text
A_t^{tau + delta} = A_t^tau + delta v_theta(A_t^tau, o_t)
```

论文实验里使用 10 个 integration steps。这里最重要的理解是：π0 不是把动作离散成 token，而是在条件观察下学习一个把噪声 action chunk 连续推向可执行 action chunk 的向量场。

## 论文动机：机器人动作不是自然语言

VLM 擅长离散 token 预测，但机器人动作天然是连续信号。把连续动作离散化成 token 很优雅，也容易复用语言模型能力，但它不是唯一选择。

## 论文里的硬事实

π0 论文里的几个数字很重要：

| 项目 | π0 的选择 |
| --- | --- |
| Backbone | PaliGemma 3B 视觉语言模型 |
| Action expert | 从零初始化的约 300M 参数动作专家模块 |
| 总参数量 | 约 3.3B |
| 总体路线 | VLM backbone + flow matching action expert |
| 输出 | `H=50` 的连续 action chunk，而不是逐维 action token |
| 输入 | 每个机器人 2 或 3 路 RGB 图像、语言指令、关节/状态向量 |
| 数据 | 超过 10,000 小时机器人数据，包含自有 dexterous data、OXE Magic Soup、BridgeData V2、DROID 等 |
| 机器人覆盖 | 自有数据含 7 种 robot configurations、68 个高层任务；再混合 OXE 的 22 个 robots |
| 控制 | 面向最高约 50Hz 的高频、灵巧、长程操作任务 |
| 代表任务 | 折衣服、收拾桌面、装购物袋、组装纸箱等 |

这些事实说明 π0 的目标不是在 LIBERO 这类短任务上刷分，而是把 VLA 推向高频连续控制和复杂真实任务。

## Claim / Evidence：π0 和 π0.5 分别证明什么

π0 和 π0.5 放在同一篇里读，最容易混淆的是 claim。更专业的拆法是：

| 论文 | 核心 claim | 主要 evidence | 不能证明什么 |
| --- | --- | --- | --- |
| π0 | VLM backbone + flow-matching action expert 可以成为 general robot control policy | 多机器人配置、长程灵巧任务、10k+ 小时机器人数据、action chunk 生成 | 不能证明任意新机器人零样本可用，也不能证明 flow matching 总是优于所有 token/回归方法 |
| π0.5 | heterogeneous co-training 能提升 open-world generalization | 家庭环境、web vision-language data、高层语义预测、cross-embodiment data 的混合训练 | 不能证明开放世界问题已解决，也不能证明所有长程任务都无需外部规划或低层安全系统 |
| openpi | 将 π0 / π0.5 变成可下载 checkpoint、config、data transform 和 inference/fine-tuning 工具链 | 官方 repo、base/expert checkpoints、LIBERO/DROID/ALOHA 示例 | 不能保证你的机器人 embodiment 或数据 schema 能直接成功 |

这样拆开以后，π0 是“连续动作生成路线”的论文，π0.5 是“开放世界泛化数据路线”的论文，openpi 是“复现实验接口”的工程入口。

## Action / temporal contract

π0 这类 VLA 不能只写“输出 action chunk”。需要把机器人控制 contract 说清：

| Contract | π0 里的含义 | 读论文/跑代码时要检查 |
| --- | --- | --- |
| Observation | 每个机器人通常输入 2 或 3 路 RGB 图像、语言指令和 proprioceptive state | camera key、图像分辨率、state dim 是否与 checkpoint config 一致 |
| Action | 连续 action chunk，论文主设定 `H=50` | action dim、关节/末端控制模式、gripper 表示是否一致 |
| Temporal | 面向最高约 50Hz 控制，推理时用 10 个 Euler integration steps 生成 chunk | chunk horizon 与 robot control loop 是否匹配；chunk 过长会降低反馈频率 |
| Embodiment | 不同机器人有不同 state/action 维度 | 是否有对应 transform / adapter；不能假设一个 checkpoint 通吃所有机器人 |
| Safety | 论文模型不替代低层控制和安全系统 | 真机实验仍需限速、碰撞保护、人类接管和动作裁剪 |

这张表决定了 openpi 实验该打印什么：不是只打印模型参数，而是 `action_horizon`、`action_dim`、observation keys、state keys、latency 和 normalization stats。

π0 的直觉是：

> 语义理解可以借助 VLM，动作生成应该用更适合连续控制的模块。

于是模型被拆成更清晰的两部分：

```text
vision-language backbone -> context
action expert -> continuous action chunk
```

这个分工是 π0 论文最值得学习的地方。

## 什么是 action expert

Action expert 是专门负责动作生成的模块。它接收来自视觉语言 backbone 的上下文，再生成机器人动作序列。

它解决的问题包括：

- 连续动作建模。
- 多步 action chunk 生成。
- 不同机器人 action space 适配。
- 高频控制下的平滑性。
- 任务语义和动作轨迹之间的连接。

和 action token 路线相比，action expert 更明确承认“机器人控制不是文本生成的简单变体”。

## Flow matching 的直觉

Flow matching 可以粗略理解为学习一个从噪声到数据的连续变换。对 π0 来说，目标数据不是图像或文本，而是一段机器人 action chunk。

简化形式：

```text
context = VLM(image, language, robot_state)
noise_action = random initialization
action_chunk = flow_model(context, noise_action)
```

这个思路适合机器人动作的原因是：

- 动作是连续向量。
- 同一个任务可能有多种合理轨迹。
- 一次生成多步动作可以减轻逐步预测误差。
- 生成式建模能表达动作分布，而不是只给一个点估计。

这也是 π0 与 OpenVLA 最核心的技术分歧。

## π0 论文要读什么

读 π0 时，我会重点看六个问题：

| 问题 | 关注点 |
| --- | --- |
| Backbone | 使用什么视觉语言模型，语义能力从哪里来 |
| Action expert | 如何接入 backbone，上下文如何传递 |
| Flow objective | 训练目标如何定义，生成过程如何采样 |
| Action chunk | horizon 多长，控制频率如何匹配 |
| Embodiment | 不同机器人动作空间如何处理 |
| Evaluation | 真机、仿真、任务种类和泛化方式 |

这些问题比“代码怎么跑”更接近论文核心。

## π0.5 的延伸：open-world generalization

π0.5 在 π0 基础上进一步强调 open-world generalization。这个方向说明 VLA 研究不满足于在固定桌面任务里成功，而是希望模型能面对训练集中没有出现过的家庭环境、物体组合和长程任务。

π0.5 的关键不是“把 π0 放大一点”，而是改变训练数据的组织方式。论文和官方博客强调 heterogeneous co-training：同一个模型混合学习低层动作数据、高层语义预测、web 视觉语言数据和不同 embodiment 的机器人数据。

可以把 π0.5 的数据和监督拆成这张表：

| 数据/监督类型 | 提供什么能力 | 为什么对 open-world 有用 |
| --- | --- | --- |
| mobile manipulator household demonstrations | 目标机器人在家庭环境里的低层动作 | 直接学习清理厨房、整理卧室这类目标技能 |
| non-mobile multi-environment robot data | 更广泛的 manipulation primitive | 补足目标机器人数据覆盖不足 |
| cross-embodiment lab data | 其他机器人上的动作经验 | 让物理技能跨平台迁移 |
| high-level semantic prediction | 子任务、阶段和语义结构 | 让模型知道“清理厨房”应拆成哪些可执行步骤 |
| web vision-language data | 物体、场景、常识识别 | 帮模型理解训练环境外的新物体和新房间 |
| verbal instruction data | 语言 grounding 和人类指令形式 | 减少真实部署时指令说法变化带来的失效 |

读 π0.5 时要问：

- 它相比 π0 加入了哪些数据源。
- 哪些样本有低层 action，哪些只有语义/视觉语言监督。
- 高层 semantic prediction 是否真的提升低层执行。
- 泛化评估是否在完全未见过的真实家庭里做。
- 长程任务是端到端完成，还是依赖额外 planner。
- 失败案例是否说明了 open-world 的边界。

π0.5 的重点不是换一个版本号，而是把 VLA 从“会做一组实验室任务”推向“能在更开放环境中利用语义知识和物理技能组合”。

## openpi 的位置

openpi 是 Physical Intelligence 开源的训练和部署工具库。它对学习者的价值是把 π0 系列从论文带到可运行接口。

但主文不应该变成 openpi 安装教程。我们只需要在论文讲解里知道：

- 它提供模型推理和训练入口。
- 它暴露 checkpoint、config、data transforms。
- 它能帮助我们验证 action chunk 和接口假设。
- 它的正式推理和训练依赖 NVIDIA GPU。

截至 2026-05-15，openpi README 给出的单 GPU 显存边界是：推理 `>8GB`，LoRA fine-tuning `>22.5GB`，全量 fine-tuning `>70GB`，并说明主要测试环境是 Ubuntu 22.04。它还明确提供 base checkpoints、expert checkpoints、dummy inference、policy server、DROID / ALOHA / LIBERO 示例，以及 `compute_norm_stats.py` 这类归一化统计入口。

用 code contract 可以这样读：

| openpi 对象 | 作用 | 为什么重要 |
| --- | --- | --- |
| checkpoint path | 选择 π0、π0-FAST、π0.5、DROID、ALOHA、LIBERO 等模型族 | 不同 checkpoint 的 action/token route 和目标机器人不同 |
| config name | 定义模型、数据 transform、训练和推理参数 | config 错会导致 observation/action schema 不匹配 |
| data transforms | 把环境 observation/action 映射到模型接口 | 这是复现最容易错的层 |
| norm stats | state/action normalization 和 unnormalization | stats 错会让动作幅度失真 |
| policy server | 将模型推理和机器人/runtime 解耦 | 支持 GPU 远程推理，但也引入网络延迟和服务稳定性问题 |

具体命令放到实验篇。

## 和 OpenVLA 的对照

| 维度 | OpenVLA | π0 / openpi |
| --- | --- | --- |
| 动作思想 | 动作 token 化 | 连续动作生成 |
| 模型分工 | VLM 生成动作表示 | VLM + action expert |
| 训练直觉 | token prediction | flow matching |
| 输出 | action token 或解码动作 | action chunk |
| 学习重点 | 离散化和解码 | 连续轨迹和生成过程 |

这张表是读 VLA 技术路线时的坐标轴。

## 局限和开放问题

π0 路线也有自己的问题：

- Flow matching 推理可能比单步回归更复杂。
- Action chunk 过长可能降低反馈频率。
- 多机器人 action space 仍然难统一。
- 真实部署仍需要低层控制、安全和延迟处理。
- Open-world generalization 的评估很难设计。

这些问题会在后续 VLA 论文里反复出现。

## 复现实验另篇

本文不展开命令。后续 openpi 实验篇再做：

- 读取 openpi README 和模型配置。
- 跑 dummy inference。
- 打印 action horizon、action dim 和 latency。
- 对比 π0 与 π0.5 checkpoint。
- 记录 GPU 显存要求。

## 参考论文与资料

- [π0: A Vision-Language-Action Flow Model for General Robot Control](https://arxiv.org/abs/2410.24164)
- [π0.5: a Vision-Language-Action Model with Open-World Generalization](https://arxiv.org/abs/2504.16054)
- [π0 project PDF](https://www.pi.website/download/pi0.pdf)
- [Physical Intelligence openpi](https://github.com/Physical-Intelligence/openpi)

## 本文小结

π0 系列让我们看到 VLA 的另一条主线：视觉语言 backbone 负责理解，action expert 负责连续动作生成，flow matching 负责建模动作分布。它和 OpenVLA 的差异，正好帮助我们建立 VLA 技术地图。
