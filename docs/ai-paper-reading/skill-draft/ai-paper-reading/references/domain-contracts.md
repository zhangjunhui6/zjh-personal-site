# Domain Contracts

Use only the sections relevant to the paper.

## Embodied AI / Robotics / VLA

| Contract | Check |
| --- | --- |
| Observation | Cameras, views, resolution, proprioception, history, frequency |
| Action | Dimension, coordinate frame, control mode, gripper/actuator definition |
| Temporal | Control frequency, action horizon, chunking, closed-loop vs open-loop |
| Environment | Simulation/real robot, reset protocol, objects, scenes, randomization |
| Safety | Low-level controller, human takeover, collision/speed limits |
| Evaluation | Episode count, success predicate, task suite, OOD split, real deployment |

Common failure: a policy seems to work in paper tables but cannot be reproduced because action normalization, gripper convention, or environment reset is unclear.

## LLM / Agent / Alignment

| Contract | Check |
| --- | --- |
| Prompt/context | Context length, prompt format, memory, system messages |
| Output | Text, JSON, tool call, code, action, schema constraints |
| Supervision | SFT, RLHF, DPO, RLAIF, rejection sampling, synthetic data |
| Tooling | Tool availability, permissions, state, error handling |
| Evaluation | Human eval, automatic eval, task success, contamination risk |
| Safety | Refusal, jailbreaks, prompt injection, sensitive task boundary |

Common failure: selected demos substitute for repeatable task success.

## Computer Vision / Multimodal

| Contract | Check |
| --- | --- |
| Modality | Image, video, audio, text, depth, mask, synchronization |
| Preprocessing | Resize, crop, augmentation, normalization, tokenization |
| Backbone | Pretraining source, frozen vs tuned, fusion point |
| Resolution/token cost | Image size, frames, visual tokens, latency |
| Evaluation | Closed-set, open-vocab, zero-shot, few-shot, OOD |

Common failure: gains attributed to architecture actually come from preprocessing or data.

## Benchmarks

| Contract | Check |
| --- | --- |
| Task definition | What ability is measured |
| Split | Train/dev/test/OOD and leakage risk |
| Metric | Whether metric matches the claim |
| Baselines | Fairness, compute, data, tuning budget |
| Variance | Seeds, confidence intervals, error bars |
| Failure analysis | Which cases fail and why |

Common failure: average score hides task-specific weakness.

## Post-training / Fine-tuning

| Contract | Check |
| --- | --- |
| Base model | Checkpoint, pretraining data boundary, license |
| Data mapping | Input/output schema and transform |
| Trainable modules | Full fine-tune, LoRA, adapters, heads, expert modules |
| Normalization | Stats, tokenizer, processor, unnormalization |
| Evaluation | Base vs tuned, ID vs OOD, overfitting checks |
| Cost | VRAM, wall time, dataset size, checkpoint size |

Common failure: loss improves while deployment behavior breaks because mapping or normalization is wrong.
