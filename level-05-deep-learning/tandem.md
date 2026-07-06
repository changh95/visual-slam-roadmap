# TANDEM

> Koestler 2021 · [Paper](https://arxiv.org/abs/2111.07418)

**One-line summary** — Real-time monocular dense SLAM that pairs DSO's classical photometric tracking with a learned multi-view stereo network (CVA-MVSNet) and TSDF fusion for dense reconstruction.

## Key ideas

- **Hybrid division of labor**: Classical direct tracking (DSO) supplies accurate, reliable poses; a learned MVS network supplies dense depth — each side doing what it is best at.
- **CVA-MVSNet**: A lightweight cost-volume MVS network takes the current keyframe plus nearby keyframes with DSO poses, builds a plane-sweep cost volume across depth hypotheses, and regresses dense depth — recovering the textureless regions direct methods leave empty.
- **Dense TSDF mapping**: Predicted depth maps are fused into a truncated signed distance function volume, yielding a globally consistent dense mesh from a single moving camera.
- **Map-assisted tracking**: Depth rendered from the TSDF feeds back into tracking as an additional constraint, closing the loop between mapping and localization.
- Real-time on a single GPU with dense reconstructions approaching RGB-D quality from monocular input.

## Why it matters for SLAM

TANDEM is a clean demonstration of the classical-plus-learned hybrid design pattern: keep the well-understood geometric estimator for poses, insert learning exactly where classical methods are weakest (dense depth in textureless areas). It showed monocular cameras can produce dense maps online without a depth sensor, influencing subsequent dense monocular systems and standing as the pragmatic alternative to fully learned pipelines like DROID-SLAM.

## Related

- [DSO](../level-03-monocular-slam/dso.md) — the direct sparse odometry backbone
- [MonoRec](monorec.md) — related dense reconstruction from monocular video
- [CodeMapping](codemapping.md) — sparse SLAM + learned dense depth via codes
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — the fully learned alternative
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md) — neural implicit dense SLAM alternative

[Back to Level 5](../README.md#level-5-applying-deep-learning)
