# Deep Image Retrieval

**Deep image retrieval** replaces hand-crafted global image descriptors (Bag of Visual Words, VLAD, Fisher vectors) with embeddings produced by a neural network: an image $I$ is mapped to a compact vector $f(I) \in \mathbb{R}^D$ such that images of the *same place* (or same object) are close in embedding space, and images of different places are far apart. Retrieval then reduces to (approximate) nearest-neighbour search among database embeddings — exactly the operation a SLAM system needs for loop closure candidate generation and relocalization.

## From CNN features to a global descriptor

A convolutional backbone applied to an image yields a $H \times W \times C$ activation tensor — effectively a dense grid of $C$-dimensional local features. Deep retrieval methods differ mainly in how they **pool** this tensor into a single vector:

- **SPoC / sum pooling**: average the activations over the spatial grid.
- **MAC / max pooling**: take the per-channel maximum; **R-MAC** aggregates max-pooled descriptors over a set of image regions for some translation tolerance.
- **GeM (generalized mean) pooling** interpolates between the two with a learnable exponent $p$:

$$
f_c = \left( \frac{1}{|\mathcal{X}_c|} \sum_{x \in \mathcal{X}_c} x^{\,p} \right)^{1/p}
$$

  where $\mathcal{X}_c$ is the set of activations in channel $c$. Setting $p = 1$ gives average pooling and $p \to \infty$ gives max pooling; in practice a learned $p \approx 3$ works well (Radenović et al.).
- **NetVLAD** (Arandjelović et al., 2016) is a differentiable version of VLAD: each local descriptor $\mathbf{x}_i$ is *softly* assigned to $K$ learned cluster centres $\mathbf{c}_k$, and the residuals are accumulated per cluster:

$$
V(j,k) = \sum_i \bar{a}_k(\mathbf{x}_i)\,\big(x_i^{(j)} - c_k^{(j)}\big)
$$

  where $\bar{a}_k$ is a softmax over cluster similarities. The matrix $V$ is intra-normalized, flattened, and L2-normalized.

The resulting descriptor is typically compressed with **PCA + whitening** to a few hundred dimensions, and images are compared with cosine/L2 distance.

## Training: metric learning

The embedding is trained with a ranking objective rather than a classification loss. The classic choice is the **triplet loss** over an anchor $a$, a positive $p$ (same place), and a negative $n$ (different place):

$$
L = \max\big(0,\; m + d(f_a, f_p) - d(f_a, f_n)\big)
$$

which pushes the positive at least a margin $m$ closer to the anchor than the negative. Supervision comes cheaply:

- **Weak GPS supervision** (NetVLAD): geotagged street-view panoramas provide potential positives; the network picks the best-matching one, and hard negatives are mined from far-away locations.
- **SfM-based supervision** (GeM): 3D reconstructions from structure-from-motion define which images truly co-observe a scene, giving clean positives/negatives without human labels.

## Global retrieval + local reranking

A global descriptor alone can confuse visually similar but distinct places (perceptual aliasing). Modern pipelines therefore use a **two-stage** design:

1. **Retrieve** the top-$k$ database images by global descriptor distance (fast, scalable).
2. **Rerank / verify** candidates with local feature matching and geometric verification (e.g., RANSAC over an epipolar or PnP model).

DELF/DELG couple both stages in one network (attention-selected deep local features plus a global head); **HF-Net** distills a global retrieval head and SuperPoint-style local features into a single network for **hierarchical localization** — the pattern used in the `hloc` toolbox and in large-scale visual relocalization systems. Patch-NetVLAD instead reranks with multi-scale NetVLAD descriptors of image patches.

## Why it matters for SLAM

Loop closure detection and relocalization are retrieval problems: given the current frame, find previously mapped frames showing the same place. Classical BoW (DBoW2) works well when appearance is stable, but degrades badly under day-night, seasonal, or weather changes because it is built on hand-crafted local descriptors. Learned global descriptors are trained precisely to be invariant to such condition changes, and they produce a single compact vector per keyframe — cheap to store in a keyframe database and fast to search. Understanding the retrieve-then-verify structure also explains the architecture of modern relocalization stacks (HF-Net/hloc, Patch-NetVLAD) and of collaborative SLAM systems that must match places across robots.

## Related

- [Bag of Visual Words](bag-of-visual-words.md)
- [NetVLAD](../level-05-deep-learning/netvlad.md)
- [HF-Net](../level-05-deep-learning/hf-net.md)
- [Patch NetVLAD](../level-05-deep-learning/patch-netvlad.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
