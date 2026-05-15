---
title: "OpenVLA 论文精读：开源 VLM 如何变成 robot policy"
description: "从论文动机、模型结构、动作 token、数据来源、训练目标和评估方式理解 OpenVLA，而不是把它写成推理命令教程。"
date: 2026-05-15
tags:
  - robotics
  - openvla
  - vla
  - policy
  - paper-reading
lang: zh
translationKey: robot-vla-openvla-policy-notes
draft: true
---

## 快速读法

- 本文定位：OpenVLA 论文精读，不展开本地或云端推理命令。
- 本文任务：理解开源 VLM 如何被改造成机器人 policy。
- 读完要能回答：OpenVLA 为什么选择 action token 路线，它的开源价值在哪里。
- 实验另篇：后续单独做 checkpoint 下载、单次 inference 和 LIBERO eval。

OpenVLA 是 VLA 方向里很适合作为第一篇精读的论文。它的价值不只是提出一个模型，而是把 VLA 的核心问题以开源方式暴露出来：数据、模型、动作表示、训练和评估都可以被研究者检查。

这篇文章按论文阅读顺序来拆。

## 本篇读完要形成的论文地图

OpenVLA 可以先记成一句话：

> 用开放的 VLM backbone、机器人数据和 action tokenization，构造一个可复查的通用 robot policy 基线。

围绕这句话，论文可以拆成四个贡献：

| 贡献 | 读论文时看什么 |
| --- | --- |
| 开放基线 | 模型、代码、数据处理和评估是否能被复查 |
| VLM 迁移 | 哪些能力来自视觉语言预训练，哪些来自机器人数据 |
| 动作 token 化 | 连续动作如何离散、解码、归一化 |
| 机器人评估 | 是否在真实任务或标准 benchmark 上证明可执行性 |

只要这四块看清楚，就不会把 OpenVLA 误读成“一个大 VLM 加了机器人 prompt”。

## 原论文图表导航

读 OpenVLA 时，建议先对照原文和项目页看这些图表，而不是直接从 introduction 跳到实验数字：

| 原文图表 | 重点看什么 | 为什么重要 |
| --- | --- | --- |
| Figure 1: OpenVLA model architecture | 图像经过 DINOv2 + SigLIP 双视觉编码器，projector 映射到 Llama 2 embedding space，最后输出 7 维动作 token | 这是 OpenVLA 把 Prismatic VLM 改成 robot policy 的主图 |
| Section 3.2: action tokenization | 每个动作维度按训练数据 1% 到 99% 分位区间离散成 256 bins，再映射到 Llama tokenizer 的最后 256 个低频 token | 这是 OpenVLA 和连续 action expert 路线的根本分叉 |
| Figure 2 + Table 4 | BridgeData V2 / WidowX 评估任务、泛化轴和详细 success rate | 判断 OpenVLA 是否只是会做训练分布内动作 |
| Section 5.2 / 5.3 | 新机器人/新任务 fine-tuning、LoRA 参数高效微调 | 这是 OpenVLA 不只是 base model，而是可适配开放基线的原因 |
| Figure 5 | 不同 GPU、量化设置下的推理速度和显存权衡 | 关系到后续 Docker 云 GPU 实验怎么选机器 |

这几张图表读完后，正文的很多细节会变成“填空题”：视觉特征从哪里来，动作 token 怎么训练，评估到底证明了什么，以及为什么它需要云端 GPU 而不是本机 Docker 硬跑。

## 原图精读：OpenVLA 的三张关键图

<figure>
  <img src="/images/robotics/vla/original/openvla-fig1.png" alt="OpenVLA paper Figure 1 model architecture" />
  <figcaption>原图：OpenVLA Figure 1, Kim et al., <a href="https://arxiv.org/abs/2406.09246">OpenVLA: An Open-Source Vision-Language-Action Model</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

Figure 1 要从左往右读。左边不是“随便一张图片加一句话”，而是 OpenVLA 的 observation contract：一个 RGB observation 和一个 language instruction。中间的 DinoV2 + SigLIP 是视觉表征来源，MLP projector 的作用是把视觉特征塞进 Llama 2 的 embedding space。右边最关键：模型输出的不是自然语言，而是经过 action de-tokenizer 还原的 7 维 robot action。

这张图真正暴露了 OpenVLA 的路线选择：它把机器人控制改写成 VLM 的 next-token prediction 问题。这样做的优点是能复用 VLM 训练栈，缺点是动作必须离散化，且逐 token 解码会影响控制频率。

<figure>
  <img src="/images/robotics/vla/original/openvla-fig2.png" alt="OpenVLA paper Figure 2 BridgeData V2 WidowX evaluation tasks and results" />
  <figcaption>原图：OpenVLA Figure 2, Kim et al., <a href="https://arxiv.org/abs/2406.09246">arXiv:2406.09246</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

Figure 2 不要只看最左边 average。它把评估拆成 visual、motion、physical、semantic 和 language grounding 等泛化轴。专业读法是先问：每个轴对应训练分布外的哪种变化？例如 semantic generalization 更接近“未见概念/未见目标”的语义泛化，language grounding 更接近“场景里有多个物体时，是否按指令操作正确目标”。

这也是为什么 OpenVLA 的结论不能写成“通用机器人模型已经解决”。更准确的说法是：在这些明确任务和泛化轴上，OpenVLA 作为开放 VLA 基线明显强于若干对照模型，但不同泛化类型的难度并不一样。

<figure>
  <img src="/images/robotics/vla/original/openvla-fig5.png" alt="OpenVLA paper Figure 5 inference memory and latency tradeoff" />
  <figcaption>原图：OpenVLA Figure 5, Kim et al., <a href="https://arxiv.org/abs/2406.09246">arXiv:2406.09246</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

Figure 5 是后续 Docker 实验最有用的一张图。它把模型能力问题落回工程现实：显存、量化、推理频率和 GPU 型号会决定机器人闭环能不能跑。OpenVLA 可以做开源基线，但正式推理和评估仍应放在 NVIDIA GPU Docker 里，本机 M1 Pro Docker 更适合做数据和接口检查。

![OpenVLA architecture and action tokenization](/images/robotics/vla/openvla-architecture.svg)

*自绘图：对应 OpenVLA Figure 1 和 Section 3.2。上面的原图保留论文全貌，这张图只保留 VLA policy 的机制主线。*

## 自绘结构图

```text
RGB image(s) ──> DINOv2 / SigLIP ──> visual tokens ┐
                                                     ├─> Llama 2 7B ──> action tokens ──> 7-DoF action
instruction ──> tokenizer ─────────> text tokens ───┘
```

这里的关键不是“图像和语言都进了模型”，而是动作也被塞进了语言模型的 token 空间。OpenVLA 的工程优雅性和局限性都来自这个决定。

## 核心公式：动作离散化、token 映射与 next-token loss

OpenVLA 的动作空间不是直接回归连续值，而是先把每个动作维度离散化。论文使用训练数据每个维度的 1% 和 99% 分位数作为边界，减少离群动作把 bin 拉得过宽：

```text
q_i^lo = quantile(a_i, 0.01)
q_i^hi = quantile(a_i, 0.99)

b_i = clip(
  floor((a_i - q_i^lo) / (q_i^hi - q_i^lo) * 255),
  0,
  255
)
```

但这还不是完整的 OpenVLA action tokenizer。关键下一步是把 bin id 映射进语言模型 tokenizer：

```text
token_i = llama_vocab[-256 + b_i]
```

也就是说，OpenVLA 没有扩展一个全新的 256 action-token vocabulary，而是复用 Llama tokenizer 里最后 256 个最少使用的 token，把它们覆盖成 action tokens。推理时再反向解码：

```text
â_i = q_i^lo + b_i / 255 * (q_i^hi - q_i^lo)
```

训练目标是标准 next-token prediction，但 loss 只关心动作 token：

```text
L_action = - Σ_i log pθ(token_i | image, instruction, token_<i)
```

读论文时要注意三件事。第一，连续控制被改写成语言模型的离散 token 预测，所以 OpenVLA 能直接沿用 VLM 训练基础设施。第二，动作边界依赖训练数据统计，换数据集或换机器人时必须重新检查 unnormalization/action stats。第三，逐 token 生成带来延迟，这也是后续 π0/SmolVLA 改用 continuous action chunk 的重要动机。

## 论文要解决什么

OpenVLA 的问题背景可以概括成两点。

第一，VLM 已经拥有强视觉和语言能力，但机器人控制需要输出动作。如何把 VLM 的能力迁移到 robot policy，是 VLA 的核心问题。

第二，很多强 VLA 系统并不完全开源，研究者难以复现和改进。OpenVLA 的名字里 “Open” 很重要，它希望提供可访问的模型、代码和训练路线。

所以它不只是一个性能论文，也是一个开放基线论文。

## 论文里的硬事实

读 OpenVLA 时先记住这些事实，后面的讨论才不会飘：

| 项目 | OpenVLA 的选择 |
| --- | --- |
| 模型规模 | 7B 参数级 VLA |
| Backbone | Prismatic-7B：DINOv2 + SigLIP 视觉编码器、2 层 MLP projector、Llama 2 7B 语言模型 |
| 动作形式 | 单步 7-DoF robot control action，逐维离散为 action tokens |
| 离散化 | 每个动作维度 256 bins，边界来自训练集 1%/99% 分位数 |
| Token 映射 | 覆盖 Llama tokenizer 中最后 256 个最少使用 token |
| 训练数据 | 970k real-world robot manipulation trajectories，来自 Open X-Embodiment 的筛选混合 |
| 训练代价 | 64 张 A100 训练 14 天，约 21,500 A100-hours |
| 推理代价 | bf16 约需 15GB GPU 显存；RTX 4090 上约 6Hz |
| 评估结论 | 在 29 个任务、多种 robot embodiment 上比 55B RT-2-X 高 16.5% 绝对成功率 |
| 工程贡献 | 发布模型、fine-tuning notebook、PyTorch 代码、LoRA/quantization 路径 |

这些事实也解释了它为什么适合做入门论文：结构足够清晰，代码和模型足够开放，局限也足够明显。

## VLA contract：OpenVLA 承诺了什么接口

用 AI 论文精读框架看 OpenVLA，必须把它的 contract 拆开。否则读者容易只记住“7B VLA”，却不知道 policy 到底吃什么、吐什么。

| Contract | OpenVLA 里的具体含义 | 失败风险 |
| --- | --- | --- |
| Observation | 以 RGB 图像和语言指令为核心输入；具体部署时还受相机视角、图像预处理和 processor 约束 | 相机视角或 resize/crop 不一致，会让模型看到和训练分布不同的 observation |
| Action | 单步 7-DoF end-effector action，逐维离散成 256 bins，再映射到 Llama token | action dim、gripper convention 或坐标系错，token 预测看似正常但动作不可执行 |
| Temporal | 逐步生成动作 token，闭环频率受模型推理速度影响；论文报告 RTX 4090 约 6Hz | 逐 token 解码延迟会影响实时控制，尤其不适合高频灵巧动作 |
| Normalization | 动作边界来自训练数据每维 1%/99% 分位数；推理时必须反解码/反归一化 | 换数据集或机器人时 action stats 错，动作幅度会系统性偏移 |
| Evaluation | BridgeData V2 / WidowX 等任务上看 success rate 和泛化轴 | 单个平均分不能直接证明真实世界通用泛化 |

这张 contract 表比模型参数更重要。后续你真正跑 Docker inference 时，第一步不是“模型能不能 load”，而是确认 observation key、action dim、unnorm stats 和目标评估环境是否一致。

## Formula to code：公式在实现里对应什么

OpenVLA 的公式可以映射成三层代码对象：

| 公式/机制 | 实现对应物 | 检查点 |
| --- | --- | --- |
| `b_i = discretize(a_i)` | action tokenizer / processor | bin 数是否 256，边界是否来自正确数据集统计 |
| `token_i = llama_vocab[-256 + b_i]` | tokenizer vocabulary override | action token 是否和 Llama 低频 token 一一对应 |
| `L_action = -log p(token_i | ...)` | VLM next-token training loss | loss 是否只监督 action tokens，prompt/text 部分如何处理 |
| `â_i = decode(token_i)` | unnormalization / action decoder | gripper、坐标系、动作尺度是否和环境一致 |

这也是为什么 OpenVLA 的复现实验不能只写 `model.generate()`。真正的复现入口是 processor、action tokenizer、unnormalization 和环境 wrapper 的闭环。

## OpenVLA 的真正贡献不只是开源

OpenVLA 很容易被误读成“把一个 VLM 开源出来给机器人用”。更准确的读法是三层贡献：

| 层级 | 具体贡献 | 读论文时要追问 |
| --- | --- | --- |
| 模型层 | Prismatic VLM + action tokenization | 视觉特征、语言 token、动作 token 是否真的在同一个生成接口下工作 |
| 数据层 | 从 Open X-Embodiment 中筛出单臂、第三视角、end-effector control 更一致的数据混合 | 数据多样性和动作空间一致性之间如何取舍 |
| 适配层 | 系统研究 fine-tuning、LoRA、quantization | 开源 VLA 能否成为新机器人任务的 initialization，而不是只能 out-of-box 跑 demo |

这也是为什么 OpenVLA 后续实验不应该只跑一次 inference。真正值得验证的是：给定新数据集时，action stats、processor、LoRA adapter 和评估环境能否闭环。

## 论文的核心方法

OpenVLA 的基本思路是：

```text
pretrained VLM backbone
  + robot data
  + action tokenization
  -> vision-language-action policy
```

它不是从零训练机器人模型，而是站在 VLM 的视觉语言能力之上，再用机器人数据把输出空间对齐到动作。

读这类论文时要抓住一个问题：哪些能力来自 VLM 预训练，哪些能力来自机器人数据微调？

## Action tokenization 是关键

OpenVLA 路线的一个核心，是把连续机器人动作转换成模型可以预测的 token 或 token-like 表示。

这个设计背后有一个很强的工程直觉：

> 如果语言模型已经擅长预测 token，那么能否把机器人动作也变成 token 序列？

这样做的好处是可以复用 VLM/LLM 的生成范式。但代价是必须小心处理连续动作的离散化。

读论文时要问：

- 每个 action 维度如何离散。
- 动作值域从哪里来。
- 不同机器人或数据集的动作是否共享 token 空间。
- gripper 是否和位姿动作一起处理。
- 输出 token 如何被还原成可执行 action。

Action tokenization 不是实现细节，而是 OpenVLA 技术路线的中心。

## 输入：图像、语言与机器人状态

OpenVLA 这样的 VLA policy 需要把当前观察和任务目标合在一起。论文里通常要说明：

- 使用哪类相机图像。
- 语言指令如何进入 prompt 或 processor。
- 是否使用 proprioception。
- 历史帧或历史动作是否参与。
- 输入分辨率和图像预处理如何影响性能。

如果论文主打开放词表指令理解，就要看它如何构造语言输入，以及评估里是否真的测试了语言泛化。

## 数据：Open X-Embodiment 的意义

OpenVLA 使用大规模机器人数据进行训练。这里的关键不是只看 episode 数，而是看数据多样性：

- 不同任务。
- 不同场景。
- 不同机器人。
- 不同相机视角。
- 不同语言指令。

Open X-Embodiment 对 OpenVLA 的意义在于提供跨任务、跨 embodiment 的机器人数据基础。没有这类数据，VLM 很难知道“动作 token”和真实机器人行为之间的关系。

## 训练：把 VLM 对齐到动作

OpenVLA 的训练可以先理解成行为克隆：给定 observation 和 instruction，预测专家 action。

但因为输出经过 tokenization，训练目标更接近 token prediction。也就是说，它把机器人控制问题放进了 VLM 擅长的序列预测框架。

读训练部分时重点看：

- 使用哪些预训练权重。
- 冻结还是更新 backbone。
- robot data 如何混合。
- action token loss 如何定义。
- 是否做 instruction tuning。
- 训练成本和硬件需求如何。

这些细节决定它到底是“VLM 小改造”，还是“深度机器人后训练”。

## 评估：不要只看总分

OpenVLA 论文的评估要从三个角度读：

| 角度 | 关注点 |
| --- | --- |
| 任务成功率 | 是否真的完成 manipulation task |
| 泛化 | 新任务、新物体、新场景是否有效 |
| 开源基线 | 其他研究者是否能复现和扩展 |

如果论文和项目页强调超过某些基线，要继续看比较是否公平：数据、模型规模、评估任务、机器人平台是否一致。

## Evaluation protocol：分数能证明什么

OpenVLA 的评估要按照 protocol 读，而不是只看“超过 RT-2-X”这句话。

| 评估问题 | 阅读时要查什么 | 能证明什么 | 不能证明什么 |
| --- | --- | --- | --- |
| BridgeData V2 / WidowX 任务 | 任务类别、物体、场景、语言指令是否和训练分布相近 | OpenVLA 在标准桌面 manipulation 设置下可执行 | 不能证明任意机器人平台上的泛化 |
| 多任务平均成功率 | 每个任务的 success rate，而不是只看平均值 | 判断能力是否集中在少数任务 | 平均分会掩盖特定失败类型 |
| 和 RT-2-X 对比 | 数据、模型规模、训练协议、评估平台是否一致 | 提供开放基线相对闭源强模型的参考 | 不等于所有 VLA 场景优于 RT-2-X |
| Fine-tuning 结果 | 新 robot setup / new task 上的样本量、训练方式、LoRA 设置 | 说明 OpenVLA 可作为 initialization | 不等于小数据微调一定能迁移到任何机器人 |

专业读法是把 OpenVLA 结论限定为：在论文设定的数据、机器人平台和评估任务里，开放 VLM + action tokenization 能形成强 robot policy 基线。不要把它外推成“任意 RGB+语言都能稳定控制机器人”。

## OpenVLA 的局限怎么理解

OpenVLA 的路线很清晰，但也有局限：

- action tokenization 会带来离散化误差。
- 不同机器人 action space 仍然难以完全统一。
- 大模型推理和训练成本不低。
- 真实机器人部署还需要控制频率、安全和接口适配。
- 成功率不能直接等同于物理世界泛化能力。

这些局限不削弱它的价值，反而说明后续论文为什么会探索 continuous action expert、flow matching 和更轻量模型。

## 复现实验另篇

本文不放 Docker 命令。后续实验篇再做：

- 下载 OpenVLA checkpoint。
- 构造一条 observation + instruction。
- 跑一次 policy inference。
- 打印 action shape 和 latency。
- 接到 LIBERO 做少量 episode。

主文负责讲清论文机制，实验篇负责验证调用链。

## 参考论文与资料

- [OpenVLA paper](https://arxiv.org/abs/2406.09246)
- [OpenVLA project page](https://openvla.github.io/)
- [OpenVLA GitHub](https://github.com/openvla/openvla)
- [Open X-Embodiment paper](https://arxiv.org/abs/2310.08864)

## 本文小结

OpenVLA 的关键贡献是把开源 VLM、机器人数据和 action tokenization 接成一个可复查的 VLA policy。读它时不要只看模型大小和结果表，要重点理解动作如何被 token 化、数据如何提供控制监督、评估如何证明机器人能力。
