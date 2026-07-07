# SAM 3

> Carion 2025 · [Paper](https://arxiv.org/abs/2511.16719)

**One-line summary** — Unifies detection, segmentation, and tracking of *all* instances of a visual concept — prompted by a short noun phrase, image exemplars, or both — in images and video, roughly doubling the accuracy of existing systems on the new Promptable Concept Segmentation task while still improving on SAM 2's visual-prompt segmentation.

## Problem

SAM and SAM 2 segment *one object per prompt* from points/boxes/masks — they cannot answer "segment all cats in this video". SAM 3 formalizes **Promptable Concept Segmentation (PCS)**: given an image or short video (≤30 s) and a concept prompt — a simple noun phrase ("yellow school bus"), positive/negative exemplar boxes, or both — detect, segment, and track *every* matching instance with persistent identities, refinable interactively. Text is deliberately restricted to atomic noun phrases (long referring expressions are delegated to an MLLM wrapper), yet an open vocabulary is intrinsically ambiguous (polysemy, subjective modifiers, boundary ambiguity), so evaluation uses three expert annotations per phrase and accepts multiple valid interpretations. No dataset existed at the required concept diversity — model and data engine had to be built together, again.

## Method & architecture

A DETR-based detector and a SAM 2-style tracker share a single aligned **Perception Encoder (PE)** vision-language backbone; the decoupling avoids task conflict, since the detector must be identity-agnostic while the tracker's job is separating identities:

- **Detector (DETR paradigm)**: PE encodes image and text; each exemplar box is encoded (position + label embeddings + ROI-pooled features, fused by a small transformer) and concatenated with text tokens into "prompt tokens". A fusion encoder conditions image embeddings by cross-attending to prompt tokens; a DETR-style decoder's object queries then predict per-query match logits and box deltas (vanilla attention with box-region-positional bias; DAC-DETR dual supervision and Align loss), with a MaskFormer-derived mask head and a per-pixel semantic-segmentation head.
- **Presence token**: recognition (what, global context) and localization (where, local evidence) conflict inside one query, so a learned global token alone predicts $p(\text{NP is present in input})$ and each query $q_i$ only solves $p(q_i \text{ is a match} \mid \text{NP is present})$; the final score is their product. Ablations: +1.5 cgF1, and training with hard-negative phrases lifts image-level IL_MCC from 0.44 to 0.68.
- **Tracker**: inherits SAM 2's prompt encoder, mask decoder, memory encoder, and memory bank (three candidate masks per object per frame to handle ambiguity; only confidently-present frames retained in memory). Each frame runs

$$\hat{\mathcal{M}}_t = \mathrm{propagate}(\mathcal{M}_{t-1}), \quad \mathcal{O}_t = \mathrm{detect}(I_t, P), \quad \mathcal{M}_t = \mathrm{match\_and\_update}(\hat{\mathcal{M}}_t, \mathcal{O}_t)$$

- with IoU-based matching, new masklets spawned for unmatched detections, a temporal **masklet detection score** suppressing tracks that stop being matched to detections, and periodic re-prompting of the tracker with high-confidence detection masks so the memory bank keeps reliable references. Individual masks/masklets remain refinable with SAM-style positive/negative clicks.
- **Training stages**: PE pre-training → detector pre-training → detector fine-tuning → tracker training on a frozen backbone.

**Data engine** (four phases, human + AI in the loop): AI annotators propose noun phrases and adversarial hard negatives from a 22.4M-node Wikidata-based ontology; SAM 3 proposes candidate masks; fine-tuned Llama 3.2 **AI verifiers** perform mask-quality and exhaustivity verification at near-human accuracy, roughly doubling annotation throughput and steering humans to the hardest failures. Yield: **SA-Co/HQ** — 5.2M images, 4M unique noun phrases, 52M masks; a synthetic set of 38M phrases and 1.4B masks; **SA-Co/VIDEO** — 52.5K videos, 467K masklets; and the **SA-Co benchmark** — 207K unique phrases over 121K images and videos with hard negatives, >50x more concepts than existing benchmarks. The main metric enforces calibration (predictions only count above 0.5 confidence): $\mathrm{cgF_1} = 100 \cdot \mathrm{pmF_1} \cdot \mathrm{IL\_MCC}$.

## Results

- **Image PCS with text**: zero-shot 48.8 LVIS mask AP vs. the previous best 38.5; on SA-Co/Gold 54.1 cgF1 — more than double the strongest baseline OWLv2 (24.6) and 74% of estimated human performance (72.8); new zero-shot state of the art on COCO and COCO-O boxes.
- **Exemplar prompts**: a single exemplar box beats T-Rex2 by +18.3 AP+ on COCO, +10.3 on LVIS, +20.5 on ODinW; interactively, 3 exemplar prompts gain +21.6 cgF1 over text-only and +2.0 over an ideal PVS-style per-instance correction baseline.
- **Video PCS with text**: 30.3/50.8/36.4 cgF1 on SA-Co/VEval SA-V/YT-Temporal-1B/SmartGlasses — over 80% of human pHOTA — plus 36.3 test mAP on LVVIS and 60.5 val mAP on OVIS, well above GLEE and a tracking-by-detection variant of itself.
- **PVS still improves**: VOS $\mathcal{J}\&\mathcal{F}$ 83.5/84.4 on SA-V val/test (SAM 2.1 L: 77.9/78.4), 92.2 DAVIS17, 60.3 on the hard MOSEv2 (+6.5 over prior work); interactive image segmentation on SA-37 reaches 81.3/85.1 mIoU at 3/5 clicks vs SAM 2.1's 80.3/84.3.
- **Counting**: 0.12 MAE / 93.8% accuracy on CountBench, ahead of Gemini 2.5 Pro and Molmo-72B — while also returning masks.
- **SAM 3 Agent**: with an MLLM proposing noun-phrase queries, zero-shot ReasonSeg val gIoU reaches 77.0 (Gemini 2.5 Pro), surpassing prior fine-tuned work.
- **Speed**: 30 ms per image with 100+ detected objects on an H200; video latency scales with object count, near real-time for ~5 concurrent objects.

## Why it matters for SLAM

Open-vocabulary mapping pipelines like ConceptGraphs currently bolt together a grounding detector, class-agnostic SAM masks, and CLIP features per frame, then solve cross-frame object association themselves. SAM 3 collapses that detect–segment–track loop into one calibrated model: text-promptable, *exhaustive* instance masks with persistent identities give object-level mapping its short-horizon data association for free; the presence score is a ready-made existence confidence for deciding map insertion; and exemplar prompts let an operator teach the mapper a rare, domain-specific object online instead of retraining. The honest caveats: SAM 3 knows concepts, not geometry or poses — it is a perception module to feed a mapping backend, not a localizer; PCS is defined on short (≤30 s) clips, so long-term map-level re-association still falls to the SLAM side; and near-real-time holds only around ~5 concurrent tracked objects, with out-of-domain vocabulary a stated limitation.

## Related

- [SAM](sam.md) — the original promptable single-object image segmenter
- [SAM 2](sam-2.md) — the streaming memory-based video tracker SAM 3 inherits
- [Grounding DINO](grounding-dino.md) — prior open-set text-prompted detection, a baseline here
- [DETR](detr.md) — the query-based detection paradigm behind the SAM 3 detector
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary object-level mapping that this class of model feeds
