# D3VO

> Yang 2020 · [論文](https://arxiv.org/abs/2003.01060)

**一行要約** — 深度、姿勢、フォトメトリック不確かさという3つの深層予測をDSO式の直接法VOフレームワークに統合し、フロントエンドトラッキングとバックエンドのフォトメトリックバンドル調整の両方で学習された事前分布を活用する。

## 問題

2020年までに、単一の学習量(CNN-SLAMやDVSOにおける深度)が古典的なモノキュラーVOを強化できることは明らかになっていたが、純粋に幾何的なモノキュラーシステムは精度と頑健性の点でステレオや視覚慣性パイプラインにまだ遅れをとっていた。D3VO("Deep Depth, Deep Pose and Deep Uncertainty for Monocular Visual Odometry")は、疎な直接法オドメトリフレームワークのトラッキングフロントエンドとウィンドウ化された非線形最適化バックエンドの両方に深層ネットワークを*3つの*レベルで同時に密に統合することで、このギャップをどれだけ縮められるかを問う。

## 手法とアーキテクチャ

**自己教師ネットワーク** — DepthNetは単一の左画像から深度マップ $D_t, D_{t^s}$ と不確かさ $\Sigma_t$ を予測し、PoseNetは連結された画像ペアから相対姿勢 $\mathbf{T}_t^{t'}$ とアフィン輝度パラメータ $a,b$ を予測する(両者ともUNet類似構造)。学習は、時間的*および*静的ステレオワープ $I_{t'}\in\{I_{t-1},I_{t+1},I_{t^s}\}$ にわたる画素ごとの最小フォトメトリック再投影誤差を最小化し、2つの追加要素がある。まず、予測された**輝度変換**がその場で照明をアラインする。$I_t^{a_{t'},b_{t'}}=a_{t\rightarrow t'}I_t+b_{t\rightarrow t'}$ — DSOのアフィン輝度モデルの学習時の類似物である。次に、**異方性の偶然的不確かさ**: 損失は予測された分散マップによって減衰される。

$$L_{self}=\frac{1}{|V|}\sum_{\mathbf{p}\in V}\frac{\min_{t'}\,r\big(I_t^{a_{t'},b_{t'}},\,I_{t'\rightarrow t}\big)}{\Sigma_t}+\log\Sigma_t$$

そのため、輝度不変性に違反する画素(非ランバート面、移動物体、高周波領域)は高い $\Sigma_t$ を得る。$r$ は通常のSSIM + $\ell_1$ フォトメトリック誤差である。

**オドメトリ** — DSOと同様に、キーフレーム $\mathcal{F}$ と点 $\mathcal{P}_i$ にわたって標準的なアフィン輝度Huber残差 $E_{\mathbf{p}j}$ を用いて $E_{photo}$ を最小化するウィンドウ化された疎なフォトメトリックバンドル調整。D3VOはネットワークを3つのレベルで注入する。

- *深層深度*: 点の深度は $d_{\mathbf{p}}=\widetilde{D}_i[\mathbf{p}]$ としてメトリックに初期化され、DVSOの仮想ステレオ項 $E_{\mathbf{p}}^{\dagger}=w_{\mathbf{p}}\lVert I_i^{\dagger}[\mathbf{p}^{\dagger}]-I_i[\mathbf{p}]\rVert_{\gamma}$ が最適化された深度を予測と整合させ続ける: $E_{photo}=\sum_{i\in\mathcal{F}}\sum_{\mathbf{p}\in\mathcal{P}_i}\big(\lambda E_{\mathbf{p}}^{\dagger}+\sum_{j\in\mathrm{obs}(\mathbf{p})}E_{\mathbf{p}j}\big)$。
- *深層不確かさ*: DSOの経験的な勾配ベース残差重みは、学習されたマップに置き換えられる。

$$w_{\mathbf{p}}=\frac{\alpha^2}{\alpha^2+\lVert\widetilde{\Sigma}(\mathbf{p})\rVert_2^2}$$

  反射、移動物体、深度不連続境界の重みを下げる。
- *深層姿勢*: PoseNetの予測が定速モデルを置き換え、フロントエンドの直接画像アライメントを初期化する(現在のフレームと直前フレームにわたる小さなファクターグラフを介して)。そして、連続するキーフレーム間の相対姿勢事前分布としてバックエンドに入る。

$$E_{pose}=\sum_{i\in\mathcal{F}}\mathrm{Log}\big(\widetilde{\mathbf{T}}_{i-1}^{i}\,\mathbf{T}_{i}^{i-1}\big)^{\top}\,\Sigma_{\tilde{\xi}}^{-1}\,\mathrm{Log}\big(\widetilde{\mathbf{T}}_{i-1}^{i}\,\mathbf{T}_{i}^{i-1}\big),\qquad E_{total}=E_{photo}+w\,E_{pose}$$

IMUプリインテグレーション事前分布との類推であるが — カメラだけから得られる。$E_{total}$ はガウス・ニュートン法で最小化される。

## 実験結果

**深度**: KITTI Eigen splitにおいて、フルネットワークはRMSE **4.485**に達する(同じステレオ+モノ自己教師下でのMonodepth2の4.750に対して)。これはスパース深度教師を必要とするDVSO(4.442)に近い; EuRoC V2_01ではRMSE 0.337を記録する(Monodepth2の0.370に対して)、輝度変換が利得の大部分をもたらす。**オドメトリ(KITTI)**: テストスプリット(01, 02, 06, 08, 09, 10)において、平均 $t_{rel}$ は**0.82%**(Stereo DSOの0.89、ステレオORB-SLAM2の0.91、モノキュラーDSOの65.8に対して); Seq. 09/10では、D3VOは0.78/0.62を得る(DVSOの0.83/0.74、そしてすべてのend-to-end手法をはるかに下回る)。**EuRoC MAV**: 5つのテストシーケンスにわたる平均RMSE ATE **0.10 m** — VI-DSO(0.11)、VINS-Mono(0.18)、OKVIS(0.28)、ROVIO(0.24)、MSCKF(0.25)よりも優れており、IMUを一切使用していないにもかかわらず、ステレオ慣性のBasalt(4シーケンスサブセットで0.08)と同等である。アブレーションは、深層姿勢が激しい動きのシーケンスV1_03とV2_03を救っていることを示す(Dd+Dpで0.63→0.13、0.52→0.19)。

## SLAMにおける意義

D3VOは、CNN-SLAM → DVSO → D3VOと続く「直接法VOバックエンド内部の深層事前分布」路線の頂点である。各段階でより多くの学習量が古典的パイプラインに組み込まれていった。単一のパッシブカメラでステレオや視覚慣性システムに匹敵したことは、学習された事前分布が追加センサーの代替となり得るという最も強力な証拠となり、その学習された不確かさ重み付き残差とネットワーク姿勢をIMU事前分布として用いる設計は、後のハイブリッドシステムにおいて影響力のあるパターンとなった。

## 関連ノート

- [DSO](dso.md)
- [DVSO](dvso.md)
- [CNN-SLAM](cnn-slam.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Self-supervised depth](self-supervised-depth.md)
