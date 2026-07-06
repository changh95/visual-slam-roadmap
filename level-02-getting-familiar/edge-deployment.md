# Edge deployment

SLAM does not run in the cloud — it runs on the robot, drone, headset, or phone, under hard latency and power budgets. **Edge deployment** is the craft of taking a perception pipeline (increasingly one that includes neural networks) and making it run in real time on embedded compute such as an NVIDIA Jetson, a phone SoC, or an XR headset.

**Exporting learned front-ends.** Modern SLAM systems replace hand-crafted components with networks: SuperPoint for keypoints, LightGlue/SuperGlue for matching, monocular depth networks for dense priors. These are trained in PyTorch, but PyTorch is a poor runtime for embedded targets. The standard path is:

1. **Export to ONNX** — a framework-neutral graph format. This step surfaces problems early: dynamic shapes (variable keypoint counts!), unsupported ops, and control flow all need attention.
2. **Compile with TensorRT** — NVIDIA's inference optimizer fuses layers, selects fast kernels, and quantizes to FP16 or INT8 for large speedups on Jetson/RTX GPUs. Alternatives exist per platform (ONNX Runtime, Core ML, TFLite/NNAPI on phones).
3. **Integrate into the C++ pipeline** — the compiled engine is called from the SLAM front-end, replacing the original detector/matcher, ideally with zero-copy image input on unified-memory devices like Jetson.

Common pitfalls: accuracy drop after INT8 quantization (calibrate on representative images and re-check matching quality, not just classification-style metrics), dynamic output sizes from keypoint detectors, and preprocessing mismatches (normalization, resizing) between training and deployment.

**Jetson benchmarking.** A number on a desktop GPU says little about the edge. On Jetson-class devices you benchmark end-to-end: latency per frame (not just network inference — include preprocessing and copies), sustained throughput under thermal throttling, power draw at a given nvpmodel/clock setting, and CPU load left over for the SLAM back-end. The honest metric is the full pipeline's frame rate on the target device at the target power mode, measured after several minutes of warm-up.

## Why it matters for SLAM

The gap between "the paper runs at 30 FPS" and "it runs on my robot" is exactly this topic. Learned front-ends only earn their place in a real system if they fit the edge budget alongside tracking and mapping threads, and deployment constraints (FP16/INT8, fixed input sizes, limited memory bandwidth) often drive the choice between, say, SuperPoint and a lighter detector like XFeat. Engineers who can profile and optimize on-device are the ones who ship SLAM.

## Related

- [Concurrency (SIMD, OpenMP, CUDA)](concurrency.md)
- [C++/Python interop](cpp-python-interop.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
- [XFeat](../level-05-deep-learning/xfeat.md)
- [LightGlue](../level-05-deep-learning/lightglue.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
