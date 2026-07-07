# SIFT

**SIFT (Scale-Invariant Feature Transform)**, published by David Lowe in 2004, is the landmark algorithm for scale- and rotation-invariant local features. It defined the detector + descriptor template that ORB, AKAZE, SuperPoint and others still follow, and remains a gold standard for matching accuracy (e.g., in COLMAP-style offline reconstruction).

## Keypoint detection: blobs in scale space

SIFT detects **blobs** rather than corners, and does so across scales so the same world structure is found whether it appears large or small in the image. A Gaussian **scale space** is built by convolving the image with Gaussians of increasing scale $\sigma$:

$$
L(x, y, \sigma) = G(x, y, \sigma) * I(x, y)
$$

The **Difference of Gaussians (DoG)** between neighboring scales approximates the scale-normalized Laplacian of Gaussian (a blob detector) at a fraction of the cost:

$$
D(x, y, \sigma) = L(x, y, k\sigma) - L(x, y, \sigma)
$$

The scale space is organized into **octaves** (image downsampled by 2 between octaves) with several scales per octave — an image pyramid with multiple blur levels per pyramid level.

Keypoints are local **extrema of $D$ in both space and scale**: each sample is compared to its 26 neighbors in the $3 \times 3 \times 3$ cube spanning $(x, y, \sigma)$. Candidates are then:

1. **Refined to sub-pixel/sub-scale accuracy** by fitting a quadratic (second-order Taylor expansion of $D$) around the extremum;
2. **Filtered by contrast** — extrema with small $|D|$ are unstable and discarded;
3. **Filtered by edge response** — DoG responds strongly along edges, where localization is poor. Like the Harris test, the ratio of principal curvatures (eigenvalues of the $2 \times 2$ Hessian of $D$) is thresholded to keep only blob-like, well-localized points.

## Descriptor: 128-D gradient histograms

- **Orientation assignment**: a histogram of gradient orientations in the keypoint's neighborhood (weighted by gradient magnitude and a Gaussian window) is built, and the dominant peak defines the keypoint's canonical orientation. All descriptor measurements are made relative to it — this provides rotation invariance.
- **Descriptor**: the region around the keypoint (at its detected scale) is divided into a $4 \times 4$ grid of subregions; each accumulates an 8-bin histogram of gradient orientations, giving a $4 \times 4 \times 8 = 128$-dimensional vector. The vector is normalized (with clamping of large components and renormalization) for illumination invariance.

## Matching

SIFT descriptors are floating-point vectors compared with **L2 distance**. Ambiguous matches are filtered with **Lowe's ratio test**: accept the nearest neighbor only if $d_1 / d_2 < 0.8$, where $d_1, d_2$ are the distances to the first and second nearest neighbors. For large databases, approximate nearest-neighbor structures (kd-trees, FLANN) replace brute force — SIFT's 128 dimensions are near the practical limit for kd-trees.

## Cost

SIFT is highly accurate but slow — on the order of a second per high-resolution image on CPU — which is why real-time SLAM historically adopted FAST/ORB instead, and why GPU implementations or binary alternatives are used when SIFT-level robustness is needed online.

## Why it matters for SLAM

- **Scale invariance** is essential when a camera approaches or retreats from structure — matching survives large depth changes where fixed-scale corners fail.
- SIFT's pipeline (scale-space detection, orientation assignment, gradient-histogram descriptor, ratio-test matching) is the conceptual blueprint for every feature system used in SLAM; ORB is best understood as a real-time approximation of it.
- Offline mapping and structure-from-motion (e.g., COLMAP) still default to SIFT for maximum matching quality; visual place recognition historically built bag-of-visual-words vocabularies from SIFT descriptors.

## Related

- [Gaussian blur](../level-01-beginner/gaussian-blur.md)
- [Image pyramid](image-pyramid.md)
- [ORB](orb.md)
- [Brute-force matching](brute-force-matching.md)
- [Corner detector](../level-01-beginner/corner-detector.md)
