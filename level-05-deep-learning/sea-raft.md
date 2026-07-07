# SEA-RAFT

> Wang 2024 · [Paper](https://arxiv.org/abs/2405.14793)

**One-line summary** — Simple, Efficient, Accurate RAFT: a mixture-of-Laplace loss, direct regression of the initial flow, rigid-flow pre-training on TartanAir, and architectural simplifications give RAFT the best accuracy-efficiency Pareto frontier — state of the art on Spring while running at least 2.3x faster than comparable methods.

## Problem

Post-RAFT progress in optical flow came mostly from heavier architectures — Transformer cost-volume encoders, larger backbones — trading away the speed that makes flow usable in real-time systems. Meanwhile RAFT's own recipe has weaknesses: the standard $L_1$ endpoint loss is dominated by ambiguous, unpredictable pixels under heavy occlusion; zero-initialized flow forces many refinement iterations (12 in training, up to 32 in inference); and the synthetic FlyingChairs/Things data limits realism and generalization. SEA-RAFT asks how far loss, initialization, and data changes can push the original architecture.

## Method & architecture

SEA-RAFT keeps RAFT's skeleton. Feature encoder $F$ and context encoder $C$ (truncated ImageNet-pretrained ResNets replacing RAFT's custom encoders) map $I_1, I_2 \in \mathbb{R}^{H\times W\times 3}$ to $1/8$-resolution features; a multi-scale 4D correlation volume is built as

$$V_k = F(I_1) \circ \texttt{AvgPool}(F(I_2), 2^k)^{\top} \in \mathbb{R}^{h\times w\times\frac{h}{2^k}\times\frac{w}{2^k}}, \qquad k=4,\ (h,w)=\tfrac{1}{8}(H,W)$$

Each iteration looks up motion features around the current flow $\mu$ with radius $r{=}4$, $M = \texttt{MotionEncoder}(\texttt{LookUp}(\{V_k\},\mu,r))$, and a recurrent unit (two ConvNeXt blocks replacing RAFT's ConvGRU) updates the hidden state and regresses the residual: $h' = \texttt{RNN}(h, M, C(I_1))$, $\Delta\mu = \texttt{FlowHead}(h')$. The three main changes:

- **Mixture-of-Laplace (MoL) loss**: instead of $L_1$, the network predicts per-pixel parameters of a two-component Laplace mixture — one component for ordinary pixels, one for ambiguous (occluded) ones:

$$MixLap(x;\alpha,\beta_1,\beta_2,\mu) = \alpha\cdot\frac{e^{-\frac{|x-\mu|}{e^{\beta_1}}}}{2e^{\beta_1}} + (1-\alpha)\cdot\frac{e^{-\frac{|x-\mu|}{e^{\beta_2}}}}{2e^{\beta_2}}$$

  with $\beta_1{=}0$ fixed so the first component matches the $L_1$/endpoint-error metric, scales regressed in log-space for stability ($\beta_2 \in [0,10]$), and the loss $\mathcal{L}_{MoL}$ being the negative log-likelihood of the ground truth averaged over pixels and both flow axes, applied per iteration with the usual exponential weighting $\mathcal{L}_{all}=\sum_{i=1}^{N}\gamma^{N-i}\mathcal{L}_{MoL}^{i}$. The mixing weight $\alpha$ doubles as an uncertainty output.
- **Direct initial-flow regression**: the context encoder, fed both stacked frames, predicts the initial flow (plus its MoL parameters) instead of starting from zero — cutting iterations to $N{=}4$ in training and at most 12 in inference.
- **Rigid-flow pre-training**: 300k steps on TartanAir, whose flow comes purely from camera motion in static scenes — limited motion diversity but high realism, measurably improving generalization.

Variants: SEA-RAFT(S) uses the first 6 layers of ResNet-18, (M) the first 13 of ResNet-34; (L) is (M) run with 12 inference iterations.

## Results

- **Spring test (fine-tuned)**: SEA-RAFT(M) reaches 3.686 1px-outlier rate and 0.363 EPE — 1st place, at least 22.9% EPE and 17.8% 1px error reduction over prior methods; even SEA-RAFT(S) beats all others (20.0% / 12.8% reductions). Zero-shot on Spring train, it is best among methods without extra data and close to MS-RAFT+ while being 11x smaller and 24x faster.
- **Efficiency**: at least 2.3x faster than methods of comparable accuracy; the smallest model runs 1080p at 21 fps on an RTX 3090 (3x faster than original RAFT); SEA-RAFT(M) takes 70.96 ms / 486.9 GMACs at 540x960 vs. RAFT's 140.7 ms / 938.2 GMACs.
- **Zero-shot C+T on KITTI train**: best published generalization — Fl-epe 4.09 to 3.62, Fl-all 13.7 to 12.9. On Sintel train it is competitive on clean but weaker on final (4.11); adding just ~1.2k real pairs (KITTI+HD1K) shrinks that gap (2.79).
- **Sintel/KITTI test**: SEA-RAFT(L) gets 1.31 clean / 2.60 final and 4.30 Fl-all — vs. RAFT, 19.9% / 4.2% / 15.7% improvements — with similar-accuracy methods at least 1.8x (Sintel) and 4.6x (KITTI) slower.

## Why it matters for SLAM

SEA-RAFT is the practical choice when a SLAM front-end needs dense flow at real-time rates: RAFT-class machinery without Transformer-class latency. Two of its ingredients align directly with SLAM needs — the rigid-motion pre-training matches the mostly rigid world SLAM assumes, and the Laplace-mixture parameters give per-pixel uncertainty that maps naturally onto measurement covariances in probabilistic estimation. It is also a case study that loss, initialization, and data design can beat architecture growth, a lesson relevant to any learned SLAM component.

## Related

- [RAFT](raft.md) — the base architecture and training target
- [FlowFormer](flowformer.md) — the heavier Transformer alternative
- [TartanVO](tartanvo.md) — learned VO also built on TartanAir's rigid-scene data
- [DPVO](dpvo.md) — sparse learned odometry with RAFT-style updates
- [DROID-SLAM](droid-slam.md) — RAFT machinery in a full SLAM system
