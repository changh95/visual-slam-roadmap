# PoseNet

> Kendall 2015 · [Paper](https://arxiv.org/abs/1505.07427)

**One-line summary** — First CNN to regress a full 6-DoF camera pose (translation + quaternion) directly from a single RGB image, pioneering Absolute Pose Regression (APR) for visual relocalization at 5 ms per frame with a 50 MB model.

## Problem

Classical relocalization is either metric (match features against a 3D map, solve PnP — needs a good initial estimate, gigabytes of storage, and fails when SIFT-style matching fails under blur, low light, or texture-poor views) or appearance-based (classify among a discrete set of places — only a coarse location). PoseNet addresses the lost/kidnapped-robot problem by asking whether a convnet can map a single 224x224 image *directly* to continuous 6-DoF pose, end-to-end, with no feature engineering, no map, and no graph optimization — and whether this is trainable at all given that pose-labelled data is scarce (a few hundred to a few thousand frames per scene, auto-labelled by SfM).

## Method & architecture

- **Backbone**: a modified GoogLeNet (23 layers with trainable parameters). All three softmax classifiers are replaced by affine regressors outputting a 7-D pose vector, and an extra 2048-D fully connected layer is inserted before the final regressor to form an explorable localization feature. The output is

$$\mathbf{p} = [\mathbf{x}, \mathbf{q}]$$

  with position $\mathbf{x} \in \mathbb{R}^3$ and orientation quaternion $\mathbf{q} \in \mathbb{R}^4$, chosen because arbitrary 4-D values map to valid rotations by unit-normalization (simpler than orthonormalizing rotation matrices); $\mathbf{q}$ is normalized at test time.
- **Loss**: joint regression with a scale factor balancing the two terms,

$$loss(I) = \lVert\hat{\mathbf{x}}-\mathbf{x}\rVert_2 + \beta\,\left\lVert\hat{\mathbf{q}}-\frac{\mathbf{q}}{\lVert\mathbf{q}\rVert}\right\rVert_2$$

  The optimal $\beta$ is the ratio of expected position to orientation error at the *end* of training, found by grid search: 120–750 indoors, 250–2000 outdoors. Training position and orientation separately, or in separate branches, performed worse — each output helps factor the other out.
- **Transfer learning**: weights are pretrained as a classifier on ImageNet/Places, which converges to lower error in less time even from sparse training sets; Places (more scene-relevant) ultimately beats ImageNet. The learned feature is a smoothly varying, largely one-to-one function of pose and generalizes to unseen scenes with a few dozen samples.
- **Data via SfM**: training poses come from a structure-from-motion reconstruction of a smartphone video (2 Hz frames, ~1 m spacing), reducing labelling effort to just recording video; the paper releases the Cambridge Landmarks dataset (5 outdoor scenes).
- **Inference**: a single center crop takes 5 ms; averaging 128 uniformly spaced crops (95 ms) gives a modest boost, mainly in cluttered scenes.

## Results

- **Overall**: approximately 2 m and 6 deg accuracy on large outdoor scenes (up to 50,000 m^2) and 0.5 m, 10 deg indoors, in real time.
- **Cambridge Landmarks (median)**: King's College 1.92 m / 5.40 deg (1.66 m / 4.86 deg dense), Old Hospital 2.31 m / 5.38 deg, Shop Facade 1.46 m / 8.08 deg, St Mary's Church 2.65 m / 8.48 deg, Street 3.67 m / 6.50 deg — beating a nearest-neighbour match on its own feature vector (e.g. 3.34 m / 5.92 deg on King's College), proving it regresses beyond the training set.
- **7 Scenes (median)**: e.g. Chess 0.32 m / 8.12 deg, Office 0.48 m / 7.68 deg, Stairs 0.47 m / 13.8 deg — but the RGB-D SCoRe Forest gets 0.03–0.06 m, so PoseNet is far less accurate where depth-based scene coordinate regression applies (though it wins on the hardest frames above the 95th percentile).
- **Efficiency**: 50 MB of weights and 5 ms per pose, versus gigabytes and minutes for SIFT-based metric localization whose cost scales $\mathcal{O}(n^2)$ with training data.
- **Robustness**: keeps localizing under motion blur, dusk/night silhouettes, fog, rain, dynamic objects, and unknown camera intrinsics (35–45 mm focal lengths vs. 30 mm training camera) — all cases where SfM with SIFT fails outright; accuracy degrades gracefully down to a few dozen training images spaced 4 m apart.

## Why it matters for SLAM

PoseNet launched the learned-relocalization research direction and defined the APR problem setting, showing a convnet can solve out-of-image-plane regression via transfer learning. Its limitations were as influential as its results: meter-level accuracy far from structure-based methods motivated scene coordinate regression (DSAC, ACE), which keeps the geometric solver in the loop and reaches centimeter accuracy, and later analysis showed APR behaves more like image retrieval than geometry. In SLAM, PoseNet-style regression survives as a coarse relocalization prior, and its compact constant-memory "map in the weights" foreshadowed implicit neural maps.

## Related

- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — why APR accuracy is bounded by retrieval
- [DSAC](dsac.md) — scene coordinate regression with differentiable RANSAC
- [DSAC++](dsacpp.md) — refined scene coordinate regression training
- [ACE](ace.md) — fast modern scene coordinate regression
- [hloc](hloc.md) — the structure-based hierarchical localization alternative
