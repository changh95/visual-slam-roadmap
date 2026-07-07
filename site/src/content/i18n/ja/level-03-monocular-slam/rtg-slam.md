# RTG-SLAM

> Peng 2024 · [論文](https://arxiv.org/abs/2404.19706)

**一行要約** — リアルタイムGaussian SLAM(SIGGRAPH 2024)。コンパクトな二値不透明度Gaussian表現、サーフェル風の深度レンダリング、そして不安定なGaussianのみを最適化し、そのピクセルのみをレンダリングするオンザフライ方式によって、3DGS再構成を大規模シーンにスケールさせる。

## 問題

初期の3DGS SLAMシステムは毎フレームすべてのGaussianを最適化し、すべてのピクセルをレンダリングしていたため、コストはマップの規模に応じて増大していた——同時期で最速のGaussian SLAMでも合成データのReplicaにおいて8.34 fpsであり、実世界の大規模シーン全体を示したものはなかった。素の3DGSはまた、多数の重なり合う半透明Gaussianで表面をフィットさせるため、メモリと計算の両面で無駄が多い。RTG-SLAMは「Gaussian splattingを用いてRGBDカメラで大規模環境をリアルタイム3D再構成するシステム」であり、フレームごとのコストがマップ規模ではなく*変化量*に追随するように構築されている。

## 手法とアーキテクチャ

各Gaussianは位置$\mathbf{p}_i$、共分散$\boldsymbol{\Sigma}_i$(スケール$\mathbf{s}_i$+四元数$\mathbf{q}_i$)、不透明度$\alpha_i$、SH係数を持ち、さらに法線$\mathbf{n}_i$、信頼度カウント$\eta_i$、タイムスタンプ$t_i$を持つ楕円ディスク(サーフェル)として扱われる。不透明度は生成時に固定される。**opaque(不透明)**($\alpha=0.99$、表面と主要な色にフィット)または**nearly transparent(ほぼ透明)**($\alpha=0.1$、残差色にフィット)のいずれかであり、深いアルファ合成の積み重ねは行わない。

- **色とデプスのレンダリングの違い**: 色は標準的なアルファブレンディング$\hat{\mathbf{C}}(\mathbf{u})=\sum_{i=1}^{n}\mathbf{c}_{i}f_{i}(\mathbf{u})\prod_{j=1}^{i-1}(1-f_{j}(\mathbf{u}))$を用い、$f(\mathbf{u})=\alpha_{i}\exp(-\frac{1}{2}(\mathbf{u}-\boldsymbol{\mu})^{\top}\boldsymbol{\Sigma}_{2D,i}^{-1}(\mathbf{u}-\boldsymbol{\mu}))$と光透過率マップ$\hat{\mathbf{T}}(\mathbf{u})=\prod_{i}(1-f_{i}(\mathbf{u}))$を伴う。デプスは*異なる*方式でレンダリングされる。レイに沿って$\alpha^{\mathbf{r}}_{j}>\delta_{\alpha}=e^{-0.5}$を満たす最初の不透明Gaussianをディスクとみなし、ピクセルデプスはレイと平面の交点

$$\mathbf{p}_{G_{j}^{\mathbf{r}},\mathbf{r}}=(\mathbf{R}_{g}\mathbf{K}^{-1}\dot{\mathbf{u}})\,\theta_{\mathbf{u}}+\mathbf{t}_{g},\qquad \theta_{\mathbf{u}}=\frac{(\mathbf{p}_{j}^{\mathbf{r}}-\mathbf{t}_{g})\cdot\mathbf{n}_{j}^{\mathbf{r}}}{(\mathbf{R}_{g}\mathbf{K}^{-1}\dot{\mathbf{u}})\cdot\mathbf{n}_{j}^{\mathbf{r}}},$$

  から得られる。これは完全に微分可能であり、単一の不透明Gaussianだけで局所的な表面パッチをフィットできる。法線マップとインデックスマップも同一のパスから得られる。
- **ターゲット指向のGaussian追加**: フレームごとに、幾何を必要とするピクセルを選ぶマスク$M_{s}$(透過率$\hat{\mathbf{T}}_{k}(\mathbf{u})>\delta_{\mathbf{T}}=0.5$、新規観測)または$|\hat{\mathbf{D}}_{k}-\mathbf{D}_{k}|>\delta_{d}=0.1$(デプス誤差)、および色誤差のみが$\delta_{c}=0.1$を超えるピクセルのマスク$M_{c}$を作り、マスクされたピクセルの5%をサンプルする。$M_s$のピクセルは不透明Gaussianを、$M_c$のピクセルは既存の不透明Gaussianが既に安定している場合にのみ小さな透明Gaussianを生成する。
- **安定/不安定な最適化**: 信頼度$\eta>\delta_{\eta}$のGaussianは安定とみなされ固定される。「不安定なGaussianのみを最適化し、不安定なGaussianが占めるピクセルのみをレンダリングする」方式で、$L=w_{c}L_{color}+w_{d}L_{depth}+w_{reg}L_{reg}$($L_1$の色/デプス損失、$L_{reg}$は透明Gaussianの幾何を固定、$w_c=w_d=1$、$w_{reg}=1000$)を用いる。最適化済みのウィンドウは重み付き平均$G_{o}=(1-w_{curr})G_{o-1}+w_{curr}G^{\prime}_{o}$によって以前の状態と融合され、忘却を回避する。誤差が繰り返される安定Gaussianは不安定状態に戻され、長期にわたって不安定なものは外れ値として削除される。
- **トラッキング**: レンダリングされたデプス/法線マップに対する古典的なフレーム対モデルICPにより、点対平面誤差$E(\boldsymbol{\xi})=\sum\lVert(\mathbf{T}_{g,k}\mathbf{V}_{k}^{l}(\mathbf{u})-\hat{\mathbf{V}}_{k-1}^{g*}(\hat{\mathbf{u}}))\cdot\hat{\mathbf{N}}_{k-1}^{*}(\hat{\mathbf{u}})\rVert$をマルチレベルICPで最小化し、加えてORB-SLAM2風のランドマーク/ポーズグラフバックエンドを持つ。キーフレーム(30°または0.3 mごと)は誤差上位40%のピクセルの大域最適化を発生させる。

## 実験結果

i9-13900KF + RTX 4090上、Azure Kinectによるライブスキャンで:

- **実世界の大規模シーン**: 廊下、倉庫、ホテルの部屋、住宅、オフィス(43〜100 m²)がライブで約16 fpsで再構成された。約70 m²の住宅シーンでは17.9 fps、8.8 GBメモリ、対するCo-SLAMは8.65 fps / 17.3 GB(SOTAのNeRF SLAMの「約2倍の速度、半分のメモリコスト」)。SplaTAMは0.31 fpsにとどまり、7,155,880個のGaussianを使用してメモリ不足に陥る(RTG-SLAMは987,524個)。
- **Replica office0のスループット**: 全体で17.24 FPS。トラッキング0.02秒/フレーム、マッピング3.5ミリ秒/イテレーション、ピークメモリ2751 MB — SplaTAMの再構成速度の約46倍。
- **TUM ATE RMSE**: 1.66 / 0.38 / 1.13 cm(fr1_desk / fr2_xyz / fr3_office)、平均1.06 cm — ESLAM(2.11)、Point-SLAM(2.38)、SplaTAM(3.39)を上回り、ORB-SLAM2(1.00)に近い。
- **ScanNet++の幾何精度(GT姿勢)**: 精度0.95 cm / 完全性1.11 cm、SplaTAM(1.32/1.54)より優れ、Point-SLAM(サンプリングにグラウンドトゥルースデプスを使用)を除くすべてのNeRF手法を上回る。
- アブレーションでは、コンパクトなGaussianはアルファブレンディングされたデプスと同等の精度を得るために必要なプリミティブ数が大幅に少ないこと、また不透明のみのマップは透明な残差レイヤーがない場合に新規視点からの色誤差に悩まされることが示された。

## SLAMにおける意義

RTG-SLAMは、Gaussian SLAMの計算量をマップ規模ではなく変化量に比例させる方法を示した——これは古典的な大規模SLAMを扱いやすくした洞察(局所BA、共視性ウィンドウ)と同じ発想を、KinectFusion風のICPトラッキングとサーフェル風の信頼度管理を通じてスプラッティングの時代に翻案したものである。その安定/不安定な状態管理とディスクベースのデプスレンダリングは、Gaussian SLAMを実際の建物や実際のロボットにスケールさせるための参照デザインとなった。

## 関連ノート

- [SplaTAM](splatam.md)
- [Photo-SLAM](photo-slam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [MonoGS](monogs.md)
- [EGG-Fusion](egg-fusion.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
