# VLM vs VLA

**Vision-Language Models (VLMs)** are neural networks trained jointly on images and text. They *reason about* visual input: classify it against arbitrary text labels, describe it, answer questions about it. CLIP learns a shared image-text embedding space via contrastive training; BLIP-2 bridges a frozen image encoder to a frozen LLM with a small Q-Former; LLaVA connects CLIP features to a language model and instruction-tunes the result into a visual chatbot. The output of a VLM is always *language* (or an embedding) — it perceives and understands, but it does not act.

**Vision-Language-Action Models (VLAs)** extend VLMs by one crucial step: they additionally output **robot actions**. The standard trick, introduced by RT-2, is to discretize continuous robot commands (end-effector deltas, gripper state, or navigation headings) into bins and represent them as tokens in the model's vocabulary. Acting then becomes next-token prediction: given the current camera image and a language instruction, the model autoregressively generates action tokens which are decoded into motor commands. OpenVLA open-sourced this recipe at 7B parameters; NaVILA extends it from tabletop manipulation to legged-robot navigation.

| | VLM | VLA |
|---|---|---|
| Input | Image(s) + text | Image(s) + text (+ robot state/history) |
| Output | Text, embeddings, similarity scores | Robot action tokens (plus optionally text) |
| Trained on | Internet image-text pairs | VLM initialization + robot demonstration data |
| Examples | CLIP, SigLIP, BLIP-2, LLaVA | RT-2, OpenVLA, NaVILA |
| Role in a robot | Perception and semantic reasoning | End-to-end (or high-level) control policy |

The reason VLAs are built *on top of* VLMs, rather than trained from scratch on robot data, is transfer: robot demonstration datasets are tiny compared to the internet, but a VLM backbone already knows what objects are, how they are described, and roughly how the world works. RT-2's headline result was *emergent generalization* — manipulating objects and following instructions never seen in robot training, purely because the underlying VLM had seen them on the web.

A design tension worth understanding: VLAs collapse perception, reasoning, and control into one network, which optimizes end-to-end but gives up the explicit geometric state (map, pose) that modular robotic stacks maintain. Most current VLAs have no metric memory at all — which is precisely where SLAM re-enters the picture.

## Why it matters for SLAM

VLMs are already reshaping SLAM: CLIP-style embeddings attached to 3D maps yield open-vocabulary scene understanding (LERF, ConceptFusion) where a map can be queried with free-form text. VLAs frame the bigger architectural question for the field — whether future robots will use an explicit SLAM map with a VLA planning on top of it (SLAM as the metric memory that VLAs lack), or end-to-end policies that bypass explicit geometry entirely. Knowing where each model class is strong tells you where classical spatial representations still earn their keep: long-horizon navigation, metric precision, and persistent maps.

## Related

- [CLIP](clip.md)
- [BLIP-2](blip-2.md)
- [RT-2](rt-2.md)
- [OpenVLA](openvla.md)
- [NaVILA](navila.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
