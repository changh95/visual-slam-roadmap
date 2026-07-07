# Bag of Visual Words

**Bag of Visual Words (BoVW)** applies text-retrieval ideas to images (Sivic & Zisserman, 2003): quantize local feature descriptors into a discrete vocabulary of "visual words," describe an image as a histogram of word occurrences, and compare images by comparing histograms. It is the classical engine behind loop-closure detection and relocalization in SLAM (DBoW2 in ORB-SLAM, for example).

## Pipeline

1. **Vocabulary construction (offline).** Collect a large set of local descriptors (e.g., ORB, SIFT) from a training corpus and cluster them with k-means into $K$ cluster centers — the **visual words**. For binary descriptors, cluster centers are computed with Hamming-space medians rather than Euclidean means.
2. **Image representation.** For each new image, extract descriptors and assign each to its nearest visual word. The image becomes a $K$-dimensional histogram $\mathbf{v}$, where bin $k$ counts the keypoints assigned to word $k$. All spatial layout is discarded — hence "bag."
3. **TF-IDF weighting.** Not all words are equally informative. Each bin is weighted by term frequency times inverse document frequency:

$$v_k = \frac{n_{k,d}}{n_d} \cdot \log\frac{N}{n_k}$$

where $n_{k,d}$ is the count of word $k$ in image $d$, $n_d$ the total words in the image, $N$ the number of database images, and $n_k$ the number of database images containing word $k$. Words that appear everywhere (floor texture, foliage) get down-weighted; rare, distinctive words dominate the score.

4. **Retrieval.** Normalize the weighted histograms and score similarity — DBoW2 uses an L1-based score

$$s(\mathbf{v}_1, \mathbf{v}_2) = 1 - \frac{1}{2}\left\lVert \frac{\mathbf{v}_1}{\lVert \mathbf{v}_1 \rVert} - \frac{\mathbf{v}_2}{\lVert \mathbf{v}_2 \rVert} \right\rVert_1$$

— and return the top-scoring database images as loop-closure candidates.

## The hierarchical vocabulary tree

A flat vocabulary requires $O(K)$ distance computations to assign each descriptor, which is too slow for the $K \sim 10^5$–$10^6$ words needed for discriminative retrieval. DBoW2/DBoW3 arrange words in a **vocabulary tree** built by hierarchical k-means: $k$ branches per node, $L$ levels, giving $K = k^L$ leaf words. Assigning a descriptor walks the tree comparing against $k$ children per level — $O(kL)$, i.e., logarithmic in $K$.

Two index structures make retrieval and verification fast:

- **Inverted index**: for each word, the list of database images containing it (with weights). Scoring a query only touches images that share at least one word.
- **Direct index**: for each image, the features grouped by tree node at some intermediate level. When a candidate is retrieved, correspondences for geometric verification are found by matching only features that fall in the same node — much faster than brute-force descriptor matching.

## Practical notes

- **Vocabulary size matters**: small vocabularies make dissimilar features collide into the same word (low distinctiveness); very large ones split matching features across words (low repeatability). Retrieval systems use large vocabularies precisely because the hierarchical tree keeps assignment cheap.
- **Normalization for loop closure**: raw scores depend on scene texture richness, so systems like ORB-SLAM normalize a candidate's score by the best score among the query's covisible keyframes, turning an absolute threshold into a relative one that transfers across environments.
- **Same vocabulary everywhere**: a pre-trained, environment-independent vocabulary (e.g., the ORB vocabulary shipped with ORB-SLAM) works surprisingly well in practice, avoiding per-deployment training.

## Limitations and the verification step

BoVW throws away geometry, so two images with similar texture statistics can score high without depicting the same place (**perceptual aliasing** — corridors, brick walls). Practical loop-closure pipelines therefore treat BoVW output as *candidates only* and confirm them with geometric verification: match features, estimate an essential/fundamental matrix or PnP pose with RANSAC, and accept the loop only if enough inliers support a consistent geometry. Temporal consistency checks (requiring several consecutive matching frames) further suppress false positives. A vocabulary trained on one visual domain also transfers imperfectly to very different environments.

## Why it matters for SLAM

Odometry drifts; loop closure is what makes SLAM more than dead reckoning, and BoVW is the classical way to *find* loops in constant time regardless of map size. It also powers relocalization after tracking loss and multi-session map alignment. Even as learned global descriptors (NetVLAD and successors) replace the retrieval stage in newer systems, the BoVW architecture — quantize, weight, invert, verify — remains the reference design, and DBoW2-style vocabularies still run in many deployed systems because they are fast, compact, and CPU-only.

## Hands-on

- [Global feature detection](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_09)

## Related

- [ORB](orb.md)
- [HBST](hbst.md)
- [Deep image retrieval](deep-image-retrieval.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
- [NetVLAD](../level-05-deep-learning/netvlad.md)
