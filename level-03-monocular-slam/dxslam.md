# DXSLAM

> Li 2020 · [Paper](https://arxiv.org/abs/2008.05416)

**One-line summary** — Replaced hand-crafted ORB features with deep local and global features from HF-Net inside the ORB-SLAM2 pipeline, significantly improving robustness to illumination change and lifelong-SLAM scene changes — while running in real time on a CPU.

## Problem

For visual SLAM, "though the theoretical framework has been well established for most aspects, feature extraction and association is still empirically designed in most cases, and can be vulnerable in complex environments" — ORB-SLAM2 frequently fails to recognize previously visited scenes when the scene or viewpoint changes. CNN features are far more robust, but most deep-feature systems need a GPU, which is impractical on many robots. DXSLAM shows deep features "can be seamlessly incorporated into a modern SLAM framework" and made CPU-real-time: change the features, keep the proven geometry.

## Method & architecture

The framework is ORB-SLAM2's tracking / local mapping / loop closing pipeline with feature extraction, relocalization, and loop closure rebuilt around one CNN:

- **HF-Net front-end** — each image passes a shared encoder and three parallel decoders predicting keypoint detection scores, dense local descriptors (both SuperPoint-architecture), and a NetVLAD global descriptor. One inference yields local features for pose tracking/mapping and a global image descriptor for retrieval. HF-Net was chosen empirically over SuperPoint and D2-Net (SuperPoint extracts too few keypoints in low light).
- **Incrementally trained FBoW vocabulary** — a visual vocabulary is trained on HF-Net local descriptors from the OpenLORIS-Scene sequences: adjacent training images are brute-force matched, the top 300 matched descriptors (by detection score) join existing visual words, unmatched ones become new leaves, and words are then clustered into parent nodes. The binary FBoW form loads in ~40 ms vs ~6 s for ORB-SLAM2's vocabulary.
- **Re-localization with global features** — instead of BoW retrieval + frame-to-frame matching, candidates are retrieved by learned global descriptors and used for *group matching*: the current frame's keypoints are matched against all keypoints of a retrieved group (usually 2-3 groups), then standard RANSAC + PnP estimates the pose. This fixes both failure modes of ORB-SLAM2 relocalization (no candidates retrieved; too few matches per single frame).
- **Two-stage loop closure** — top-$K$ candidates are ranked by the BoW similarity score

$$s(v_{1},v_{2})=\sum_{i=1}^{N}|v_{1,i}|+|v_{2,i}|-|v_{1,i}-v_{2,i}|,$$

  between visual vectors $v_1,v_2$; since BoW discards spatial relations, a second phase computes a global-descriptor inner-product distance to each candidate and accepts the closest only if below a threshold — precision-first, as a false loop damages the map.
- **CPU optimization** — the TensorFlow HF-Net model is converted with Intel OpenVINO (bilinear descriptor upsampling moved to post-processing), and FBoW uses SIMD instructions, so "the full system can run in real-time without any GPU or other accelerators."

## Results

On OpenLORIS-Scene re-localization tests (office scene, controlled challenge factors), DXSLAM scores 0.862 under illumination change (ORB-SLAM2: 0.764), 0.994 under low light (ORB-SLAM2 and DS-SLAM: 0), and 0.999 with changed objects and people; all methods fail (0) under the total viewpoint reversal. Loop-closure PR curves on New College and City Center show the full method (HF-FBoW-GLB) well above ORB-SLAM2's ORB-BoW, with the global-descriptor stage adding a notable margin. On TUM RGB-D dynamic sequences, ATE RMSE drops from 0.3900 m (ORB-SLAM2) to 0.0167 m on fr3_walking_static and 0.4863 m to 0.0759 m on fr3_walking_half — comparable to the dynamic-aware DS-SLAM without explicitly handling dynamics. Feature extraction on a 15 W i7-10710U takes 46.2 ms/image with OpenVINO (68% faster than plain HF-Net's 144.2 ms; SuperPoint needs 387.5 ms, D2-Net 2484.6 ms), and the full ROS system publishes poses at ~15 Hz on an Intel NUC.

## Why it matters for SLAM

DXSLAM is a clean demonstration of the simplest way to modernise classical SLAM: keep the proven geometric backend, swap in learned features. It showed substantial robustness gains over ORB-SLAM2 in dynamic and lifelong-SLAM settings without redesigning the system — and, unusually, proved the recipe deployable on GPU-free robots. It bridges Level 3's classical systems and Level 5's learned-feature research (SuperPoint, HF-Net); many production systems follow exactly this hybrid recipe.

## Related

- [ORB-SLAM2](orb-slam2.md)
- [HF-Net](../level-05-deep-learning/hf-net.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
- [NetVLAD](../level-05-deep-learning/netvlad.md)
- [Learned vs hand-crafted](../level-05-deep-learning/learned-vs-hand-crafted.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
