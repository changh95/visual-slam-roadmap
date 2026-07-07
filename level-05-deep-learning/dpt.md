# DPT

> Ranftl 2021 · [Paper](https://arxiv.org/abs/2103.13413)

**One-line summary** — Replaces the CNN backbone with a Vision Transformer for dense prediction (depth, segmentation), exploiting global self-attention at every layer to produce globally coherent depth maps.

## Problem

Fully-convolutional networks dominate dense prediction, but their encoders progressively downsample: feature resolution and granularity lost in the deeper stages are hard to recover in the decoder, and individual convolutions have limited receptive fields, so broad context is only acquired late in very deep stacks. For pixel-level tasks like monocular depth this causes locally inconsistent, globally wobbly predictions. DPT asks whether a Vision Transformer backbone — constant representation resolution, global receptive field at every stage — yields finer-grained and more globally coherent dense predictions.

## Method & architecture

**Transformer encoder.** The image is decomposed into non-overlapping patches of $p^2$ pixels ($p=16$), each flattened and linearly projected to a token; a learnable position embedding and a special *readout token* are added, giving tokens $t^0 = \{t_0^0, \dots, t_{N_p}^0\}$, $t_n^0 \in \mathbb{R}^D$ with $N_p = \frac{HW}{p^2}$. $L$ transformer layers of multi-headed self-attention transform them into $t^l$. Because tokens correspond one-to-one with patches, spatial resolution is constant through all stages, and every token can attend to every other from the first layer. Variants: ViT-Base ($D=768$, 12 layers), ViT-Large ($D=1024$, 24 layers), and ViT-Hybrid (ResNet-50 features as tokens, 12 layers).

**Reassemble.** Tokens from four transformer depths are converted back into image-like feature maps by a three-stage operation

$$\mathrm{Reassemble}_{s}^{\hat{D}}(t) = (\mathrm{Resample}_{s} \circ \mathrm{Concatenate} \circ \mathrm{Read})(t)$$

where $\mathrm{Read}: \mathbb{R}^{(N_p+1)\times D} \rightarrow \mathbb{R}^{N_p \times D}$ folds the readout token into the patch tokens (the default projects the concatenation $\mathrm{mlp}(\mathrm{cat}(t_i, t_0))$ per token), $\mathrm{Concatenate}$ reshapes tokens to an $\frac{H}{p}\times\frac{W}{p}\times D$ map by patch position, and $\mathrm{Resample}_s$ rescales it to $\frac{H}{s}\times\frac{W}{s}\times\hat{D}$ via $1{\times}1$ projection plus (transpose-)convolution, with $\hat{D}=256$. For ViT-Large the tapped layers are $l = \{5, 12, 18, 24\}$ (assembled at lower resolution for deeper layers); ViT-Base uses $l = \{3,6,9,12\}$; ViT-Hybrid uses the two first ResNet blocks plus stages $\{9, 12\}$.

**Convolutional fusion decoder.** RefineNet-style fusion blocks with residual convolutional units progressively combine consecutive-stage feature maps, upsampling by 2 at each stage; the final representation has half the input resolution and feeds a task-specific output head. Position embeddings are linearly interpolated on the fly, so DPT handles varying image sizes like an FCN.

**Depth training recipe.** Follows the MiDaS protocol — scale- and shift-invariant trimmed loss on inverse depth plus multi-scale gradient matching — but on **MIX 6**, a ~1.4M-image meta-dataset (MIX 5 plus five additional datasets), the largest depth training set compiled at the time, trained with multi-objective (Pareto) dataset mixing for 60 epochs at $384\times 384$.

## Results

Zero-shot cross-dataset transfer (all metrics lower-is-better): DPT-Large trained on MIX 6 reaches DIW WHDR 10.82, ETH3D AbsRel 0.089, Sintel AbsRel 0.270, and $\delta > 1.25$ outlier rates 8.46 (KITTI), 8.32 (NYU), 9.97 (TUM), versus the previous-best fully-convolutional MiDaS (MIX 5): 12.46 / 0.129 / 0.327 / 23.90 / 9.55 / 14.29. Average relative improvement is 28% for DPT-Large and 23% for DPT-Hybrid; retraining the convolutional MiDaS on the same MIX 6 improves it only marginally, showing the FCN cannot exploit the extra data the way the transformer can. Fine-tuned DPT-Hybrid set new states of the art on NYUv2 ($\delta_1$ 0.904, AbsRel 0.110, RMSE 0.357) and KITTI ($\delta_1$ 0.959, AbsRel 0.062, RMSE 2.573). For semantic segmentation, DPT-Hybrid set a new state of the art on ADE20K with 49.02% mIoU and on Pascal Context after fine-tuning.

## Why it matters for SLAM

DPT made ViT encoders the default for monocular depth: DPT-Large became the backbone of MiDaS v3 and Depth Anything v1, which are the depth priors most commonly injected into monocular and dense SLAM systems. When a SLAM pipeline consumes a "relative depth network" today, it is very likely a DPT-style architecture underneath. Its globally consistent depth is exactly what dense mapping needs — locally wobbly depth maps break TSDF or surfel fusion.

## Related

- [MiDaS](midas.md) — the robust relative-depth training recipe DPT plugs into
- [MonoDepth](monodepth.md) — earlier self-supervised monocular depth lineage
- [ZoeDepth](zoedepth.md) — adds metric scale on top of relative-depth pre-training
- [Depth Anything](depth-anything.md) — foundation-scale depth model built on the DPT architecture
- [Metric3D](metric3d.md) — metric-depth line that also trains on massive mixed data
