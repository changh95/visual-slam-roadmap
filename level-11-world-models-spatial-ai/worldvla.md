# WorldVLA

> Cen (Alibaba) 2025 · [Paper](https://arxiv.org/abs/2506.21539)

**One-line summary** — WorldVLA unifies a vision-language-action model and a world model in one autoregressive transformer that predicts both robot action tokens and future image tokens, so learning environment physics and generating actions reinforce each other.

## Key ideas

- **Two models, one sequence**: Conventional pipelines keep the world model ("what will happen") and the policy ("what to do") separate, which lets policies pick actions inconsistent with predicted dynamics. WorldVLA interleaves visual, language, and action tokens in a single autoregressive sequence, so one next-token objective trains both capabilities.
- **Bidirectional benefit**: The world-model half learns how actions change the visual world — implicit physics — which grounds the action-model half; conversely, action prediction gives the world model a purposeful, control-oriented representation of dynamics.
- **Discretized everything**: Images are encoded to discrete visual tokens and continuous robot actions to discrete action tokens, making a GPT-style decoder-only transformer the shared engine, in the lineage of RT-2's actions-as-tokens and GAIA-1's tokenized world modeling.
- **Imagination for control**: Because the same model can roll future observation tokens forward under candidate actions, it supports look-ahead: evaluating what an action sequence would do before executing it, in the spirit of model-predictive control.

## Why it matters for SLAM

WorldVLA marks the convergence of the two big threads of this level — world models (GAIA-1, Cosmos) and VLAs (RT-2, OpenVLA) — into a single architecture, closing the consistency gap between predicting the world and acting in it. For SLAM, it sketches a plausible end-state for Spatial AI stacks: learned dynamics and action generation fused in one model, with explicit SLAM geometry remaining the complementary source of metric grounding that constrains and verifies the model's imagined rollouts.

## Related

- [World model](world-model.md)
- [RT-2](rt-2.md)
- [OpenVLA](openvla.md)
- [GAIA-1](gaia-1.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
