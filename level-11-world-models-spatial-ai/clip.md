# CLIP

> Radford (OpenAI) 2021 · [Paper](https://arxiv.org/abs/2103.00020)

**One-line summary** — CLIP trains an image encoder and a text encoder jointly on 400 million web image-text pairs with a symmetric contrastive objective, producing a shared embedding space that enables zero-shot visual recognition of essentially arbitrary concepts described in natural language.

## Problem

State-of-the-art vision systems were trained to predict a fixed set of predetermined object categories (canonically ImageNet's 1000 classes). This restricted supervision limits generality: specifying *any other* visual concept requires collecting new labeled data and retraining. Captions are already attached to images at internet scale for free — but predicting the exact words of a caption (VirTex-style) scales poorly: the authors' caption-prediction baseline learned ImageNet recognition 3× slower than a bag-of-words baseline, and swapping in a contrastive objective bought another 4× efficiency. CLIP asks whether this weak, noisy pairing signal, at sufficient scale, trains visual representations that transfer zero-shot to arbitrary tasks.

## Method & architecture

**Data.** WIT (WebImageText): 400M (image, text) pairs collected from the internet using 500,000 queries, class-balanced at up to 20,000 pairs per query.

**Dual encoders.** An image encoder (5 ResNets: RN50 to RN50x64 with attention pooling; and 3 ViTs: B/32, B/16, L/14) and a text encoder (63M-parameter, 12-layer, 512-wide Transformer over lower-cased BPE, 49,152 vocab, max length 76; the [EOS] activation is the text feature) are trained from scratch. Each representation is *linearly* projected into the joint embedding space — no non-linear projection head.

**Contrastive objective.** Given a batch of $N$ pairs, CLIP predicts which of the $N \times N$ possible pairings actually occurred: maximize cosine similarity of the $N$ real pairs, minimize it for the $N^2 - N$ incorrect ones, via a symmetric cross-entropy over the similarity scores (the multi-class N-pair / InfoNCE loss). Following the paper's Figure 3 pseudocode, with $L_2$-normalized embeddings $x_i$ (image) and $y_j$ (text) and learned temperature $\tau$:
$$\text{logits}_{ij} = \frac{\langle x_i, y_j \rangle}{\tau}, \qquad \mathcal{L} = \tfrac{1}{2}\big( \text{CE}_{\text{image} \to \text{text}} + \text{CE}_{\text{text} \to \text{image}} \big)$$
where each CE is a softmax cross-entropy with the matched index as the label, taken along rows and columns respectively. $\tau$ is learned as a log-parameterized scalar (initialized to 0.07, logits clipped at 100). Batch size is 32,768; the largest ResNet took 18 days on 592 V100s and ViT-L/14 12 days on 256 V100s, plus one extra epoch at 336px (ViT-L/14@336px, the reported "CLIP").

**Zero-shot transfer.** At test time the class names of a dataset are embedded (with prompt templates like "A photo of a {label}.") and an image is classified to the nearest text embedding — the text encoder acts as a hypernetwork generating the weights of a linear classifier. Prompt engineering and ensembling 80 prompts improve ImageNet accuracy by almost 5%.

## Results

- **Zero-shot ImageNet: 76.2%**, matching the original supervised ResNet-50 without using any of its 1.28M training examples (top-5: 95%, matching Inception-V4).
- Across **27 datasets**, zero-shot CLIP beats a fully supervised logistic regression on ResNet-50 features on **16 of 27**; on STL10 it sets a state of the art at 99.3% with no training examples; on video action recognition it wins by +14.5% (Kinetics700) and +7.7% (UCF101).
- **Linear probing**: CLIP features outperform the best ImageNet model (Noisy Student EfficientNet-L2) on **21 of 27** datasets, with the biggest gains on OCR, geo-localization, and activity recognition.
- **Robustness**: on 7 natural distribution shifts (ImageNetV2, ImageNet-R, ObjectNet, ...), zero-shot CLIP shrinks the robustness gap by **up to 75%**; adapting to ImageNet raises ImageNet accuracy by 9.2% but erodes that effective robustness.
- Zero-shot retrieval matches or beats all prior zero-shot results on Flickr30k and MSCOCO text retrieval.

## Why it matters for SLAM

CLIP is the enabling technology of open-vocabulary SLAM: by attaching CLIP features to 3D map elements, systems like LERF and ConceptFusion let you query a reconstructed scene with free-form text ("find the fire extinguisher") instead of a fixed detector class list. It is also upstream of the VLM/VLA stack (BLIP-2, LLaVA, OpenVLA) that increasingly sits on top of SLAM in modern robot architectures. For vision-language pretraining what BERT was for NLP, CLIP is the reference point — with SigLIP as its direct technical successor.

## Related

- [SigLIP](siglip.md)
- [BLIP-2](blip-2.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [LERF](../level-03-monocular-slam/lerf.md)
- [ConceptFusion](../level-03-monocular-slam/conceptfusion.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)
