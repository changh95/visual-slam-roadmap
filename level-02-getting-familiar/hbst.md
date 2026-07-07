# HBST (Hamming Binary Search Tree)

**HBST** (Schlegel & Grisetti, 2018) is a binary search tree for *binary descriptors* (ORB, BRIEF, BRISK, FREAK) that answers approximate nearest-neighbour queries in Hamming space at logarithmic cost, and — crucially for SLAM — supports **incremental insertion while searching**. It was proposed as a lightweight, vocabulary-free alternative to bag-of-visual-words (DBoW2) and FLANN-LSH for loop closure detection: instead of quantizing descriptors against a pre-trained vocabulary, it indexes the raw descriptors of the trajectory as they arrive.

## How the tree is built

A binary descriptor is a fixed-length bit string $\mathbf{d} \in \{0,1\}^D$ (e.g., $D = 256$ for ORB) compared with the Hamming distance — the number of differing bits, computed with `XOR` + `popcount`.

- Each **internal node** stores a single bit index $k \in \{0, \dots, D-1\}$. A descriptor is routed left if its bit $k$ is 0 and right if it is 1.
- Each **leaf** stores a set of descriptors (with payloads — in SLAM, the image/keyframe index and keypoint that the descriptor came from).
- When a leaf exceeds a maximum size, it is **split**: a splitting bit is selected for the descriptors it holds, and they are redistributed into two children.

The splitting bit is chosen for balance: compute the mean value $\bar{d}_k$ of every candidate bit over the descriptors in the leaf and pick the bit whose mean is closest to $0.5$ — the bit that partitions the set most evenly. A balanced tree over $N$ descriptors then has depth around $\log_2 N$, and each query touches one root-to-leaf path.

## Search — and why it is approximate

A query descriptor $\mathbf{q}$ descends the tree by reading its own bits at each node's index ($h$ bit tests for depth $h$), lands in a single leaf, and is matched **exhaustively by Hamming distance against only that leaf's descriptors** (accepting matches below a distance threshold $\tau$). Total cost is $O(\log N + L)$ for leaf size $L$, versus $O(N)$ for brute force.

The price is approximation: a true match whose descriptor differs from the query *in one of the bits used for splitting* is routed to a different leaf and missed. The probability of this grows with tree depth and with descriptor noise. HBST accepts this because place recognition does not need every match — it needs *enough* consistent matches to vote for the right keyframe, and geometric verification cleans up afterwards.

## Incremental search-and-insert

The operation that makes HBST fit SLAM's online setting: for each new image, its descriptors are dropped down the tree once, and in the same pass the tree (1) reports matches against everything indexed so far and (2) inserts the new descriptors (splitting leaves that overflow). The database grows with the trajectory with no offline training phase, no vocabulary file, and no periodic rebuild. Matches are aggregated per past image — each matched descriptor casts a vote for the keyframe it belongs to — and keyframes with high vote counts become loop closure candidates, which are then verified geometrically (e.g., essential matrix or PnP within RANSAC).

Summarizing the costs for a database of $N$ descriptors with maximum leaf size $L$:

- **Insertion**: one root-to-leaf descent, $O(\log N)$, plus an occasional leaf split.
- **Query**: $O(\log N)$ bit tests + $O(L)$ Hamming comparisons in the leaf.
- **Memory**: the raw descriptors plus one bit index per internal node — no hash tables, no vocabulary.
- **Knobs**: maximum leaf size $L$ (deeper tree and faster leaves vs. better recall) and the matching threshold $\tau$.

## Where it sits among its alternatives

- **Brute-force matching** is exact but linear in database size — fine for two frames, hopeless against thousands of keyframes.
- **BoW (DBoW2/DBoW3)** needs a pre-trained vocabulary; quantization loses descriptor detail, but the inverted index is extremely fast and memory-lean.
- **FLANN-LSH** also handles binary descriptors incrementally, but with multiple hash tables and higher memory/latency in typical loop-closure workloads.
- **HBST** trades a controlled amount of recall for direct descriptor-level matching (keypoint correspondences come out for free, ready for geometric verification) with very fast queries and no training.

## Why it matters for SLAM

Loop closure detection must query "have I seen this before?" against an ever-growing database, every few frames, within a real-time budget. HBST is a clean, self-contained answer for feature-based systems that already compute binary descriptors: no vocabulary shipping (a DBoW2 ORB vocabulary is a large binary artifact), image-level *and* keypoint-level correspondences from a single structure, and logarithmic growth in query time along the trajectory. It is also an instructive case study in the accuracy-speed trade-offs of indexing Hamming space — comparing it with LSH and BoW sharpens your understanding of all three.

## Related

- [LSH](lsh.md)
- [Bag of Visual Words](bag-of-visual-words.md)
- [Brute-force matching](brute-force-matching.md)
- [ORB](orb.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
