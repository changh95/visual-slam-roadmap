### キーコンセプト
- **[VOとSLAMの違い](level-03-monocular-slam/vo-vs-slam.md)** — VOは局所的(ループクロージングなし)、SLAMはグローバルな地図とループクロージングを含む
- **[スケールの曖昧性](level-03-monocular-slam/scale-ambiguity.md)** — モノキュラSLAMの根本的な限界。古典的手法では幾何情報だけから絶対スケールを復元することはできない(Metric3DやMASt3Rのような学習済みメトリック深度の事前分布があれば近似的なスケールを与えることができる)
- **[共視グラフ(Covisibility graph)](level-03-monocular-slam/covisibility-graph.md)** — キーフレーム間で共有される地図点の可視性。ORB-SLAMの中核データ構造
- **[視覚的場所認識(VPR)](level-03-monocular-slam/visual-place-recognition-vpr.md)** — ループクロージングのために、以前訪れた場所を認識すること
- **[自己教師あり深度推定](level-03-monocular-slam/self-supervised-depth.md)** — 正解データなしでモノキュラ深度を学習する手法(Monodepth2、Godard 2019)

### 特徴点ベースSLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [Visual Odometry](level-03-monocular-slam/visual-odometry.md) | [Nistér 2004](https://ieeexplore.ieee.org/document/1315094) | 5点法によるEssential行列解法、RANSAC、三角測量、VO(局所のみ、ループクロージングなし) |
| [**MonoSLAM**](level-03-monocular-slam/monoslam.md) | [Davison 2007](https://ieeexplore.ieee.org/document/4160954) | **初のリアルタイムモノキュラSLAM**、EKFベース、単眼カメラ、疎な3次元地図、確率的特徴点初期化 |
| [PTAM](level-03-monocular-slam/ptam.md) | [Klein & Murray 2007](https://www.robots.ox.ac.uk/~gk/publications/KleinMurray2007ISMAR.pdf) | FAST特徴点、トラッキング、**フロントエンド/バックエンドの分離**、並列スレッド、キーフレーム、マッピング、バンドル調整、手動初期化 |
| [Visual-SLAM why filter?](level-03-monocular-slam/visual-slam-why-filter.md) | [Strasdat 2012](https://doi.org/10.1016/j.imavis.2012.02.009) | バンドル調整、スケールを考慮したBA、動きのみのBA(Motion-only BA) |
| [**ORB-SLAM**](level-03-monocular-slam/orb-slam.md) | [Mur-Artal 2015](https://arxiv.org/abs/1502.00956) | ORB特徴点、**自動初期化(HomographyとFundamentalの選択)**、トラッキングスレッド、ローカル(共視グラフベース)BA+ループクロージング時のグローバルBA、ローカルマッピング、大規模環境対応、ループクロージング、Bag of Visual Words、グローバル最適化、共視グラフ、**地図点管理(削減・統合)** |
| [Pop-up SLAM](level-03-monocular-slam/pop-up-slam.md) | [Yang 2016](https://arxiv.org/abs/1703.07334) | 線特徴・平面特徴 |
| [PL-SLAM](level-03-monocular-slam/pl-slam.md) | [Pumarola 2017](https://www.albertpumarola.com/research/pl-slam/index.html) | 点特徴・線特徴 |
| [**ORB-SLAM2**](level-03-monocular-slam/orb-slam2.md) | [Mur-Artal 2017](https://arxiv.org/abs/1610.06475) | → ステレオSLAMへ、→ RGB-D SLAMへ |
| [CubeSLAM](level-03-monocular-slam/cubeslam.md) | [Yang 2019](https://arxiv.org/abs/1806.00557) | モノキュラ3D立方体検出+SLAM、9自由度の物体表現 |
| [OpenVSLAM](level-03-monocular-slam/openvslam.md) | [Sumikura 2019](https://arxiv.org/abs/1910.01122) | ORBベースのSLAMフレームワーク、透視投影/魚眼/正距円筒カメラモデル、地図の保存・読込+位置推定モード |
| [**Stella-VSLAM**](level-03-monocular-slam/stella-vslam.md) | [Community 2021](https://github.com/stella-cv/stella_vslam) | OpenVSLAMの後継、ライセンス再編(→ Level 7にも掲載) |
| [UcoSLAM](level-03-monocular-slam/ucoslam.md) | [Muñoz-Salinas 2019](https://arxiv.org/abs/1902.03729) | フィデューシャルマーカー |
| [DeepFusion](level-03-monocular-slam/deepfusion.md) | [Laidlow 2019](https://arxiv.org/abs/2207.12244) | 高密度モノキュラ再構成、準高密度MVS+CNNによる深度・勾配予測、学習された不確実性を用いた確率的融合 |
| [**ORB-SLAM3**](level-03-monocular-slam/orb-slam3.md) | [Campos 2020](https://arxiv.org/abs/2007.11898) | モノキュラ+ステレオ+VIO、マルチマップ、IMU統合 |
| [DXSLAM](level-03-monocular-slam/dxslam.md) | [Li 2020](https://arxiv.org/abs/2008.05416) | SLAMのための深層特徴 |
| [**PyCuVSLAM**](level-03-monocular-slam/pycuvslam.md) | [NVIDIA 2025](https://github.com/NVlabs/pycuvslam) | Python+CUDAによるGPU加速VSLAMツールキット(cuVSLAMラッパー;ステレオ/マルチカメラVIO) |

### 直接法SLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**DTAM**](level-03-monocular-slam/dtam.md) | [Newcombe 2011](https://ieeexplore.ieee.org/document/6126513) | 高密度マッピング、キーフレームマッピング、GPGPU |
| [**LSD-SLAM**](level-03-monocular-slam/lsd-slam.md) | [Engel 2014](https://cvg.cit.tum.de/research/vslam/lsdslam) | 輝度誤差最小化、高勾配画素・エッジ、大規模環境対応、ループクロージング、ポーズグラフ最適化 |
| [**DSO**](level-03-monocular-slam/dso.md) | [Engel 2016](https://arxiv.org/abs/1607.02565) | 輝度バンドル調整、スライディングウィンドウBA、ループクロージング/グローバル最適化なし |
| [**LDSO**](level-03-monocular-slam/ldso.md) | [Gao 2018](https://arxiv.org/abs/1808.01111) | DSO+ループクロージング(BoWベース)、DSOの主な弱点に対応 |
| [CNN-SLAM](level-03-monocular-slam/cnn-slam.md) | [Tateno 2017](https://arxiv.org/abs/1704.03489) | LSD-SLAMの深度+深層学習による深度、セマンティックラベル |
| [DVSO](level-03-monocular-slam/dvso.md) | [Yang 2018](https://arxiv.org/abs/1807.02570) | 深層学習による単眼深度推定、StackNet |
| [D3VO](level-03-monocular-slam/d3vo.md) | [Yang 2020](https://arxiv.org/abs/2003.01060) | 深層学習による単眼深度推定、深層姿勢推定、深層偶然的不確実性(aleatoric uncertainty) |

### 準直接法(ハイブリッド)

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [SVO](level-03-monocular-slam/svo.md) | [Forster 2014](https://ieeexplore.ieee.org/document/6906584) | FAST特徴点検出、疎な直接画像アライメント、深度フィルタ |
| [SVO2](level-03-monocular-slam/svo2.md) | [Forster 2017](https://rpg.ifi.uzh.ch/svo2.html) | マルチカメラ/魚眼、確率的深度推定、直接法の収束性、疎な手法、バンドル調整 |
| [**Stereo DSO**](level-07-stereo-slam/stereo-dso.md) | [Wang 2017](https://arxiv.org/abs/1708.07878) | → ステレオSLAMへ |
| [VI-DSO](level-06-vio-vins/vi-dso.md) | [von Stumberg 2018](https://arxiv.org/abs/1804.05625) | → VIO/VINSへ |

### 学習ベースSLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**DROID-SLAM**](level-03-monocular-slam/droid-slam.md) | [Teed 2021](https://arxiv.org/abs/2108.10869) | 微分可能なBA、高密度オプティカルフロー、end-to-endで学習(→ Level 5にも掲載) |
| [TartanVO](level-03-monocular-slam/tartanvo.md) | [Wang 2021](https://arxiv.org/abs/2011.00359) | 汎化性の高いビジュアルオドメトリ |
| [**DPVO**](level-03-monocular-slam/dpvo.md) | [Teed 2023](https://arxiv.org/abs/2208.04726) | パッチベースの軽量DROID-SLAM、リアルタイムVO(→ Level 5にも掲載) |
| [**DPV-SLAM**](level-03-monocular-slam/dpv-slam.md) | [Lipson 2024](https://arxiv.org/abs/2408.01654) | DPVO+ループクロージング、完全なSLAM(ECCV 2024) |
| [MAC-VO](level-03-monocular-slam/mac-vo.md) | [Qiu 2024](https://arxiv.org/abs/2409.09479) | 学習ベースVO、メトリックスケールを考慮 |
| [**VoT**](level-03-monocular-slam/vot.md) | [Yugay 2025](https://arxiv.org/abs/2510.03348) | Transformerを用いたビジュアルオドメトリ(後にFVOへ改題) |

### 基盤モデルSLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**DUSt3R**](level-03-monocular-slam/dust3r.md) | [Wang 2024](https://arxiv.org/abs/2312.14132) | 画像ペアからのポイントマップ回帰、キャリブレーション不要 |
| [**MASt3R**](level-03-monocular-slam/mast3r.md) | [Leroy 2024](https://arxiv.org/abs/2406.09756) | DUSt3R+ローカル特徴マッチング |
| [**MASt3R-SLAM**](level-03-monocular-slam/mast3r-slam.md) | [Murai 2024](https://arxiv.org/abs/2412.12392) | MASt3Rの事前分布によるリアルタイム高密度SLAM |
| [**VGGT**](level-03-monocular-slam/vggt.md) | [Wang (Meta) 2025](https://arxiv.org/abs/2503.11651) | N視点からの姿勢・深度・ポイントマップ・トラックのフィードフォワード推論(**CVPR 2025最優秀論文**) |
| [**VGGT-SLAM**](level-03-monocular-slam/vggt-slam.md) | [Maggio 2025](https://arxiv.org/abs/2505.12549) | SL(4)多様体上で最適化された高密度RGB SLAM、VGGTフロントエンド |
| [**VGGT-SLAM 2.0**](level-03-monocular-slam/vggt-slam-2-0.md) | [Maggio 2026](https://arxiv.org/abs/2601.19887) | リアルタイム高密度フィードフォワードシーン再構成 |
| [**VGGT-Geo**](level-03-monocular-slam/vggt-geo.md) | [Qin 2026](https://www.mdpi.com/2220-9964/15/2/85) | 高密度屋内SLAMのためのVGGT事前分布の確率的幾何融合 |
| [**IGGT**](level-03-monocular-slam/iggt.md) | [Li 2025](https://arxiv.org/abs/2510.22706) | インスタンスに基づく幾何Transformer — 3次元再構成とインスタンスレベル理解の統合 |
| [**AMB3R**](level-03-monocular-slam/amb3r.md) | [Wang 2025](https://arxiv.org/abs/2511.20343) | バックエンドを備えた高精度フィードフォワードのメトリックスケール3次元再構成、SfM/SLAM対応 |
| [**MASt3R-Fusion**](level-03-monocular-slam/mast3r-fusion.md) | [Zhou 2025](https://arxiv.org/abs/2509.20757) | MASt3Rフィードフォワード視覚モデル+IMU+GNSS融合 |

#### SfMツール

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**COLMAP**](level-03-monocular-slam/colmap.md) | [Schönberger 2016](https://colmap.github.io/) | デファクトスタンダードとなる逐次SfM+MVSパイプライン(C++/CUDA、pycolmapバインディング) |
| [**GLOMAP**](level-03-monocular-slam/glomap.md) | [Pan 2024](https://arxiv.org/abs/2407.20219) | グローバルSfMの再考 — COLMAP互換、大幅に高速なマッピング |
| [**InstantSfM**](level-03-monocular-slam/instantsfm.md) | [Zhong 2025](https://arxiv.org/abs/2510.13310) | GPUネイティブな疎性を考慮したSfMパイプライン、COLMAPに対する大幅な高速化 |

### ニューラル表現SLAM

#### NeRFベース

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**iMAP**](level-03-monocular-slam/imap.md) | [Sucar 2021](https://arxiv.org/abs/2103.12352) | 初のNeRF-SLAM、単一のMLP、リアルタイムトラッキング/マッピング |
| [**BARF**](level-03-monocular-slam/barf.md) | [Lin 2021](https://arxiv.org/abs/2104.06405) | バンドル調整を行うNeRF、coarse-to-fineの位置エンコーディング、姿勢とNeRFの同時最適化(完全なSLAMではなく姿勢+NeRFの共同最適化) |
| [**NICE-SLAM**](level-03-monocular-slam/nice-slam.md) | [Zhu & Peng 2022](https://arxiv.org/abs/2112.12130) | 階層的特徴グリッド(coarse/mid/fine)、スケーラブル |
| [**Co-SLAM**](level-03-monocular-slam/co-slam.md) | [Wang 2023](https://arxiv.org/abs/2304.14377) | ハッシュグリッド(Instant-NGP)+座標エンコーディング、NICE-SLAMより5〜10倍高速 |
| [**ESLAM**](level-03-monocular-slam/eslam.md) | [Johari 2023](https://arxiv.org/abs/2211.11704) | トライプレーン表現、O(N²)対O(N³)のメモリ使用量 |
| [**Point-SLAM**](level-03-monocular-slam/point-slam.md) | [Sandström 2023](https://arxiv.org/abs/2304.04278) | ニューラル点群ベース |
| [**NeRF-SLAM**](level-03-monocular-slam/nerf-slam.md) | [Rosinol 2023](https://arxiv.org/abs/2210.13641) | NeRF+古典的SLAMパイプライン |
| [**NICER-SLAM**](level-03-monocular-slam/nicer-slam.md) | [Zhu 2024](https://arxiv.org/abs/2302.03594) | RGBのみのNeRF-SLAM(深度センサー不要)、モノキュラ深度の統合 |
| [**vMAP**](level-03-monocular-slam/vmap.md) | [Kong 2023](https://arxiv.org/abs/2302.01838) | 物体レベルのNeRF-SLAM、物体ごとのニューラルフィールド |
| [**GO-SLAM**](level-03-monocular-slam/go-slam.md) | [Zhang 2023](https://arxiv.org/abs/2309.02436) | グローバル最適化+NeRF-SLAM、ループクロージング+グローバルBA |

#### 3DGSベース

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**SplaTAM**](level-03-monocular-slam/splatam.md) | [Keetha 2024](https://arxiv.org/abs/2312.02126) | 最初期の3DGS SLAMシステムの一つ(GS-SLAM、MonoGSと同時期)、RGB-D、シルエット誘導による高密度化 |
| [**MonoGS**](level-03-monocular-slam/monogs.md) | [Matsuki 2024](https://arxiv.org/abs/2312.06741) | 初のモノキュラ3DGS SLAM(CVPR 2024 highlight)、ラスタライズベースの直接トラッキング、解析的カメラヤコビアン |
| [**GS-ICP SLAM**](level-03-monocular-slam/gs-icp-slam.md) | [Ha 2024](https://arxiv.org/abs/2403.12550) | Gaussian-to-Gaussian ICP(マハラノビス距離)、幾何ベースのトラッキング |
| [**Photo-SLAM**](level-03-monocular-slam/photo-slam.md) | [Huang 2024](https://arxiv.org/abs/2311.16728) | 明示的な幾何+暗示的な見た目表現(MLPによる色)、アンチエイリアシング |
| [**RTG-SLAM**](level-03-monocular-slam/rtg-slam.md) | [Peng 2024](https://arxiv.org/abs/2404.19706) | リアルタイム重視、適応的なガウシアン数の制御、Jetson Orinで25FPS |
| [**EGG-Fusion**](level-03-monocular-slam/egg-fusion.md) | [Pan 2025](https://arxiv.org/abs/2512.01296) | 幾何を考慮したガウシアンサーフェルのオンザフライ融合、情報フィルタベース、リアルタイム |
| [**Online 3DGS Modeling**](level-03-monocular-slam/online-3dgs-modeling.md) | [Lee 2025](https://arxiv.org/abs/2508.14014) | 新規視点選択を伴うオンライン3Dガウシアンスプラッティングモデリング |
| [**ActiveSplat**](level-03-monocular-slam/activesplat.md) | [Li 2025](https://arxiv.org/abs/2410.21955) | 3DGSによるアクティブマッピング+ボロノイ図ベースのパス計画 |
| [**OpenGS-SLAM**](level-03-monocular-slam/opengs-slam.md) | [Yang 2025](https://arxiv.org/abs/2503.01646) | オープンセットな高密度セマンティック3DGS SLAM、物体レベルのシーン理解 |
| [**LEGS**](level-03-monocular-slam/legs.md) | [Yu 2024](https://arxiv.org/abs/2409.18108) | 言語を埋め込んだガウシアンスプラット、リアルタイムに言語で問い合わせ可能な3D表現 |

### セマンティック/言語グラウンディングSLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**ConceptFusion**](level-03-monocular-slam/conceptfusion.md) | [Jatavallabhula (MIT) 2023](https://arxiv.org/abs/2302.07241) | CLIP特徴を3次元地図に融合、オープンボキャブラリな言語クエリ |
| [**LERF**](level-03-monocular-slam/lerf.md) | [Kerr 2023](https://arxiv.org/abs/2303.09553) | 言語を埋め込んだRadiance Fields、DINOマルチスケール、NeRF+CLIP |
| [**OpenScene**](level-03-monocular-slam/openscene.md) | [Peng (ETH) 2023](https://arxiv.org/abs/2211.15654) | 言語特徴を3次元点群に逆投影 |
| [**ConceptGraphs**](level-05-deep-learning/conceptgraphs.md) | [Gu 2023](https://arxiv.org/abs/2309.16650) | オープンボキャブラリな3Dシーングラフ、SAM+CLIP+LLMによる空間関係 |
| [**SpatialLM**](level-03-monocular-slam/spatiallm.md) | [Mao 2025](https://github.com/manycore-research/SpatialLM) | 点群→LLM、Pythonスクリプトとして構造化された屋内モデリング |

> 関連項目: [**LEGS**](https://arxiv.org/abs/2409.18108)、[**OpenGS-SLAM**](https://arxiv.org/abs/2503.01646) (上記3DGSベースの節); [**Open-YOLO 3D**](https://arxiv.org/abs/2406.02548) (Level 5 物体検出)

### 動的環境SLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**DynaSLAM**](level-03-monocular-slam/dynaslam.md) | [Bescós 2018](https://arxiv.org/abs/1806.05620) | Mask R-CNNによる動的物体除去+背景インペインティング、ORB-SLAM2ベース |
| [DS-SLAM](level-03-monocular-slam/ds-slam.md) | [Yu 2018](https://arxiv.org/abs/1809.08379) | セマンティックセグメンテーション(SegNet)+動き整合性チェック |
| [MaskFusion](level-03-monocular-slam/maskfusion.md) | [Rünz 2018](https://arxiv.org/abs/1804.09194) | RGB-Dによる複数移動物体の認識・トラッキング・再構成 |
| [MID-Fusion](level-03-monocular-slam/mid-fusion.md) | [Xu 2019](https://arxiv.org/abs/1812.07976) | Octreeベースの物体レベル・マルチインスタンス動的RGB-D SLAM |
| [**VDO-SLAM**](level-03-monocular-slam/vdo-slam.md) | [Zhang 2020](https://arxiv.org/abs/2005.11052) | 動的物体を考慮したSLAM、カメラと物体の運動を同時推定 |
| [DynaSLAM II](level-03-monocular-slam/dynaslam-ii.md) | [Bescós 2021](https://arxiv.org/abs/2010.07820) | 密結合なマルチ物体トラッキングとSLAM |
| [**MonST3R**](level-03-monocular-slam/monst3r.md) | [Zhang 2024](https://arxiv.org/abs/2410.03825) | 動きが存在する状況下でのDUSt3R系ポイントマップ推定 |
