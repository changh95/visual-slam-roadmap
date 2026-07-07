# FLANN (Fast Library for Approximate Nearest Neighbours)

**FLANN** (Muja & Lowe, 2009) is a library for *approximate* nearest-neighbour search in high-dimensional spaces, built to make large-scale descriptor matching practical. Exact brute-force matching costs $O(n \cdot m \cdot d)$ for $n$ query and $m$ database descriptors of dimension $d$, and exact tree search collapses to nearly linear scan in high dimensions. FLANN's position is pragmatic: accept finding the true nearest neighbour only, say, 95% of the time in exchange for one or two orders of magnitude speed-up — a trade that feature matching tolerates well, since downstream ratio tests and RANSAC discard bad matches anyway.

## The two core index structures

**Randomized kd-tree forest.** Instead of one kd-tree searched exhaustively, FLANN builds several trees whose split dimensions are chosen *randomly among the few dimensions of highest variance*. All trees are searched simultaneously through a single shared priority queue ordered by distance to the splitting boundary, and the search stops after a fixed budget of leaf checks. Because each tree partitions the space differently, the true neighbour that falls on the wrong side of a split in one tree is usually found in another. This is the method of choice for float descriptors (SIFT's 128-D, SuperPoint's 256-D).

**Priority search k-means tree.** The data is recursively partitioned with k-means into $K$ clusters per node (branching factor), building a hierarchy that respects the natural clustering of the data rather than axis-aligned cuts. Queries descend to the closest cluster and backtrack through a priority queue of unexplored branches. This often wins when higher precision is required.

For **binary descriptors** (ORB, BRIEF), FLANN provides a multi-probe **LSH** index instead — Hamming space has no meaningful axis-aligned splits, but bit-sampling hash functions are naturally locality-sensitive there.

## Automatic algorithm configuration

FLANN's signature feature is picking the algorithm *for you*: given a dataset, a target search precision (fraction of true nearest neighbours returned), and weights expressing how much you care about build time and memory versus query time, it cross-validates on a sample of the data and returns the best index type and parameters (number of trees, branching factor, leaf-check budget). This matters because the optimal structure genuinely depends on the data distribution and the required precision — there is no single winner.

## The knobs that matter

Whether tuned automatically or by hand, FLANN's behaviour comes down to a few parameters:

- **Number of trees** (randomized kd-forest): more trees raise recall per leaf-check budget at the cost of memory and build time; a handful of trees is typical.
- **`checks`** — the budget of leaf visits per query: the single most direct accuracy/speed dial at search time. More checks asymptotically approach exact search.
- **Branching factor and iterations** (k-means tree): coarser vs. finer hierarchies, and how hard k-means works during the build.
- **Target precision** (auto-tuned mode): the fraction of queries whose *true* nearest neighbour must be returned; FLANN searches the parameter space to meet it at minimum cost.

A useful mental model: the index defines *which* candidates get examined, and `checks` defines *how many* — accuracy failures show up not as wrong distances but as a correct neighbour that was simply never visited.

## Use in a matching pipeline

A typical SLAM/SfM matching stage with FLANN:

1. Build an index over the descriptors of the reference image (or the map's landmark descriptors).
2. For each query descriptor, retrieve the 2 approximate nearest neighbours.
3. Apply **Lowe's ratio test** — accept only if $d_1 / d_2 < 0.8$ — to discard ambiguous matches.
4. Feed surviving matches to geometric verification (RANSAC on an essential matrix or PnP model).

In OpenCV this is `cv::FlannBasedMatcher`, the drop-in alternative to `cv::BFMatcher`; note that for ORB it must be configured with the LSH index, since the default kd-tree assumes float descriptors. Approximation adds one caveat: the ratio test compares *approximate* first and second neighbours, so aggressive speed settings slightly change which matches survive.

## Why it matters for SLAM

Matching cost scales with map size, and SLAM systems match constantly: feature-to-map tracking, loop-closure candidate verification, relocalization against thousands of keyframes, and offline SfM matching across image collections (COLMAP uses FLANN-style approximate search). Brute force is fine for two images with a few thousand ORB features (Hamming + `popcount` is very fast), but against a large map or a large vocabulary, sub-linear approximate search is what keeps the front-end real-time. FLANN is also the standard answer for nearest-neighbour queries on 3D point clouds (via its integration in PCL), where kd-trees operate in their low-dimensional comfort zone — e.g., correspondence search inside ICP.

## Related

- [Kd-Tree](kd-tree.md)
- [LSH](lsh.md)
- [Brute-force matching](brute-force-matching.md)
- [OpenCV](opencv.md)
- [ICP](../level-04-rgbd-slam/icp.md)
