# WorldVLA

> Cen (Alibaba) 2025 · [Paper](https://arxiv.org/abs/2506.21539)

**One-line summary** — WorldVLA unifies a vision-language-action model and a world model in one autoregressive transformer that predicts both robot action tokens and future image tokens, so learning environment physics and generating actions reinforce each other.

## Problem

Robot learning pipelines have split into two camps that ignore each other's strengths. Vision-language-action models (RT-2, OpenVLA) map observations and instructions to actions, but treat actions solely as outputs — never as inputs to be understood — so they have no mechanism for predicting the *consequences* of those actions. World models (GAIA-1, Cosmos) predict how the visual world evolves from observations and actions, but produce no actions themselves. WorldVLA asks whether one autoregressive model can do both: unify action and image understanding *and* generation in a single framework.

## Method & architecture

WorldVLA defines an action (policy) model $\pi_\theta$ and a world model $f_\phi$ over image observations $o$, actions $a$, and a language instruction $l$:

$$a_t = \pi_\theta(a_t \mid o_{t-h:t},\, l), \qquad o_t = f_\phi(o_t \mid o_{t-h:t-1},\, a_{t-h:t-1})$$

and unifies both in one model $M_\psi$ with a policy head and a world head sharing all weights.

- **One transformer, three tokenizers**: the backbone is initialized from Chameleon, a unified image understanding/generation MLLM. The image tokenizer is a VQ-GAN (compression ratio 16, codebook 8192; 256 tokens per 256×256 image, 1024 per 512×512). The action tokenizer discretizes each of 7 action dimensions (3 relative positions, 3 relative angles, 1 gripper state) into 256 bins, so an action is 7 tokens. Text uses a BPE tokenizer whose 65,536-word vocabulary *contains* the 8192 image codes and 256 action codes — all modalities share one vocabulary and one autoregressive engine.
- **Two interleaved data formats**: action-model samples ask "what action should the robot take to {instruction}?" over $M$ observation images and supervise only the $K$ output action tokens ($\mathcal{L}_{action}$); world-model samples ask to "generate the next frame given the current image and action" and supervise only the generated image tokens ($\mathcal{L}_{world}$), repeated $N$ times. No instruction is needed for the world half, since the action fully determines the next state.
- **Training objective**: a mixed cross-entropy loss

$$\mathcal{L} = \mathcal{L}_{action} + \alpha\, \mathcal{L}_{world}$$

  with $\alpha = 0.04$ balancing the few action tokens (7) against the many image tokens (256/1024).
- **Action-chunk attention mask**: naive causal attention makes later actions in a chunk depend on earlier *predicted* actions; since actions were absent from MLLM pretraining, generalization is weak and errors propagate. WorldVLA's mask lets each action attend only to text and image tokens — not to prior actions — enabling parallel action generation; the world-model half keeps the standard causal mask.
- **Setup**: $M=2$ historical frames, chunk size $K=5$ ($K=10$ for LIBERO-Long), $N=1$.

## Results

On the LIBERO benchmark (success rate over 50 rollouts per task), WorldVLA at 512×512 scores 87.6 / 96.2 / 83.4 / 60.0 on Spatial / Object / Goal / Long, average **81.8**, beating the discrete-action OpenVLA baseline (76.5 average) *without* large-scale robot pretraining; the 256×256 variant averages 79.1. Ablations isolate the mutual enhancement: adding world-model data lifts the pure action model from 62.8 to 67.2 average SR; naive autoregressive action chunking collapses it to 54.0, and the proposed attention mask recovers 76.6 (78.1 with world data — the full model). The abstract-level summary: about +4% grasping SR over the same-backbone action model, a 10–50% SR drop from naive chunking, and a 4–23% improvement from the mask. In the other direction, the action data improves world modeling: over 50-frame rollouts FVD drops from 718.6 to 674.1 (about 10% better) and PSNR rises 23.98 to 24.30 vs a pure world model, which visibly fails at physics (objects vanishing, drawers refusing to open). Pretraining the action model with the world-model task alone also helps (62.8 to 66.8).

## Why it matters for SLAM

WorldVLA marks the convergence of the two big threads of this level — world models (GAIA-1, Cosmos) and VLAs (RT-2, OpenVLA) — into a single architecture, closing the consistency gap between predicting the world and acting in it. Its ablations quantify something SLAM researchers intuit: models that must predict the geometric consequences of motion learn better representations for choosing motions, and vice versa. For SLAM, it sketches a plausible end-state for Spatial AI stacks: learned dynamics and action generation fused in one model, with explicit SLAM geometry remaining the complementary source of metric grounding that constrains and verifies the model's imagined rollouts.

## Related

- [World model](world-model.md)
- [RT-2](rt-2.md)
- [OpenVLA](openvla.md)
- [GAIA-1](gaia-1.md)
- [NVIDIA Cosmos](nvidia-cosmos.md)
