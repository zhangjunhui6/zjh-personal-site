---
name: ai-paper-reading
description: Use when writing, reviewing, summarizing, or turning AI research papers into technical articles, paper-reading notes, literature reviews, or reproducible experiment plans. Applies to LLMs, agents, multimodal models, computer vision, embodied AI, robotics, and VLA papers; triggers on requests like "论文精读", "review this paper explanation", "write a technical article from this paper", "extract formulas/figures/tables", "turn this paper into experiments", or "is this paper article professional enough".
---

# AI Paper Reading

## Workflow

First identify the mode:

- **Write mode**: create a paper-reading article, outline, or technical note.
- **Review mode**: critique an existing paper explanation or article.
- **Experiment mode**: convert a paper into a reproducible experiment plan.

Use primary sources whenever possible: the paper, official project page, official docs, code repository, model card, dataset card, benchmark docs. For current or uncertain claims, verify with browsing before presenting facts.

## Core Analysis

For every AI paper, extract this one-page map before writing details:

| Item | What to capture |
| --- | --- |
| Problem | Task, bottleneck, and gap in prior work |
| Claim | 1-3 verifiable contributions |
| Route | Architecture, data, objective, scaling, alignment, systems, benchmark, or application |
| Evidence | Main benchmark, ablation, human eval, deployment, or theory |
| Limitation | What the paper does not prove |

Then inspect in this order:

1. Figure 1 / teaser: what the paper wants readers to believe.
2. Method figure: input, output, and module connections.
3. Main result table: metric, benchmark, baseline, and split.
4. Ablation table: what actually caused the gain.
5. Data/training setup: dataset, compute, preprocessing, and implementation details.
6. Limitations/failure cases: where the method breaks.

Always name concrete Figure / Table / Section numbers or titles. Avoid vague references like "the architecture figure" when a paper-specific anchor exists.

## Formula Handling

Formulas must explain mechanism, not decorate the article.

- Prefer the paper's notation and explain each variable.
- If simplifying, label it as a teaching abstraction.
- Map formulas to implementation objects: loss, tokenizer, processor, policy head, reward model, scheduler, data transform, evaluator, or simulator.
- Ask what the loss is computed over: all tokens, action tokens, timesteps, preference pairs, reward samples, trajectories, or episodes.

## Domain Contracts

Apply domain-specific contracts when relevant. Load `references/domain-contracts.md` when the paper involves robotics/VLA, LLM agents, multimodal/CV, benchmarks, or post-training.

For embodied AI and VLA, never skip observation/action/temporal/evaluation contracts. A robot policy article is incomplete if the action space, control mode, horizon, and success protocol are unclear.

## Output Modes

Use `references/output-templates.md` for detailed templates.

In **write mode**, produce:

- Fast reading guide.
- Paper map.
- Figure/Table/Section navigation.
- Self-drawn mechanism diagram plan or Mermaid diagram.
- Formula/objective explanation.
- Data, evaluation, ablation, cost, limitations.
- Reproduction boundary.

In **review mode**, produce findings first:

- Score using `references/review-rubric.md`.
- P0/P1/P2 issues.
- Missing contracts.
- Concrete sections/tables/figures to add.
- Whether the article is ready for publication or still draft-quality.

In **experiment mode**, produce:

- Minimal reproducible claim.
- Required data/model/checkpoint.
- Environment and compute boundary.
- Validation command or evaluation protocol.
- Expected outputs and failure log fields.

## Image And Figure Policy

Do not copy paper figures wholesale into user articles unless the user has rights and explicitly asks. Prefer:

- Figure navigation with original figure numbers.
- Self-drawn mechanism diagrams.
- Mermaid diagrams.
- Recreated conceptual diagrams with attribution to the source paper section.

## References

- `references/review-rubric.md`: scoring and severity rules.
- `references/domain-contracts.md`: domain-specific checks.
- `references/output-templates.md`: reusable article/review/experiment templates.
