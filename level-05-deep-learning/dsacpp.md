# DSAC++

> Brachmann 2018 · [Paper](https://arxiv.org/abs/1711.10228)

**One-line summary** — "Learning less is more": strips the DSAC pipeline down to a single learnable component — an FCN regressing scene coordinates — scored by a parameter-free soft inlier count, and shows it can be trained from RGB images and ground-truth poses alone, discovering scene geometry without any 3D model.

## Problem

DSAC had three shortcomings. Its scoring CNN overfits — it memorizes *where* reprojection errors occur in the image, a pattern that does not generalize to unseen views. Its initialization requires scene coordinate ground truth from RGB-D data or a 3D scene model, which may not exist (especially outdoors, where reconstructions demand tedious parameter search). And its end-to-end training was unstable because pose-refinement gradients were computed by finite differences, giving high gradient variance. DSAC++ asks whether learning a *single* component of the localization pipeline suffices — and whether it can be learned from camera poses alone.

## Method & architecture

The DSAC-style pipeline is kept — scene coordinate regression, hypothesis sampling via PnP from 4-tuples, probabilistic selection, refinement — but with only one learnable component:

- **Fully convolutional coordinate network** (VGG-style, ~30M params): maps a 640x480 image to 80x60 scene coordinates $\mathbf{y}_i(\mathbf{w})$ with 41x41 px receptive fields — dense predictions reusing computation, unlike DSAC's independent patches.
- **Soft inlier count replaces the Score CNN**: hypothesis consensus is a sigmoid-smoothed inlier count over reprojection errors $r_i(\mathbf{h},\mathbf{w})=\lVert C\mathbf{h}^{-1}\mathbf{y}_i(\mathbf{w})-\mathbf{p}_i\rVert$:

$$s(\mathbf{h})=\sum_i \mathrm{sig}\left(\tau-\beta\, r_i(\mathbf{h},\mathbf{w})\right)$$

  A hypothesis $j$ is selected via the softmax $P(j;\mathbf{w},\alpha) \propto \exp(\alpha\, s(\mathbf{h}_j(\mathbf{w})))$, where $\alpha$ is auto-tuned by gradient descent on $|S(\alpha)-S^{*}|$, with $S(\alpha)$ the Shannon entropy of $P$ — keeping the distribution broad so end-to-end training stays stable instead of collapsing.
- **Three-step training**: (1) *initialize* coordinates on targets $\mathbf{y}^{*}$ — rendered from a 3D model if available, otherwise the constant-depth heuristic $\mathbf{y}_i^{*} \approx \mathbf{h}^{*}(\frac{d x_i}{f}, \frac{d y_i}{f}, d, 1)^T$ that merely disentangles camera views; (2) *optimize reprojection error* against ground-truth poses, $\tilde{\mathbf{w}}=\arg\min_{\mathbf{w}}\sum_i r_i(\mathbf{h}^{*},\mathbf{w})$ — single-view constraints from which the network recovers true depth, i.e. discovers scene geometry with no 3D model; (3) *end-to-end*, minimizing the expected pose loss $\mathbb{E}_{j\sim P}[\ell(\mathbf{R}(\mathbf{h}_j(\mathbf{w})),\mathbf{h}^{*})]$ as in DSAC.
- **Analytic refinement gradients**: refinement is Gauss-Newton on inlier reprojection errors, $\mathbf{R}^{t+1}=\mathbf{R}^{t}-(J_{\mathbf{r}}^{T}J_{\mathbf{r}})^{-1}J_{\mathbf{r}}^{T}\mathbf{r}(\mathbf{R}^{t},\mathbf{w})$, and its gradient is approximated by linearizing around the optimum $\mathbf{h}_\mathrm{O}$: $\frac{\partial}{\partial\mathbf{w}}\mathbf{R}(\mathbf{h})\approx-(J_{\mathbf{r}}^{T}J_{\mathbf{r}})^{-1}J_{\mathbf{r}}^{T}\frac{\partial}{\partial\mathbf{w}}\mathbf{r}(\mathbf{h}_{\mathrm{O}},\mathbf{w})$ — replacing DSAC's unstable finite differences.

## Results

- **7Scenes** (% frames within 5 cm / 5 deg, complete set): **76.1%** with a 3D model — +13.6% over DSAC trained on RGB-D; DSAC trained from a rendered model drops another 6.6%, so DSAC++ *without any 3D model* (60.4%) still beats model-trained DSAC by 4.5%.
- **12Scenes**: 96.4% with a 16.7% margin over DSAC; 60.9% without a 3D model, comparable to a SIFT+PnP baseline.
- **Median errors**: e.g. 7Scenes Chess 0.02 m / 0.5 deg; Cambridge King's College 0.18 m / 0.3 deg, Great Court 0.40 m / 0.2 deg — roughly 10x better than the PoseNet variants on many scenes and about 2x better than feature-based Active Search; without a 3D model it still surpasses most model-based competitors (e.g. King's College 0.23 m / 0.4 deg). Like DSAC, it fails on the order-of-magnitude larger Cambridge Street scene.
- **Ablation**: swapping only DSAC's scoring CNN for the soft inlier count lifts 7Scenes 55.9% to 58.9% (Heads +19%, Stairs +8%) and 12Scenes 79.7% to 89.6% — score *regression* generalizes poorly, coordinate regression well.

## Why it matters for SLAM

DSAC++ removed the biggest practical barrier to scene coordinate regression — the need for 3D ground truth — making the approach compatible with the output of any SLAM/SfM system that provides poses. Its recipe (single FCN + classical geometric solving, soft inlier scoring, analytic Gauss-Newton gradients, reprojection-based self-supervision) became the template adopted by DSAC\* and the ACE family, and it demonstrated early that an implicit neural scene map can be discovered from single-view reprojection constraints alone — an idea that reappears throughout neural mapping.

## Related

- [DSAC](dsac.md) — the original differentiable-RANSAC formulation
- [DSAC\*](dsac-star.md) — unified and further improved framework (TPAMI)
- [ACE](ace.md) — accelerates SCR training from hours to minutes
- [ACE Zero](ace-zero.md) — removes even the pose supervision, learning maps from scratch
- [PoseNet](posenet.md) — the absolute pose regression approach SCR outperforms
