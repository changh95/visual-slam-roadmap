# Edge deployment

SLAM并不在云端运行——它运行在机器人、无人机、头显或手机上，受到严格的延迟和功耗预算约束。**边缘部署（Edge deployment）**是一门技艺：把一条感知流水线（越来越多地包含神经网络）改造成能在嵌入式计算设备（如NVIDIA Jetson、手机SoC或XR头显）上实时运行。

## 导出学习式前端

现代SLAM系统正在用网络取代手工设计的组件：SuperPoint用于关键点、LightGlue/SuperGlue用于匹配、单目深度网络用于密集先验。这些网络都是在PyTorch中训练的，但PyTorch并不是嵌入式目标平台的理想运行时。标准路径是：

1. **导出为ONNX**——一种与框架无关的图格式。这一步会提早暴露问题：动态形状（关键点数量可变！）、不受支持的算子以及控制流都需要处理。

   ```python
   torch.onnx.export(
       model, dummy_image, "superpoint.onnx",
       input_names=["image"],
       output_names=["scores", "descriptors"],
       dynamic_axes={"image": {2: "height", 3: "width"}},
   )
   ```

2. **用TensorRT编译**——NVIDIA的推理优化器会融合层、选择快速内核，并量化到FP16或INT8，在Jetson/RTX GPU上带来大幅加速：

   ```bash
   trtexec --onnx=superpoint.onnx --fp16 --saveEngine=superpoint.engine
   ```

   不同平台也有相应的替代方案：ONNX Runtime作为可移植的基线方案，Apple硬件上的Core ML，Android手机上的TFLite/NNAPI。

3. **集成进C++流水线**——编译好的引擎从SLAM前端中被调用，取代原有的检测器/匹配器，理想情况下在Jetson这类统一内存设备上实现零拷贝图像输入（CPU和GPU共享物理内存，因此一条布线良好的流水线永远不会拷贝帧数据）。

**量化实践。** 在GPU类边缘硬件上，FP16通常是"免费"的收益。INT8则需要在具有代表性的图像上进行一次校准——对SLAM前端而言，"具有代表性"意味着你的部署场景，而真正重要的检验指标是下游质量（匹配内点率、跟踪稳定性），而不是分类式的精度分数。Jetson类模块还额外提供DLA加速核心，可以将支持的网络从GPU上卸载出去。

## Jetson基准测试

桌面GPU上的一个数字对边缘设备意义不大。在Jetson类设备上，你需要进行端到端的基准测试：

- **每帧延迟**，包括预处理（缩放、归一化）、主机/设备间拷贝以及后处理——而不只是网络调用本身。
- **热负荷下的持续吞吐量**——应在预热数分钟之后再测量，因为嵌入式设备会降频；冷启动状态下的基准测试会高估实际表现。
- **功耗模式**——Jetson的性能取决于所选的`nvpmodel`功耗配置和时钟设置（`jetson_clocks`）；报告数据时应说明来自哪种模式，并用`tegrastats`观察实时利用率。
- **留给SLAM的余量**——前端网络与跟踪、建图以及机器人栈的其余部分共享同一个SoC；剩余的CPU余量和内存带宽也是结果的一部分。

诚实的指标是整条流水线在目标设备、目标功耗模式下、处于热态时测得的帧率。

## 常见陷阱

- **INT8量化后的精度下降**——应在具有代表性的图像上进行校准，并端到端重新检查匹配质量。
- **动态输出尺寸**——关键点检测器会输出数量可变的点；应在导出时固定一个Top-K预算，或在运行时显式处理动态形状。
- **预处理不一致**——训练与部署之间归一化常数、缩放插值方式和颜色通道顺序的差异会在没有任何报错的情况下悄然降低质量。
- **只对推理本身做基准测试**——这是幻灯片上"达到30 FPS"却在机器人上达不到的经典原因。

## 对SLAM的意义

"论文中跑到30 FPS"和"能在我的机器人上运行"之间的差距，正是这个主题所在。学习式前端只有在与跟踪、建图线程并存的情况下依然能满足边缘预算，才能真正在实际系统中占据一席之地，而部署约束（FP16/INT8、固定输入尺寸、有限的内存带宽）常常决定了在SuperPoint和更轻量的检测器（如XFeat）之间的取舍。能够在设备上进行性能剖析与优化的工程师，才是真正能把SLAM产品化的人。

## 相关条目

- [Concurrency (SIMD, OpenMP, CUDA)](concurrency.md)
- [C++/Python interop](cpp-python-interop.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
- [XFeat](../level-05-deep-learning/xfeat.md)
- [LightGlue](../level-05-deep-learning/lightglue.md)
