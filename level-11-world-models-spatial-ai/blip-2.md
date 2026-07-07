# BLIP-2

> Li (Salesforce) 2023 · [Paper](https://arxiv.org/abs/2301.12597)

**One-line summary** — BLIP-2 bridges a *frozen* pre-trained image encoder and a *frozen* large language model with a lightweight Querying Transformer (Q-Former), achieving strong vision-language capabilities at a fraction of the training cost of end-to-end multimodal models.

## Problem

The cost of vision-and-language pre-training had become prohibitive because it meant end-to-end training of large-scale models — every new VLM re-trained billions of visual and language parameters. Yet powerful ingredients already existed off the shelf: large pre-trained image encoders and LLMs, each excellent in its own modality. The open question was whether a small trainable module could bridge the *modality gap* — feeding visual information into an LLM that has never seen an image — without unfreezing either giant, and without the catastrophic forgetting that unfreezing causes.

## Method & architecture

**Q-Former.** The only trainable module (188M parameters, initialized from BERT-base) sits between the frozen image encoder and the frozen LLM. It has two transformer submodules sharing the same self-attention layers: an *image transformer* whose input is a fixed set of **32 learnable query embeddings** (dim 768) that cross-attend to the frozen image encoder's output features (cross-attention inserted every other block), and a *text transformer* that acts as text encoder or decoder. Whatever the input resolution, the queries compress the image to 32 output vectors $Z$ — an information bottleneck forced to extract the visual content most relevant to language.

**Stage 1 — vision-language representation learning** (frozen image encoder + Q-Former, on image-text pairs), jointly optimizing three objectives that differ only in their attention masks:
- *Image-Text Contrastive (ITC)*: align $Z$ with the [CLS] text embedding $t$; the image-text similarity is the max over queries, $s(I,T) = \max_k \langle z_k, t \rangle$, contrasted against in-batch negatives with a unimodal mask (queries and text cannot see each other).
- *Image-grounded Text Generation (ITG)*: generate the caption with a multimodal causal mask — text tokens attend to all queries, so all caption-relevant information must flow through the queries.
- *Image-Text Matching (ITM)*: binary matched/unmatched classification with a bidirectional mask and hard negative mining.

**Stage 2 — generative learning from a frozen LLM.** A single fully-connected layer projects $Z$ to the LLM's embedding dimension; the projected queries are prepended to the text as *soft visual prompts*. Decoder LLMs (OPT 2.7B/6.7B) are trained with a language-modeling loss; encoder-decoder LLMs (FlanT5-XL/XXL) with a prefix-LM loss. Because stage 1 already made $Z$ language-informative, the LLM's burden of learning alignment is small, mitigating catastrophic forgetting.

**Training.** Frozen encoders: CLIP ViT-L/14 or EVA-CLIP ViT-g/14 (second-to-last layer features). Data: 129M images (COCO, Visual Genome, CC3M, CC12M, SBU, 115M from LAION-400M) with CapFilt synthetic captions. 250k steps (stage 1) + 80k steps (stage 2); the largest model (ViT-g + FlanT5-XXL) pre-trains in under 6 + 3 days on a single 16×A100(40G) machine.

## Results

Zero-shot overview (BLIP-2 has 188M trainable parameters):

| Model | Trainable | VQAv2 (test-dev) | NoCaps CIDEr | Flickr TR@1 / IR@1 |
|---|---|---|---|---|
| Flamingo | 10.2B | 56.3 | – | – |
| BLIP | 583M | – | 113.2 | 96.7 / 86.7 |
| **BLIP-2** | **188M** | **65.0** | **121.6** | **97.6 / 89.7** |

- Headline: BLIP-2 (ViT-g, FlanT5-XXL) **outperforms Flamingo80B by 8.7% on zero-shot VQAv2 with 54× fewer trainable parameters** (65.0 vs 56.3 test-dev); it also leads GQA (44.7) and comes second only to Flamingo80B on knowledge-heavy OK-VQA (45.9 vs 50.6).
- Scaling ablation: a stronger image encoder (ViT-g > ViT-L) or a stronger/instruction-tuned LLM (FlanT5 > OPT, larger > smaller) both improve performance — validating BLIP-2 as a generic recipe that harvests progress in both communities.
- Removing stage-1 representation learning collapses zero-shot VQA for both LLM types, with OPT showing catastrophic forgetting — evidence the Q-Former bottleneck, not the LLM, does the alignment.
- With an instruction-tuned FlanT5, BLIP-2 exhibits emerging instructed zero-shot image-to-text generation: visual conversation, visual knowledge/commonsense reasoning, storytelling.

## Why it matters for SLAM

BLIP-2's frozen-encoder + lightweight-adapter + frozen-LLM pattern became the standard recipe for building vision-language systems cheaply (InstructBLIP, MiniGPT-4, many robotics VLMs), and it defines the practical path for adding language-based reasoning to spatial systems: rather than retraining a giant model, a small bridge can connect a SLAM system's visual (or rendered-map) features to an off-the-shelf LLM. In the VLM-to-VLA lineage that runs through this level, BLIP-2 is the efficiency milestone between CLIP's contrastive embeddings and LLaVA/OpenVLA's instruction-following stacks.

## Related

- [CLIP](clip.md)
- [LLaVA](llava.md)
- [SigLIP](siglip.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)
