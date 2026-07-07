# GS-ICP SLAM

> Ha 2024 · [論文](https://arxiv.org/abs/2403.12550)

**一行要約** — 「RGBD GS-ICP SLAM」は、Generalized ICPによるトラッキングと3DGSによるマッピングを、両者に共通するファクター — ガウシアン(平均+共分散) — を通じて融合し、トラッキングとマッピングの間で共分散が双方向に流れるようにすることで、システム全体で最大107 FPSを達成する。

## 問題

初期の3DGS SLAMシステム(SplaTAM、MonoGS、GS-SLAM)は、ガウシアンマップをレンダリングして密な光度誤差を最小化することでカメラをトラッキングする — 1フレームあたり数十回のラスタライズが必要であり、トラッキングは遅くなる。一方、分離型のシステム(Photo-SLAM、Orbeez-SLAM、vMAP)はORB-SLAMのフロントエンドをニューラルマップに後付けする形をとり、「トラッキング用にORB特徴情報を含む別個のマップ」を必要とし、その計算結果はマッピングには一切再利用されない。GS-ICP SLAMの着眼点は、3Dガウシアンはすでに確率分布そのものであり、G-ICPレジストレーションが必要とするのはまさに平均と共分散である — したがって「G-ICPと3DGSは同一のガウシアンワールドを共有できる」という点にある。

## 手法とアーキテクチャ

シーンは1組のガウシアン集合 $\boldsymbol{G}=\{\boldsymbol{\mathcal{X}},\boldsymbol{\mathcal{C}}\}$ (3D点と共分散、レンダリング用の色と不透明度の集合 $\boldsymbol{H},\boldsymbol{O}$ を含む)として表現される。各フレームでは、深度画像をダウンサンプリングして逆投影しソースガウシアンを生成し、マップに対してG-ICPでトラッキングを行い、(キーフレームの場合は)ソースガウシアンを新しいマップのプリミティブとして挿入する一方で、並行するマッピングスレッドがラスタライズによってそれらを最適化する。

- **G-ICPトラッキング**: 最近傍探索から得られる対応点 $\boldsymbol{x}^s_i \leftrightarrow \boldsymbol{x}^t_i$ と残差 $d_i=\boldsymbol{x}^t_i-\mathbf{T}\boldsymbol{x}^s_i$ において、各点はガウス確率変数であるため $d_i\sim\mathcal{N}(0,\,C^t_i+\mathbf{T}C^s_i\mathbf{T}^\top)$ となり、最大尤度推定により分布間(マハラノビス)の目的関数

$$\mathbf{T}^{*}=\operatorname*{argmin}_{\mathbf{T}}\sum_i^N d_i^{\top}\left(C_i^{t}+\mathbf{T}C_i^{s}\mathbf{T}^{\top}\right)^{-1}d_i ,$$

  が得られる。つまり、両分布の合成された不確かさで重み付けされたレジストレーションである。トラッキングのために画像がレンダリングされることは一度もない。
- **共分散の共有**: G-ICP中に現在フレームについて計算された共分散が、新たに挿入されるマップガウシアンの初期共分散として使われ、マップ側の最適化済みガウシアンがそのままG-ICPのターゲットとして機能する — 再計算も、密度化や不透明度リセットも不要である。
- **楕円スケール正則化(トラッキング)**: SVDによって $C=\boldsymbol{R}\boldsymbol{\Lambda}^{2}\boldsymbol{R}^{\top}$ に分解し、従来型の平面強制 $\boldsymbol{S}=[1,1,\epsilon]^{\top}$ の代わりに、スケールを $\boldsymbol{\Lambda}'=\frac{1}{median(\boldsymbol{S})}\,diag(s_2,s_1,s_0)$ として正規化する。これにより、すべてを平面に平坦化するのではなく、各マップガウシアンの最適化された形状(線や角)を保持できる。
- **スケール整合(マッピング)**: センサー点群は距離が離れるほど疎になるため、カメラから遠い場所のkNN共分散は大きくなりすぎる。新しいキーフレームのガウシアンは、挿入前に $\boldsymbol{\Lambda}''=\frac{1}{z^{p}}\boldsymbol{\Lambda}'$ ($p=1.5$が最良)として正規化される。
- **マッピング損失**: ガウシアンの位置、共分散、色、不透明度は $\lambda_{I_1}\mathcal{L}_1(I,I_{gt})+\lambda_{I_2}\mathcal{L}_{D\text{-}SSIM}(I,I_{gt})+\lambda_{D}\mathcal{L}_1(D,D_{gt})$ によって最適化され、各イテレーションで過去のキーフレームを1枚ランダムサンプリングして視点局所解への収束を回避し、さらに縮退したガウシアンの刈り込みを行う。
- **2段階のキーフレーム**: トラッキング用キーフレームはG-ICPの対応点の割合(トラッキングの副産物として無償で得られる)によって選ばれる。追加の「マッピング専用」キーフレームは、スキャンマッチング誤差をトラッキングに戻すことなく学習用視点を密にする。

## 実験結果

Ryzen 7 7800X3D + RTX 4090、RGB-D入力にて:

- **Replica ATE RMSE**: 8シーン平均0.16 cm — すべてのシーンで最良であり、従来最良(SplaTAM 0.36、GS-SLAM 0.50、Point-SLAM 0.54 cm)の半分未満。
- **Replicaのマップ品質/速度**: トラッキングを30 FPSに制限した場合、PSNR 38.83 dB / SSIM 0.975 / LPIPS 0.041(全シーンでSOTA。SplaTAM 33.89、Point-SLAM 35.62 dB)。速度制限なしの場合、システム全体で平均98.11 FPS、最高107.06 FPS(office1)に達し、それでも35.93 dBを維持する — SplaTAMの0.23 FPSやPoint-SLAMの0.30 FPSと比較される。
- **TUM RGB-D**: ATE平均2.4 cmで結合型システムの中で最良(SplaTAM 3.2、GS-SLAM 3.7、NICE-SLAM 4.0)。分離型のORB-SLAM3/Photo-SLAMは1.3 cmに達するが、別個の特徴マップを必要とする。システムは制限なしで73.92 FPSで動作し、PSNRはSplaTAMより約11.7%低いが — その速度は(30-FPSモードで)約92倍、最大227倍に達する。
- **アブレーション**: TUMにおける楕円 vs 平面 vs スケール正則化なしのATE比較: 2.37 vs 29.12 vs 236.54 cm。G-ICP共分散と $z^{1.5}$ スケール整合を使うことで、ReplicaのATEは8.89 cm / 24.81 dB(素朴なkNN初期化)から0.157 cm / 38.83 dBに改善する。

## SLAMにおける意義

GS-ICP SLAMは、古典的な幾何レジストレーションと現代の微分可能レンダリングが単一のデータ構造を共有できることを示している。幾何によってトラッキングし、見た目によってマッピングする — 両方に一つの確率的ガウシアンワールドが仕えるのである。概念的には、3DGSの潮流を数十年にわたるICPベースのRGB-D SLAM(KinectFusionの系譜)に再接続するものであり、また、トラッキングが決してレンダリングを行わないため、光度トラッカーを悩ませる露出変化に対して本質的に頑健である。実務者にとっては、密で写実的なSLAMが遅くなくてもよいことを示す代表的な実証例として位置づけられている。

## 関連ノート

- [SplaTAM](splatam.md)
- [MonoGS](monogs.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [RTG-SLAM](rtg-slam.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
