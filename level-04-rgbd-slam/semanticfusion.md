# SemanticFusion

> McCormac 2016 · [Paper](https://arxiv.org/abs/1609.05130)

**One-line summary** — The first real-time dense semantic SLAM system, fusing per-frame CNN segmentation predictions into an ElasticFusion surfel map via recursive Bayesian updates to produce a coherent 3D semantic map.

## Problem

Dense geometric SLAM produces accurate 3D reconstructions, but the map does not know *what* anything is — for the next level of robot intelligence and intuitive user interaction, maps need to extend beyond geometry and appearance to contain semantics. Single-frame CNN semantic segmentation, meanwhile, is noisy and view-dependent: the same surface can be labeled differently from different viewpoints. The missing piece was a mechanism to accumulate many per-frame 2D predictions into one persistent, consistent 3D labeling.

## Method & architecture

The pipeline has three units running together, plus an optional regularizer:

- **SLAM backbone (ElasticFusion)**: for each frame $k$, ElasticFusion tracks the camera by combined ICP + RGB alignment, yielding pose $T_{WC}$, and fuses depth into a surfel map. Its deformation graph lets probability distributions be "carried along" with surfels through small and large loop closures, so surfels stay persistently associated with real-world entities — exactly the long-term correspondence semantic fusion needs. (Default parameters, except depth cutoff extended from 3 m to 8 m.)
- **CNN front-end**: a Deconvolutional Semantic Segmentation network (Noh et al., VGG-16 based, in Caffe) is run on every 10th frame, returning per-pixel class probabilities $P(O_{u} = l_i \mid I_k)$ over 13 NYUv2 classes. A fourth *depth* channel is added by initializing depth filters from the average intensity of the pretrained RGB filters, rescaled ($\approx 32\times$) from the 0–255 color range to the 0–8 m depth range. Inputs are rescaled to 224×224; outputs upsampled to 640×480.
- **Bayesian label fusion**: each surfel $s$ stores a discrete distribution $P(L_s = l_i)$ over labels, initialized uniform. Using the tracked pose, each visible surfel at 3D position $x(s)$ is associated with pixel $u(s,k) = \pi\big(T_{CW}(k)\, x(s)\big)$ and updated recursively:

$$P(l_i \mid I_{1,\dots,k}) = \frac{1}{Z}\, P(l_i \mid I_{1,\dots,k-1})\; P\big(O_{u(s,k)} = l_i \mid I_k\big)$$

  with $Z$ a normalizing constant. The SLAM correspondences are what allow label hypotheses from many viewpoints to be combined in a Bayesian way.
- **Optional CRF regularization**: a fully-connected CRF with Gaussian edge potentials treats each surfel as a node and incrementally updates the distributions by approximately minimizing $E(\mathbf{x}) = \sum_s \psi_u(x_s) + \sum_{s<s'} \psi_p(x_s, x_{s'})$, with unary $\psi_u(x_s) = -\log P(L_s = x_s \mid I_{1,\dots,k})$ and Potts-weighted pairwise kernels — a bilateral appearance kernel over surfel positions $\mathbf{p}$ and colors $\mathbf{c}$ and a smoothness kernel over normals $\mathbf{n}$:

$$k^1 = \exp\Big(-\frac{|\mathbf{p}_s-\mathbf{p}_{s'}|^2}{2\theta_\alpha^2} - \frac{|\mathbf{c}_s-\mathbf{c}_{s'}|^2}{2\theta_\beta^2}\Big), \qquad k^2 = \exp\Big(-\frac{|\mathbf{p}_s-\mathbf{p}_{s'}|^2}{2\theta_\alpha^2} - \frac{|\mathbf{n}_s-\mathbf{n}_{s'}|^2}{2\theta_\gamma^2}\Big)$$

  with $\theta_\alpha = 0.05$ m, $\theta_\beta = 20$, $\theta_\gamma = 0.1$ rad, applied every 500 frames.

Per-frame cost (i7-5820K + Titan Black): SLAM 29.3 ms, probability-table bookkeeping 1.0 ms; CNN forward pass 51.2 ms and Bayesian update 41.1 ms every 10 frames — an average frame rate of 25.3 Hz.

## Results

On a purpose-built office reconstruction dataset (loopy trajectory, 49 annotated test frames, 13 NYUv2 classes), fusing predictions raised the RGBD-CNN from 43.6% to 48.3% class-average accuracy, and the state-of-the-art Eigen et al. CNN from 57.1% to 60.0%. On the NYUv2 test set (140 usable sequences, 360 labeled images), SemanticFusion improved the RGBD-CNN from 55.6% to 58.9% class average (62.0% to 67.5% pixel average) and Eigen et al. from 59.9% to 63.2% (+3.3%); adding the CRF gave small further gains (63.6%). The improvement is roughly double on the office dataset versus NYUv2's mostly rotational trajectories — multi-view fusion is worth most exactly when viewpoints vary. Predicting on every frame gives 52.5% accuracy at 8.2 Hz; every 10th frame gives 49–51% at 25.3 Hz.

## Why it matters for SLAM

SemanticFusion pioneered "deep semantic SLAM": it demonstrated that CNN perception and dense SLAM are complementary, with SLAM providing the correspondences that turn per-frame 2D predictions into a persistent, consistent 3D semantic map — and that the fusion improves even the 2D labeling itself. It directly inspired the semantic mapping line that leads to Fusion++, PanopticFusion, Kimera, and today's 3D scene graph systems.

## Related

- [ElasticFusion](elasticfusion.md)
- [Fusion++](fusionpp.md)
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md)
- [MaskFusion](../level-03-monocular-slam/maskfusion.md)
- [ConceptFusion](../level-03-monocular-slam/conceptfusion.md)
