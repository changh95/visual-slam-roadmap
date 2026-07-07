# Edge deployment

SLAM does not run in the cloud — it runs on the robot, drone, headset, or phone, under hard latency and power budgets. **Edge deployment** is the craft of taking a perception pipeline (increasingly one that includes neural networks) and making it run in real time on embedded compute such as an NVIDIA Jetson, a phone SoC, or an XR headset.

## Exporting learned front-ends

Modern SLAM systems replace hand-crafted components with networks: SuperPoint for keypoints, LightGlue/SuperGlue for matching, monocular depth networks for dense priors. These are trained in PyTorch, but PyTorch is a poor runtime for embedded targets. The standard path is:

1. **Export to ONNX** — a framework-neutral graph format. This step surfaces problems early: dynamic shapes (variable keypoint counts!), unsupported ops, and control flow all need attention.

   ```python
   torch.onnx.export(
       model, dummy_image, "superpoint.onnx",
       input_names=["image"],
       output_names=["scores", "descriptors"],
       dynamic_axes={"image": {2: "height", 3: "width"}},
   )
   ```

2. **Compile with TensorRT** — NVIDIA's inference optimizer fuses layers, selects fast kernels, and quantizes to FP16 or INT8 for large speedups on Jetson/RTX GPUs:

   ```bash
   trtexec --onnx=superpoint.onnx --fp16 --saveEngine=superpoint.engine
   ```

   Alternatives exist per platform: ONNX Runtime as a portable baseline, Core ML on Apple hardware, TFLite/NNAPI on Android phones.

3. **Integrate into the C++ pipeline** — the compiled engine is called from the SLAM front-end, replacing the original detector/matcher, ideally with zero-copy image input on unified-memory devices like Jetson (CPU and GPU share physical memory, so a well-plumbed pipeline never copies the frame).

**Quantization in practice.** FP16 is usually a free win on GPU-class edge hardware. INT8 needs a calibration pass over representative images — and for SLAM front-ends, "representative" means your deployment scenes, and the check that matters is downstream quality (matching inlier rates, tracking stability), not a classification-style accuracy score. Jetson-class modules additionally offer DLA accelerator cores that can offload supported networks from the GPU.

## Jetson benchmarking

A number on a desktop GPU says little about the edge. On Jetson-class devices you benchmark end-to-end:

- **Latency per frame**, including preprocessing (resize, normalize), host/device copies, and postprocessing — not just the network invocation.
- **Sustained throughput under thermal load** — measure after several minutes of warm-up, because embedded devices throttle; a benchmark taken cold overstates reality.
- **Power mode** — Jetson performance depends on the selected `nvpmodel` power profile and clock settings (`jetson_clocks`); report which mode your numbers come from, and watch live utilization with `tegrastats`.
- **What is left for SLAM** — the front-end network shares the SoC with tracking, mapping, and the rest of the robot stack; CPU headroom and memory bandwidth remaining are part of the result.

The honest metric is the full pipeline's frame rate on the target device at the target power mode, measured hot.

## Common pitfalls

- **Accuracy drop after INT8 quantization** — calibrate on representative images and re-check matching quality end to end.
- **Dynamic output sizes** — keypoint detectors emit a variable number of points; either fix a top-K budget at export time or handle dynamic shapes explicitly in the runtime.
- **Preprocessing mismatches** — normalization constants, resize interpolation, and color order differing between training and deployment silently degrade quality with no error message.
- **Benchmarking only inference** — the classic way to "hit 30 FPS" in a slide and miss it on the robot.

## Why it matters for SLAM

The gap between "the paper runs at 30 FPS" and "it runs on my robot" is exactly this topic. Learned front-ends only earn their place in a real system if they fit the edge budget alongside tracking and mapping threads, and deployment constraints (FP16/INT8, fixed input sizes, limited memory bandwidth) often drive the choice between, say, SuperPoint and a lighter detector like XFeat. Engineers who can profile and optimize on-device are the ones who ship SLAM.

## Related

- [Concurrency (SIMD, OpenMP, CUDA)](concurrency.md)
- [C++/Python interop](cpp-python-interop.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
- [XFeat](../level-05-deep-learning/xfeat.md)
- [LightGlue](../level-05-deep-learning/lightglue.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
