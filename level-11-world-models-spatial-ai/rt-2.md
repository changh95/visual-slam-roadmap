# RT-2

> Brohan (DeepMind) 2023 · [Paper](https://arxiv.org/abs/2307.15818)

**One-line summary** — RT-2 represents robot actions as text tokens and co-fine-tunes a large vision-language model on both web-scale vision-language data and robot trajectories, transferring internet knowledge into robotic control and coining the term "vision-language-action" (VLA) model.

## Problem

Traditional robot learning is data-hungry and brittle: a policy trained to pick up apples cannot pick up oranges without new demonstrations, because everything it knows comes from limited robot data. Vision-language models trained on Internet-scale data already contain broad semantic knowledge about objects, categories, and relations. RT-2 asks whether a *single end-to-end trained model* can both map robot observations to actions and enjoy the benefits of large-scale pretraining on web vision-language data — boosting generalization and enabling emergent semantic reasoning in the control loop.

## Key ideas

- **Actions as text tokens**: continuous end-effector actions are discretized into bins (e.g. $a_{\text{tok}} = \text{round}\big(\tfrac{a - a_{\min}}{a_{\max} - a_{\min}} \cdot 255\big)$) and expressed as text tokens, incorporated into the training set *in the same way as natural language tokens*. A robot trajectory becomes just another sequence for a language model:
  $$\mathcal{L} = -\sum_t \log p_\theta(a_{\text{tok},t} \mid I_t, \ell, a_{\text{tok},<t})$$
- **Co-fine-tuning, not replacement**: a state-of-the-art VLM (PaLI-X / PaLM-E scale) is fine-tuned on a *mixture* of robotic trajectory data and Internet-scale vision-language tasks such as visual question answering — preserving web knowledge while acquiring manipulation skills, instead of overwriting it with robot data.
- **A simple, general recipe**: the whole contribution is deliberately minimal — same architecture, same objective, one shared token format for language and actions. The authors name this model category *vision-language-action models (VLA)* and instantiate it as RT-2.
- **Emergent generalization**: web pretraining shows up as capabilities never present in the robot training data — significantly improved generalization to novel objects, interpreting commands absent from robot data (such as placing an object onto a particular number or icon), and rudimentary reasoning (picking the smallest or largest object, or the one closest to another object).
- **Chain-of-thought control**: incorporating chain-of-thought reasoning lets RT-2 perform multi-stage semantic reasoning — figuring out which object could serve as an improvised hammer (a rock), or which drink suits a tired person (an energy drink) — before emitting action tokens.

## Results & impact

An extensive evaluation (6k evaluation trials) showed that the approach yields performant robotic policies with a range of emergent capabilities inherited from Internet-scale training; on emergent-capability evaluations RT-2 roughly doubled the success rate of the prior RT-1 baseline (62% vs 32% in the authors' evaluations). Beyond the numbers, RT-2's lasting impact is the paradigm: actions-as-tokens plus co-fine-tuning became the standard VLA recipe adopted by OpenVLA, Octo, and most subsequent robot foundation models.

## Why it matters for SLAM

RT-2 established the actions-as-tokens VLA paradigm that OpenVLA, NaVILA, WorldVLA, and most subsequent robot foundation models adopted, and it demonstrated that web-scale pretraining genuinely transfers to embodied control. For SLAM researchers, it frames the key open question of the Spatial AI era: if web knowledge lets a policy generalize to novel objects, can SLAM-style spatial knowledge (metric maps, persistent geometry) be injected the same way to generalize across novel environments and long-horizon navigation?

## Related

- [OpenVLA](openvla.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [LLaVA](llava.md)
- [WorldVLA](worldvla.md)
- [NaVILA](navila.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
