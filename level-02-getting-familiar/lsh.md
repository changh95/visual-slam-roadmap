# LSH (Locality-Sensitive Hashing)

Locality-Sensitive Hashing (LSH) is an approximate nearest-neighbour search technique built on a simple idea: hash descriptors so that **similar descriptors collide** (land in the same bucket) with high probability, while dissimilar ones collide with low probability. A query then only needs to compare against the few candidates in its bucket instead of the whole database.

## The locality-sensitive property

A family of hash functions $\mathcal{H}$ is called $(r, cr, p_1, p_2)$-sensitive for a distance $d(\cdot,\cdot)$ if for any two points $\mathbf{p}, \mathbf{q}$:

- if $d(\mathbf{p}, \mathbf{q}) \leq r$ then $\Pr[h(\mathbf{p}) = h(\mathbf{q})] \geq p_1$,
- if $d(\mathbf{p}, \mathbf{q}) \geq cr$ then $\Pr[h(\mathbf{p}) = h(\mathbf{q})] \leq p_2$,

with $p_1 > p_2$ and $c > 1$. In words: close points are likely to collide, far points are unlikely to.

For **binary descriptors** under Hamming distance (ORB, BRIEF, AKAZE's MLDB), the natural family is **bit sampling**: $h(\mathbf{x}) = x_i$ for a randomly chosen bit position $i$. Two descriptors of length $n$ differing in $d_H$ bits then collide with probability

$$
\Pr[h(\mathbf{p}) = h(\mathbf{q})] = 1 - \frac{d_H(\mathbf{p}, \mathbf{q})}{n}
$$

which decreases exactly with distance — the locality-sensitive property for free.

## Amplification: k bits, L tables

A single random bit is a very weak hash, so LSH amplifies it in two directions:

- **Concatenation (AND)**: build each table's key from $k$ hash functions, $g(\mathbf{x}) = (h_1(\mathbf{x}), \dots, h_k(\mathbf{x}))$. The collision probability for one table becomes $(1 - d_H/n)^k$ — larger $k$ makes buckets smaller and more selective, reducing false positives.
- **Multiple tables (OR)**: build $L$ independent tables and probe all of them. The probability that true neighbours collide in **at least one** table is

$$
P = 1 - \left(1 - \left(1 - \frac{d_H}{n}\right)^{k}\right)^{L}
$$

Tuning $k$ and $L$ trades accuracy against speed and memory: selective keys (large $k$) need many tables (large $L$) to keep recall up.

## Multi-probe LSH

Standard LSH needs many hash tables to achieve good recall, which is memory-hungry. **Multi-probe LSH** observes that if a true neighbour missed the query's bucket, it most likely landed in a **nearby** bucket — one whose key differs in only a few positions. Instead of adding more tables, a multi-probe query generates a *probing sequence* of perturbed keys (flip one bit of the key, then two, ...) ordered by their likelihood of holding neighbours, and inspects those extra buckets in the same table. This achieves similar recall with several times fewer tables, at the cost of more probes per query. OpenCV's FLANN-based LSH index exposes exactly these knobs: number of tables, key size $k$, and multi-probe level.

## Why it matters for SLAM

Feature-based SLAM systems generate thousands of binary descriptors per frame and must match them against maps or keyframe databases containing millions. [Brute-force matching](brute-force-matching.md) is exact but scales as $O(nm)$; [kd-trees](kd-tree.md) degrade badly for high-dimensional binary data. LSH is the standard answer for binary descriptors — it is what [FLANN](flann.md) selects for ORB/BRIEF data — and it powers fast relocalization and loop-closure candidate retrieval where a query descriptor set must be matched against a large map in milliseconds. Understanding the $k$/$L$/multi-probe trade-off lets you tune recall vs. latency for your platform.

## Related

- [FLANN](flann.md)
- [Kd-tree](kd-tree.md)
- [Brute-force matching](brute-force-matching.md)
- [ORB](orb.md)
- [HBST](hbst.md)
