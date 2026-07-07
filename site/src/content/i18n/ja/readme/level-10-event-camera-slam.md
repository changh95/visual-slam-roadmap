### キーコンセプト
- **[イベントカメラ(DVS)](level-10-event-camera-slam/event-cameras-dvs.md)** — 画素ごとに非同期で輝度変化を検出、マイクロ秒単位の時間分解能
- **[利点](level-10-event-camera-slam/advantages.md)** — HDR(140dB以上)、モーションブラーなし、低レイテンシ、低消費電力
- **[課題](level-10-event-camera-slam/challenges.md)** — 絶対輝度が得られない、疎で非同期な出力、新たなアルゴリズムが必要
- **[イベント表現](level-10-event-camera-slam/event-representations.md)** — イベントフレーム、time surface、ボクセルグリッド、spike tensor

### 基礎

| リソース | 著者/年 | キーコンセプト |
|----------|-------------|--------------|
| [**Event-based Vision Survey**](level-10-event-camera-slam/event-based-vision-survey.md) | [Gallego 2020](https://arxiv.org/abs/1904.08405) | イベントカメラアルゴリズムの包括的サーベイ |
| [Awesome-Event-based-SLAM](https://github.com/KwanWaiPang/Awesome-Event-based-SLAM) | KwanWaiPang | イベントベースSLAM論文を厳選したGitHubリスト |

### システム

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**EVO**](level-10-event-camera-slam/evo.md) | [Rebecq 2017](https://rpg.ifi.uzh.ch/docs/RAL16_EVO.pdf) | イベントベースビジュアルオドメトリ、イベントからの3次元再構成 |
| [**ESVO**](level-10-event-camera-slam/esvo.md) | [Zhou 2021](https://arxiv.org/abs/2007.15548) | イベントベースステレオビジュアルオドメトリ |
| [**Ultimate-SLAM**](level-10-event-camera-slam/ultimate-slam.md) | [Vidal 2018](https://arxiv.org/abs/1709.06310) | イベント+フレーム+IMU融合 |
| [**EKLT**](level-10-event-camera-slam/eklt.md) | [Gehrig 2020](https://rpg.ifi.uzh.ch/docs/IJCV19_Gehrig.pdf) | イベントベースKLT特徴点追跡 |
| [**ESVIO**](level-10-event-camera-slam/esvio.md) | [Chen 2023](https://arxiv.org/abs/2212.13184) | イベントベースステレオVIO |
| [**EDS**](level-10-event-camera-slam/eds.md) | [Hidalgo-Carrió 2022](https://rpg.ifi.uzh.ch/docs/CVPR22_Hidalgo.pdf) | イベント支援による直接疎オドメトリ |
| [**DEVO**](level-10-event-camera-slam/devo.md) | [Klenk 2024](https://arxiv.org/abs/2312.09800) | 深層学習によるイベントベースビジュアルオドメトリ、DPVO流のパッチベース、シミュレートされたイベントで学習 |
| [**VIO-GO**](level-10-event-camera-slam/vio-go.md) | [Sakhrieh 2025](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2025.1541017/full) | HDRシナリオ向けにパラメータを最適化したイベントベースVIO |
