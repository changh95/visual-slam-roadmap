# RT-2

> Brohan (DeepMind) 2023 · [Paper](https://arxiv.org/abs/2307.15818)

**One-line summary** — RT-2 represents robot actions as text tokens and co-fine-tunes a large vision-language model on both web-scale vision-language data and robot trajectories, transferring internet knowledge into robotic control and coining the term "vision-language-action" (VLA) model.

## Key ideas

- **Actions as tokens**: Continuous end-effector actions are discretized into bins and written as text tokens in the model's vocabulary, so a robot trajectory becomes just another sequence for a language model:
  $$\mathcal{L} = -\sum_t \log p_\theta(a_{\text{tok},t} \mid I_t, \ell, a_{\text{tok},<t})$$
- **Co-fine-tuning, not replacement**: A large pre-trained VLM (PaLI-X / PaLM-E) is fine-tuned on a mixture of web vision-language tasks (VQA, captioning) and robot demonstration data, preserving web knowledge while acquiring manipulation skills.
- **Emergent generalization**: The resulting policy handles objects seen only in web images (never in robot data), interprets novel category/color/spatial-relation descriptions, and benefits from chain-of-thought-style multi-step reasoning — capabilities never explicitly taught with robot data.
- **Semantic reasoning in the control loop**: Because the policy is a VLM, instructions like "move the block to the object that represents the smallest number" resolve through the model's language understanding, not hand-coded logic.

## Why it matters for SLAM

RT-2 established the actions-as-tokens VLA paradigm that OpenVLA, NaVILA, WorldVLA, and most subsequent robot foundation models adopted, and it demonstrated that web-scale pretraining genuinely transfers to embodied control. For SLAM researchers, it frames the key open question of the Spatial AI era: if web knowledge lets a policy generalize to novel objects, can SLAM-style spatial knowledge (metric maps, persistent geometry) be injected the same way to generalize across novel environments and long-horizon navigation?

## Related

- [OpenVLA](openvla.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [LLaVA](llava.md)
- [WorldVLA](worldvla.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
