# DeepV2D

> Teed 2018 · [Paper](https://arxiv.org/abs/1812.04605)

**One-line summary** — DeepV2D predicts depth from video by composing classical geometric algorithms into differentiable modules and alternating between motion estimation and depth estimation until both converge.

## Problem

Depth-from-video sits between two unsatisfying extremes: classical SfM pipelines are geometrically principled but fragile and not learnable, while one-shot depth regression networks ignore the geometric structure of the problem and cannot exploit multiple frames properly. DeepV2D's goal is an end-to-end architecture that "combines the representation ability of neural networks with the geometric principles governing image formation" — keeping geometry as the skeleton and learning the flesh.

## Key ideas

- **Classical algorithms as trainable modules.** A collection of classical geometric algorithms (camera motion estimation, multi-view stereo aggregation) is converted into differentiable modules and composed into a single end-to-end trainable architecture.
- **Two interleaved stages.** A **depth module** builds multi-view matching evidence over video frames given the current camera motion, and a **motion module** updates the camera poses given the current depth. Neither works without the other — so they are alternated.
- **Block coordinate descent, learned.** At inference, motion and depth estimation are alternated and "converge to accurate depth": better depth improves motion, which improves depth. This self-correcting loop contrasts with one-shot regressors like DeMoN, which get a single chance to be right.
- **Robustness through joint training.** Because the whole pipeline is trained end-to-end, each module learns to tolerate the other's intermediate errors — early iterations see rough depth/motion, so the modules are optimized to refine rather than assume clean inputs.
- **Geometry as structure, learning as refinement.** The design principle — hard-code the multi-view geometry, learn matching and regularization — places DeepV2D squarely in the BA-Net/DeepTAM generation of geometry-aware learned systems.

## Results & impact

- The paper demonstrates accurate video-to-depth on standard benchmarks, with the alternating inference converging to accurate depth (abstract); code was released and became a common baseline for learned depth-from-video.
- Its greatest impact is genealogical: Teed & Deng's subsequent works — RAFT (iterative recurrent flow updates) and DROID-SLAM (iterative updates through a differentiable dense BA layer) — grew directly out of this alternate-and-converge design.
- Together with BA-Net and DeepTAM, it helped establish "embed geometric optimization inside the network" as the dominant philosophy of learned SLAM.

## Why it matters for SLAM

DeepV2D is a key link in the lineage from DeMoN to DROID-SLAM: it showed that iterating between learned motion and learned depth — with geometry mediating the exchange — beats regressing either quantity in one shot. Video-to-depth modules of this style serve as dense front-ends for mapping, and the alternating-refinement idea now underpins the most accurate learned VO/SLAM systems.

## Related

- [DeMoN](demon.md)
- [BA-Net](ba-net.md)
- [DeepTAM](deeptam.md)
- [RAFT](raft.md)
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
