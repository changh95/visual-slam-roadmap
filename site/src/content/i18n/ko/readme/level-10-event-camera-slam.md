### 핵심 개념
- **[이벤트 카메라(DVS)](level-10-event-camera-slam/event-cameras-dvs.md)** — 비동기적 픽셀별 밝기 변화 감지, μs 단위 시간 해상도
- **[장점](level-10-event-camera-slam/advantages.md)** — HDR(140dB 이상), 모션 블러 없음, 저지연, 저전력
- **[과제](level-10-event-camera-slam/challenges.md)** — 절대 밝기 값 없음, 희소한 비동기 출력, 새로운 알고리즘 필요
- **[이벤트 표현](level-10-event-camera-slam/event-representations.md)** — 이벤트 프레임, 타임 서피스, 복셀 그리드, 스파이크 텐서

### 기초

| 자료 | 저자/연도 | 핵심 개념 |
|----------|-------------|--------------|
| [**Event-based Vision Survey**](level-10-event-camera-slam/event-based-vision-survey.md) | [Gallego 2020](https://arxiv.org/abs/1904.08405) | 이벤트 카메라 알고리즘에 대한 포괄적인 서베이 |
| [Awesome-Event-based-SLAM](https://github.com/KwanWaiPang/Awesome-Event-based-SLAM) | KwanWaiPang | 이벤트 기반 SLAM 논문을 정리한 GitHub 목록 |

### 시스템

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**EVO**](level-10-event-camera-slam/evo.md) | [Rebecq 2017](https://rpg.ifi.uzh.ch/docs/RAL16_EVO.pdf) | 이벤트 기반 시각 오도메트리, 이벤트로부터의 3D 재구성 |
| [**ESVO**](level-10-event-camera-slam/esvo.md) | [Zhou 2021](https://arxiv.org/abs/2007.15548) | 이벤트 기반 스테레오 시각 오도메트리 |
| [**Ultimate-SLAM**](level-10-event-camera-slam/ultimate-slam.md) | [Vidal 2018](https://arxiv.org/abs/1709.06310) | 이벤트 + 프레임 + IMU 융합 |
| [**EKLT**](level-10-event-camera-slam/eklt.md) | [Gehrig 2020](https://rpg.ifi.uzh.ch/docs/IJCV19_Gehrig.pdf) | 이벤트 기반 KLT 특징 추적 |
| [**ESVIO**](level-10-event-camera-slam/esvio.md) | [Chen 2023](https://arxiv.org/abs/2212.13184) | 이벤트 기반 스테레오 VIO |
| [**EDS**](level-10-event-camera-slam/eds.md) | [Hidalgo-Carrió 2022](https://rpg.ifi.uzh.ch/docs/CVPR22_Hidalgo.pdf) | 이벤트 보조 직접 희소 오도메트리 |
| [**DEVO**](level-10-event-camera-slam/devo.md) | [Klenk 2024](https://arxiv.org/abs/2312.09800) | 딥러닝 기반 이벤트 시각 오도메트리, DPVO 방식의 패치 기반, 시뮬레이션된 이벤트로 학습 |
| [**VIO-GO**](level-10-event-camera-slam/vio-go.md) | [Sakhrieh 2025](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2025.1541017/full) | HDR 상황에 최적화된 파라미터를 갖춘 이벤트 기반 VIO |
