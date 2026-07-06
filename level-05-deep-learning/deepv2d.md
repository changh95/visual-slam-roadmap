# DeepV2D

> Teed 2018 · [Paper](https://arxiv.org/abs/1812.04605)

**One-line summary** — DeepV2D predicts depth from video by composing classical geometric algorithms into differentiable modules and alternating between motion estimation and depth estimation until both converge.

## Key ideas

- Combines "the representation ability of neural networks with the geometric principles governing image formation": classical multi-view geometry algorithms are converted into trainable, differentiable modules and assembled into one end-to-end architecture.
- Two interleaved stages: a **depth module** (multi-view cost volume over the video frames given current camera motion) and a **motion module** (updates camera poses given current depth). At inference the two are alternated, converging to accurate depth — block coordinate descent, learned.
- The alternation gives the system a self-correcting property: better depth improves motion, which improves depth — in contrast to one-shot regression networks like DeMoN.
- Trained end-to-end so each module learns to be robust to the other's intermediate errors.

## Why it matters for SLAM

DeepV2D is a key link in the lineage from DeMoN to DROID-SLAM: Teed & Deng's follow-up work (RAFT, DROID-SLAM) turned this alternating geometric-update idea into iterative recurrent updates with a differentiable bundle adjustment layer. The design lesson — embed geometry as structure, learn the rest — is now the dominant philosophy in learned SLAM, and video-to-depth modules of this style serve as dense front-ends for mapping.

## Related

- [DeMoN](demon.md)
- [BA-Net](ba-net.md)
- [DeepTAM](deeptam.md)
- [RAFT](raft.md)
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
