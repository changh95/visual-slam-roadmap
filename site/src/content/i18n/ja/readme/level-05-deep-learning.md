### キーコンセプト
- **[学習ベース対手作り(hand-crafted)](level-05-deep-learning/learned-vs-hand-crafted.md)** — 個々の古典的モジュール(特徴、深度、マッチング)をネットワークで置き換える手法 対 end-to-endな学習
- **[微分可能性](level-05-deep-learning/differentiability.md)** — 古典的な最適化(RANSAC、BA)を微分可能にし、学習を通せるようにすること
- **[基盤モデル](level-05-deep-learning/foundation-models.md)** — 再利用可能な知覚バックボーンとしての大規模事前学習モデル(CLIP、SAM、DUSt3R系)

> Level 5は5つの柱で構成される:
> **A. フロントエンド** — 手作りモジュールを置き換える学習ベースの知覚コンポーネント
> **B. バックエンド** — 古典的ソルバーを置き換える学習/certifiable(証明可能)な最適化
> **C. システム** — end-to-endな深層VO/SLAMパイプライン
> **D. シーン理解** — SLAM地図上でのセマンティック・言語・関係推論
> **E. 基盤モデル・ニューラルSLAM** — ポイントマップTransformer、NeRFおよび3DGSベースの高密度SLAMシステム

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


#### 学習ベースSLAMシステム

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**DROID-SLAM**](level-05-deep-learning/droid-slam.md) | [Teed 2021](https://arxiv.org/abs/2108.10869) | 微分可能なBA、高密度オプティカルフロー、end-to-endで学習 |
| [TartanVO](level-05-deep-learning/tartanvo.md) | [Wang 2021](https://arxiv.org/abs/2011.00359) | 汎化性の高いビジュアルオドメトリ |
| [**DPV-SLAM**](level-05-deep-learning/dpv-slam.md) | [Lipson 2024](https://arxiv.org/abs/2408.01654) | DPVO+ループクロージング、完全なSLAM(ECCV 2024) |
| [MAC-VO](level-05-deep-learning/mac-vo.md) | [Qiu 2024](https://arxiv.org/abs/2409.09479) | 学習ベースVO、メトリックスケールを考慮 |
| [**VoT**](level-05-deep-learning/vot.md) | [Yugay 2025](https://arxiv.org/abs/2510.03348) | Transformerを用いたビジュアルオドメトリ(後にFVOへ改題) |

#### 潜在表現SLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**CodeSLAM**](level-05-deep-learning/codeslam.md) | [Bloesch 2018](https://arxiv.org/abs/1804.00874) | 深度を128次元の潜在コードとして表現、コードと姿勢に対する輝度BA |
| [**SceneCode**](level-05-deep-learning/scenecode.md) | [Zhi 2019](https://arxiv.org/abs/1903.06482) | 深度とセマンティックを単一の潜在コードで表現、モダリティ間の制約 |
| [**DeepFactors**](level-05-deep-learning/deepfactors.md) | [Czarnowski 2020](https://arxiv.org/abs/2001.05049) | 確率的な深度コード+ファクターグラフ、GPUで30FPS以上 |
| [**NodeSLAM**](level-05-deep-learning/nodeslam.md) | [Sucar 2020](https://arxiv.org/abs/2004.04485) | 物体レベルのDeepSDFコード、物体ごとのoccupancy VAE |
| [**CodeMapping**](level-05-deep-learning/codemapping.md) | [Matsuki 2021](https://arxiv.org/abs/2107.08994) | 疎なSLAM+学習ベースの高密度マッピング、ハイブリッドアプローチ |

#### ニューラルレンダリング(参考)

> NeRF/3DGSベースのSLAMシステム → 以下の**柱E**を参照

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
| [**ConceptGraphs**](level-05-deep-learning/conceptgraphs.md) | [Gu 2023](https://arxiv.org/abs/2309.16650) | オープンボキャブラリな3Dシーングラフ、SAM+CLIP+LLMによる関係推論 |

---


#### セマンティック/言語グラウンディングSLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**ConceptFusion**](level-05-deep-learning/conceptfusion.md) | [Jatavallabhula (MIT) 2023](https://arxiv.org/abs/2302.07241) | CLIP特徴を3次元地図に融合、オープンボキャブラリな言語クエリ |
| [**LERF**](level-05-deep-learning/lerf.md) | [Kerr 2023](https://arxiv.org/abs/2303.09553) | 言語を埋め込んだRadiance Fields、DINOマルチスケール、NeRF+CLIP |
| [**OpenScene**](level-05-deep-learning/openscene.md) | [Peng (ETH) 2023](https://arxiv.org/abs/2211.15654) | 言語特徴を3次元点群に逆投影 |
| [**SpatialLM**](level-05-deep-learning/spatiallm.md) | [Mao 2025](https://github.com/manycore-research/SpatialLM) | 点群→LLM、Pythonスクリプトとして構造化された屋内モデリング |

> 関連項目: [**LEGS**](https://arxiv.org/abs/2409.18108)、[**OpenGS-SLAM**](https://arxiv.org/abs/2503.01646) (上記の柱E); [**Open-YOLO 3D**](https://arxiv.org/abs/2406.02548) (Level 5 物体検出)

### E. 基盤モデル・ニューラル表現SLAM

#### 基盤モデルSLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**DUSt3R**](level-05-deep-learning/dust3r.md) | [Wang 2024](https://arxiv.org/abs/2312.14132) | 画像ペアからのポイントマップ回帰、キャリブレーション不要 |
| [**MASt3R**](level-05-deep-learning/mast3r.md) | [Leroy 2024](https://arxiv.org/abs/2406.09756) | DUSt3R+ローカル特徴マッチング |
| [**MASt3R-SLAM**](level-05-deep-learning/mast3r-slam.md) | [Murai 2024](https://arxiv.org/abs/2412.12392) | MASt3Rの事前分布によるリアルタイム高密度SLAM |
| [**VGGT**](level-05-deep-learning/vggt.md) | [Wang (Meta) 2025](https://arxiv.org/abs/2503.11651) | N視点からの姿勢・深度・ポイントマップ・トラックのフィードフォワード推論(**CVPR 2025最優秀論文**) |
| [**VGGT-SLAM**](level-05-deep-learning/vggt-slam.md) | [Maggio 2025](https://arxiv.org/abs/2505.12549) | SL(4)多様体上で最適化された高密度RGB SLAM、VGGTフロントエンド |
| [**VGGT-SLAM 2.0**](level-05-deep-learning/vggt-slam-2-0.md) | [Maggio 2026](https://arxiv.org/abs/2601.19887) | リアルタイム高密度フィードフォワードシーン再構成 |
| [**VGGT-Geo**](level-05-deep-learning/vggt-geo.md) | [Qin 2026](https://www.mdpi.com/2220-9964/15/2/85) | 高密度屋内SLAMのためのVGGT事前分布の確率的幾何融合 |
| [**IGGT**](level-05-deep-learning/iggt.md) | [Li 2025](https://arxiv.org/abs/2510.22706) | インスタンスに基づく幾何Transformer — 3次元再構成とインスタンスレベル理解の統合 |
| [**AMB3R**](level-05-deep-learning/amb3r.md) | [Wang 2025](https://arxiv.org/abs/2511.20343) | バックエンドを備えた高精度フィードフォワードのメトリックスケール3次元再構成、SfM/SLAM対応 |
| [**MASt3R-Fusion**](level-05-deep-learning/mast3r-fusion.md) | [Zhou 2025](https://arxiv.org/abs/2509.20757) | MASt3Rフィードフォワード視覚モデル+IMU+GNSS融合 |

#### NeRFベース

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**iMAP**](level-05-deep-learning/imap.md) | [Sucar 2021](https://arxiv.org/abs/2103.12352) | 初のNeRF-SLAM、単一のMLP、リアルタイムトラッキング/マッピング |
| [**BARF**](level-05-deep-learning/barf.md) | [Lin 2021](https://arxiv.org/abs/2104.06405) | バンドル調整を行うNeRF、coarse-to-fineの位置エンコーディング、姿勢とNeRFの同時最適化(完全なSLAMではなく姿勢+NeRFの共同最適化) |
| [**NICE-SLAM**](level-05-deep-learning/nice-slam.md) | [Zhu & Peng 2022](https://arxiv.org/abs/2112.12130) | 階層的特徴グリッド(coarse/mid/fine)、スケーラブル |
| [**Co-SLAM**](level-05-deep-learning/co-slam.md) | [Wang 2023](https://arxiv.org/abs/2304.14377) | ハッシュグリッド(Instant-NGP)+座標エンコーディング、NICE-SLAMより5〜10倍高速 |
| [**ESLAM**](level-05-deep-learning/eslam.md) | [Johari 2023](https://arxiv.org/abs/2211.11704) | トライプレーン表現、O(N²)対O(N³)のメモリ使用量 |
| [**Point-SLAM**](level-05-deep-learning/point-slam.md) | [Sandström 2023](https://arxiv.org/abs/2304.04278) | ニューラル点群ベース |
| [**NeRF-SLAM**](level-05-deep-learning/nerf-slam.md) | [Rosinol 2023](https://arxiv.org/abs/2210.13641) | NeRF+古典的SLAMパイプライン |
| [**NICER-SLAM**](level-05-deep-learning/nicer-slam.md) | [Zhu 2024](https://arxiv.org/abs/2302.03594) | RGBのみのNeRF-SLAM(深度センサー不要)、モノキュラ深度の統合 |
| [**vMAP**](level-05-deep-learning/vmap.md) | [Kong 2023](https://arxiv.org/abs/2302.01838) | 物体レベルのNeRF-SLAM、物体ごとのニューラルフィールド |
| [**GO-SLAM**](level-05-deep-learning/go-slam.md) | [Zhang 2023](https://arxiv.org/abs/2309.02436) | グローバル最適化+NeRF-SLAM、ループクロージング+グローバルBA |

#### 3DGSベース

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**SplaTAM**](level-05-deep-learning/splatam.md) | [Keetha 2024](https://arxiv.org/abs/2312.02126) | 最初期の3DGS SLAMシステムの一つ(GS-SLAM、MonoGSと同時期)、RGB-D、シルエット誘導による高密度化 |
| [**MonoGS**](level-05-deep-learning/monogs.md) | [Matsuki 2024](https://arxiv.org/abs/2312.06741) | 初のモノキュラ3DGS SLAM(CVPR 2024 highlight)、ラスタライズベースの直接トラッキング、解析的カメラヤコビアン |
| [**GS-ICP SLAM**](level-05-deep-learning/gs-icp-slam.md) | [Ha 2024](https://arxiv.org/abs/2403.12550) | Gaussian-to-Gaussian ICP(マハラノビス距離)、幾何ベースのトラッキング |
| [**Photo-SLAM**](level-05-deep-learning/photo-slam.md) | [Huang 2024](https://arxiv.org/abs/2311.16728) | 明示的な幾何+暗示的な見た目表現(MLPによる色)、アンチエイリアシング |
| [**RTG-SLAM**](level-05-deep-learning/rtg-slam.md) | [Peng 2024](https://arxiv.org/abs/2404.19706) | リアルタイム重視、適応的なガウシアン数の制御、Jetson Orinで25FPS |
| [**EGG-Fusion**](level-05-deep-learning/egg-fusion.md) | [Pan 2025](https://arxiv.org/abs/2512.01296) | 幾何を考慮したガウシアンサーフェルのオンザフライ融合、情報フィルタベース、リアルタイム |
| [**Online 3DGS Modeling**](level-05-deep-learning/online-3dgs-modeling.md) | [Lee 2025](https://arxiv.org/abs/2508.14014) | 新規視点選択を伴うオンライン3Dガウシアンスプラッティングモデリング |
| [**ActiveSplat**](level-05-deep-learning/activesplat.md) | [Li 2025](https://arxiv.org/abs/2410.21955) | 3DGSによるアクティブマッピング+ボロノイ図ベースのパス計画 |
| [**OpenGS-SLAM**](level-05-deep-learning/opengs-slam.md) | [Yang 2025](https://arxiv.org/abs/2503.01646) | オープンセットな高密度セマンティック3DGS SLAM、物体レベルのシーン理解 |
| [**LEGS**](level-05-deep-learning/legs.md) | [Yu 2024](https://arxiv.org/abs/2409.18108) | 言語を埋め込んだガウシアンスプラット、リアルタイムに言語で問い合わせ可能な3D表現 |
