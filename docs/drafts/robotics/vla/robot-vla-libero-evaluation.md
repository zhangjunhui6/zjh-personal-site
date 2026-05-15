---
title: "LIBERO 论文精读：VLA 评估为什么不能只看 demo"
description: "从 lifelong learning、knowledge transfer、任务套件、success rate 和失败分析理解 LIBERO benchmark 在 VLA 研究中的作用。"
date: 2026-05-15
tags:
  - robotics
  - libero
  - evaluation
  - vla
  - paper-reading
lang: zh
translationKey: robot-vla-libero-evaluation
draft: true
---

## 快速读法

- 本文定位：LIBERO benchmark 论文讲解，不展开评估脚本命令。
- 本文任务：理解为什么 VLA 需要标准化任务评估。
- 读完要能回答：LIBERO 在测什么，为什么 success rate 不是全部。
- 实验另篇：后续再做云 GPU 小规模 LIBERO eval。

VLA demo 视频很容易让人兴奋，但研究上真正重要的问题是：模型在一组明确任务上能否稳定成功？LIBERO 的价值就在于把“看起来会做”变成“可以统计评估”。

这篇文章不是跑 LIBERO，而是先读懂它作为 benchmark 的意义。

## 先抓思想：benchmark 把 demo 变成可证伪的 claim

LIBERO 的精髓不是“又一个仿真环境”，而是提出一个评估思想：

> VLA 能力必须落到明确任务、明确初始状态、明确成功谓词和可重复 episode 上，才有资格被比较。

这和模型论文的关系非常紧。OpenVLA、SmolVLA 或其他 policy 的成功率，只有在你知道 benchmark 测的是什么时才有意义。

| 层级 | LIBERO 的回答 | 为什么重要 |
| --- | --- | --- |
| 思想矛盾 | demo 很容易 cherry-pick，但机器人能力需要统计证据 | 把任务定义、场景初始化和 goal predicates 标准化 |
| 核心创新 | task suites、knowledge transfer / lifelong learning protocol、success predicate | 让“会不会做”变成可重复评估 |
| 架构关系 | LIBERO 不规定模型结构，而规定评估环境和任务协议 | 它测的是 policy 能力，不是提出新 policy |
| 证据重点 | task suite 分数、平均成功率、遗忘、不同任务类型差异 | 判断模型到底擅长空间、物体、目标还是长任务 |
| 局限 | 仿真环境不等于真实机器人，success predicate 不覆盖全部安全和交互质量 | 解释为什么 LIBERO 分数不能直接等同真机通用能力 |

所以读 LIBERO 文章要先理解 benchmark 的哲学：它不是替代真实部署，而是给 VLA 提供一个可比较、可诊断的中间层。

## 本篇读完要形成的评估地图

LIBERO 这类 benchmark 的价值，不在于给论文加一个分数，而在于把“能力”拆成可比较的问题：

| 评估层 | 要回答的问题 |
| --- | --- |
| 任务层 | 模型在哪些 manipulation task 上稳定成功 |
| 迁移层 | 学过的知识是否能帮助新任务，是否遗忘旧任务 |
| 协议层 | episode、seed、成功条件是否可复查 |
| 诊断层 | 失败来自感知、语言、动作还是控制接口 |

读 VLA 论文时，LIBERO 分数应该被当成诊断入口，而不是结论本身。

## 原论文图表导航

LIBERO 不是一篇模型论文，所以最重要的图不是网络结构，而是任务生成和评估协议：

| 原文图表 | 重点看什么 | 为什么重要 |
| --- | --- | --- |
| Figure 2 任务生成流程 | 从人类活动模板、语言指令、PDDL 初始状态到 goal predicates | 解释 LIBERO 为什么能系统地产生语言条件任务 |
| Task suite 表 | LIBERO-Spatial、Object、Goal、LIBERO-100 的任务划分 | 判断 benchmark 在测哪一种知识迁移 |
| lifelong learning 曲线 | 学新任务后旧任务表现如何变化 | 这是“知识迁移/遗忘”而不是单次成功率 |
| full results 表 | 算法、policy 架构、task suite 的交叉结果 | 看方法是否只在某一类任务上有效 |

读 VLA 论文里的 LIBERO 结果时，至少要追到 task suite 层级；只看一个平均 success rate 基本不够。

## 原图精读：LIBERO 的任务生成管线

<figure>
  <img src="/images/robotics/vla/original/libero-fig2.png" alt="LIBERO paper Figure 2 procedural generation pipeline" />
  <figcaption>原图：LIBERO Figure 2, Liu et al., <a href="https://arxiv.org/abs/2306.03310">LIBERO: Benchmarking Knowledge Transfer for Lifelong Robot Learning</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

Figure 2 是 LIBERO 的核心，不是装饰性的 pipeline。它说明一个 language-conditioned manipulation task 不是手写一句指令就结束，而是从 human activity template 生成 task instruction，再选 scene、object layout、initial state，最后写成 PDDL/BDDL 里的 goal predicates。也就是说，LIBERO 的成功率不是“视频看起来像成功”，而是环境状态是否满足明确 predicate。

这张图要和后面的 success rate 一起读：如果模型失败，我们可以追到任务生成链条里的具体环节。它可能是语言 grounding 失败，可能是 initial layout 导致视觉误判，也可能是动作执行没有满足 final predicates。benchmark 的价值就在这里：把 demo 的模糊印象拆成可诊断的条件。

![LIBERO evaluation pipeline](/images/robotics/vla/libero-eval.svg)

*自绘图：对应 LIBERO Figure 2 和 task suite 表。原图展示任务生成管线，自绘图把它压缩成后续评估实验要检查的 success predicate。*

## 自绘评估流程图

```text
language instruction
        │
        v
BDDL / PDDL goal predicates ──> robosuite scene init ──> rollout policy
        │                                                │
        └──────────────────────── success predicate <────┘
```

这里的重点是 goal predicate。LIBERO 的成功不是“看起来完成了”，而是环境状态满足任务定义。

## 核心公式：success、平均表现和遗忘

单个 episode 的成功可以抽象成：

```text
success(τ, g) = 1[all predicates in g are true at terminal state]
```

某个任务 `i` 在第 `k` 次学习后的表现记为 `R_{k,i}`。lifelong setting 里常看平均表现：

```text
A_k = (1 / k) Σ_{i=1..k} R_{k,i}
```

以及遗忘程度：

```text
F_i = max_{j < k} R_{j,i} - R_{k,i}
```

这解释了为什么 LIBERO 不只是“跑几个任务算成功率”。它想测的是：模型学新任务时，旧知识是否保留，旧知识是否帮助新任务。

## Benchmark 论文在解决什么

机器人学习里，评估往往比模型更难。原因是：

- 任务初始状态会变化。
- 物体位置会变化。
- 接触 dynamics 很敏感。
- 同一条指令可能有多种可行轨迹。
- 一次成功 demo 不代表稳定能力。

LIBERO 关注 lifelong robot learning 和 knowledge transfer。它希望构造一组可重复的 manipulation 任务，让研究者比较模型是否能在不同任务、场景和知识迁移设置下表现稳定。

## 论文里的硬事实

LIBERO 的基本配置要先记住：

| 项目 | 数字或事实 |
| --- | --- |
| 原论文总任务数 | 130 个 language-conditioned manipulation tasks |
| 原论文主要套件 | LIBERO-Spatial、LIBERO-Object、LIBERO-Goal、LIBERO-100 |
| 控制变量 | spatial relation、object concept、task goal、mixed knowledge |
| LIBERO-100 | 100 个 mixed knowledge transfer tasks |
| 工具链常见拆法 | LeRobot 等工具常暴露 `libero_spatial`、`libero_object`、`libero_goal`、`libero_10` / `libero_long`、`libero_90` |
| 研究对象 | declarative knowledge 和 procedural knowledge 的迁移 |

所以 LIBERO 不是普通仿真环境集合，而是专门设计来测“知识如何迁移和遗忘”的 benchmark。

## 原论文和工具链命名要分开

读论文时先记原始 benchmark 逻辑：Spatial、Object、Goal 分别控制空间关系、物体概念和任务目标，LIBERO-100 则混合这些知识类型形成更大规模的迁移任务。

到 LeRobot、openpi 或其他工具里跑实验时，你会经常看到另一套更工程化的命名，例如：

```text
libero_spatial
libero_object
libero_goal
libero_10 / libero_long
libero_90
```

这不是论文思想变了，而是评估脚本为了训练/测试划分、短程/长程任务和数据组织做了拆分。写实验记录时要同时写清楚“论文套件名”和“代码里的 env.task 名”，否则 success rate 没法比较。

## LIBERO 的核心不是环境，而是评估协议

很多人把 benchmark 只理解成“一个仿真环境”。但对论文阅读来说，更重要的是评估协议：

- 任务如何划分。
- 每类任务测试什么能力。
- episode 数如何设置。
- 成功条件如何判定。
- 模型是否能利用前面任务学到的知识。
- 不同方法是否在同一设置下比较。

没有协议，环境只是可运行软件；有了协议，它才是 benchmark。

## Lifelong learning 怎么理解

LIBERO 的论文主题和 lifelong learning 相关。可以先用直觉理解：

> 机器人不应该每次遇到新任务都从零开始，而应该把过去任务中的知识迁移到未来任务。

这会带来几个评价问题：

- 学了新任务后，旧任务会不会忘。
- 旧任务知识能不能帮助新任务。
- 模型能否在任务分布变化时保持稳定。
- 不同任务之间共享的是视觉知识、动作技能，还是语言 grounding。

VLA 模型虽然经常被当作 generalist policy，但如果没有这种评估，很难证明它真的会迁移。

## Success rate 怎么读

LIBERO 和类似 benchmark 常用 success rate，但论文里不能只看一个总数。

要拆成：

| 指标 | 意义 |
| --- | --- |
| overall success rate | 总体完成率 |
| per-task success rate | 哪些任务强，哪些任务弱 |
| average steps | 是否拖到超时边缘 |
| failure category | 失败来自感知、抓取、放置还是接口 |
| variance | 不同随机种子是否稳定 |

一个模型如果总成功率中等，但在某些任务上很稳定，可能比一个只在简单任务高分的模型更值得研究。

## LIBERO 对 VLA 的价值

VLA 模型需要连接图像、语言和动作。LIBERO 给它提供了几个观察窗口：

- 语言指令是否正确 grounded。
- 视觉状态变化是否被 policy 捕捉。
- 机械臂动作是否能完成 manipulation。
- 长程任务是否会累积误差。
- 不同任务之间是否有迁移。

这让 LIBERO 不只是“跑分工具”，而是分析 VLA 能力结构的仪器。

## 读评估表时要小心什么

论文结果表容易给人确定感，但要继续问：

- 任务数量和 episode 数是否足够。
- 是否固定 random seed。
- 是否使用相同 observation 和 action space。
- 是否有同等训练数据。
- 是否调参到 benchmark。
- 是否有失败视频或定性分析。

如果比较方法使用的数据、模型规模、动作接口都不同，总分对比就要谨慎解释。

## 失败分析比成功率更重要

VLA 失败常见几类：

- 看错目标物体。
- 理解错语言指令。
- 到达目标附近但抓取失败。
- 抓到了但放置失败。
- 轨迹抖动或控制不稳。
- 任务快完成时超时。

这些失败对应不同论文问题。感知失败可能需要更强视觉 representation；抓取失败可能是动作空间和控制频率问题；语言失败则指向 instruction grounding。

## 和真实机器人评估的关系

仿真 benchmark 不能替代真机，但它有价值：

- 可重复。
- 成本低。
- 方便比较方法。
- 可以快速定位接口和 policy 问题。

真机评估更接近部署，但成本高、噪声大、复现难。比较好的论文会说明仿真和真机之间的边界，而不是把一个数字夸成全部能力。

## 复现实验另篇

本文不放运行命令。后续 LIBERO 实验篇再做：

- 选择一个 VLA checkpoint。
- 跑少量 task 和 episode。
- 记录 per-task success rate。
- 给失败类型分类。
- 记录 latency 和显存。

实验篇服务于论文理解：不是追分，而是学会解释结果。

## 参考论文与资料

- [LIBERO: Benchmarking Knowledge Transfer for Lifelong Robot Learning](https://arxiv.org/abs/2306.03310)
- [LIBERO GitHub](https://github.com/Lifelong-Robot-Learning/LIBERO)
- [LIBERO documentation in LeRobot](https://huggingface.co/docs/lerobot/en/libero)

## 本文小结

LIBERO 的核心价值是把 VLA 从 demo 带到可统计、可比较、可分析的评估协议。读 VLA 论文时，看到 success rate 要继续追问任务划分、随机性、失败类型和迁移设置。
