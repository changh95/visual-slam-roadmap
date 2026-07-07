# YOLO (v1→v11)
> Redmon 2016→2024 · [Paper](https://arxiv.org/abs/1506.02640)

**One-line summary** — "You Only Look Once" reframed object detection as a single-shot regression problem solved by one CNN forward pass, establishing the real-time detection family that SLAM systems most commonly use for semantic and dynamic-object reasoning.

## Problem
Before YOLO, object detection repurposed classifiers to perform detection: DPM slid a classifier over the image at all locations and scales, and the R-CNN family generated region proposals, classified each, then refined, deduplicated, and rescored boxes in post-processing. These complex pipelines were slow — far from camera frame rate — and hard to optimize because each component was trained separately. Robotics needed detection that runs in one pass, at video rate, with a single trainable objective.

## Method & architecture
- **Grid regression.** The image is divided into an $S \times S$ grid; the cell containing an object's center is responsible for detecting it. Each cell predicts $B$ boxes — each with $x, y, w, h$ and a confidence defined as $\Pr(\text{Object}) \cdot \text{IOU}^{\text{truth}}_{\text{pred}}$ — plus $C$ conditional class probabilities $\Pr(\text{Class}_i \mid \text{Object})$ shared across the cell's boxes. The whole output is a single $S \times S \times (B \cdot 5 + C)$ tensor; on Pascal VOC, $S{=}7$, $B{=}2$, $C{=}20$ gives a $7\times7\times30$ tensor (98 boxes/image). At test time class-specific scores are $\Pr(\text{Class}_i \mid \text{Object}) \cdot \Pr(\text{Object}) \cdot \text{IOU}^{\text{truth}}_{\text{pred}} = \Pr(\text{Class}_i) \cdot \text{IOU}^{\text{truth}}_{\text{pred}}$.
- **Network.** 24 convolutional layers ($1\times1$ reduction + $3\times3$ conv, GoogLeNet-inspired) followed by 2 fully-connected layers; Fast YOLO uses 9 conv layers. The first 20 conv layers are pretrained on ImageNet at $224\times224$ (88% top-5), then detection is fine-tuned at $448\times448$ with leaky-ReLU activations $\phi(x) = x$ if $x > 0$, else $0.1x$.
- **Multi-part sum-squared loss**, with $\lambda_\text{coord} = 5$, $\lambda_\text{noobj} = 0.5$ and $\mathbf{1}_{ij}^{\text{obj}}$ selecting the predictor "responsible" for an object (highest current IOU):

$$\begin{aligned}
& \lambda_{\text{coord}} \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{obj}} \left[ (x_i - \hat{x}_i)^2 + (y_i - \hat{y}_i)^2 \right] + \lambda_{\text{coord}} \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{obj}} \left[ \left(\sqrt{w_i} - \sqrt{\hat{w}_i}\right)^2 + \left(\sqrt{h_i} - \sqrt{\hat{h}_i}\right)^2 \right] \\
& + \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{obj}} (C_i - \hat{C}_i)^2 + \lambda_{\text{noobj}} \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{noobj}} (C_i - \hat{C}_i)^2 + \sum_{i=0}^{S^2} \mathbf{1}_{i}^{\text{obj}} \sum_{c \in \text{classes}} \left(p_i(c) - \hat{p}_i(c)\right)^2
\end{aligned}$$

  Square roots of $w, h$ make small-box errors count more; classification loss applies only in cells containing objects. Trained ~135 epochs on VOC 2007+2012 (batch 64, momentum 0.9, decay 0.0005, dropout 0.5, scale/translation/HSV augmentation).
- **Global context.** The network sees the whole image (not proposal crops), so it encodes contextual information; NMS is optional cleanup (+2–3% mAP), not a structural necessity as in R-CNN/DPM.
- **Stated limitations** (which drove the sequels): each cell predicts only two boxes and one class, so grouped small objects (flocks of birds) are hard; features are coarse after downsampling; the loss treats errors in small and large boxes alike — localization error was YOLO's main error source.
- **A long evolutionary line (v1→v11).** Successive versions added anchor boxes and multi-scale prediction, stronger backbones and training recipes, and anchor-free heads in recent generations, keeping the family near the speed/accuracy Pareto front for real-time detection; the Ultralytics ecosystem (training, ONNX/TensorRT export, edge deployment) is a major practical reason YOLO remains the default detector in robotics.

## Results
On Pascal VOC 2007, YOLO reaches **63.4% mAP at 45 FPS** and Fast YOLO **52.7% mAP at 155 FPS** — versus 30Hz DPM at 26.1% mAP and, among the accurate-but-slow, Fast R-CNN at 70.0% mAP / 0.5 FPS and Faster R-CNN (VGG-16) at 73.2% / 7 FPS; a VGG-16 YOLO scores 66.4% at 21 FPS. Error analysis shows Fast R-CNN is almost 3× more likely to predict background false positives (13.6% of its top detections); rescoring Fast R-CNN with YOLO lifts VOC 2007 mAP from 71.8% to **75.0%**. On VOC 2012 test YOLO scores 57.9% mAP, trailing state of the art mainly on small objects (bottle, sheep, tv/monitor 8–10% below R-CNN). Generalizing to artwork, YOLO's person AP holds up (VOC2007 59.2 → Picasso 53.3, People-Art 45) while R-CNN collapses (54.2 → 10.4, 26).

That 45-FPS operating point made per-frame detection viable inside live perception stacks for the first time, and the family's evolution kept it there — setting the benchmark that Transformer detectors (DETR → RT-DETR) later had to beat on both axes.

## Why it matters for SLAM
Object detection is the cheapest way to inject semantics into a SLAM pipeline. Real-time detectors in the YOLO family are used to mask out dynamic objects (people, vehicles) so they do not corrupt feature tracking, to provide object-level landmarks for object SLAM (e.g., CubeSLAM builds 3D cuboid landmarks from 2D detections), and to label maps for downstream tasks. When a SLAM system needs "what is in the image" at frame rate on a robot's onboard computer, YOLO is usually the first tool reached for — with the caveat that it is closed-set by design, the limitation that motivated open-vocabulary detectors like Grounding DINO.

## Related
- [DETR](detr.md) — Transformer-based set-prediction alternative to YOLO-style detection.
- [RT-DETR](rt-detr.md) — the first Transformer detector to beat YOLO on both speed and accuracy.
- [Grounding DINO](grounding-dino.md) — open-vocabulary detection beyond YOLO's fixed classes.
- [CubeSLAM](../level-03-monocular-slam/cubeslam.md) — object SLAM built on 2D detections.
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — using detection/segmentation to remove dynamic objects.
- [SAM](sam.md) — promptable segmentation, the pixel-level counterpart to box-level detection.
