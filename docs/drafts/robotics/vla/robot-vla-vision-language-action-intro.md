---
title: "机器人 VLA 总纲：先理解思想，再理解架构"
description: "建立 Vision-Language-Action 模型的核心心智模型：VLA 与 VLM 的根本差异、动作表示路线、机器人数据契约、训练目标和评估边界。"
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

- 本文定位：整套 VLA 连载的总纲，不是单篇论文摘要。
- 本文任务：先建立 VLA 的核心思想，再进入 OpenVLA、π0、SmolVLA、LIBERO、GR00T 等论文。
- 读完要能回答：VLA 和普通 VLM 差在哪里，为什么动作表示是核心，为什么数据和评估决定论文结论能不能信。
- 实验另篇：Docker 复现实验单独写；本文只负责让你读论文时有抓手。

如果只把 VLA 理解成“视觉语言模型接一个机器人头”，后面每篇论文都会显得像一堆模块名：VLM backbone、action tokenizer、flow matching、action expert、LoRA、LIBERO、LeRobot、GR00T。真正的学习顺序应该反过来：

```text
VLA 的思想问题
  -> 论文解决的关键矛盾
  -> 创新点为什么合理
  -> 架构为什么这样设计
  -> 公式、代码和实验细节
```

这篇总纲就是给后面所有论文建立一套共同语言。

## 一句话理解 VLA

VLA 的全称是 Vision-Language-Action。它不是普通多模态模型多接了一个输出，而是把视觉、语言和机器人控制放进同一个闭环：

```text
image / video + language instruction + robot state
    -> policy
    -> executable robot action
    -> new observation
    -> next action
```

普通 VLM 的目标是回答得对；VLA 的目标是动得对。这个差别会改变几乎所有技术细节。

| 问题 | 普通 VLM | 机器人 VLA |
| --- | --- | --- |
| 输入 | 图像和文本为主 | 图像、语言、机器人状态、历史观测 |
| 输出 | 文本 token | 可执行动作、action chunk 或技能 |
| 错误形式 | 说错、漏答、幻觉 | 撞到、抓空、方向反、动作幅度错 |
| 时间结构 | 多数是一次性回答 | 闭环控制，观察和动作不断交替 |
| 泛化对象 | 新图像、新问题、新语义组合 | 新物体、新场景、新任务、新机器人本体 |
| 评估 | QA accuracy、caption、human preference | success rate、rollout、失败类型、延迟和安全边界 |

所以 VLA 的核心不是“大模型理解了语言”，而是：

> 如何把视觉语言理解，落到具体机器人、具体动作空间、具体控制频率和具体评估协议里。

## VLA 的核心矛盾

VLA 论文大多在处理同一个矛盾：

> 视觉语言模型有大量世界知识，但机器人动作数据稀缺、昂贵、强依赖本体和环境。

这个矛盾可以拆成四层。

| 层级 | 矛盾 | 典型论文路线 |
| --- | --- | --- |
| 语义到动作 | VLM 会识别物体和理解指令，但不会自然输出机器人动作 | RT-2、OpenVLA 的 action-as-token |
| 离散到连续 | LLM 擅长 token，机器人控制却是连续信号 | π0、SmolVLA、GR00T 的 action expert / flow matching |
| 单机器人到多机器人 | 一个机器人学到的动作不一定适用于另一个身体 | Open X-Embodiment、GR00T 的 embodiment adapter |
| demo 到可证明能力 | 精选视频好看，但不能证明泛化和稳定性 | LIBERO、真实机器人 success rate、failure analysis |

读 VLA 论文时，先问它站在哪一层矛盾上。否则很容易把“用了什么 backbone”误读成论文贡献。

## 最小公式：VLA 是一个条件策略

最小 VLA policy 可以写成：

```text
a_t = π_θ(o_t, s_t, l, h_t)
```

其中：

| 符号 | 含义 | 代码里通常对应什么 |
| --- | --- | --- |
| `o_t` | 当前视觉观察，比如第三视角、腕部相机、多路 RGB | `observation.images.*`、image processor |
| `s_t` | 机器人自身状态，比如关节角、末端位姿、夹爪状态 | `observation.state`、proprioception |
| `l` | 语言任务，比如 “pick up the red block” | `task`、`instruction`、`task_index` metadata |
| `h_t` | 历史信息，比如过去帧、队列、隐藏状态 | frame stack、history cache、action queue |
| `a_t` | 当前动作 | `action`、policy output、environment step |

训练时最常见的出发点是行为克隆：

```text
L_BC = E_{τ ~ D, t} [ loss(π_θ(o_t, s_t, l, h_t), a_t*) ]
```

但不同论文的“loss”不一样：

| 路线 | 训练对象 | 代表论文 |
| --- | --- | --- |
| action token | 预测离散动作 token 的交叉熵 | RT-2、OpenVLA |
| action regression | 直接回归连续动作 | 早期 imitation learning / 部分 policy head |
| diffusion / flow matching | 从噪声生成连续 action chunk | π0、SmolVLA、GR00T |
| post-training | 用目标机器人或目标任务数据适配基础 VLA | OpenVLA fine-tuning、openpi、LoRA |

公式不是装饰。公式的作用是帮你追问：loss 到底算在 token 上、单步动作上、整段 action chunk 上，还是 rollout success 上？

## VLA 的五个 contract

一篇 VLA 论文如果不讲清这五个 contract，就算架构图很好看，也很难真正复现或判断结论。

| Contract | 必须问什么 | 常见失败 |
| --- | --- | --- |
| Observation | 几个相机、什么视角、什么分辨率、是否有 state、是否用历史帧 | 相机顺序或 resize 不一致，模型看到的分布变了 |
| Action | 几维动作、坐标系、控制模式、gripper 定义、是否 action chunk | 维度对上了但坐标系反了，机器人动作不可执行 |
| Temporal | 控制频率、action horizon、闭环还是开环、是否异步执行 | 推理太慢，action queue 过期，反馈频率不够 |
| Data | 真机/仿真/视频、多少 embodiment、任务和语言如何标注 | 数据看似多，但动作空间不可混合或长尾太稀疏 |
| Evaluation | 任务套件、episode 数、success predicate、OOD split、失败类型 | 平均分好看，但只证明了很窄的任务分布 |

后面每篇文章都应该回到这五个 contract。它们比模型名字更能决定你是否真正理解了 VLA。

## 三条主技术路线

VLA 发展到现在，可以先粗分成三条路线。这个分法不是论文分类表，而是帮助你理解“为什么架构会长成这样”。

### 路线一：把动作变成 token

这条路线的直觉是：

> 既然 VLM/LLM 擅长预测 token，能不能把机器人动作也编码成 token？

RT-2 和 OpenVLA 都属于这个方向。它的优点是可以复用语言模型的训练范式、tokenizer、generation API 和大规模预训练能力。缺点是机器人动作本来是连续信号，离散化会带来精度、延迟和动作分布问题。

读这类论文时，重点不是“用了哪个 LLM”，而是：

- 连续动作如何离散。
- 每个动作维度有多少 bins。
- 动作值域从哪里来。
- token 如何解码回真实动作。
- 控制频率是否被逐 token 生成拖慢。

### 路线二：让 VLM 负责理解，让 action expert 负责连续控制

这条路线的直觉是：

> 语义理解可以借助 VLM，但动作生成应该由更适合连续控制的模块完成。

π0、SmolVLA 和 GR00T 都可以放在这条线上。它们通常把视觉语言 backbone 和 action expert 分开：VLM 提供语义上下文，action expert 用 diffusion 或 flow matching 生成连续 action chunk。

读这类论文时，重点是：

- action chunk 的长度是多少。
- flow/diffusion 的噪声到动作过程怎么训练。
- 推理需要多少采样步。
- action queue、异步执行和控制频率如何配合。
- 不同机器人 state/action 维度如何适配。

### 路线三：把 VLA 当成机器人系统，而不是单个模型

这条路线的直觉是：

> 机器人能力不是只由 policy 网络决定，还由数据、工具链、评估、低层控制和安全系统共同决定。

Open X-Embodiment、DROID、LeRobot、LIBERO、GR00T 和微调文章都属于这个更大的系统视角。它们提醒我们：没有数据格式、norm stats、evaluation wrapper、success predicate 和低层 controller，VLA 论文里的模型无法变成可靠实验。

读这类文章时，重点是：

- 数据是否覆盖目标场景和目标 embodiment。
- 论文结果是否能映射到可复现的 benchmark。
- 工具链是否保存了 schema、stats、processor 和 checkpoint config。
- 部署时哪些东西由模型负责，哪些由机器人系统负责。

## 代表论文放进同一张地图

下面这张表是后续连载的阅读地图。读每篇之前，先看它在 VLA 思想链条里解决哪一个问题。

| 文章 | 论文/主题精髓 | 核心创新点 | 你读完应该掌握 |
| --- | --- | --- | --- |
| VLA 总纲 | VLA 是从视觉语言理解到机器人动作闭环 | 用 observation/action/temporal/eval contract 统一理解不同论文 | 能判断一篇 VLA 论文到底在解决什么问题 |
| Open X-Embodiment / DROID | VLA 的能力上限被数据覆盖决定 | 跨机器人数据混合、真实世界大规模采集 | 能区分 embodiment diversity 和 scene diversity |
| LeRobot | 论文到实验之间需要工具链桥梁 | dataset schema、stats、processor、policy、eval 统一接口 | 能把论文概念映射到代码对象 |
| OpenVLA | 把 VLM 改造成开源 action-token robot policy | 7-DoF 动作离散化并映射进 Llama token 空间 | 能解释 action token 路线的优点和代价 |
| SmolVLA | VLA 不一定只能靠大模型和昂贵训练 | 小 VLM、flow action expert、社区数据、异步推理 | 能解释 affordable/efficient 的证据链 |
| π0 / π0.5 | 机器人动作是连续轨迹生成问题 | VLM + flow matching action expert + action chunk | 能解释为什么连续动作路线不同于 OpenVLA |
| LIBERO | VLA 不能只靠 demo 证明能力 | 用任务套件和 success protocol 测 knowledge transfer | 能读懂 benchmark 能证明什么、不能证明什么 |
| 微调 / LoRA | 基础 VLA 必须适配目标机器人和任务 | 参数高效更新 + 数据映射 + norm stats + eval 闭环 | 能知道微调失败时先查 action contract 而不是只查 loss |
| GR00T | 人形机器人 VLA 是系统工程 | dual-system、embodiment adapters、合成/仿真/真机数据 | 能解释 humanoid VLA 为什么不只是桌面机械臂放大版 |

![Robot VLA route map](/images/robotics/vla/vla-route-map.svg)

*自绘图：VLA 学习地图。它不是某篇论文原图，而是把后续 OpenVLA、π0、SmolVLA、LIBERO、fine-tuning、GR00T 的位置先摆出来。*

## 读一篇 VLA 论文的固定顺序

以后每读一篇 VLA 论文，都按下面顺序，不要从 abstract 顺着读到底。

| 顺序 | 看什么 | 要回答的问题 |
| --- | --- | --- |
| 1 | Teaser / Figure 1 | 作者希望你相信什么能力已经成立 |
| 2 | Problem / Claim | 论文针对哪个 VLA 矛盾提出了什么可验证 claim |
| 3 | Method figure | 视觉、语言、state、action 在哪里汇合 |
| 4 | Action representation | 输出是 token、连续动作、action chunk、技能，还是混合表示 |
| 5 | Objective | loss 算在什么对象上，和真实 rollout 有什么差距 |
| 6 | Data | 能力来自什么数据，是否覆盖目标 embodiment 和场景 |
| 7 | Evaluation | success rate 如何定义，episode 和 split 是否可信 |
| 8 | Failure / limitation | 论文没有证明什么，部署时哪里最容易错 |
| 9 | Code object | 这个概念在代码里对应 processor、policy、tokenizer、stats、env wrapper 还是 evaluator |

这就是“理论思想先行”的读法。只有先知道论文在解决什么思想问题，架构图才有意义。

## 论文创新点该怎么判断

VLA 论文里常见的“创新点”可以分成六类。读文章时要避免把所有创新都写成“提出了一个模型”。

| 创新类型 | 判断标准 | 例子 |
| --- | --- | --- |
| 表示创新 | 是否改变了动作、状态或任务的表达方式 | OpenVLA 的 action tokenization |
| 生成目标创新 | 是否改变了动作学习目标 | π0 的 flow matching action chunk |
| 数据创新 | 是否解决机器人数据稀缺、混合或真实场景采集问题 | Open X-Embodiment、DROID |
| 系统创新 | 是否改变推理、部署或工具链组织方式 | SmolVLA async inference、LeRobot |
| 评估创新 | 是否让能力验证更可复查 | LIBERO |
| 适配创新 | 是否降低新机器人/新任务适配成本 | LoRA、openpi post-training、GR00T adapters |

判断创新点时，不要只问“有没有新模块”，还要问：这个模块解决的是哪个 VLA 矛盾，有什么证据证明它解决了。

## 架构图应该怎么读

VLA 架构图不是神经网络积木图，而是 contract 图。看到任何架构图，都先找五个位置：

```text
observation input
  -> visual/language/state encoder
  -> fusion point
  -> action representation
  -> decoder / controller / environment
```

然后追问：

- 哪些模块来自预训练 VLM，哪些从机器人数据学出来。
- 语言信息是在一开始融合，还是通过 cross-attention 控制 action expert。
- action 是一次生成一个，还是生成一个 chunk。
- 模型输出后是否还需要 unnormalization、low-level controller 或 safety filter。
- 图里没画出来但实验必须存在的东西是什么。

很多论文图会把 processor、norm stats、env wrapper、control loop 画得很轻，但实验失败往往正好发生在这些位置。

## 评估比 demo 更重要

VLA 论文的 demo 视频通常很有吸引力，但你不能只靠 demo 判断模型水平。专业读法是把评估拆成：

| 评估类型 | 能说明什么 | 不能说明什么 |
| --- | --- | --- |
| 离线 loss / action error | 模型是否拟合示范动作 | 不能保证闭环成功 |
| 仿真 benchmark | 是否在标准任务套件上可比较 | sim-to-real gap 仍然存在 |
| 真机 success rate | 是否能在目标机器人执行 | episode 数少时方差很大 |
| OOD / generalization split | 是否能处理新物体、新场景、新语言 | 需要看 split 是否真正分布外 |
| failure analysis | 失败来自感知、语言、控制还是数据 | 很多论文写得不够细 |

VLA 最有价值的不是一个平均分，而是失败类型。因为失败类型会告诉你下一步应该改数据、改动作表示、改模型，还是改评估环境。

## 代码里要找什么

有了理论地图，代码阅读就不会乱。后续实验里最先检查的不是模型参数量，而是这些对象：

| 论文概念 | 代码对象 |
| --- | --- |
| observation contract | dataset features、camera keys、image processor |
| action contract | action dim、action tokenizer、policy output spec |
| temporal contract | action horizon、control fps、history、action queue |
| normalization | `meta/stats.json`、unnorm key、processor stats |
| training objective | loss function、action mask、flow scheduler |
| evaluation | env wrapper、rollout loop、success predicate |
| post-training | adapter config、trainable modules、checkpoint family |

这也是为什么本连载把“论文精读”和“Docker 实验”分开。理论文章负责建立这些对象之间的关系；实验文章负责逐个打印、验证和跑通。

## 读完本文你应该会什么

读完总纲后，你不需要立刻会训练一个 VLA，但应该能做五件事：

1. 看到一篇 VLA 论文，先判断它是在做 action token、continuous action expert、数据系统、benchmark，还是 post-training。
2. 看架构图时能找到 observation、state、language、action 和 control loop 的位置。
3. 看公式时能判断 loss 到底监督的是 action token、单步动作还是 action chunk。
4. 看实验表时能追问 success rate 的任务、episode、split 和失败类型。
5. 看代码时知道先查 schema、action shape、norm stats、processor、policy config 和 evaluator。

如果能做到这五点，后面读 OpenVLA、π0、SmolVLA 和 GR00T，就不会只是记模型名，而是能理解每篇论文为什么这样设计。

## 复现实验另篇

本文不展开本地实验。后续 Docker 实验会围绕这几个最小验证：

- 加载 LeRobotDataset 并打印 observation/action schema。
- 检查 action shape、fps、norm stats 和 task metadata。
- 在云端 NVIDIA Docker 里跑 OpenVLA / SmolVLA / openpi 的最小 inference。
- 在 LIBERO 或小型环境里跑 rollout，记录 success、latency 和失败类型。

实验的目标不是堆命令，而是验证本文的 contract 是否真的对齐。

## 参考论文

- [RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control](https://arxiv.org/abs/2307.15818)
- [Open X-Embodiment: Robotic Learning Datasets and RT-X Models](https://arxiv.org/abs/2310.08864)
- [OpenVLA: An Open-Source Vision-Language-Action Model](https://arxiv.org/abs/2406.09246)
- [π0: A Vision-Language-Action Flow Model for General Robot Control](https://arxiv.org/abs/2410.24164)
- [LIBERO: Benchmarking Knowledge Transfer for Lifelong Robot Learning](https://arxiv.org/abs/2306.03310)
- [GR00T N1: An Open Foundation Model for Generalist Humanoid Robots](https://arxiv.org/abs/2503.14734)

## 本文小结

VLA 的主线不是“更大的多模态模型”，而是“把视觉语言理解变成机器人可执行动作”。后面的论文都可以放回这句话里：OpenVLA 研究动作 token 化，π0 研究连续 action chunk，SmolVLA 研究低成本闭环，LIBERO 研究评估证据，GR00T 研究人形机器人系统。先抓住这条思想线，架构和细节才会真正变得有意义。
