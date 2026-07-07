# Kd-Tree

A **kd-tree** (k-dimensional tree, Bentley 1975) is a binary space-partitioning structure for points in $\mathbb{R}^d$ that makes nearest-neighbour queries sub-linear on average. It is the default answer to "find the closest point(s)" in low-dimensional geometric data — 3D point clouds above all — and, in randomized-forest form, a practical tool for approximate matching of high-dimensional float descriptors.

## Construction

Each internal node splits the point set with an axis-aligned hyperplane:

1. Choose a **splitting dimension** — classically cycling through dimensions by depth ($x, y, z, x, \dots$), or better, the dimension of largest variance/spread of the points in the node.
2. Choose the **splitting value** — typically the median coordinate, which guarantees a balanced tree of depth $O(\log n)$.
3. Recurse on the two halves until nodes hold fewer than a leaf-size threshold of points.

Building costs $O(n \log n)$ with median-of-medians or presorting; the tree stores each point once.

## Nearest-neighbour search

A query $\mathbf{q}$ first descends to the leaf containing it ($O(\log n)$ comparisons) and takes the best point found there as the current candidate with distance $r_{\text{best}}$. Then the search **backtracks**: at each node on the way up, the *other* subtree must be visited only if the splitting plane is closer than the current best, i.e., if

$$
|q_k - s| < r_{\text{best}}
$$

where $q_k$ is the query's coordinate in the node's split dimension $k$ and $s$ the split value — geometrically, only if the hypersphere of radius $r_{\text{best}}$ around $\mathbf{q}$ crosses the plane. Otherwise the whole subtree is pruned. The same scheme yields k-nearest-neighbour queries (keep a heap of the best $k$) and radius searches.

In low dimensions ($d \lesssim 10$), pruning is effective and the average query cost is $O(\log n)$.

## The curse of dimensionality

As $d$ grows, distances concentrate — the nearest and farthest neighbours become relatively similar in distance — and the pruning sphere intersects almost every splitting plane, so the search degenerates toward a full linear scan while paying tree-traversal overhead. As a rule of thumb, exact kd-tree search needs $n \gg 2^d$ to beat brute force; SIFT's 128 dimensions are far beyond the exact-search regime. Two remedies define modern practice:

- **Best-bin-first (BBF)** (Beis & Lowe, 1997): explore nodes in order of their distance to the query using a priority queue, and *stop after a fixed budget* of leaf examinations, returning the best candidate found. This turns the kd-tree into an approximate method with a tunable accuracy/speed dial — introduced precisely for SIFT matching.
- **Randomized kd-tree forests**: build several trees with randomized split-dimension choices (among the top-variance dimensions) and search them through one shared priority queue; a neighbour "hidden" behind a bad split in one tree is found via another. This is one of FLANN's core indexes.

Note that kd-trees compare raw vectors under L2 — for binary descriptors under Hamming distance, LSH or HBST are the appropriate structures.

## Where kd-trees appear in SLAM

- **ICP and point-cloud registration**: the correspondence step — nearest model point for every scene point, every iteration — is a batch of 3D NN queries; PCL, Open3D, and libpointmatcher all use kd-trees (FAST-LIO2 builds an incrementally-updatable variant, ikd-Tree, to avoid rebuilding as the map grows).
- **Descriptor matching**: approximate NN over SIFT/SuperPoint-style descriptors in SfM and relocalization pipelines (via FLANN).
- **Map queries**: radius searches for local map extraction, normal estimation neighbourhoods, keyframe position lookups, and mesh/surfel neighbour searches.

## Why it matters for SLAM

Nearest-neighbour search is one of the most-executed primitives in a SLAM system — inside every ICP iteration of a LiDAR or RGB-D pipeline, inside every matching stage of a feature pipeline, inside mapping operations like normal estimation and downsampling. Knowing the kd-tree's mechanics tells you when it is the right tool (3D points: superb; 128-D descriptors: only in approximate/forest form; binary descriptors: wrong tool) and explains the design of the libraries built on top of it (FLANN's indexes, PCL's search module, ikd-Tree). It is also a recurring systems bottleneck: rebuild-vs-update strategies for a growing map directly shape the architecture of real-time LiDAR odometry.

## Related

- [FLANN](flann.md)
- [Brute-force matching](brute-force-matching.md)
- [LSH](lsh.md)
- [Point cloud](point-cloud.md)
- [ICP](../level-04-rgbd-slam/icp.md)
