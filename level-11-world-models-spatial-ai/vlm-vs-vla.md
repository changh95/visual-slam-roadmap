# VLM vs VLA

**Vision-Language Models (VLMs)** are neural networks trained jointly on images and text. They *reason about* visual input: classify it against arbitrary text labels, describe it, answer questions about it. **Vision-Language-Action Models (VLAs)** extend VLMs by one crucial step: they additionally output **robot actions**. The distinction sounds small; architecturally and philosophically it is the difference between a perception module and a policy.

## VLMs: perception and reasoning

The VLM lineage in this level illustrates three architectural generations:

- **CLIP** learns a shared image-text embedding space via contrastive training on 400M web pairs — output is an *embedding*, and "reasoning" is similarity search (zero-shot classification, retrieval).
- **BLIP-2** bridges a frozen image encoder to a frozen LLM with a small Q-Former, so the output becomes *generated language* conditioned on the image — captioning, VQA, instruction following — at a fraction of end-to-end training cost.
- **LLaVA** goes even simpler: a single linear projection connects a frozen CLIP encoder's visual tokens to an LLM, and instruction tuning on visual conversations turns the result into a visual chatbot.

Whatever the internals, the output of a VLM is always language, embeddings, or scores — it perceives and understands, but it does not act.

## VLAs: closing the loop to action

The standard trick, introduced by RT-2, is to **discretize continuous robot commands into tokens**: end-effector position/rotation deltas, gripper state, or navigation headings are binned (e.g., 256 bins per degree of freedom) and each bin is assigned a token in the model's vocabulary. Acting then becomes next-token prediction: given the current camera image and a language instruction, the model autoregressively generates action tokens that are decoded into motor commands.

- **RT-2** co-fine-tunes a large VLM on web data *and* robot demonstrations, so the same network answers questions and emits actions.
- **OpenVLA** open-sourced the recipe at 7B parameters, notably fusing two vision encoders — DINOv2 (spatial, object-centric features) and SigLIP (semantic, text-aligned features) — before the language backbone, evidence that vision-encoder quality is a real bottleneck in VLA performance.
- **NaVILA** extends the recipe from tabletop manipulation to legged-robot navigation.

## Side-by-side

| | VLM | VLA |
|---|---|---|
| Input | Image(s) + text | Image(s) + text (+ robot state/history) |
| Output | Text, embeddings, similarity scores | Robot action tokens (plus optionally text) |
| Trained on | Internet image-text pairs | VLM initialization + robot demonstration data |
| Examples | CLIP, SigLIP, BLIP-2, LLaVA | RT-2, OpenVLA, NaVILA |
| Role in a robot | Perception and semantic reasoning | End-to-end (or high-level) control policy |

## Why build VLAs on top of VLMs?

Transfer. Robot demonstration datasets are tiny compared to the internet, but a VLM backbone already knows what objects are, how they are described, and roughly how the world works. RT-2's headline result was *emergent generalization* — manipulating objects and following instructions never seen in robot training, purely because the underlying VLM had seen them on the web. Training a VLA from scratch on robot data alone throws that prior away.

## The design tension — and where SLAM fits

VLAs collapse perception, reasoning, and control into one network, which optimizes end-to-end but gives up the explicit geometric state (map, pose) that modular robotic stacks maintain. In the modular pattern the stack reads:

$$\text{Perceive} \xrightarrow{\text{SLAM}} \text{Map + Pose} \xrightarrow{\text{VLM}} \text{Scene understanding} \xrightarrow{\text{VLA}} \text{Action}$$

The end-to-end alternative skips explicit geometry entirely. Which wins likely depends on the task: precise manipulation in known spaces and long-horizon navigation favor explicit SLAM state; short-horizon, open-world instruction following may favor end-to-end policies. Most current VLAs have no metric memory at all — which is precisely where SLAM re-enters the picture.

## Why it matters for SLAM

VLMs are already reshaping SLAM: CLIP-style embeddings attached to 3D maps yield open-vocabulary scene understanding (LERF, ConceptFusion) where a map can be queried with free-form text. VLAs frame the bigger architectural question for the field — whether future robots will use an explicit SLAM map with a VLA planning on top of it (SLAM as the metric memory that VLAs lack), or end-to-end policies that bypass explicit geometry entirely. Knowing where each model class is strong tells you where classical spatial representations still earn their keep: long-horizon navigation, metric precision, and persistent maps.

## Related

- [CLIP](clip.md)
- [BLIP-2](blip-2.md)
- [RT-2](rt-2.md)
- [OpenVLA](openvla.md)
- [NaVILA](navila.md)
- [Spatial AI](spatial-ai.md)
