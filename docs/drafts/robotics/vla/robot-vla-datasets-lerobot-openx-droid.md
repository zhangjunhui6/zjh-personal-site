---
title: "机器人数据集论文：Open X-Embodiment、DROID 与 LeRobotDataset"
description: "从论文视角理解机器人数据集为什么决定 VLA 能力边界：跨 embodiment、真实世界采集、语言标注、动作空间和标准化格式。"
date: 2026-05-15
tags:
  - robotics
  - datasets
  - lerobot
  - vla
  - paper-reading
lang: zh
translationKey: robot-vla-datasets-lerobot-openx-droid
draft: true
---

## 快速读法

- 本文定位：数据集论文讲解，不展开下载和加载命令。
- 本文任务：理解为什么 VLA 的上限很大程度由机器人数据决定。
- 读完要能回答：Open X-Embodiment 和 DROID 分别解决了什么数据问题。
- 实验另篇：后续再做 LeRobotDataset 加载、字段检查和 action shape 打印。

机器人 VLA 论文里，数据不是背景材料，而是方法的一部分。模型能不能泛化，经常取决于它见过多少机器人、多少任务、多少场景，以及这些数据是否被整理成一致的格式。

这一篇重点读三类东西：Open X-Embodiment 的跨机器人数据思想，DROID 的真实世界采集思想，以及 LeRobotDataset 这种工具格式为什么对复现重要。

## 本篇读完要形成的论文地图

数据集论文不要只记“规模有多大”。更有用的读法是判断它解决了哪一种数据瓶颈：

| 对象 | 主要回答 | 读论文时的抓手 |
| --- | --- | --- |
| Open X-Embodiment | 多机器人、多机构数据能否帮助通用策略 | embodiment 差异、数据标准化、跨任务迁移 |
| DROID | 真实世界遥操作数据如何规模化采集 | 场景多样性、采集流程、质量控制 |
| LeRobotDataset | 论文数据如何变成可复现接口 | schema、processor、action shape、metadata |

这样读的好处是，你不会把数据集当成模型论文的附录，而会看到它们如何定义 VLA 的能力边界。

## 原论文图表导航

数据集论文的图表要带着“这个数据能不能支撑 VLA 泛化”去看：

| 原文图表 | 重点看什么 | 为什么重要 |
| --- | --- | --- |
| Open X-Embodiment Figure 0 | 60+ individual datasets、22 embodiments、common skills 和长尾技能分布 | 判断跨 embodiment 学习是不是论文主问题 |
| Open X-Embodiment Figure 1 / Figure 2 | RT-1-X / RT-2-X 架构路线，以及不同机器人和任务上的 transfer 结果 | 判断数据混合是否真的有正迁移 |
| DROID Figure 0 / Figure 1 / Figure 2 | 统一采集平台、verbs/objects 长尾、scene diversity | 判断真实世界数据多样性是否来自场景，而不是只来自任务名 |
| DROID Table I / 数据统计表 | DROID 与 prior datasets 在场景、机器人、任务、小时数上的对比 | 判断它的贡献是 in-the-wild scale，而不是单纯数据量 |
| LeRobotDataset v3 diagram | episode-based 到 file-based 数据组织、`meta/info.json`、`meta/stats.json`、Parquet/video shards | 判断论文数据如何落到可复现接口 |

这些图表比模型参数更重要。VLA 模型的上限往往先被数据覆盖范围决定。

## 原图精读：数据覆盖和迁移证据

<figure>
  <img src="/images/robotics/vla/original/openx-fig0.png" alt="Open X-Embodiment paper Figure 0 dataset overview" />
  <figcaption>原图：Open X-Embodiment Figure 0, Open X-Embodiment Collaboration et al., <a href="https://arxiv.org/abs/2310.08864">Open X-Embodiment: Robotic Learning Datasets and RT-X Models</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

这张 Open X-Embodiment 概览图要先看 embodiment 和 skill 的分布，而不是只看总量。它把“机器人数据集很大”拆成几个变量：多少个 individual datasets、多少种机器人、哪些机器人贡献了最多轨迹、哪些技能和物体是长尾。VLA 读者最该追问的是：这些数据能否共享同一种 action representation，还是只能在粗粒度上做数据混合？

<figure>
  <img src="/images/robotics/vla/original/openx-fig1.png" alt="Open X-Embodiment paper Figure 1 RT-1-X and RT-2-X architectures" />
  <figcaption>原图：Open X-Embodiment Figure 1, Open X-Embodiment Collaboration et al., <a href="https://arxiv.org/abs/2310.08864">arXiv:2310.08864</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

Figure 1 把 RT-1-X 和 RT-2-X 的路线并排放出来：二者都吃图像和文本指令，输出离散化的末端执行器动作；差别是 RT-1-X 更像 robotics-native architecture，RT-2-X 则把 action 当作另一种语言 token 放进 VLM。后面读 OpenVLA 时会发现，它继承的正是这条 action-token 路线。

<figure>
  <img src="/images/robotics/vla/original/openx-fig2.png" alt="Open X-Embodiment paper Figure 2 RT-1-X transfer success rate" />
  <figcaption>原图：Open X-Embodiment Figure 2, Open X-Embodiment Collaboration et al., <a href="https://arxiv.org/abs/2310.08864">arXiv:2310.08864</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

Figure 2 是数据集论文最重要的“证据图”：混合多机器人数据后，RT-1-X 在多个真实机器人评估里是否比单域训练更好。读它时不要把 bar chart 当作最终结论，而要看实验地点、机器人 embodiment 和任务是否真的跨域。数据集论文的价值必须通过 policy transfer 证明，而不只是发布数据。

<figure>
  <img src="/images/robotics/vla/original/droid-fig0.png" alt="DROID paper Figure 0 robot platform" />
  <figcaption>原图：DROID Figure 0, Khazatsky et al., <a href="https://arxiv.org/abs/2403.12945">DROID: A Large-Scale In-The-Wild Robot Manipulation Dataset</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

DROID 先看采集平台，因为它的核心不是“机器人种类多”，而是“统一硬件 + 多地点真实场景采集”。同一套 Franka、相机和遥操作硬件被带到不同建筑、办公室和家庭环境里，减少了 embodiment 差异，同时放大 scene diversity。这和 Open X-Embodiment 正好互补。

<figure>
  <img src="/images/robotics/vla/original/droid-fig1.png" alt="DROID paper Figure 1 distribution of verbs and objects" />
  <figcaption>原图：DROID Figure 1, Khazatsky et al., <a href="https://arxiv.org/abs/2403.12945">arXiv:2403.12945</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

DROID Figure 1 要看长尾。VLA 数据如果只有少数高频技能，模型容易学到固定脚本；长尾 verbs 和 objects 说明数据更接近真实世界的稀疏任务分布。但长尾也意味着训练更难：低频动作样本少，action distribution 更分散，后续模型不一定能同等学好每一类行为。

<figure>
  <img src="/images/robotics/vla/original/droid-fig2.png" alt="DROID paper Figure 2 scene diversity" />
  <figcaption>原图：DROID Figure 2, Khazatsky et al., <a href="https://arxiv.org/abs/2403.12945">arXiv:2403.12945</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

Figure 2 则把 DROID 的贡献从“任务多”推进到“场景多”。对 VLA 来说，场景多样性会直接影响视觉泛化：背景、桌面高度、光照、遮挡、物体摆放和相机相对位置都会改变 observation distribution。读数据集论文时，这类图比 headline 数字更能说明数据是否有泛化价值。

![Robot dataset schema map](/images/robotics/vla/datasets-schema.svg)

*自绘图：对应 Open X-Embodiment、DROID 和 LeRobotDataset 的阅读关系。原图展示论文证据，自绘图把数据 contract 抽象成后续实验要检查的 schema。*

## 自绘数据结构图

```text
episode
  ├─ language instruction
  ├─ frames
  │    ├─ camera image(s)
  │    ├─ robot state / proprioception
  │    └─ action
  └─ metadata
       ├─ robot embodiment
       ├─ fps / control mode
       └─ normalization stats
```

看到任何机器人数据集，都先把它还原成这棵树。树上缺哪一支，后面的 VLA 训练和评估就会在哪里出问题。

## 核心公式：机器人数据不是独立样本

一条机器人 demonstration 不是一张图，而是一段轨迹：

```text
τ = {(o_t, s_t, l, a_t)}_{t=1..T}
```

其中 `o_t` 是图像观察，`s_t` 是机器人状态，`l` 是语言任务，`a_t` 是动作。行为克隆训练常写成：

```text
L_BC = E_{τ~D,t} [ ℓ(πθ(o_t, s_t, l), a_t) ]
```

跨 embodiment 的难点在于：不同数据集里的 `a_t` 可能不是同一个空间。一个模型能不能学到通用能力，取决于论文如何处理这个 action-space mismatch。

## 为什么机器人数据比图文数据更麻烦

图文数据通常至少有比较统一的输入输出：图像、文本、标签。机器人数据多了几层约束：

- 时间：一条样本往往是 episode，不是一张图。
- 动作：必须知道 action 每一维代表什么。
- 坐标系：world、base、end-effector、camera 坐标不能混。
- 机器人本体：不同 embodiment 的动作空间不一定可比。
- 控制频率：同一个动作幅度在不同 fps 下含义不同。
- 成功标准：任务完成与否不一定能从单帧判断。

所以数据集论文的核心贡献往往不是“数据量大”，而是回答：这些复杂数据如何被采集、标准化、混合和评估。

## Open X-Embodiment 的论文主线

Open X-Embodiment 关心的是跨机器人学习。它把多个机构、多个机器人、多个任务的数据组织起来，尝试训练更通用的 RT-X 模型。

这篇论文里有几个必须记住的数字：

| 项目 | 数字或事实 |
| --- | --- |
| 参与机构 | 21 个机构协作 |
| 机器人 embodiment | 22 种机器人 |
| Individual datasets | 60+ 个数据集 |
| 技能覆盖 | 527 个 skills |
| 任务规模 | 160,266 个 task instances / tasks |
| 模型路线 | 训练 RT-X / RT-1-X / RT-2-X 这类跨 embodiment 策略 |

这些数字不是用来炫规模，而是说明论文真正研究的是“跨身体经验能不能迁移”。

这篇论文的关键问题是：

> 如果一个机器人策略从很多不同机器人身上学习，是否能对新任务或新平台产生正迁移？

读这篇时要关注三个点。

第一是 embodiment。论文不是只在一个机械臂上扩数据，而是明确把“不同身体”作为问题本身。不同机器人有不同视角、动作空间和工作空间，模型必须处理这种异质性。

第二是 standardization。跨数据集训练的前提是格式统一。否则数据量再大，也只是不可直接混合的碎片。

第三是 transfer。论文真正关心的是混合数据是否帮助某个机器人完成任务，而不是只把数据堆在一起。

## DROID 的论文主线

DROID 更强调真实世界、多地点、大规模遥操作采集。它的贡献不是跨很多机器人型号，而是让真实机器人操作数据覆盖更多家庭化、非实验室化的场景。

DROID 的硬事实也要先记住：

| 项目 | 数字或事实 |
| --- | --- |
| 数据量 | 约 76k demonstration trajectories |
| 时长 | 约 350 小时交互数据 |
| 场景 | 564 个真实场景 |
| 建筑 | 52 个 buildings |
| 任务 | 86 个 manipulation tasks / verbs |
| 采集者 | 50 位采集者，覆盖北美、亚洲、欧洲 |
| 机构 | 13 个机构 |
| 核心路线 | 统一硬件平台 + 分布式真实环境采集 |

DROID 的价值在于 scene diversity。它问的不是“能不能把很多机器人混在一起”，而是“真实世界家庭/办公室环境的数据能不能规模化”。

这里要注意一个版本细节：DROID 的早期 abstract 和不同网页有时写 84 tasks，有些 PDF/Figure 1 和后续引用写 86 tasks。文章里如果引用具体数字，最好写清楚来源版本；实验篇更应该以实际下载的数据集 metadata 为准。

读 DROID 时要抓这些问题：

- 为什么真实世界数据比仿真或单实验室数据更重要。
- 遥操作采集如何影响动作分布。
- 任务、场景、物体的多样性如何支持泛化。
- 数据质量如何控制。
- 这种数据如何被后续 VLA 模型使用。

Open X-Embodiment 更像是“跨 embodiment 的大混合”，DROID 更像是“真实世界机器人操作数据工厂”。两者都在回答 VLA 的数据饥饿问题，但侧重点不同。

## LeRobotDataset 的位置

LeRobotDataset 更像是复现和工程接口。它本身不等同于一篇核心 VLA 模型论文，但它解决一个很实际的问题：

> 论文里的机器人数据，如何变成普通研究者可以加载、查看、训练和评估的格式？

理解 LeRobotDataset 时，要把它看成三层：

| 层级 | 作用 |
| --- | --- |
| 数据抽象 | episode、frame、observation、action、task |
| 工具接口 | dataset loading、可视化、转换、训练入口 |
| 复现桥梁 | 把论文数据和可运行代码连接起来 |

这就是为什么本连载虽然主文讲论文，仍然会在实验篇使用 LeRobot。

## 读数据集论文的五个问题

### 1. 数据从哪里来

要区分：

- 真机遥操作。
- 仿真生成。
- 人类视频。
- 多机构聚合。
- 合成数据增强。

数据来源决定了模型学到的是“机器人真实可执行动作”，还是更偏视觉/语义先验。

### 2. 数据覆盖什么任务

任务覆盖要看：

- 操作物体种类。
- 动作技能种类。
- 场景变化。
- 语言指令变化。
- 组合任务或长程任务。

如果任务太集中，模型可能只是记住局部模式。

### 3. Action 怎么定义

这是机器人数据最关键的问题。

要问：

- action 是 joint space 还是 end-effector space。
- 是 absolute pose 还是 delta pose。
- gripper 如何表示。
- action 是否归一化。
- 不同机器人之间 action 是否统一。

看不懂 action，就看不懂数据集对模型的约束。

### 4. 语言从哪里来

语言可能来自人工标注、任务模板、环境元数据或后处理生成。语言质量会影响 VLA 的 grounding 能力。

要看：

- 指令是否具体。
- 是否和 episode 一一对应。
- 是否有 paraphrase。
- 是否存在模糊或过短标签。

### 5. 如何评估数据价值

数据集论文不能只说“我们收集了很多数据”。它要证明数据有用。

常见方式包括：

- 用数据训练 policy，看任务成功率。
- 比较单数据集训练和混合数据训练。
- 测试跨任务或跨机器人迁移。
- 分析数据规模和模型性能关系。

## 复现实验另篇

本文不展开 Docker 和加载命令。后续实验篇只做几件事：

- 用 LeRobotDataset 加载一个公开数据集。
- 打印 camera keys、state shape、action shape、language key。
- 对照本文的问题清单，写一张数据集阅读表。

实验是为了验证论文阅读，不是替代论文阅读。

## 参考论文与资料

- [Open X-Embodiment: Robotic Learning Datasets and RT-X Models](https://arxiv.org/abs/2310.08864)
- [DROID: A Large-Scale In-The-Wild Robot Manipulation Dataset](https://arxiv.org/abs/2403.12945)
- [DROID project page](https://droid-dataset.github.io/)
- [LeRobot documentation](https://huggingface.co/docs/lerobot/main/index)

## 本文小结

VLA 的数据问题不是“更多图片”，而是跨机器人、跨任务、跨场景、跨动作空间的数据如何被组织起来。Open X-Embodiment 让我们理解跨 embodiment 学习，DROID 让我们理解真实世界采集，LeRobotDataset 则是把论文世界接到实验世界的工具桥。
