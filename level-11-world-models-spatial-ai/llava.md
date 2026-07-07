# LLaVA

> Liu 2023 · [Paper](https://arxiv.org/abs/2304.08485)

**One-line summary** — LLaVA (Large Language and Vision Assistant) connects a CLIP vision encoder to the LLaMA language model through a simple projection layer and fine-tunes on GPT-4-generated visual instruction data, showing that data quality — not architectural complexity — is the key to a strong open-source conversational VLM.

## Problem

Instruction tuning LLMs on machine-generated instruction-following data had dramatically improved zero-shot capabilities on new language tasks, but the idea was largely unexplored in the multimodal field. VLMs of the time either demanded massive compute (Flamingo), used intricate bridging architectures (BLIP-2's Q-Former between frozen encoders), or were closed (GPT-4V) — and manually labeling multimodal conversation datasets at scale is prohibitively expensive. LLaVA asks whether a *minimal* architecture plus *machine-generated* multimodal instruction data can yield a competitive, reproducible open VLM.

## Key ideas

- **Visual instruction tuning**: the first attempt to use *language-only* GPT-4 to generate multimodal language-image instruction-following data. Given an image's captions and object bounding boxes (as text), GPT-4 produces three kinds of examples — conversational QA, detailed descriptions, and complex reasoning — yielding a diverse instruction dataset (158k examples) with no manual dialogue labeling.
- **Minimal architecture**: a frozen CLIP ViT-L/14 encoder produces visual patch features, which a single learned projection $\mathbf{W}$ maps into LLaMA's token embedding space:
  $$\mathbf{h}_v = \mathbf{W} \cdot f_{\text{CLIP}}(I), \qquad p(T \mid I, T_{\text{inst}}) = p_{\text{LLaMA}}\big(T \mid [\mathbf{h}_v;\ \text{embed}(T_{\text{inst}})]\big)$$
  Visual tokens are simply prepended to the text context — no Q-Former, no multi-stage bridging module.
- **Two-stage training**: stage 1 trains only the projection on image-caption pairs to align CLIP's visual space with the LLM's token space (both backbones frozen); stage 2 fine-tunes the projection plus the LLM on the GPT-4-generated instruction data.
- **End-to-end multimodal assistant**: the result is an end-to-end trained large multimodal model connecting a vision encoder and an LLM for general-purpose visual and language understanding — a conversational assistant, not just a captioner or classifier.
- **A reproducible recipe**: the simplicity made LLaVA cheap to train and easy to modify; the community swapped in different vision encoders (SigLIP, DINOv2), language backbones, and instruction datasets. The follow-up LLaVA-1.5 improved results further with a small MLP projection, a higher-resolution CLIP encoder, and added VQA training data.

## Results & impact

Early experiments showed impressive multimodal chat ability, sometimes exhibiting behaviors of multimodal GPT-4 on unseen images and instructions, and LLaVA achieved an 85.1% relative score compared with GPT-4 on a synthetic multimodal instruction-following dataset. Fine-tuned on Science QA, the synergy of LLaVA and GPT-4 set a new state-of-the-art accuracy of 92.53%. The GPT-4-generated visual instruction data, model, and code were all released — and the "encoder + projection + LLM" recipe became the de facto starting point for open-source VLM research (InstructBLIP, MiniGPT-4, and many robotics VLMs build on it).

## Why it matters for SLAM

LLaVA democratized conversational vision-language models: the "encoder + projection + LLM" recipe underlies most robotics VLMs and vision-language-action systems that followed (including navigation VLAs such as NaVILA). For SLAM, a LLaVA-style VLM attached to rendered views of a map provides scene understanding, object identification, and spatial question answering — one of the most direct integration paths from a geometric SLAM map to open-vocabulary semantic reasoning.

## Related

- [CLIP](clip.md)
- [BLIP-2](blip-2.md)
- [SigLIP](siglip.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [OpenVLA](openvla.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
