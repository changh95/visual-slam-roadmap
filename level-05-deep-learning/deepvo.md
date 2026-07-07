# DeepVO

> Wang 2017 · [Paper](https://arxiv.org/abs/1709.08429)

**One-line summary** — DeepVO (ICRA 2017) was the pioneering end-to-end learned visual odometry: a recurrent convolutional network (RCNN) that regresses 6-DoF camera poses directly from raw monocular video, replacing the entire classical VO pipeline.

## Problem

Classical monocular VO is built from a standard pipeline — camera calibration, feature detection, feature matching/tracking, outlier rejection (RANSAC), motion estimation, scale estimation, local optimisation (BA) — whose components "need to be carefully designed and specifically fine-tuned to work well in different environments", and which requires prior knowledge (e.g. camera height) to recover absolute scale. DeepVO asks the then-radical question: can a deep network learn the entire mapping from raw image sequences to camera poses end-to-end, "without adopting any module in the conventional VO pipeline (even camera calibration)"?

## Method & architecture

- **Input tensor.** Each pair of consecutive RGB frames (mean-subtracted, resized to a multiple of 64 — e.g. 1280×384 on KITTI) is stacked into a single tensor, so the network learns inter-frame *motion* features rather than single-image appearance.
- **CNN feature extractor.** 9 convolutional layers, each followed by ReLU except Conv6 (17 layers total), with receptive fields shrinking 7×7 → 5×5 → 3×3 and channels growing 64 → 1024. The structure is inspired by (and initialized from a pre-trained) FlowNet, i.e. an optical-flow-style geometric representation — the learned counterpart of feature extraction + matching.
- **Deep RNN.** Two stacked LSTM layers with 1000 hidden states each consume the Conv6 features. A plain RNN would update

$$\mathbf{h}_{k}=\mathcal{H}(\mathbf{W}_{xh}\mathbf{x}_{k}+\mathbf{W}_{hh}\mathbf{h}_{k-1}+\mathbf{b}_{h}), \qquad \mathbf{y}_{k}=\mathbf{W}_{hy}\mathbf{h}_{k}+\mathbf{b}_{y},$$

  but LSTMs (input, forget and output gates with memory cell $\mathbf{c}_{k}$) are used to capture long-term dependencies — implicitly modelling motion dynamics and inter-frame relations that frame-pair-only methods ignore. A pose estimate is emitted at every time step.
- **Probabilistic framing and loss.** The system models $p(\mathbf{Y}_{t}|\mathbf{X}_{t})=p(\mathbf{y}_{1},\ldots,\mathbf{y}_{t}\,|\,\mathbf{x}_{1},\ldots,\mathbf{x}_{t})$ and finds optimal parameters by minimising the MSE of positions $\mathbf{p}$ and Euler-angle orientations $\boldsymbol{\varphi}$:

$$\boldsymbol{\theta}^{*}=\operatorname*{argmin}_{\boldsymbol{\theta}}\frac{1}{N}\sum_{i=1}^{N}\sum_{k=1}^{t}\left\|\hat{\mathbf{p}}_{k}-\mathbf{p}_{k}\right\|_{2}^{2}+\kappa\left\|\hat{\boldsymbol{\varphi}}_{k}-\boldsymbol{\varphi}_{k}\right\|_{2}^{2},$$

  with scale factor $\kappa=100$ balancing orientation against position. Euler angles are preferred over quaternions, whose unit constraint hinders the optimisation.
- **Training.** Theano, Adagrad (lr 0.001) for up to 200 epochs on a Tesla K40, with dropout and early stopping; the paper shows overfitting produces great training-set trajectories but badly degraded test VO.

## Results

- **KITTI (with ground truth).** Trained on sequences 00, 02, 08, 09 (segmented into 7410 subsequence samples), tested on 03, 04, 05, 06, 07, 10 using the KITTI metrics (average RMSE drift over 100–800 m lengths). Mean over the test sequences: DeepVO **5.96% / 6.12°per100m** ($t_{rel}$ / $r_{rel}$) vs monocular VISO2-M 17.48% / 16.52 and stereo VISO2-S 1.89% / 1.96. Best sequences: 05 (2.62 / 3.61) and 07 (3.91 / 4.60).
- Consistently better than monocular VISO2 except translational error at high speeds — training data was almost entirely below 60 km/h; errors shrink toward stereo VISO2 as trajectory length grows.
- **KITTI sequences 11–21 (no ground truth).** Trained on all of 00–10, its trajectories are much better than VISO2-M and roughly similar to stereo VISO2-S — except seq 12 (50–90 km/h with little high-speed training data).
- **Scale.** Absolute scale is "completely maintained by the network itself and implicitly learnt during the end-to-end training" — no scale estimation or post-alignment to ground truth is performed.
- The conclusion explicitly positions learned VO as "a viable complement" to geometric methods, not a replacement — a framing that held up.

## Why it matters for SLAM

DeepVO is where "learned SLAM" starts in most curricula: it demonstrated both the promise (no hand engineering, implicit scale, temporal priors via the RNN) and the core limitation (memorization of the training domain — the paper's own high-speed failures) of end-to-end pose regression. Understanding why DeepVO struggles to generalize — no explicit geometry anywhere in the network — is the best motivation for the self-supervised line (SfM-Learner, UnDeepVO) and the geometry-hybrid systems that follow.

## Related

- [SfM-Learner](sfm-learner.md)
- [UndeepVO](undeepvo.md)
- [PoseNet](posenet.md)
- [FlowNet](flownet.md)
- [TartanVO](../level-03-monocular-slam/tartanvo.md)
- [DeepSLAM](deepslam.md)
