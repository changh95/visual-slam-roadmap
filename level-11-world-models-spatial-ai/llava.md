# LLaVA

> Liu 2023 · [Paper](https://arxiv.org/abs/2304.08485)

**One-line summary** — LLaVA (Large Language and Vision Assistant) connects a frozen CLIP vision encoder to the Vicuna LLM through a single linear projection and instruction-tunes on GPT-4-generated visual instruction data, showing that data quality — not architectural complexity — is the key to a strong open-source conversational VLM.

## Problem

Instruction tuning LLMs on machine-generated instruction-following data had dramatically improved zero-shot capabilities on new language tasks, but the idea was largely unexplored in the multimodal field. VLMs of the time either demanded massive compute (Flamingo), used intricate bridging architectures (BLIP-2's Q-Former, Flamingo's gated cross-attention), or were closed (GPT-4V) — and manually labeling multimodal conversation data at scale is expensive and ill-defined. LLaVA asks whether a *minimal* architecture plus *machine-generated* multimodal instruction data can yield a competitive, reproducible open VLM.

## Method & architecture

- **GPT-assisted data generation**: language-only GPT-4 is prompted with two *symbolic* representations of a COCO image — its captions and object bounding-box coordinates — and asked to produce three response types: multi-turn **conversation** (58K), **detailed description** (23K), and **complex reasoning** (77K), totaling 158K language-image instruction-following samples. A few manually designed seed examples for in-context learning are the only human annotations.
- **Architecture**: input image $\mathbf{X}_v$ passes through the pre-trained CLIP ViT-L/14 encoder $g(\cdot)$ (grid features before the last Transformer layer), and one trainable projection matrix $\mathbf{W}$ maps the features into the word-embedding space of the Vicuna LLM $f_{\boldsymbol{\phi}}$:

$$\mathbf{H}_v = \mathbf{W} \cdot \mathbf{Z}_v, \quad \text{with } \mathbf{Z}_v = g(\mathbf{X}_v)$$

  The visual tokens $\mathbf{H}_v$ are simply placed in the LLM's context alongside text — no Q-Former, no cross-attention module.
- **Training objective**: multi-turn data $(\mathbf{X}_q^1, \mathbf{X}_a^1, \dots, \mathbf{X}_q^T, \mathbf{X}_a^T)$ is serialized into a single sequence and the model is trained auto-regressively on the assistant tokens only:

$$p(\mathbf{X}_a \mid \mathbf{X}_v, \mathbf{X}_{\text{instruct}}) = \prod_{i=1}^{L} p_{\boldsymbol{\theta}}\big(x_i \mid \mathbf{X}_v, \mathbf{X}_{\text{instruct},<i}, \mathbf{X}_{a,<i}\big)$$

  where $\mathbf{X}_{\text{instruct},<i}$ and $\mathbf{X}_{a,<i}$ are instruction and answer tokens before the current prediction token $x_i$.
- **Two-stage training**: **Stage 1 (feature alignment)** — CC3M filtered to 595K image-text pairs, treated as naive single-turn instructions; both backbones frozen, only $\boldsymbol{\theta} = \mathbf{W}$ trained (1 epoch, lr 2e-3, batch 128) — effectively learning a visual tokenizer for the frozen LLM. **Stage 2 (end-to-end fine-tuning)** — vision encoder stays frozen; $\boldsymbol{\theta} = \{\mathbf{W}, \boldsymbol{\phi}\}$ trained on the 158K instruction set (3 epochs, lr 2e-5, batch 32) on 8×A100.
- **Evaluation protocol**: GPT-4 judges candidate answers against reference answers produced by text-only GPT-4 given ground-truth descriptions, yielding a relative score — the basis of the LLaVA-Bench (COCO) and LLaVA-Bench (In-the-Wild) benchmarks introduced by the paper.

## Results

- **LLaVA-Bench (COCO)** (90 questions): full-data LLaVA scores **85.1%** relative to text-only GPT-4; removing instruction tuning collapses the score to 21.5 (−63.6), and conversation-only training gives 73.8 — data mix matters.
- **LLaVA-Bench (In-the-Wild)** (24 images, 60 questions): LLaVA reaches **67.3 ± 2.0** overall vs BLIP-2's 38.1 ± 1.0 (+29%) and OpenFlamingo's 19.1 ± 0.4 (+48%), with 81.7 on complex reasoning.
- **ScienceQA**: LLaVA alone achieves **90.92%** accuracy (close to the then-SoTA MM-CoT-Large at 91.68%); using GPT-4 as a judge to arbitrate disagreements yields a new SoTA of **92.53%**. Two-shot text-only GPT-4 alone gets 82.69%.
- **Ablations**: training from scratch without Stage 1 drops accuracy by 5.11 points to 85.81%; a 7B model scores 89.84% vs 90.92% for 13B; last-layer CLIP features score 0.96 lower than penultimate-layer features.
- Qualitatively, LLaVA follows instructions on out-of-domain images (e.g., the "Extreme Ironing" GPT-4 demo) where BLIP-2 and OpenFlamingo merely describe the scene.

## Why it matters for SLAM

LLaVA democratized conversational vision-language models: the "encoder + projection + LLM" recipe underlies most robotics VLMs and vision-language-action systems that followed (including navigation VLAs such as NaVILA, whose VILA backbone follows the same pattern, and OpenVLA's Prismatic backbone, trained on the LLaVA-1.5 data mixture). For SLAM, a LLaVA-style VLM attached to rendered views of a map provides scene understanding, object identification, and spatial question answering — one of the most direct integration paths from a geometric SLAM map to open-vocabulary semantic reasoning.

## Related

- [CLIP](clip.md)
- [BLIP-2](blip-2.md)
- [SigLIP](siglip.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [OpenVLA](openvla.md)
