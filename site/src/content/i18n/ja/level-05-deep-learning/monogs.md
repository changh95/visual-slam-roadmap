# MonoGS

> Matsuki 2024 · [論文](https://arxiv.org/abs/2312.06741)

**一行要約** — 「Gaussian Splatting SLAM」(CVPR 2024ハイライト): 単眼SLAMにおける3D Gaussian Splattingの最初の応用であり、Gaussianを唯一の3D表現として用い、ラスタライズされた地図に対する直接最適化によってカメラを追跡し、3 fpsでライブ動作する。

## 問題

3D Gaussian Splattingは高速な微分可能ラスタライゼーションによってフォトリアリスティックな地図を生成するが、元の3DGSアルゴリズムは「オフラインのStructure from Motion(SfM)システムからの正確な姿勢を必要とする」 — これはバッチ処理の手法であり、姿勢は所与のものとされる。それをSLAMの*内部で*使うことは逆を意味する。ライブカメラから漸進的にGaussianを構築しながら、そのGaussianから姿勢を推定するということである。「視覚SLAMにとって最も基本的だが最も困難な設定」である単一の単眼RGBストリームにおいて、ラスタライゼーションは視線方向に沿って何の制約も課さず、新しく挿入されたGaussianは複数の視点がそれを制約するまで幾何学的に曖昧なままである。

## 手法とアーキテクチャ

地図は非等方的なGaussianの集合 $\mathcal{G}$ であり、各Gaussianは色 $c^i$、不透明度 $\alpha^i$、ワールド座標系の平均 $\boldsymbol{\mu}_W^i$、共分散 $\boldsymbol{\Sigma}_W^i$ を持つ(球面調和関数は省略)。ピクセルの色は、深度順にソートされた $\mathcal{N}$ 個のGaussianをスプラットしてアルファブレンディングすることで合成される。

$$\mathcal{C}_p=\sum_{i\in\mathcal{N}}c_i\alpha_i\prod_{j=1}^{i-1}(1-\alpha_j), \qquad \mathcal{D}_p=\sum_{i\in\mathcal{N}}z_i\alpha_i\prod_{j=1}^{i-1}(1-\alpha_j),$$

ここで $z_i$ はレイに沿ったGaussian $i$ までの距離である(深度も同様の方法でラスタライズされる)。画像への投影は $\boldsymbol{\mu}_I=\pi(\boldsymbol{T}_{CW}\cdot\boldsymbol{\mu}_W)$、$\boldsymbol{\Sigma}_I=\mathbf{J}\mathbf{W}\boldsymbol{\Sigma}_W\mathbf{W}^\top\mathbf{J}^\top$ であり、$\boldsymbol{T}_{CW}\in SE(3)$ はカメラ姿勢、$\mathbf{J}$ は線形化された投影のヤコビ行列、$\mathbf{W}$ は $\boldsymbol{T}_{CW}$ の回転成分である。

- **リー群上の解析的カメラヤコビ行列**(本論文の重要な導出): 追跡には1フレームあたり約50〜100回の勾配降下反復が必要であるため、自動微分の代わりに、$\boldsymbol{\mu}_I$ と $\boldsymbol{\Sigma}_I$ の $\boldsymbol{T}_{CW}$ に対する微分は、多様体の微分 $\frac{\mathcal{D}f(\boldsymbol{T})}{\mathcal{D}\boldsymbol{T}}\triangleq\lim_{\tau\to 0}\frac{\mathrm{Log}(f(\mathrm{Exp}(\tau)\circ\boldsymbol{T})\circ f(\boldsymbol{T})^{-1})}{\tau}$ を用いて閉形式で導出され、以下のような最小のヤコビ行列を与える。

$$\frac{\mathcal{D}\boldsymbol{\mu}_C}{\mathcal{D}\boldsymbol{T}_{CW}}=\begin{bmatrix}\boldsymbol{I} & -\boldsymbol{\mu}_C^{\times}\end{bmatrix},$$

  ここで $\boldsymbol{\mu}_C^{\times}$ はカメラ座標系におけるGaussian中心の反対称行列である。これらはCUDAラスタライザに直接組み込まれる。
- **追跡**: 現在の姿勢のみが最適化され、光度学的残差 $E_{pho}=\lVert I(\mathcal{G},\boldsymbol{T}_{CW})-\bar{I}\rVert_1$ を最小化する(露出のためのアフィン輝度パラメータを伴う)。深度が利用可能な場合、幾何学的残差 $E_{geo}=\lVert D(\mathcal{G},\boldsymbol{T}_{CW})-\bar{D}\rVert_1$ が $\lambda_{pho}E_{pho}+(1-\lambda_{pho})E_{geo}$、$\lambda_{pho}=0.9$ として追加される。
- **Gaussianの可視性によるキーフレーミング**: ウィンドウ $\mathcal{W}_k$(8〜10キーフレーム)は、2つのフレームで可視なGaussianのIoU(intersection-over-union)を用いて管理される。可視性の共有度が低下するか、並進が中央深度の一定割合を超えるとキーフレームになる。Gaussianはレイに沿ってソートされるため、遮蔽は設計上処理される。
- **挿入と剪定**: 新しいGaussianは観測された深度(RGB-D)から初期化されるか、レンダリングされた/中央深度の周りに分散を持ってサンプリングされる(単眼)。直近3キーフレームで挿入されたが少なくとも3つの他フレームから観測されていないGaussianは、幾何学的に不安定として剪定される。
- **等方性正則化を伴うマッピング**: ラスタライゼーションは視線方向に沿ってGaussianを制約しないままにするため、マッピングは細長いスケールにペナルティを課す $E_{iso}=\sum_{i=1}^{|\mathcal{G}|}\lVert\mathbf{s}_i-\tilde{\mathbf{s}_i}\cdot\mathbf{1}\rVert_1$ を追加し、ウィンドウ内のキーフレーム姿勢とGaussianを同時に最適化する。$\min\sum_{k\in\mathcal{W}}E^k_{pho}+\lambda_{iso}E_{iso}$、$\lambda_{iso}=10$、忘却を防ぐために反復ごとに過去の2つのランダムなキーフレームを用いる。

## 実験結果

RTX 4090搭載のデスクトップ上(マルチプロセス実装、単眼で3 fpsのライブ動作)で以下を得る。

- **TUM RGB-D、単眼ATE RMSE(cm)**: fr1/desk、fr2/xyz、fr3/officeでそれぞれ3.78 / 4.60 / 3.50(平均3.96)。深いモデル事前分布を一切使わずにDROID-VO(7.73)、DepthCov-VO(25.2)、DSO(11.0)を上回り、ループ閉じ込みを持つシステム(ORB-SLAM2: 1.60)に近づく。
- **TUM RGB-Dモード**: 平均1.47 cm — レンダリングベースの手法の中で最良(ESLAM 2.00、Point-SLAM 3.04)であり、ループ閉じ込みを持つBAD-SLAM(1.50)よりも優れる。
- **Replica RGB-D ATE**: 平均0.58 cm(単一プロセスでは0.32 cm、8シーケンス中6でPoint-SLAMの0.53を上回り最良)。
- **Replicaレンダリング**: 769レンダリングFPSでPSNR 38.94 dB、SSIM 0.968、LPIPS 0.070 — 深度ガイド付きレイサンプリングを必要とするPoint-SLAMの1.33 FPSで35.17 dBに対して。
- **メモリ**: TUM上で2.6 MB(単眼)/ 3.97 MB(RGB-D)の地図、NICE-SLAMの40 MBに対して。
- **収束範囲**: 開始点をずらした姿勢最適化は79〜82%の試行で収束する。対してハッシュグリッドSDFは14%、MLP SDFは33% — Gaussianはハッシングや位置エンコーディングとは異なり、3D空間で滑らかな勾配場を形成する。
- アブレーション: $E_{iso}$ を除去すると単眼ATEは3.96から4.83に悪化する。キーフレーム選択を除去すると8.73に悪化する。定性的には、深度センサーが見逃す細いワイヤーや透明な物体を再構成できる。

## SLAMにおける意義

MonoGSはGaussian-splatting SLAMへの正統な*単眼*入口である。レンダリング品質の地図とカメラ追跡が1つの微分可能な表現をインタラクティブなレートで共有できることを示した。その解析的ヤコビ行列・直接整合の定式化は、splatting SLAMを直接的な手法(DTAM、LSD-SLAM、DSO)に結びつけている — はるかに豊かな地図に適用された同じ光度学的原理であり、その可視性に基づくキーフレーミングはDSOのウィンドウ管理を反映している。これはMonoSLAMとiMAPと同じインペリアル・カレッジの研究室から生まれたものであり、それぞれがその時代の地図表現を再定義してきた。

## ハンズオン

- [Gaussian Splatting SLAMを実行する](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/gaussian_splatting_slam)

## 関連ノート

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [Photo-SLAM](photo-slam.md)
- [DTAM](../level-03-monocular-slam/dtam.md)
- [DSO](../level-03-monocular-slam/dso.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
