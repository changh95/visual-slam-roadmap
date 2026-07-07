# DVO

> Kerl 2013 · [プロジェクトページ](https://vision.in.tum.de/data/software/dvo)

**一行要約** — ロバストなt分布誤差モデルの下で、全ピクセルにわたる測光残差と深度残差を同時に最小化する直接(特徴点フリーな)RGB-Dオドメトリであり、エントロピーに基づくキーフレーム選択とポーズグラフによるループ閉じ込みを拡張してDVO-SLAMとなる。

## 問題

特徴点ベースのRGB-Dオドメトリは、画像を疎なキーポイントに縮約することで大部分の情報を捨ててしまい、テクスチャの乏しい屋内シーンでは手がかりが枯渇する。直接法は全ピクセルを活用できるが、密な残差はオクルージョン、反射、動的物体、センサーノイズといった外れ値によって汚染される。著者らは、ガウスノイズの仮定が実際の残差ヒストグラムに当てはまらず、外れ値が推定値にバイアスを与えることを見出した。フレーム対フレームの位置合わせも本質的にドリフトする。欠けていたのは、ロバストな密なRGB-D位置合わせのための原理に基づいた確率論的な定式化と、それに加えてドリフトを最適化で取り除けるようにするための、キーフレームを選択しループ閉じ込みを検証する軽量な方法であった。

## 手法とアーキテクチャ

「DVO」は2つの論文からなる。ICRA 2013のロバストオドメトリ(測光項、t分布、運動事前分布)と、IROS 2013の密な視覚SLAM(深度項、キーフレーム、ループ閉じ込み、g2oポーズグラフを追加)である。

- **ワーピング**: 深度$\mathcal{Z}_1(\mathbf{x})$を持つピクセル$\mathbf{x}$は逆投影$\pi^{-1}$で再構成され、剛体運動$\boldsymbol{T} = \exp(\hat{\boldsymbol{\xi}})$(ツイスト$\boldsymbol{\xi}\in\mathbb{R}^6$)で変換され、再投影される: $\mathbf{x}' = \tau(\mathbf{x},\boldsymbol{T}) = \pi\big(\boldsymbol{T}\,\pi^{-1}(\mathbf{x}, \mathcal{Z}_1(\mathbf{x}))\big)$。
- **測光残差+深度残差**: 各ピクセルは、以下のスタックされた残差$\mathbf{r} = (r_{\mathcal{I}}, r_{\mathcal{Z}})^\top$を提供する。

$$r_{\mathcal{I}} = \mathcal{I}_2\big(\tau(\mathbf{x},\boldsymbol{T})\big) - \mathcal{I}_1(\mathbf{x}), \qquad r_{\mathcal{Z}} = \mathcal{Z}_2\big(\tau(\mathbf{x},\boldsymbol{T})\big) - \big[\boldsymbol{T}\,\pi^{-1}(\mathbf{x},\mathcal{Z}_1(\mathbf{x}))\big]_Z ,$$

  ここで$[\cdot]_Z$はZ成分であり、深度誤差は投影的な探索を伴う点対平面ICPと等価である。2つの誤差を手動で調整した重みで線形に結合した従来手法とは異なり、これらは同時にモデル化される。
- **確率論的ロバスト推定**: MAP推定$\boldsymbol{\xi}^* = \arg\max_{\boldsymbol{\xi}} p(\boldsymbol{\xi} \mid \mathbf{r})$であり、2変量残差はt分布$p_t(\mathbf{0}, \boldsymbol{\Sigma}, \nu)$に従う。これはガウス分布の無限混合であり、その重い裾が外れ値をカバーする。これは反復再重み付け最小二乗法につながる。

$$\boldsymbol{\xi}^* = \arg\min_{\boldsymbol{\xi}} \sum_{i}^{n} w_i\, \mathbf{r}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i, \qquad w_i = \frac{\nu+1}{\nu + \mathbf{r}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i},$$

  ここで$\nu = 5$自由度であり、スケール行列$\boldsymbol{\Sigma}$は反復ごとに期待値最大化法(EM)によって再推定される。手動で調整したロバストカーネルの閾値は不要である。ガウス・ニュートン正規方程式$\sum_i w_i \boldsymbol{J}_i^\top \boldsymbol{\Sigma}^{-1} \boldsymbol{J}_i\, \Delta\boldsymbol{\xi} = -\sum_i w_i \boldsymbol{J}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i$(2×6のヤコビアン$\boldsymbol{J}_i$)は、画像ピラミッドにわたって粗から密へ解かれる。等速運動の事前分布を加えることもできる。その場合、更新式は$(J^\top W J + \Sigma^{-1})\Delta\boldsymbol{\xi} = -J^\top W \mathbf{r}(\mathbf{0}) + \Sigma^{-1}(\boldsymbol{\xi}_{t-1} - \boldsymbol{\xi}_t^{(k)})$となる。
- **エントロピーに基づくキーフレームとループ閉じ込み(DVO-SLAM)**: 近似ヘシアン$\boldsymbol{A}$からポーズ共分散$\boldsymbol{\Sigma}_{\boldsymbol{\xi}} = \boldsymbol{A}^{-1}$が得られ、そのエントロピーは$H(\boldsymbol{\xi}) \propto \ln \lvert\boldsymbol{\Sigma}_{\boldsymbol{\xi}}\rvert$である。フレームは現在のキーフレームに対してマッチングされ続け、エントロピー比

$$\alpha = \frac{H(\boldsymbol{\xi}_{k:k+j})}{H(\boldsymbol{\xi}_{k:k+1})}$$

  がある閾値を下回った時点で新しいキーフレームが挿入される。ループ閉じ込みの候補は、各キーフレームの周囲の球内でのメトリック最近傍探索によって見つけられ、まず粗い解像度でテストされ、同じエントロピー比検定で検証される。検証済みの制約はキーフレームのポーズグラフに入り、g2oで最適化され、最後に全キーフレームに対して再探索される。

## 実験結果

TUM RGB-Dベンチマーク(ICRA論文、ドリフトは並進RPEのRMSEとして測定)において、fr1/desk上でt分布重み付けはドリフトを重み付けなしの0.0551から0.0458 m/sに削減する。4つの「desk」シーケンス全体で平均すると、t分布+時間事前分布は0.0428 m/sを達成し、これは参照手法(0.2425 m/s)に対して82.35%の改善であり、fr3の「sitting」動的物体シーケンスでは0.0316 m/sである。実行速度は単一CPUコアでリアルタイム(30Hz)であり、重み付けバリアントはフレームあたり約50msである。完全なDVO-SLAM(IROS論文、freiburg1セット)では、キーフレームトラッキングだけでドリフトを平均16%削減し、ポーズグラフ最適化がさらに20%削減する。絶対軌跡誤差は0.19m(フレーム対フレーム)から0.07mに減少する。システム間比較(ATE RMSE平均)では、DVO-SLAMは0.034mに達し、RGB-D SLAM(0.054m)、MRSMap(0.043m)、KinFu(0.297m)を上回る。例えばfr1/deskは0.021m、fr1/xyzは0.011mである。フレーム対キーフレームトラッキングは約32ms(Intel i7-2600)を要し、マップ更新の平均は135msである。

## SLAMにおける意義

DVOは、直接的なRGB-Dオドメトリを特徴点ベースのパイプラインに対する真剣な代替手法として確立し、より複雑な密なシステムに取り組む前に、ワーピング、スタックされた残差、ロバストな重み、粗から密へのIRLSといった直接位置合わせの仕組みを学ぶための最も明快な論文であり続けている。そのt分布重み付けとエントロピーに基づくキーフレーム/ループ閉じ込みの基準は標準的な要素となった。現代のSLAMにおける直接法の系譜(LSD-SLAM、DSO、ニューラルSLAM内部の密なトラッカー)は、このテーマの変奏として読むことができる。

## 関連ノート

- [RGBD-SLAM-V2](rgbd-slam-v2.md) — DVOが上回った特徴点ベースのRGB-D同時代手法
- [KinectFusion](kinectfusion.md) — ボリューメトリックモデルに対するICPベースの密なトラッキング
- [ICP](icp.md) — DVOの深度残差の純粋に幾何学的な祖先
- [MRS-Map](mrs-map.md) — 同じベンチマークで比較されたサーフェル統計量に基づくレジストレーション
- [LSD-SLAM](../level-03-monocular-slam/lsd-slam.md) — 単眼のセミデンスSLAMへ発展させた直接位置合わせ
- [DSO](../level-03-monocular-slam/dso.md) — ロバストな直接位置合わせを採用した疎な直接オドメトリ
