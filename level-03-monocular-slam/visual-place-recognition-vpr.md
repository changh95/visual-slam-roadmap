# Visual Place Recognition (VPR)

**Visual Place Recognition** answers one question: *has the camera been here before?* Given the current image and a database of previously visited places, VPR retrieves the most likely match — the perception half of loop closure detection. It must succeed despite viewpoint changes, lighting changes, weather, and moderate scene change, while *not* firing on distinct places that merely look alike (**perceptual aliasing** — the second identical-looking corridor is VPR's classic enemy).

The classical approach is **Bag of Visual Words (BoVW)**:

1. Offline, cluster a large collection of local descriptors (e.g. ORB) with k-means into a *visual vocabulary* of $K$ words.
2. Represent each image as a histogram over visual words, weighted by **TF-IDF** so that ubiquitous, uninformative words count less.
3. Retrieve candidates via an inverted index (word to images containing it), which makes lookup fast even with thousands of keyframes.

The TF-IDF weighting deserves to be seen explicitly. A word $k$ appearing in $n_k$ of the $N$ database images gets inverse document frequency $\mathrm{idf}_k = \log(N / n_k)$: a word present in every corridor image carries $\mathrm{idf} \approx 0$ and contributes nothing to similarity, while a rare word (a distinctive poster, an unusual corner configuration) dominates the score. Each image's weighted histogram is normalised and compared with an L1/L2 or cosine score; only images sharing at least one word with the query are even touched, thanks to the inverted index. DBoW2/DBoW3 implement this with a hierarchical vocabulary tree ($O(\log K)$ word assignment via a coarse-to-fine descent instead of $O(K)$ linear search) and are used by ORB-SLAM, VINS-Mono, and many others. FAB-MAP is the classic probabilistic formulation of the same retrieval idea.

Modern approaches replace hand-crafted histograms with **learned global descriptors**. NetVLAD's core is a differentiable generalisation of exactly the quantisation step above: instead of hard-assigning each local feature $\mathbf{x}_i$ to its nearest cluster, it soft-assigns with weights $\bar{a}_k(\mathbf{x}_i)$ and aggregates *residuals* against each cluster centre $\mathbf{c}_k$,

$$V(j, k) = \sum_i \bar{a}_k(\mathbf{x}_i)\, \left( x_i^{(j)} - c_k^{(j)} \right),$$

producing a fixed-size descriptor that is normalised and trained end-to-end with a triplet loss on GPS-tagged street-view images ("same place, different appearance" as positives). Patch-NetVLAD adds patch-level re-ranking; HF-Net predicts global and local features in one network for a full recognition-plus-localization hierarchy; and current systems increasingly use foundation-model features (e.g. DINO-based descriptors) for robustness to extreme appearance change. For repeated traverses of the same route (delivery robots, rail), sequence-based matching — scoring short *sequences* of descriptors rather than single images — buys large robustness gains for free.

Whatever produces the candidates, a SLAM system never trusts retrieval alone. The standard pipeline is: *retrieve* top-k candidates, then **geometrically verify** — match local features against the candidate, run RANSAC on an essential/PnP model, and require enough inliers (ORB-SLAM additionally requires consistency across covisible keyframes). Only verified matches become loop closure edges, because a single false positive can fold the map.

## Evaluating VPR: precision over recall

For loop closure, the two error types are wildly asymmetric. A **missed** loop (false negative) costs some drift correction — the map stays a bit bent. A **false** loop (false positive) that survives verification can destroy the map. VPR for SLAM is therefore tuned for *precision at essentially any recall cost*: it is standard to operate where the system fires on only a fraction of true revisits but almost never on a wrong one, and papers report recall @ 100% precision for exactly this reason. This is also why the multi-layer defence (retrieval score threshold → temporal/covisibility consistency over several consecutive matches → geometric verification → robust back-end) is not paranoia but the standard architecture.

## Common pitfalls

- **Vocabulary domain mismatch**: a BoVW vocabulary trained on outdoor imagery quantises indoor ORB descriptors poorly, degrading retrieval; use (or train) a vocabulary matched to your feature type and roughly to your domain.
- **Perceptual aliasing in structured environments**: offices, warehouses, parking garages, and corridors contain genuinely near-identical views; retrieval *cannot* distinguish them, so the consistency and verification layers must — never lower geometric thresholds to "get more loops" in such environments.
- **Ignoring the time dimension**: matching against very recent keyframes trivially succeeds (they look similar because they are seconds old) and is useless; systems exclude a temporal neighbourhood around the query from the database.
- **Viewpoint vs appearance robustness trade-off**: global descriptors summarising whole-image layout are robust to lighting but brittle to large viewpoint change; local-feature verification has the opposite profile. The retrieval-then-verify pipeline works because the two layers fail differently.
- **Database growth**: naive per-keyframe descriptors make retrieval cost grow with trajectory length; inverted indices and keyframe culling keep lifelong operation tractable.

## Why it matters for SLAM

VPR is what upgrades visual odometry into full SLAM: without recognising previously visited places, drift can never be corrected. The same machinery also provides relocalization after tracking loss, kidnapped-robot recovery, multi-session map merging, and inter-robot loop closures in collaborative SLAM — nearly every "global" capability of a SLAM system rests on place recognition working reliably.

## Related

- [NetVLAD](../level-05-deep-learning/netvlad.md)
- [Patch NetVLAD](../level-05-deep-learning/patch-netvlad.md)
- [HF-Net](../level-05-deep-learning/hf-net.md)
- [ORB-SLAM](orb-slam.md)
- [VO vs SLAM](vo-vs-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
