---
title: "VLA 微调与 post-training：从论文角度理解 LoRA、小数据适配和 norm stats"
description: "不把微调写成训练命令，而是从论文视角理解机器人 VLA 的适配目标、数据映射、参数高效训练、归一化统计和评估闭环。"
date: 2026-05-15
tags:
  - robotics
  - finetuning
  - lora
  - post-training
  - vla
  - paper-reading
lang: zh
translationKey: robot-vla-finetuning-lora-post-training
draft: true
---

## 快速读法

- 本文定位：VLA 后训练范式讲解，不展开训练命令。
- 本文任务：理解为什么 VLA 微调比 LLM 微调多了动作、坐标系和评估问题。
- 读完要能回答：LoRA 只是省显存吗，norm stats 为什么会毁掉机器人动作。
- 实验另篇：后续再做最小 LoRA/post-training 复现实验。

VLA 微调不只是“把一个模型在新数据上继续训几步”。因为机器人输出是动作，微调会同时触碰视觉、语言、动作空间、控制频率和评估环境。

这篇文章从论文角度讲 VLA post-training，而不是写训练脚本。

## 本篇读完要形成的微调地图

VLA 微调可以先看成四份契约是否同时对齐：

| 契约 | 如果没对齐会怎样 |
| --- | --- |
| Observation contract | 图像、状态、语言字段进错模型，训练和推理不一致 |
| Action contract | 维度、坐标系、gripper 定义错，机器人动作不可执行 |
| Normalization contract | norm stats 错，loss 正常但动作幅度完全失真 |
| Evaluation contract | 评估任务和训练分布混在一起，成功率没有解释力 |

LoRA、adapter、全量微调都只是更新参数的方法。真正决定微调是否可信的，是这些契约有没有被论文讲清楚。

## 论文/技术报告图表导航

VLA 微调不是单独一篇论文能讲完的主题。本文按 OpenVLA、π0/openpi、LoRA 这三类资料来读：

| 图表 | 重点看什么 | 为什么重要 |
| --- | --- | --- |
| OpenVLA Section 5.2 | 新 robot setup / new task 上的 data-efficient adaptation | 判断 VLA fine-tuning 是否比从零训练 policy 更有价值 |
| OpenVLA Section 5.3 | LoRA 参数高效微调设置和性能对比 | 判断 consumer GPU fine-tuning 是否可信 |
| OpenVLA Figure 5 / Section 5.4 | quantization 对推理显存和速度的影响 | 区分训练成本和部署成本 |
| π0 Figure 3 / Figure 4 | pre-training 与 post-training 的两阶段数据配方 | 理解为什么 post-training 不只是“最后再训几步” |
| openpi config / checkpoint docs | `data transforms`、`norm stats`、`action horizon`、checkpoint family | 实验时最容易错的不是 LoRA rank，而是接口契约 |
| LoRA 原论文结构图 | 冻结原权重，只训练低秩矩阵 `A/B` | 判断它节省的是参数更新成本，不是机器人数据问题 |

没有这些图表的微调报告，通常很难判断结果是否可信。

## 原图精读：微调不是只看训练 loss

<figure>
  <img src="/images/robotics/vla/original/openvla-fig5.png" alt="OpenVLA paper Figure 5 inference memory and latency tradeoff" />
  <figcaption>原图：OpenVLA Figure 5, Kim et al., <a href="https://arxiv.org/abs/2406.09246">OpenVLA: An Open-Source Vision-Language-Action Model</a>, CC BY 4.0。本文未修改图像内容，仅用于论文精读。</figcaption>
</figure>

这张图放在微调篇里，是为了提醒一个容易忽略的点：VLA post-training 不是只有“能不能训”，还有“训完能不能部署”。LoRA 可以降低可训练参数量，量化可以降低推理显存，但机器人闭环还要看 latency、action frequency 和 GPU 档位。一个 adapter 在离线 loss 上有效，不代表它能在目标机器人或 LIBERO rollout 里稳定执行。

LoRA 原论文的 reparameterization 图也值得精读，但 arXiv 页面没有标注 CC BY 4.0，我先不把原图复制进站内。本文保留 <a href="https://arxiv.org/abs/2106.09685">LoRA paper</a> 链接，并用下面的公式解释它在 VLA 微调里的角色；如果后续确认可复用授权，再把原图补到这里。

![VLA fine-tuning contracts](/images/robotics/vla/finetune-contracts.svg)

*自绘图：VLA 微调的五个契约。LoRA 只解决参数更新成本，不能替代数据、动作、归一化和评估闭环。*

## 核心公式：LoRA 和动作反归一化

LoRA 把原权重更新写成低秩矩阵：

```text
W' = W + ΔW
ΔW = (α / r) B A
```

其中 `A` 和 `B` 是可训练低秩矩阵，`W` 通常冻结。这个公式说明 LoRA 只是在参数更新方式上省成本，它并不解决动作空间是否对齐的问题。

机器人推理时还要过动作反归一化：

```text
â = σ_dataset ⊙ ã_model + μ_dataset
```

如果 `σ_dataset` 或 `μ_dataset` 来自错误数据集，模型输出的方向可能看似合理，但实际幅度和 gripper 行为会完全错。

## 论文里的硬事实

把 VLA 微调读专业，要先记住这些事实：

| 来源 | 硬事实 | 对实验的含义 |
| --- | --- | --- |
| OpenVLA | 7B 模型 bf16 推理约 15GB 显存，原始训练用 64 A100 训练 14 天 | 本机 M1 Pro Docker 不作为正式推理/微调目标 |
| OpenVLA | 论文系统研究 data-efficient adaptation、LoRA 和 quantization | 微调篇应比较 full fine-tune、LoRA、量化推理，而不是只跑一个 loss |
| π0 | pre-training 后再 post-training 到高质量目标任务 | VLA 后训练更像“把基础物理技能对齐到目标任务”，不是普通风格微调 |
| openpi | 官方路线面向 NVIDIA GPU；推理、LoRA、全量微调显存需求差别很大 | Docker 实验要先写清 GPU 档位和 checkpoint |
| LeRobot | `meta/stats.json` 和 feature schema 决定 action normalization | norm stats 错，比 LoRA rank 选错更致命 |

所以这篇文章后续不能写成“LoRA 教程”。更专业的题目应该是：VLA post-training 如何同时处理参数更新、动作接口、数据映射和真实评估闭环。

## VLA 为什么需要 post-training

通用 VLA 模型通常来自大规模多任务数据，但真实使用时会遇到具体适配需求：

- 新机器人。
- 新相机位置。
- 新夹爪。
- 新动作空间。
- 新任务语言风格。
- 新物体和场景。

Post-training 的目标不是重新发明 foundation model，而是把已有能力对齐到具体 embodiment 和任务分布。

## 和 LLM 微调的差异

LLM 微调主要担心语言风格、知识、格式和偏好。VLA 微调还要担心：

- action 维度是否一致。
- action 坐标系是否一致。
- gripper 值域是否一致。
- observation key 是否一致。
- 控制频率是否一致。
- norm stats 是否一致。
- eval 环境是否和训练分布匹配。

这些问题任何一个出错，模型都可能“训练 loss 正常，但机器人完全不会动”。

## LoRA 的角色

LoRA 是参数高效微调方法。它的直觉是冻结大部分原模型，只训练少量低秩适配参数。

在 VLA 里，LoRA 的价值包括：

- 降低训练显存。
- 降低保存 checkpoint 成本。
- 更适合多任务或多机器人适配。
- 方便比较不同数据集或任务的 adapter。

但 LoRA 不是魔法。它只能帮助你更便宜地更新模型，不能自动修复数据映射、动作定义和评估设置。

## VLA 微调要分清四个问题

| 问题 | 典型错误 | 应该检查什么 |
| --- | --- | --- |
| 参数怎么更新 | 以为 LoRA rank 越大越好 | 哪些模块插 LoRA、哪些模块冻结、是否只训 action expert |
| 数据怎么进入模型 | camera 名称、state key、action dim 对不上 | dataset features、processor、data transforms |
| 动作怎么反归一化 | 训练 loss 下降但机器人动作幅度错 | `mean/std/min/max`、unnorm key、gripper convention |
| 怎么证明有效 | 只看训练集 loss 或少量 cherry-pick video | base vs finetuned、in-distribution vs OOD、success rate 和失败类型 |

这四个问题里，只有第一个是传统深度学习微调问题。后三个才是机器人 VLA 微调的难点。

## 数据映射是论文里最容易被低估的部分

微调论文或技术报告里，如果没有讲清数据映射，就很难判断结果是否可靠。

要看：

| 模型需要 | 数据必须提供 |
| --- | --- |
| primary image | 对应相机视角和分辨率 |
| wrist image | 是否存在，是否同步 |
| robot state | 维度和单位 |
| language instruction | 任务目标是否具体 |
| action | 维度、坐标系、频率 |
| norm stats | 训练和推理是否一致 |

这些映射比学习率更基础。

## Norm stats 为什么危险

机器人 action 往往要归一化。一个维度可能代表厘米级位移，另一个维度代表姿态角，gripper 又可能是离散开关。

Norm stats 错误会导致：

- 位移幅度过大或过小。
- 姿态旋转异常。
- gripper 总是打开或关闭。
- action chunk 看似平滑但执行完全错。
- loss 下降但真实评估失败。

所以读任何 VLA 微调论文，都要看它如何计算、保存和使用 action normalization。

## 小数据适配的科学问题

VLA 微调常常强调少量示范。这里真正的问题是：

> 预训练模型学到的通用能力，能否被少量目标数据唤醒并迁移到新任务？

要判断这个问题，实验设计必须包含：

- base model 对照。
- 微调模型对照。
- 少量数据规模变化。
- 训练任务和评估任务划分。
- 失败类型分析。

如果没有 base 对照，就不知道微调是否真的带来收益。

## 微调论文应该怎么看结果

读结果时不要只看“成功率提升”。要问：

- 提升来自更好语言理解，还是动作适配。
- 是否只对训练任务有效。
- 是否出现遗忘。
- 是否在新物体或新位置上有效。
- 是否对随机种子敏感。
- 是否显著增加推理延迟。

对于机器人，稳定性往往比峰值分数更重要。

## 和 openpi / OpenVLA 的关系

OpenVLA、SmolVLA、π0/openpi 都可能涉及 post-training，但微调对象不同：

- OpenVLA 路线可能重点调 VLM 或 action token 解码相关部分。
- SmolVLA 路线可能更关注低成本全流程训练。
- π0/openpi 路线可能重点适配 action expert 或 flow model。

所以微调文章不应该孤立看 LoRA，而要放回具体模型架构。

## 复现实验另篇

本文不展开命令。后续实验篇再做：

- 选一个小数据集。
- 确认 action schema 和 norm stats。
- 训练少量 step 的 LoRA 或 adapter。
- 比较 base checkpoint 和微调 checkpoint。
- 用少量 eval episode 记录失败类型。

## 参考资料

- [OpenVLA paper](https://arxiv.org/abs/2406.09246)
- [π0 paper](https://arxiv.org/abs/2410.24164)
- [openpi repository](https://github.com/Physical-Intelligence/openpi)
- [LeRobot documentation](https://huggingface.co/docs/lerobot/main/index)
- [LoRA paper](https://arxiv.org/abs/2106.09685)

## 本文小结

VLA 微调的难点不只是显存和训练命令，而是 embodiment 适配、数据映射、action normalization 和评估闭环。LoRA 能降低成本，但不能替代对机器人数据和动作空间的理解。
