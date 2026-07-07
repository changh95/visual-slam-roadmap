# NetVLAD

> Arandjelović 2016 · [Paper](https://arxiv.org/abs/1511.07247)

**One-line summary** — End-to-end trainable CNN for large-scale visual place recognition, built around a differentiable VLAD pooling layer trained from weakly supervised GPS-tagged street-view imagery.

## Problem

Large-scale visual place recognition — quickly and accurately recognizing where a query photograph was taken — needs a compact, discriminative image-level descriptor. Classical VLAD (Vector of Locally Aggregated Descriptors) aggregates local descriptors well but uses hard cluster assignment, so it cannot be trained end-to-end, and off-the-shelf CNN features were never optimized for the place-recognition task (their conv5 activations are not even trained to be comparable under Euclidean distance). A further obstacle is supervision: nobody hand-labels which images depict the same place, so training must work from noisy, weakly supervised GPS-tagged data.

## Method & architecture

A base CNN (VGG-16 or AlexNet, cropped at conv5 before ReLU) turns the image into $N$ D-dimensional local descriptors $\mathbf{x}_i$; the NetVLAD layer then aggregates them against $K$ cluster centres $\mathbf{c}_k$. Classical VLAD stores per-cluster residual sums, $V(j,k)=\sum_{i=1}^{N}a_{k}(\mathbf{x}_{i})\left(x_{i}(j)-c_{k}(j)\right)$, where the hard assignment $a_k \in \{0,1\}$ is the source of non-differentiability. NetVLAD replaces it with a learned soft assignment (a softmax over distances to centres, with the descriptor-norm term cancelling):

$$\bar{a}_{k}(\mathbf{x}_{i})=\frac{e^{\mathbf{w}_{k}^{T}\mathbf{x}_{i}+b_{k}}}{\sum_{k'}e^{\mathbf{w}_{k'}^{T}\mathbf{x}_{i}+b_{k'}}}, \qquad V(j,k)=\sum_{i=1}^{N}\bar{a}_{k}(\mathbf{x}_{i})\left(x_{i}(j)-c_{k}(j)\right)$$

Initialized from clustering, $\mathbf{w}_{k}=2\alpha\mathbf{c}_{k}$ and $b_{k}=-\alpha\lVert\mathbf{c}_{k}\rVert^{2}$ recover VLAD as $\alpha\to\infty$; crucially, $\{\mathbf{w}_k\},\{b_k\},\{\mathbf{c}_k\}$ are three *decoupled* trainable parameter sets, giving more flexibility than VLAD (the anchor point can move to make residuals of non-matching images dissimilar). The layer decomposes into standard ops — a $1{\times}1$ convolution, a softmax, the residual-aggregation core, intra-normalization, and final L2 normalization — so it plugs into any CNN and backpropagates. With $K=64$ the output is 32k-D (VGG-16), PCA-whitened to a 4096-D global descriptor for nearest-neighbor retrieval.

Training uses Google Street View Time Machine panoramas: images of the same places captured years apart give, for each query $q$, GPS-based *potential* positives $\{p_i^q\}$ (close by, but possibly facing elsewhere) and definite negatives $\{n_j^q\}$ (far away). A weakly supervised triplet ranking loss picks the best-matching positive automatically via the min:

$$L_{\theta}=\sum_{j}l\Big(\min_{i}d_{\theta}^{2}(q,p_{i}^{q})+m-d_{\theta}^{2}(q,n_{j}^{q})\Big)$$

where $l(x)=\max(x,0)$ is the hinge and $m$ the margin — a multiple-instance-learning twist on the triplet loss that tolerates the noisy GPS labels. The whole network is trained with SGD.

## Results

Evaluation uses recall@N (correct if a top-N database image is within 25 m) on Pittsburgh 250k (250k database images, 24k queries) and Tokyo 24/7 (76k database images, 315 phone queries including sunset/night against a daytime database). End-to-end training is decisive: on Pitts250k-test, trained AlexNet+NetVLAD reaches 81.0 % recall@1 vs 55.0 % for off-the-shelf AlexNet features with standard VLAD — a 47 % relative improvement. The 4096-D VGG-16 NetVLAD+whitening descriptor sets the state of the art on all benchmarks, outperforming the best local-feature compact descriptor (dense RootSIFT+VLAD+whitening) and Torii et al.'s view-synthesis method. NetVLAD also degrades gracefully: 128-D NetVLAD matches 512-D Max pooling (42.9 % vs 38.4 % recall@1 on Tokyo 24/7). The Time Machine data itself is crucial — with AlexNet Max pooling on Pitts30k-val, recall@1 goes 33.5 % (off-the-shelf) → 38.7 % (trained without Time Machine) → 68.5 % (trained with it), since same-time query/database pairs teach the network shortcuts like memorizing parked cars.

## Why it matters for SLAM

Loop-closure detection and relocalization are place-recognition problems, and NetVLAD's descriptor was the de facto standard for them for years — it is the global retrieval stage of the hloc pipeline and countless SLAM systems. It also established the template for learned place recognition (CNN backbone + trainable aggregation + weak metric-learning supervision) that Patch-NetVLAD, CosPlace, MixVPR, and today's foundation-model VPR methods still follow.

## Related

- [Patch NetVLAD](patch-netvlad.md) — multi-scale patch-level successor with spatial re-ranking
- [HF-Net](hf-net.md) — hierarchical localization built on NetVLAD retrieval
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the task in SLAM context
- [SuperPoint](superpoint.md) — the local-feature counterpart in learned localization pipelines
