# DeepVO

> Wang 2017 · [Paper](https://arxiv.org/abs/1709.08429)

**One-line summary** — DeepVO (ICRA 2017) was the pioneering end-to-end learned visual odometry: a recurrent convolutional network that regresses 6-DoF camera poses directly from raw monocular video, replacing the entire classical VO pipeline.

## Problem

Classical monocular VO is built from a standard pipeline — feature extraction, feature matching, motion estimation, local optimisation — whose components "need to be carefully designed and specifically fine-tuned to work well in different environments", and which requires prior knowledge to recover absolute scale. DeepVO asks the then-radical question: can a deep network learn the entire mapping from raw image sequences to camera poses end-to-end, with no module of the conventional pipeline at all?

## Key ideas

- **CNN for inter-frame motion features.** A FlowNet-style CNN processes consecutive frame pairs, learning an effective feature representation of the visual motion signal — the learned counterpart of feature extraction + matching.
- **RNN for sequential dynamics.** Two stacked LSTM layers integrate the CNN features over time,

  $$\mathbf{h}_t, \mathbf{c}_t = \text{LSTM}\big(\text{CNN}(I_t, I_{t-1}),\ \mathbf{h}_{t-1}, \mathbf{c}_{t-1}\big),$$

  implicitly modeling motion dynamics and inter-frame relations (smoothness, velocity) that frame-pair-only methods ignore.
- **Direct 6-DoF regression.** A fully connected head maps the LSTM state to a relative pose — translation $\mathbf{t} \in \mathbb{R}^3$ and Euler angles $\boldsymbol{\phi} \in \mathbb{R}^3$ — trained supervised on ground-truth trajectories with a loss that weights translation and orientation errors.
- **Implicit scale.** Because it learns from data, the network absorbs absolute scale from the training distribution — something geometric monocular VO fundamentally cannot recover without prior knowledge.
- **No pipeline, by design.** Trained and deployed end-to-end, it "infers poses directly from a sequence of raw RGB images (videos) without adopting any module in the conventional VO pipeline".

## Results & impact

- On the KITTI odometry benchmark it showed "competitive performance to state-of-the-art methods" (abstract), with accuracy strongest on training-like sequences and clear degradation on unseen environments — exposing the limited generalization of supervised pose regression.
- Established the CNN+RNN template for learned odometry and made "can a network do VO end-to-end?" a serious research question; it remains the standard first citation for supervised learned VO.
- Its data hunger and weak generalization directly motivated the self-supervised line (SfM-Learner, UnDeepVO) and, later, hybrid architectures that reintroduce geometry (TartanVO, DROID-SLAM).

## Why it matters for SLAM

DeepVO is where "learned SLAM" starts in most curricula: it demonstrated both the promise (no hand engineering, implicit scale, temporal priors) and the core limitation (memorization of the training domain) of end-to-end pose regression. Understanding why DeepVO struggles to generalize — no explicit geometry anywhere in the network — is the best motivation for the geometry-hybrid systems that follow.

## Related

- [SfM-Learner](sfm-learner.md)
- [UndeepVO](undeepvo.md)
- [PoseNet](posenet.md)
- [TartanVO](../level-03-monocular-slam/tartanvo.md)
- [DeepSLAM](deepslam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
