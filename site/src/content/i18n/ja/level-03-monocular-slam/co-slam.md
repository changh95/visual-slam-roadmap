# Co-SLAM

> Wang 2023 · [論文](https://arxiv.org/abs/2304.14377)

**一行要約** — Instant-NGP式のマルチ解像度ハッシュグリッドと滑らかなone-blob座標エンコーディングをニューラルSLAMのために組み合わせ、NICE-SLAMよりはるかに高速な10-17 Hzで動作しながら、一貫した表面を保持する。

## 問題

座標エンコーディングMLPはコヒーレンスと滑らかさの事前分布を持ち、高忠実度で穴埋めされた再構成を与えるが、逐次的に最適化すると「収束が遅く、致命的な忘却」を起こす。パラメトリックエンコーディング(特徴グリッド)は高速だが「穴埋めと滑らかさに欠ける」。NICE-SLAMはスケーラブルだがリアルタイムには遠く及ばず、そのローカルグリッドは未観測領域を補完できない。Co-SLAM("Joint Coordinate and Sparse Parametric Encodings for Neural Real-Time SLAM")は、単一のリアルタイムRGB-D SLAMシステムでこれら両方の特性を同時に得ることを目指す。

## 手法とアーキテクチャ

既知の内部パラメータを持つRGB-Dストリームが与えられたとき、Co-SLAMはカメラ姿勢 $\{\xi_t\}$ と、世界座標を色とtruncated signed distance(TSDF)にマッピングするニューラルフィールド $f_\theta(\mathbf{x})\mapsto(\mathbf{c},s)$ を同時に最適化する。**結合エンコーディング**は、滑らかなOne-blob座標エンコーディング $\gamma(\mathbf{x})$ と、Instant-NGPマルチ解像度ハッシュグリッド $\mathcal{V}_\alpha$($R_{min}$から$R_{max}$までのレベル、三線形補間)からの特徴を連結する。2つの小さなMLPがデコードする。

$$f_\tau(\gamma(\mathbf{x}),\mathcal{V}_\alpha(\mathbf{x}))\mapsto(\mathbf{h},s),\qquad f_\phi(\gamma(\mathbf{x}),\mathbf{h})\mapsto\mathbf{c},$$

学習可能なパラメータは $\theta=\{\alpha,\phi,\tau\}$ — 「オンラインSLAMに必要な高速収束、効率的なメモリ利用、穴埋め」を実現する。色と深度は光線 $\mathbf{x}_i=\mathbf{o}+d_i\mathbf{r}$ に沿って正規化された重み付き和として $\hat{\mathbf{c}}=\tfrac{1}{\sum_i w_i}\sum_i w_i\mathbf{c}_i$、$\hat{d}=\tfrac{1}{\sum_i w_i}\sum_i w_i d_i$ とレンダリングされ、単純な釣鐘型のSDFから重みへの変換

$$w_i=\sigma\!\left(\frac{s_i}{tr}\right)\sigma\!\left(-\frac{s_i}{tr}\right),$$

を用いる。ここで $tr$ はtruncation距離(10 cm)、$\sigma$ はシグモイドである。サンプリングは深度誘導型で、$M_c$個の均一サンプルと、計測深度周辺の$M_f$個の表面近傍サンプルからなる。

**損失**: $\ell_2$の色/深度レンダリング損失、truncation領域内での近似SDF損失 $\mathcal{L}_{sdf}$(予測を $D[u,v]-d$ に引き寄せる)、表面から離れた場所で $s_p=tr$ を強制する自由空間損失、そして隣接するハッシュグリッド頂点の特徴計量差に対する滑らかさ正則化 $\mathcal{L}_{smooth}=\tfrac{1}{|\mathcal{G}|}\sum_{\mathbf{x}\in\mathcal{G}}\Delta_x^2+\Delta_y^2+\Delta_z^2$(未観測空間でのハッシュ衝突ノイズを抑制するため、小さなランダム領域で計算)。

**トラッキング**は各フレームを等速運動モデル $\mathbf{T}_t=\mathbf{T}_{t-1}\mathbf{T}_{t-2}^{-1}\mathbf{T}_{t-1}$ で初期化し、次に $N_t$ 個のサンプリング画素にわたって $\xi_t$ を最適化する。**大域バンドル調整**は2つ目の鍵となるアイデアである。完全なキーフレーム画像を保存し約10枚を選択する(iMAP/NICE-SLAM)のではなく、Co-SLAMはキーフレームごとにわずか約5%の画素のみを保存し、キーフレームを頻繁に(5フレームごとに)挿入し、キーフレームデータベース*全体*から $N_g$本の光線をサンプリングしてマップとすべての姿勢を同時に最適化し、$k_m$回のマップステップと蓄積された勾配からの姿勢更新を交互に行う。

## 実験結果

- **Replica**: 深度L1 1.51 cm、精度2.10 cm、完全性2.08 cm、完全性比率93.44%、**17.4 FPS**、パラメータ数0.26 M — NICE-SLAMの1.90 / 2.37 / 2.64 / 91.13%(0.91 FPS、パラメータ数17.4 M)、iMAPの4.64 / 3.62 / 4.93 / 80.51%に対して優れている。
- **NeuralRGBD合成**(ノイジーな深度、薄い構造): 深度L1 3.02 cmで、NICE-SLAMの6.32、iMAP*の43.91に対して優れており、15.6 FPS。
- **ScanNetトラッキング**: 平均ATE RMSE 9.37 cm(トラッキングイテレーションを倍にすると8.75)で、NICE-SLAMの9.63に対して優れており、6.4-12.8 FPS(NICE-SLAMの0.68に対して)。
- **TUM RGB-D**: fr1/desk、fr2/xyz、fr3/officeで2.7 / 1.9 / 2.6 cm(イテレーションを増やすと2.4 / 1.7 / 2.4) — ニューラル系システム中最良だが、ORB-SLAM2(1.6 / 0.4 / 1.0)にはまだ及ばない。
- **アブレーション**: one-blobエンコーディングを外すと完全性が悪化する(フルモデルで2.13→2.08 cm、比率93.17→93.44%)、ハッシュグリッドを外すと精度が悪化する(3.69 cm)。大域BAは同じ総光線予算でATE 8.75±0.33に達し、NICE-SLAM式のローカルBAの9.69、BAなしの16.81に対して優れている。

## SLAMにおける意義

Co-SLAMはニューラルインプリシットSLAMをリアルタイムのレートに引き上げ、NeRF-SLAM系統をインタラクティブな用途で実用的にし、Instant-NGPのハッシュグリッドが穴埋めを回復する滑らかな座標エンコーディングと組み合わせればオンラインマッピングに有効であることを示した。その結合パラメトリック+座標エンコーディングと、疎な画素による大域バンドル調整は、ESLAMのtri-planeやPoint-SLAMのニューラル点群と並んで、NICE-SLAM系統において影響力のある設計パターンとなった。

## 関連ノート

- [NICE-SLAM](nice-slam.md)
- [iMAP](imap.md)
- [ESLAM](eslam.md)
- [Point-SLAM](point-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)
