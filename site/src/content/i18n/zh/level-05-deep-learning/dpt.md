# DPT

> Ranftl 2021 · [论文](https://arxiv.org/abs/2103.13413)

**一句话总结** — 用Vision Transformer取代CNN骨干网络进行稠密预测(深度、分割),在每一层都利用全局自注意力,从而产生全局一致的深度图。

## 问题

全卷积网络在稠密预测任务中占据主导地位,但其编码器会逐步降采样:在更深阶段丢失的特征分辨率和细粒度信息很难在解码器中恢复,而且单个卷积的感受野有限,因此只有在非常深的堆叠结构后期才能获得广阔的上下文信息。对于单目深度这类逐像素任务,这会导致预测在局部上不一致、在全局上摇摆不定。DPT探究了一个问题:一个具有恒定表示分辨率、每一阶段都拥有全局感受野的Vision Transformer骨干网络,能否产生更细粒度、全局更一致的稠密预测。

## 方法与架构

**Transformer编码器。** 图像被分解为$p^2$像素($p=16$)的非重叠图块,每个图块展平后线性投影为一个token;加入可学习的位置嵌入和一个特殊的*读出token(readout token)*,得到token集合$t^0 = \{t_0^0, \dots, t_{N_p}^0\}$,$t_n^0 \in \mathbb{R}^D$,其中$N_p = \frac{HW}{p^2}$。$L$层多头自注意力transformer层将其变换为$t^l$。由于token与图块一一对应,空间分辨率在所有阶段保持恒定,而且从第一层开始每个token就可以关注其他所有token。变体包括:ViT-Base($D=768$,12层)、ViT-Large($D=1024$,24层)和ViT-Hybrid(以ResNet-50特征作为token,12层)。

**重组(Reassemble)。** 来自四个transformer深度的token通过一个三阶段操作被转换回类图像的特征图

$$\mathrm{Reassemble}_{s}^{\hat{D}}(t) = (\mathrm{Resample}_{s} \circ \mathrm{Concatenate} \circ \mathrm{Read})(t)$$

其中$\mathrm{Read}: \mathbb{R}^{(N_p+1)\times D} \rightarrow \mathbb{R}^{N_p \times D}$将读出token折叠进图块token中(默认方案是对每个token投影其与读出token的拼接结果$\mathrm{mlp}(\mathrm{cat}(t_i, t_0))$),$\mathrm{Concatenate}$按图块位置将token重塑为一个$\frac{H}{p}\times\frac{W}{p}\times D$的特征图,而$\mathrm{Resample}_s$通过$1{\times}1$投影加(转置)卷积将其缩放为$\frac{H}{s}\times\frac{W}{s}\times\hat{D}$,其中$\hat{D}=256$。对于ViT-Large,被抽取的层是$l = \{5, 12, 18, 24\}$(更深层的层在更低分辨率下组装);ViT-Base使用$l = \{3,6,9,12\}$;ViT-Hybrid使用前两个ResNet模块加上第$\{9, 12\}$阶段。

**卷积融合解码器。** RefineNet风格的融合模块通过残差卷积单元逐步组合相邻阶段的特征图,每阶段上采样2倍;最终表示的分辨率是输入的一半,并馈入特定任务的输出头。位置嵌入在运行时被线性插值,因此DPT能像FCN一样处理不同大小的图像。

**深度训练方案。** 遵循MiDaS协议——对逆深度采用尺度和位移不变的截尾损失,加上多尺度梯度匹配——但训练数据是**MIX 6**,一个约140万图像的元数据集(MIX 5加上另外五个数据集),是当时构建的最大深度训练集,使用多目标(帕累托)数据集混合策略,在$384\times 384$分辨率下训练60个epoch。

## 实验结果

零样本跨数据集迁移(所有指标均为越低越好):在MIX 6上训练的DPT-Large达到DIW WHDR 10.82、ETH3D AbsRel 0.089、Sintel AbsRel 0.270,以及$\delta > 1.25$异常率8.46(KITTI)、8.32(NYU)、9.97(TUM),而此前最好的全卷积MiDaS(MIX 5)为:12.46 / 0.129 / 0.327 / 23.90 / 9.55 / 14.29。DPT-Large的平均相对提升为28%,DPT-Hybrid为23%;在同样的MIX 6上重新训练卷积版MiDaS只带来微小改善,说明全卷积网络无法像transformer那样利用额外数据。微调后的DPT-Hybrid在NYUv2($\delta_1$ 0.904,AbsRel 0.110,RMSE 0.357)和KITTI($\delta_1$ 0.959,AbsRel 0.062,RMSE 2.573)上创造了新的最优结果。在语义分割方面,DPT-Hybrid在ADE20K上以49.02% mIoU创造新纪录,并在微调后于Pascal Context上同样刷新最优结果。

## 对SLAM的意义

DPT使ViT编码器成为单目深度的默认选择:DPT-Large成为MiDaS v3和Depth Anything v1的骨干网络,而这两者是最常被注入单目和稠密SLAM系统的深度先验。当一个SLAM流水线使用"相对深度网络"时,其底层很可能就是DPT风格的架构。它产生的全局一致深度正是稠密建图所需要的——局部摇摆的深度图会破坏TSDF或surfel融合。

## 相关条目

- [MiDaS](midas.md) — DPT所接入的稳健相对深度训练方案
- [MonoDepth](monodepth.md) —更早的自监督单目深度谱系
- [ZoeDepth](zoedepth.md) — 在相对深度预训练基础上加入度量尺度
- [Depth Anything](depth-anything.md) — 基于DPT架构构建的基础规模深度模型
- [Metric3D](metric3d.md) — 同样在海量混合数据上训练的度量深度路线
