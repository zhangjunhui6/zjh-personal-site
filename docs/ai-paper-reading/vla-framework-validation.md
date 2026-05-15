# 用 AI 论文精读框架反审 VLA 文章

目标：验证 `ai-paper-reading-framework.md` 是否能稳定 review 已写好的 VLA 论文文章，并判断它是否适合沉淀成 Codex Skill。

本轮选择三篇代表文章：

- `robot-vla-openvla-policy-notes.md`：action-token 路线。
- `robot-vla-openpi-pi0-flow-matching.md`：flow-matching action expert 路线。
- `robot-vla-smolvla-first-experiments.md`：低成本 VLA + 系统延迟路线。

## 验证结论

框架有效，值得沉淀成 Skill。

原因是它能稳定逼出三类问题：

1. 文章有没有把论文主张转成可验证 claim。
2. 文章有没有把模型结构、公式、数据、评估和成本分开讲。
3. 对 VLA 这类 embodied AI，文章有没有写清 observation/action/temporal/evaluation contract。

验证过程中也发现框架自身一个问题：原 rubric 只有 6 项、每项 3 分，满分 18，却写了 22 分以上高质量。已经修正为 8 项、满分 24。

## OpenVLA 文章 Review

文件：`docs/drafts/robotics/vla/robot-vla-openvla-policy-notes.md`

评分：20 / 24。

一句话判断：已经是合格精读，尤其 action tokenizer 和硬事实比普通博客专业；但还需要显式 contract 表和更细的 evaluation protocol。

| 项目 | 分数 | 判断 |
| --- | --- | --- |
| 原文锚点 | 3 | Figure 1、Section 3.2、Figure 2/Table 4、Figure 5 都有锚点 |
| 方法理解 | 3 | 能解释 action-token 路线与 continuous action expert 的差异 |
| 公式 | 2 | 写清 1%/99% 分位、256 bins、Llama token 映射，但缺代码实现对应物 |
| 数据 | 2 | 有 970k trajectories，但数据筛选、机器人分布、BridgeData/OXE 关系还可更细 |
| 评估 | 2 | 有评估方向，但缺 episode 数、任务 split、baseline 公平性表 |
| 领域 contract | 2 | action contract 强，observation/temporal contract 还偏散 |
| 复现边界 | 3 | 明确 Docker 实验另篇，且不夸大 M1 Pro |
| 资料可信度 | 3 | 论文、项目页、GitHub 都有 |

P1 问题：

- 需要新增 `Observation / Action / Temporal contract` 表，把输入视角、是否使用 proprioception、单步 7-DoF、控制频率/推理延迟放在一起。
- 需要新增 `Evaluation protocol` 表，明确 BridgeData V2 / WidowX 任务、泛化轴、baseline、成功率解释。
- 公式后应加 `实现对应物`：action tokenizer、processor、unnorm stats、policy forward 分别承担什么。

建议新增小节：

```text
## VLA contract：OpenVLA 到底承诺了什么接口
## Evaluation protocol：Figure 2 / Table 4 能证明什么
## Formula to code：action tokenizer、processor 和 unnormalization
```

## π0 / openpi 文章 Review

文件：`docs/drafts/robotics/vla/robot-vla-openpi-pi0-flow-matching.md`

评分：18 / 24。

一句话判断：主线清楚，公式和硬事实已经能支撑精读；但 π0 和 π0.5 被放在同一篇后，claim/evidence 容易混在一起，需要更强结构。

| 项目 | 分数 | 判断 |
| --- | --- | --- |
| 原文锚点 | 3 | Figure 1-5、Section IV 都有 |
| 方法理解 | 3 | action expert / flow matching / action chunk 的路线解释清楚 |
| 公式 | 3 | 对齐了 action chunk、noisy action、vector field、Euler integration |
| 数据 | 2 | 有 10,000 小时、OXE、DROID、7 configs，但数据配方还不够细 |
| 评估 | 1 | 主要讲评估要问什么，缺具体结果表和 protocol |
| 领域 contract | 2 | observation/action/temporal 提到不少，但没有独立 contract 表 |
| 复现边界 | 2 | 有 openpi dummy inference 计划，但缺显存档位和 checkpoint 分支 |
| 资料可信度 | 2 | 论文、PDF、openpi 有，但 π0.5 官方依据应更集中 |

P1 问题：

- π0 与 π0.5 最好拆成两个 claim block：`π0 解决连续控制`，`π0.5 解决 open-world generalization`。
- 评估部分需要增加具体 result table 阅读指南，而不仅是“要看真机/泛化”。
- openpi 的定位需要更工程化：checkpoint family、config、data transforms、GPU requirement 应放到 contract 表。

建议新增小节：

```text
## Claim / Evidence：π0 和 π0.5 分别证明了什么
## Action contract：H=50、50Hz、2/3 cameras、state/action dim
## openpi code contract：checkpoint、config、data transform、GPU requirement
```

## SmolVLA 文章 Review

文件：`docs/drafts/robotics/vla/robot-vla-smolvla-first-experiments.md`

评分：19 / 24。

一句话判断：成本视角很好，适合学习者；但如果要达到专家级，需要把“affordable”拆成可度量证据，而不是只用参数量、数据量和异步推理描述。

| 项目 | 分数 | 判断 |
| --- | --- | --- |
| 原文锚点 | 3 | Figure 1/2/3/5、Table 1-9、Algorithm 1 都有 |
| 方法理解 | 3 | 小模型、community data、async inference 三层成本讲清楚 |
| 公式 | 2 | flow matching 公式有，但缺 action horizon / queue algorithm 的精确符号 |
| 数据 | 3 | 481 datasets、22.9K episodes、10.6M frames、数据清洗写得清楚 |
| 评估 | 2 | 知道看 LIBERO/Meta-World/SO100/SO101，但缺实际结果和 failure 类型 |
| 领域 contract | 2 | 系统延迟 contract 好，observation/action contract 还可更具体 |
| 复现边界 | 2 | 有实验另篇，但需要明确 M1 Pro Docker 只做轻量检查 |
| 资料可信度 | 2 | arXiv、HF blog、model card 有；需要减少非官方项目页依赖 |

P1 问题：

- `affordable` 需要拆成 measurable claims：参数量、GPU hours、CPU/GPU/MacBook inference、latency、success rate。
- Async inference 需要从 Figure 2 / Algorithm 1 提炼成更精确的队列状态机。
- 需要增加 `what SmolVLA cannot prove`：低成本不等于真实世界泛化，不等于任何 Mac Docker 都能跑正式 VLA。

建议新增小节：

```text
## Affordable claim：哪些证据支持，哪些不支持
## Async inference state machine：queue、threshold、merge、consume
## Failure boundary：小模型最可能在哪些任务上失败
```

## 框架本身的改进

本轮验证说明，通用框架应该再强化三点。

第一，rubric 要把 `领域 contract` 和 `资料可信度` 单独打分。否则文章可能看起来很会讲方法，但输入输出接口和来源可靠性并没有过关。

第二，review 输出要强制分 P0/P1/P2。没有严重级别，review 很容易变成泛泛建议。

第三，Skill 版本应该支持三种模式：

| 模式 | 用户请求 | 输出 |
| --- | --- | --- |
| 写作模式 | “帮我写 XX 论文精读” | 文章大纲 + 图表导航 + 公式解释 + 局限 |
| Review 模式 | “帮我 review 这篇论文解读” | 分数 + P0/P1/P2 问题 + 修改建议 |
| 实验模式 | “把论文转成实验计划” | 可复现实验边界 + Docker/算力/数据检查清单 |

## 是否进入 Skill 化

建议进入 Skill 化。

拟定 Skill：

```text
name: ai-paper-reading
description: Use when writing, reviewing, or turning AI research papers into technical articles or reproducible experiment plans. Covers paper claim analysis, figure/table navigation, formulas, data/evaluation/cost review, and domain-specific contracts for LLMs, agents, multimodal models, embodied AI, robotics, and VLA.
```

建议文件结构：

```text
ai-paper-reading/
  SKILL.md
  references/
    review-rubric.md
    domain-contracts.md
    output-templates.md
```

Skill 主体保持短，只放流程；详细 rubric、领域 contract 和模板放 references，避免每次触发都占太多上下文。
