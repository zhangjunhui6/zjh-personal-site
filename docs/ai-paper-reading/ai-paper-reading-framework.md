# AI 论文精读通用框架

这个框架来自机器人 VLA 连载，但不只适用于 VLA。它可以作为阅读大多数 AI 论文的共同模板：先判断论文到底解决什么问题，再拆模型、数据、训练、评估和部署边界。

核心原则是：不要把 AI 论文读成“模型名字 + 架构图 + 分数表”。真正要读的是论文的可验证主张。

## 一页速读

每篇论文先用一页回答这些问题：

| 问题 | 要写清什么 |
| --- | --- |
| 论文问题 | 它解决什么任务、什么瓶颈、什么旧方法的缺口 |
| 核心主张 | 作者声称贡献是什么，最好压缩成 1-3 条 |
| 方法路线 | 它属于 scaling、architecture、data、objective、alignment、systems、benchmark 还是 application |
| 证据类型 | 证据来自 benchmark、ablation、human eval、真实部署、理论分析还是案例展示 |
| 最重要局限 | 它不能证明什么，在哪些条件下可能失效 |

如果这一页写不清，后面的公式和代码通常只是噪声。

## 论文图表阅读顺序

AI 论文不要从 abstract 一路顺读。建议先看：

1. **Figure 1 / Teaser**：论文希望你相信什么。
2. **Method figure**：输入、输出、中间模块如何连接。
3. **Main result table**：论文用什么指标证明自己。
4. **Ablation table**：性能到底来自哪个设计。
5. **Data / training setup table**：数据、算力、训练细节是否足以支撑主张。
6. **Failure cases / limitations**：作者是否承认边界。

写文章时，必须标注关键 Figure / Table / Section。不要只写“模型结构图”“结果表”这种无法对照原文的说法。

## 通用十项检查

每篇 AI 论文精读都应该回答这十项。

| 检查项 | 问题 | 典型风险 |
| --- | --- | --- |
| Problem | 任务定义是否清楚 | 把宽泛愿景当作实际任务 |
| Claim | 论文主张是否可验证 | 只复述 marketing-style 贡献 |
| Input / Output | 输入输出接口是什么 | 忽略真实使用时的接口约束 |
| Architecture | 模型结构改变了什么 | 被复杂图吓住，没看出关键差异 |
| Objective | loss / reward / optimization target 是什么 | 只看架构，不看训练信号 |
| Data | 数据来源、规模、质量和分布是什么 | 把模型能力误读成数据覆盖 |
| Evaluation | benchmark、metric、baseline 是否合理 | 只看平均分，不看 protocol |
| Ablation | 哪个组件真正有贡献 | 把整体提升归因到单个 buzzword |
| Cost | 训练/推理/标注/部署成本是多少 | 忽略可复现性和工程门槛 |
| Limitations | 论文不能证明什么 | 把受控实验外推成通用能力 |

这十项是通用骨架。不同领域再加领域特有的 contract。

## 核心公式怎么写

公式不应该只是装饰。写公式时按三层处理：

1. **原论文公式**：优先保留论文符号，解释每个变量。
2. **教学版公式**：如果要简化，必须标注“抽象版”或“直觉版”。
3. **实现对应物**：指出公式在代码里大致对应 loss、processor、scheduler、policy head、reward model、data transform 还是 evaluator。

示例：

```text
L = E[loss(model(x), y)]
```

这种公式太泛，只能用于入门。专业精读应该继续追问：

- `x` 具体包含什么字段？
- `y` 是 label、token、action、reward 还是 preference？
- loss 是否只在某些 token / timestep / head 上计算？
- 数据采样分布是什么？
- 推理时是否和训练目标一致？

## 结果表怎么读

不要只问“有没有 SOTA”。结果表至少拆成：

| 维度 | 追问 |
| --- | --- |
| Baseline | 是否和强 baseline、公平设置比较 |
| Metric | 指标是否真的衡量论文主张 |
| Split | train / validation / test / OOD 是否分清 |
| Variance | 是否有多 seed、置信区间或误差条 |
| Compute | 是否用更多参数、更多数据或更多算力换分数 |
| Failure | 是否报告失败类型，而不是只报告成功样例 |

很多 AI 论文真正的结论不是“方法更强”，而是“在这个数据、算力、评估协议下更强”。

## 领域扩展：Embodied AI / Robotics / VLA

如果论文涉及机器人、VLA、自动驾驶、agent 执行或真实世界交互，必须额外加入 contract 检查。

| Contract | 必须写清 |
| --- | --- |
| Observation contract | 输入传感器、视角、状态、历史、频率 |
| Action contract | action 维度、坐标系、控制模式、gripper / actuator 定义 |
| Temporal contract | 控制频率、action horizon、闭环还是 open-loop chunk |
| Environment contract | sim、real、teleop、reset、随机化、物体和场景 |
| Safety contract | 低层控制、安全边界、人类接管和失败处理 |
| Evaluation contract | episode 数、success predicate、任务划分、是否真实部署 |

这部分是 VLA 文章最重要的加法。普通 VLM 可以只输出文本，机器人 policy 的输出必须物理可执行。

## 领域扩展：LLM / Agent / Alignment

如果论文是 LLM、agent 或 alignment，额外检查：

| Contract | 必须写清 |
| --- | --- |
| Prompt / context contract | 上下文长度、prompt 格式、工具描述、memory 是否固定 |
| Output contract | 输出是文本、JSON、tool call、代码还是动作 |
| Supervision contract | SFT、RLHF、DPO、RLAIF、rejection sampling、synthetic data 来源 |
| Tool contract | 工具可用性、权限、错误处理、环境状态 |
| Eval contract | 自动评测、人类偏好、任务成功率、污染风险 |
| Safety contract | refusal、越权、注入攻击、敏感任务边界 |

Agent 论文尤其要警惕：demo 视频和精选轨迹不能替代可重复评估。

## 领域扩展：Computer Vision / Multimodal

如果论文是 CV 或 multimodal，额外检查：

| Contract | 必须写清 |
| --- | --- |
| Modality contract | image、video、audio、text、depth、mask 等模态如何同步 |
| Preprocessing contract | resize、crop、tokenization、augmentation、normalization |
| Backbone contract | 预训练来源、冻结/微调策略、feature fusion 位置 |
| Resolution / token cost | 分辨率、帧数、visual tokens 对成本的影响 |
| Eval contract | closed-set、open-vocab、zero-shot、few-shot、OOD |

很多 multimodal 提升来自数据和 preprocessing，不一定来自模型结构本身。

## 写作模板

每篇 AI 论文精读建议用这个结构：

```text
1. 快速读法
2. 论文一页地图
3. 原论文 Figure / Table / Section 导航
4. 自绘机制图
5. Problem / Claim / Evidence
6. Input / Output / Contract
7. Architecture
8. Objective / Formula
9. Data
10. Evaluation / Ablation
11. Cost / Reproducibility
12. Limitations / Failure cases
13. 我会如何复现实验
14. 参考资料
```

不是每篇都要写得很长，但每篇都应该能回答这些检查项。

## 评分 Rubric

用 0-3 分快速评估一篇精读文章是否专业。

| 项目 | 0 分 | 1 分 | 2 分 | 3 分 |
| --- | --- | --- | --- | --- |
| 原文锚点 | 没有图表编号 | 泛称图表 | 有关键编号 | 编号、作用、阅读顺序清楚 |
| 方法理解 | 复述摘要 | 解释模块 | 解释设计取舍 | 能指出替代路线和失败点 |
| 公式 | 无公式 | 泛公式 | 对齐主要公式 | 公式、变量、实现对应物清楚 |
| 数据 | 只写数据名 | 写规模 | 写来源和分布 | 能解释数据如何限制结论 |
| 评估 | 只写分数 | 写指标 | 写 protocol | 能判断结果能/不能证明什么 |
| 领域 contract | 没有接口检查 | 零散提到输入输出 | 有主要 contract | contract 和失败风险绑定 |
| 复现边界 | 没有 | 写命令 | 写环境 | 写算力、数据、失败记录和风险 |
| 资料可信度 | 无来源 | 只列二手资料 | 主要引用论文 | 论文、官方文档、代码入口互相校验 |

总分 18 分以上可以算合格精读；22 分以上才接近高质量技术文章。

## Review 输出格式

当用这个框架 review 已有文章时，输出不要只说“好/不好”。建议固定成：

```text
1. 总分和一句话判断
2. 最强的 3 个部分
3. P0 / P1 / P2 问题列表
4. 缺失的 contract
5. 建议新增的小节或图表
6. 是否适合进入实验篇
```

其中 P0 表示会误导读者或事实不稳；P1 表示专业性不足；P2 表示表达、结构或可读性优化。

## 是否适合做成 Skill

适合。它可以沉淀成一个 `ai-paper-reading` skill，用于三类任务：

1. 写 AI 论文精读文章。
2. Review 已写好的论文解读是否专业。
3. 把某个领域论文转成实验计划。

Skill 里应该包含：

- 通用十项检查。
- Figure/Table 导航规则。
- 公式解释规则。
- 结果表阅读规则。
- 领域 contract 扩展。
- 输出模板。
- 评分 rubric。

但在真正写成 Skill 前，建议先用它再 review 2-3 篇现有 VLA 文章，看是否能稳定产出更专业的修改建议。
