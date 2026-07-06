# LLaVA

> Liu 2023 · [Paper](https://arxiv.org/abs/2304.08485)

**One-line summary** — LLaVA (Large Language and Vision Assistant) connects a CLIP vision encoder to the LLaMA language model through a simple projection layer and fine-tunes on GPT-4-generated visual instruction data, showing that data quality — not architectural complexity — is the key to a strong open-source conversational VLM.

## Key ideas

- **Visual instruction tuning**: LLaVA is the first work to use language-only GPT-4 to *generate* multimodal instruction-following data (conversational QA, detailed descriptions, complex reasoning) from image captions and bounding boxes — avoiding expensive manual labeling of multimodal dialogue.
- **Minimal architecture**: A frozen CLIP ViT-L/14 encoder feeds visual patch tokens through a learned projection into LLaMA's token embedding space; visual tokens are simply prepended to the text context. No Q-Former or multi-stage bridging module is needed.
- **Two-stage training**: Stage 1 trains only the projection for feature alignment on image-caption pairs; stage 2 fine-tunes the projection plus the LLM on the generated instruction data.
- **A reproducible recipe**: The simplicity of the design made LLaVA cheap to train and easy to modify — the community swapped in different vision encoders (SigLIP, DINOv2), language backbones, and instruction datasets, making it the de facto starting point for open-source VLM research.

## Why it matters for SLAM

LLaVA democratized conversational vision-language models: the "encoder + projection + LLM" recipe underlies most robotics VLMs and vision-language-action systems that followed (including navigation VLAs such as NaVILA). For SLAM, a LLaVA-style VLM attached to rendered views of a map provides scene understanding, object identification, and spatial question answering — one of the most direct integration paths from a geometric SLAM map to open-vocabulary semantic reasoning.

## Related

- [CLIP](clip.md)
- [BLIP-2](blip-2.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [OpenVLA](openvla.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
