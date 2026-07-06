# DSAC\*

> Brachmann 2021 · [Paper](https://arxiv.org/abs/2002.12324)

**One-line summary** — The consolidated TPAMI version of the DSAC line: one unified scene-coordinate-regression framework for visual relocalization from RGB or RGB-D images, with substantially improved training stability and efficiency.

## Key ideas

- **One framework, many settings**: DSAC\* handles relocalization from RGB or RGB-D input, and can be trained with or without a 3D scene model — unifying the separate recipes of DSAC and DSAC++ into a single system.
- **Improved learning stability**: refines the differentiable-RANSAC training procedure (initialization and hypothesis-scoring gradients) so that training converges reliably across scenes, addressing the fragility of the earlier formulations.
- **Leaner and faster**: a more efficient network and pipeline reduce training and inference cost compared to DSAC++, moving scene coordinate regression closer to practical deployment.
- **Reference implementation**: as the journal consolidation of the approach, DSAC\* became the standard SCR baseline that later work (ACE and its successors) is measured against and built upon.

## Why it matters for SLAM

Relocalization — recovering the 6-DoF camera pose inside a previously mapped scene — is what SLAM systems need after tracking loss or when restarting in a known environment. DSAC\* is the mature form of the scene-coordinate-regression answer to this problem: it encodes the map implicitly in network weights and keeps a geometric PnP+RANSAC solver in the loop, giving centimeter-level indoor accuracy. Its stable training recipe is the foundation the ACE family accelerated by orders of magnitude.

## Related

- [DSAC](dsac.md) — original differentiable RANSAC for camera localization
- [DSAC++](dsacpp.md) — self-supervised training from camera poses only
- [ACE](ace.md) — matches DSAC\* accuracy with minutes of training
- [ACE Zero](ace-zero.md) — extends SCR to learn poses and map jointly from scratch

[Back to Level 5](../README.md#level-5-applying-deep-learning)
