### 关键概念
- **[事件相机(DVS)](level-10-event-camera-slam/event-cameras-dvs.md)** — 异步逐像素亮度变化检测，微秒级时间分辨率
- **[优势](level-10-event-camera-slam/advantages.md)** — 高动态范围(140dB+)、无运动模糊、低延迟、低功耗
- **[挑战](level-10-event-camera-slam/challenges.md)** — 无绝对亮度信息、稀疏异步输出、需要全新的算法
- **[事件表征方式](level-10-event-camera-slam/event-representations.md)** — 事件帧、时间面(time surfaces)、体素网格、脉冲张量(spike tensors)

### 基础

| 资料 | 作者/年份 | 关键概念 |
|----------|-------------|--------------|
| [**事件相机视觉综述(Event-based Vision Survey)**](level-10-event-camera-slam/event-based-vision-survey.md) | [Gallego 2020](https://arxiv.org/abs/1904.08405) | 事件相机算法的全面综述 |
| [Awesome-Event-based-SLAM](https://github.com/KwanWaiPang/Awesome-Event-based-SLAM) | KwanWaiPang | 事件相机SLAM论文的GitHub精选列表 |

### 系统

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**EVO**](level-10-event-camera-slam/evo.md) | [Rebecq 2017](https://rpg.ifi.uzh.ch/docs/RAL16_EVO.pdf) | 基于事件的视觉里程计，从事件中进行3D重建 |
| [**ESVO**](level-10-event-camera-slam/esvo.md) | [Zhou 2021](https://arxiv.org/abs/2007.15548) | 基于事件的立体视觉里程计 |
| [**Ultimate-SLAM**](level-10-event-camera-slam/ultimate-slam.md) | [Vidal 2018](https://arxiv.org/abs/1709.06310) | 事件+图像帧+IMU融合 |
| [**EKLT**](level-10-event-camera-slam/eklt.md) | [Gehrig 2020](https://rpg.ifi.uzh.ch/docs/IJCV19_Gehrig.pdf) | 基于事件的KLT特征跟踪 |
| [**ESVIO**](level-10-event-camera-slam/esvio.md) | [Chen 2023](https://arxiv.org/abs/2212.13184) | 基于事件的立体VIO |
| [**EDS**](level-10-event-camera-slam/eds.md) | [Hidalgo-Carrió 2022](https://rpg.ifi.uzh.ch/docs/CVPR22_Hidalgo.pdf) | 事件辅助的直接法稀疏里程计 |
| [**DEVO**](level-10-event-camera-slam/devo.md) | [Klenk 2024](https://arxiv.org/abs/2312.09800) | 深度事件相机视觉里程计，DPVO式基于图像块方法，在模拟事件数据上训练 |
| [**VIO-GO**](level-10-event-camera-slam/vio-go.md) | [Sakhrieh 2025](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2025.1541017/full) | 针对HDR场景优化参数的事件相机VIO |
