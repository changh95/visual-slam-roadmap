# ACE-G

> Bruns 2025 · [Paper](https://arxiv.org/abs/2510.11605)

**One-line summary** — Extends the ACE line of scene coordinate regression toward generalization, pretraining the relocalization pipeline so it can operate on new scenes without per-scene fine-tuning.

## Key ideas

- **The bottleneck it targets**: even fast SCR methods like ACE still require training a scene-specific network head for every new environment (minutes per scene). A *generalizable* SCR would amortize that cost entirely into pretraining.
- **Generalizable SCR via query pretraining**: the model is pretrained at scale so that, given mapping data for an unseen scene, it can serve relocalization queries in that scene without gradient-based fine-tuning of scene-specific weights.
- **New scenes without fine-tuning**: at deployment, adding an environment no longer means running an optimization loop on-device — a significant practical difference for products that must map many spaces quickly.
- **Same output interface as classic SCR**: the system still produces 2D-3D correspondences consumed by a robust PnP/RANSAC pose solver, so it drops into existing relocalization pipelines.

## Why it matters for SLAM

The SCR lineage has been steadily removing deployment costs: DSAC made SCR trainable end-to-end, ACE cut per-scene training to minutes, ACE Zero removed the need for known poses, and ACE-G attacks the last per-scene cost — training itself. Generalizable relocalization matters for consumer AR and robotics at fleet scale, where per-scene optimization is operationally expensive. It also parallels the broader Level 5 trend of replacing per-scene optimization with feed-forward inference from large pretrained models.

## Related

- [ACE](ace.md)
- [ACE Zero](ace-zero.md)
- [DSAC\*](dsac-star.md)
- [ACE-SLAM](ace-slam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
