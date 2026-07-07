### キーコンセプト
- **[学習ベース対手作り(hand-crafted)](level-05-deep-learning/learned-vs-hand-crafted.md)** — 個々の古典的モジュール(特徴、深度、マッチング)をネットワークで置き換える手法 対 end-to-endな学習
- **[微分可能性](level-05-deep-learning/differentiability.md)** — 古典的な最適化(RANSAC、BA)を微分可能にし、学習を通せるようにすること
- **[基盤モデル](level-05-deep-learning/foundation-models.md)** — 再利用可能な知覚バックボーンとしての大規模事前学習モデル(CLIP、SAM、DUSt3R系)

> Level 5は4つの柱で構成される:
> **A. フロントエンド** — 手作りモジュールを置き換える学習ベースの知覚コンポーネント
> **B. バックエンド** — 古典的ソルバーを置き換える学習/certifiable(証明可能)な最適化
> **C. システム** — end-to-endな深層VO/SLAMパイプライン
> **D. シーン理解** — SLAM地図上でのセマンティック・言語・関係推論

### A. 深層フロントエンド — 知覚

#### 特徴点検出とマッチング

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**NetVLAD**](level-05-deep-learning/netvlad.md) | [Arandjelović 2016](https://arxiv.org/abs/1511.07247) | VLAD、場所認識 |
| [**SuperPoint**](level-05-deep-learning/superpoint.md) | [DeTone 2017](https://arxiv.org/abs/1712.07629) | Homographic Adaptation、自己教師あり、VGGエンコーダ+検出器/記述子ヘッド |
| [HardNet](level-05-deep-learning/hardnet.md) | [Mishchuk 2017](https://arxiv.org/abs/1705.10872) | 学習されたローカル記述子 |
| [**R2D2**](level-05-deep-learning/r2d2.md) | [Revaud 2019](https://arxiv.org/abs/1906.06195) | 再現性と信頼性を備えた検出器/記述子、明示的な再現性/信頼性マップ |
| [KeyNet](level-05-deep-learning/keynet.md) | [Barroso-Laguna 2019](https://arxiv.org/abs/1904.00889) | 学習された特徴点検出器 |
| [**HF-Net**](level-05-deep-learning/hf-net.md) | [Sarlin 2019](https://arxiv.org/abs/1812.03506) | グローバル特徴、ローカル特徴、視覚的位置推定 |
| [**SuperGlue**](level-05-deep-learning/superglue.md) | [Sarlin 2020](https://arxiv.org/abs/1911.11763) | Self/Cross-attention GNN、Sinkhornによる最適割当、外れ値のためのdustbin |
| [**DISK**](level-05-deep-learning/disk.md) | [Tyszkiewicz 2020](https://arxiv.org/abs/2006.13566) | ポリシー勾配(強化学習)による学習、マッチの成否を報酬として利用 |
| [Patch NetVLAD](level-05-deep-learning/patch-netvlad.md) | [Hausler 2021](https://arxiv.org/abs/2103.01486) | マルチスケールなパッチレベルVLAD |
| [**LoFTR**](level-05-deep-learning/loftr.md) | [Sun 2021](https://arxiv.org/abs/2104.00680) | 検出器不要、Transformerによるcoarse-to-fineの高密度マッチング |
| [**LightGlue**](level-05-deep-learning/lightglue.md) | [Lindenberger 2023](https://arxiv.org/abs/2306.13643) | 適応的な深さ/幅、SuperGlueより5〜10倍高速 |
| [**XFeat**](level-05-deep-learning/xfeat.md) | [Potje 2024](https://arxiv.org/abs/2404.19174) | 0.3Mパラメータ、1400FPS(RTX 4090)、64次元記述子、組込み向け |
| [**RoMa**](level-05-deep-learning/roma.md) | [Edstedt 2024](https://arxiv.org/abs/2305.15404) | DINOv2基盤特徴+coarse-to-fineの高密度マッチング |
| [**DeDoDe**](level-05-deep-learning/dedode.md) | [Edstedt 2024](https://arxiv.org/abs/2308.08479) | 検出と記述を単一段で同時に行う |
| [**RoMa v2**](level-05-deep-learning/roma-v2.md) | [Edstedt 2025](https://arxiv.org/abs/2511.15706) | より難しく・より良く・より速く・より密な高密度特徴マッチング |

#### 深度推定

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [MonoDepth](level-05-deep-learning/monodepth.md) | [Godard 2016](https://arxiv.org/abs/1609.03677) | 左右画像間の輝度一貫性、自己教師あり |
| [**MiDaS**](level-05-deep-learning/midas.md) | [Ranftl 2020](https://arxiv.org/abs/1907.01341) | 複数データセットの混合学習、スケール・シフト不変な損失、相対深度 |
| [**DPT**](level-05-deep-learning/dpt.md) | [Ranftl 2021](https://arxiv.org/abs/2103.13413) | Dense Prediction Transformer(ViTバックボーン)、グローバルコンテキスト |
| [**ZoeDepth**](level-05-deep-learning/zoedepth.md) | [Bhat 2023](https://arxiv.org/abs/2302.12288) | ゼロショットのメトリック深度、Metric Bins Module |
| [**Metric3D**](level-05-deep-learning/metric3d.md) | [Yin 2023](https://arxiv.org/abs/2307.10984) | カメラ内部パラメータを条件としたメトリック深度、Canonical Camera Space |
| [**Depth Anything**](level-05-deep-learning/depth-anything.md) | [Yang 2024](https://arxiv.org/abs/2401.10891) | 6200万枚の画像、モノキュラ深度のための基盤モデル |
| [**Depth Anything V2**](level-05-deep-learning/depth-anything-v2.md) | [Yang 2024](https://arxiv.org/abs/2406.09414) | 合成データによる改善、エッジ保存性の向上 |
| [**Marigold**](level-05-deep-learning/marigold.md) | [Ke 2024](https://arxiv.org/abs/2312.02145) | 深度推定のためのStable Diffusion、細部の再現、サンプリングによる不確実性推定 |
| [**Align3R**](level-05-deep-learning/align3r.md) | [Lu 2025](https://arxiv.org/abs/2412.03079) | 動画の時間的一貫性、DUSt3Rベース、CVPR 2025 Highlight |
| [**Masked Depth Modeling (LingBot-Depth)**](level-05-deep-learning/masked-depth-modeling-lingbot-depth.md) | [Tan 2026](https://arxiv.org/abs/2601.17895) | ガラス・鏡・金属でのRGB-D失敗を修正 |

#### オプティカルフローとシーンフロー

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**FlowNet**](level-05-deep-learning/flownet.md) | [Dosovitskiy 2015](https://arxiv.org/abs/1504.06852) | 初のend-to-endな深層オプティカルフロー(SimpleNet / CorrNet) |
| [**FlowNet 2.0**](level-05-deep-learning/flownet-2-0.md) | [Ilg 2017](https://arxiv.org/abs/1612.01925) | スタック型ネットワーク、古典手法並みの精度 |
| [**PWC-Net**](level-05-deep-learning/pwc-net.md) | [Sun 2018](https://arxiv.org/abs/1709.02371) | Pyramid-Warping-Costボリューム、coarse-to-fine、840万パラメータ |
| [**FlowNet3D**](level-05-deep-learning/flownet3d.md) | [Liu 2019](https://arxiv.org/abs/1806.01411) | 点群シーンフロー、PointNet++ベース |
| [**RAFT**](level-05-deep-learning/raft.md) | [Teed 2020](https://arxiv.org/abs/2003.12039) | All-Pairs Correlation+反復的ConvGRU更新、**ECCV最優秀論文** |
| [**RAFT-3D**](level-05-deep-learning/raft-3d.md) | [Teed 2021](https://arxiv.org/abs/2012.00726) | RAFTによるシーンフロー(3次元運動) |
| [**FlowFormer**](level-05-deep-learning/flowformer.md) | [Huang 2022](https://arxiv.org/abs/2203.16194) | コストボリュームトークン上のTransformer、グローバルコンテキスト |
| [**SEA-RAFT**](level-05-deep-learning/sea-raft.md) | [Wang 2024](https://arxiv.org/abs/2405.14793) | リアルタイム向けの効率的なRAFT派生 |

#### カメラ姿勢回帰とリローカリゼーション

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**PoseNet**](level-05-deep-learning/posenet.md) | [Kendall 2015](https://arxiv.org/abs/1505.07427) | CNNベースの6自由度姿勢回帰(APR)、GoogLeNetバックボーン |
| [**DSAC**](level-05-deep-learning/dsac.md) | [Brachmann 2017](https://arxiv.org/abs/1611.05705) | 微分可能なRANSAC、シーン座標回帰(SCR) |
| [**DSAC++**](level-05-deep-learning/dsacpp.md) | [Brachmann 2018](https://arxiv.org/abs/1711.10228) | 自己教師あり、RGB-D対応 |
| [CNN Pose Regression Limitations](level-05-deep-learning/cnn-pose-regression-limitations.md) | [Sattler 2019](https://arxiv.org/abs/1903.07504) | 姿勢回帰の性能は画像検索の性能とほぼ同等 |
| [LM-Reloc](level-05-deep-learning/lm-reloc.md) | [von Stumberg 2020](https://arxiv.org/abs/2010.06323) | 深層学習による直接リローカリゼーション |
| [**DSAC\***](level-05-deep-learning/dsac-star.md) | [Brachmann 2021](https://arxiv.org/abs/2002.12324) | RGB/RGB-Dからの視覚的リローカリゼーション、学習の安定性を改善(TPAMI) |
| [**ACE**](level-05-deep-learning/ace.md) | [Brachmann 2023](https://arxiv.org/abs/2305.14059) | Accelerated Coordinate Encoding、シーンあたり5分の学習 |
| [**ACE Zero**](level-05-deep-learning/ace-zero.md) | [Brachmann 2024](https://arxiv.org/abs/2404.14351) | ゼロショットSCR、事前構築済み3次元地図が不要 |
| [**ACE-G**](level-05-deep-learning/ace-g.md) | [Bruns 2025](https://arxiv.org/abs/2510.11605) | クエリの事前学習による汎化可能なSCR、ファインチューニングなしで新規シーンに対応 |
| [**ACE-SLAM**](level-05-deep-learning/ace-slam.md) | [Alzugaray 2025](https://arxiv.org/abs/2512.14032) | ニューラル陰関数によるリアルタイムSLAM、ネットワークの重み=地図 |
| [**hloc**](level-05-deep-learning/hloc.md) | [Sarlin 2019](https://github.com/cvg/Hierarchical-Localization) | HF-Netの階層的位置推定(粗い(NetVLAD)→精密(SuperGlue))を実装したツールボックス |

#### SLAMのための物体検出とセグメンテーション

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**YOLO**](level-05-deep-learning/yolo.md) (v1→v11) | [Redmon 2016→2024](https://arxiv.org/abs/1506.02640) | リアルタイム物体検出、Ultralyticsエコシステム |
| [**DETR**](level-05-deep-learning/detr.md) | [Carion 2020](https://arxiv.org/abs/2005.12872) | Transformerによる検出、アンカーフリー、NMS不要 |
| [**RT-DETR**](level-05-deep-learning/rt-detr.md) | [Zhao (Baidu) 2023](https://arxiv.org/abs/2304.08069) | リアルタイムDETR、YOLOの速度+Transformerの精度 |
| [**SAM**](level-05-deep-learning/sam.md) | [Kirillov 2023](https://arxiv.org/abs/2304.02643) | Segment Anything、プロンプトベース、基盤モデル |
| [**SAM 2**](level-05-deep-learning/sam-2.md) | [Meta 2024](https://arxiv.org/abs/2408.00714) | 動画セグメンテーション、Memory Attention、時間的一貫性 |
| [**Grounding DINO**](level-05-deep-learning/grounding-dino.md) | [Liu 2023](https://arxiv.org/abs/2303.05499) | テキストプロンプトによる検出→SAMパイプライン(Grounded SAM) |
| [**Open-YOLO 3D**](level-05-deep-learning/open-yolo-3d.md) | [Boudjoghra 2024](https://arxiv.org/abs/2406.02548) | 2Dオープンボキャブラリ検出→3Dインスタンスセグメンテーション、16倍高速 |

### B. 深層バックエンド — 最適化

#### 微分可能バンドル調整

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**BA-Net**](level-05-deep-learning/ba-net.md) | [Tang 2019](https://arxiv.org/abs/1806.04807) | FPN+微分可能なLM層、end-to-endなSfM(ICLR) |
| [**DROID-SLAM**](level-05-deep-learning/droid-slam.md) | [Teed 2021](https://arxiv.org/abs/2108.10869) | 高密度オプティカルフロー+微分可能な高密度BA、全画素の再投影 |
| [**DPVO**](level-05-deep-learning/dpvo.md) | [Teed 2023](https://arxiv.org/abs/2208.04726) | パッチベースのDROID-SLAM、30FPS以上のリアルタイム動作 |
| [**Theseus**](level-05-deep-learning/theseus.md) | [Pineda (Meta) 2022](https://arxiv.org/abs/2207.09442) | 微分可能な非線形最適化ライブラリ(PyTorch) |
| [**Lietorch**](level-05-deep-learning/lietorch.md) | [Teed 2021](https://github.com/princeton-vl/lietorch) | PyTorch向けのリー群演算(SE(3)/SO(3)) |

#### 証明可能な最適アルゴリズム

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**SE-Sync**](level-02-getting-familiar/se-sync.md) | [Rosen 2019](https://arxiv.org/abs/1611.00128) | SDP+リーマン最適化による証明可能なポーズグラフ最適化(arXiv 2016、IJRR 2019) |
| [**TEASER++**](level-02-getting-familiar/teaserpp.md) | [Yang 2020](https://arxiv.org/abs/2001.07715) | 点群レジストレーション、90%以上の外れ値にロバスト、TLS+最大クリーク(T-RO/RSS 2020) |
| [**GNC**](level-02-getting-familiar/gnc.md) | [Yang 2020](https://arxiv.org/abs/1909.08605) | Graduated Non-Convexity、凸関数からロバストコストへの連続変形 |
| [**QUASAR**](level-02-getting-familiar/quasar.md) | [Yang 2019](https://arxiv.org/abs/1905.12536) | 証明可能な最適回転探索(外れ値を含むWahba問題)、クォータニオンQCQP+SDP緩和 |

#### ガウス信念伝播とグラフプロセッサ

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**FutureMapping 1**](level-02-getting-familiar/futuremapping-1.md) | [Davison 2018](https://arxiv.org/abs/1803.11288) | Spatial AIの計算構造、SLAMのためのGBP |
| [**FutureMapping 2**](level-02-getting-familiar/futuremapping-2.md) | [Davison 2019](https://arxiv.org/abs/1910.14139) | Spatial AIの中核プリミティブとしてのGBP、GBPへの視覚的な入門 |
| [**BA on Graph Processor**](level-02-getting-familiar/ba-on-graph-processor.md) | [Ortiz 2020](https://arxiv.org/abs/2003.03134) | Graphcore IPU上でのバンドル調整、タイルベースの並列処理 |
| [**DANCeRS**](level-02-getting-familiar/dancers.md) | [Patwardhan 2025](https://arxiv.org/abs/2508.18153) | GBPベースのロボット群における分散合意形成 |

### C. End-to-Endな深層VO/SLAMシステム

#### 自己教師あり・学習ベースVO

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [DeepVO](level-05-deep-learning/deepvo.md) | [Wang 2017](https://arxiv.org/abs/1709.08429) | 教師あり学習 |
| [SfM-Learner](level-05-deep-learning/sfm-learner.md) | [Zhou 2017](https://arxiv.org/abs/1704.07813) | 教師なし、深層深度+深層姿勢 |
| [DeMoN](level-05-deep-learning/demon.md) | [Ummenhofer 2017](https://arxiv.org/abs/1612.02401) | 2フレームからの深度+運動、エンコーダ・デコーダ |
| [UndeepVO](level-05-deep-learning/undeepvo.md) | [Li 2018](https://arxiv.org/abs/1709.06841) | ステレオによる自己教師あり、絶対スケールの復元 |
| [DeepTAM](level-05-deep-learning/deeptam.md) | [Zhou 2018](https://arxiv.org/abs/1808.01900) | 深層学習によるトラッキングとマッピング、コストボリュームベース |
| [DeepV2D](level-05-deep-learning/deepv2d.md) | [Teed 2018](https://arxiv.org/abs/1812.04605) | 動画からの反復的深度推定、微分可能な幾何層 |
| [Depth from Videos in the Wild](level-05-deep-learning/depth-from-videos-in-the-wild.md) | [Gordon 2019](https://arxiv.org/abs/1904.04998) | 制約のない動画からの深度推定、学習されたカメラ内部パラメータ |
| [Neural Ray Surfaces](level-05-deep-learning/neural-ray-surfaces.md) | [Vasiljevic 2020](https://arxiv.org/abs/2008.06630) | 学習されたレイサーフェスモデル、非ピンホールカメラ |
| [GradSLAM](level-05-deep-learning/gradslam.md) | [Murthy 2020](https://arxiv.org/abs/1910.10672) | 微分可能なSLAMフレームワーク(PyTorch、複数のSLAMバックエンドに対応) |
| [DeepSLAM](level-05-deep-learning/deepslam.md) | [Li 2020](https://ieeexplore.ieee.org/document/9047170) | TrackingNet、MappingNet、LoopNet |
| [MonoRec](level-05-deep-learning/monorec.md) | [Wimbauer 2021](https://arxiv.org/abs/2011.11814) | 自己教師ありモノキュラ3次元再構成、移動物体対応 |
| [TANDEM](level-05-deep-learning/tandem.md) | [Koestler 2021](https://arxiv.org/abs/2111.07418) | MVS深度によるリアルタイムトラッキング+高密度マッピング、DSOベース |
| [**DROID-SLAM**](level-05-deep-learning/droid-slam.md) | [Teed 2021](https://arxiv.org/abs/2108.10869) | 高密度BA+相関、TartanAir/EuRoCでSOTA(→ 微分可能BAを参照) |
| [**DPVO**](level-05-deep-learning/dpvo.md) | [Teed 2023](https://arxiv.org/abs/2208.04726) | パッチベースの軽量DROID(→ 微分可能BAを参照) |

#### 潜在表現SLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**CodeSLAM**](level-05-deep-learning/codeslam.md) | [Bloesch 2018](https://arxiv.org/abs/1804.00874) | 深度を128次元の潜在コードとして表現、コードと姿勢に対する輝度BA |
| [**SceneCode**](level-05-deep-learning/scenecode.md) | [Zhi 2019](https://arxiv.org/abs/1903.06482) | 深度とセマンティックを単一の潜在コードで表現、モダリティ間の制約 |
| [**DeepFactors**](level-05-deep-learning/deepfactors.md) | [Czarnowski 2020](https://arxiv.org/abs/2001.05049) | 確率的な深度コード+ファクターグラフ、GPUで30FPS以上 |
| [**NodeSLAM**](level-05-deep-learning/nodeslam.md) | [Sucar 2020](https://arxiv.org/abs/2004.04485) | 物体レベルのDeepSDFコード、物体ごとのoccupancy VAE |
| [**CodeMapping**](level-05-deep-learning/codemapping.md) | [Matsuki 2021](https://arxiv.org/abs/2107.08994) | 疎なSLAM+学習ベースの高密度マッピング、ハイブリッドアプローチ |

#### ニューラルレンダリング(参考)

> NeRF/3DGSベースのSLAMシステム → **Level 3: ニューラル表現SLAM** を参照

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**NeRF**](level-05-deep-learning/nerf.md) | [Mildenhall 2020](https://arxiv.org/abs/2003.08934) | Neural Radiance Fields、新規視点合成(基礎的研究) |
| [**DIFIX3D+**](level-05-deep-learning/difix3d.md) | [Wu 2025](https://arxiv.org/abs/2503.01774) | 3次元再構成のアーティファクト除去のための単一ステップ拡散モデル(後処理) |

### D. シーン理解

#### ベンチマークと基盤

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**EFM3D**](level-05-deep-learning/efm3d.md) | [Straub (Meta) 2024](https://arxiv.org/abs/2406.10224) | 一人称視点の基盤モデルのための3Dベンチマーク、一人称視点動画からの深度・表面・セマンティック推定 |

#### 3Dシーングラフ

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [Kimera / 3D Dynamic Scene Graph](level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) | [Rosinol 2020](https://arxiv.org/abs/2002.06289) | Kimera-VIO、Kimera-Mesher、Kimera-PGMO、Kimera-Semantics、Kimera-DSG(ステレオ/モノキュラの視覚慣性パイプライン) |
| [**Hydra**](level-05-deep-learning/hydra.md) | [Hughes (MIT SPARK) 2022](https://arxiv.org/abs/2201.13360) | リアルタイムな階層的シーングラフ(メッシュ→物体→場所→部屋→建物) |
| [**Hydra-Multi**](level-05-deep-learning/hydra-multi.md) | [Chang 2023](https://arxiv.org/abs/2304.13487) | 分散マルチロボット3Dシーングラフ |
| [**Clio**](level-05-deep-learning/clio.md) | [Maggio (MIT SPARK) 2024](https://arxiv.org/abs/2404.13696) | オープンセットなタスク駆動型シーングラフ、ノードごとのCLIP埋め込み |
| [**Khronos**](level-05-deep-learning/khronos.md) | [Schmid (MIT SPARK) 2024](https://arxiv.org/abs/2402.13817) | 時空間シーングラフ、動的物体の履歴追跡 |
| [**ConceptGraphs**](level-05-deep-learning/conceptgraphs.md) | [Gu 2023](https://arxiv.org/abs/2309.16650) | オープンボキャブラリな3Dシーングラフ、SAM+CLIP+LLMによる関係推論(→ Level 3のセマンティックにも掲載) |
