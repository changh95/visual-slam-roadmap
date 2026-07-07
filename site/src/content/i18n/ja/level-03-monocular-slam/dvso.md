# DVSO

> Yang 2018 · [論文](https://arxiv.org/abs/1807.02570)

**一行要約** — Deep Virtual Stereo Odometryは、CNNによる視差予測を「仮想ステレオ」計測としてDSOに供給し、単一カメラからステレオ相当の精度とメトリックスケールを実現する。

## 問題

幾何的手がかりのみに依存する単眼VOは「スケールドリフトを起こしやすく、動き推定と3D再構成のために連続フレーム間で十分な運動視差を必要とする」。ステレオリグはこの両方の問題を解決するが、ハードウェア・キャリブレーション・ベースライン制約というコストを伴う。DVSO(「Deep Virtual Stereo Odometry: Leveraging Deep Depth Prediction for Monocular Direct Sparse Odometry」)は、深度予測ネットワークが第二のカメラの代わりになれるかを問う。DSOのウィンドウ化されたフォトメトリックバンドル調整はそのまま維持しつつ、ステレオカメラが提供していたはずの制約を追加するのである。

## 手法とアーキテクチャ

**StackNet** — 積み重ね型の視差ネットワーク。*SimpleNet*(DispNet由来のResNet-50エンコーダ・デコーダ、スキップ接続、リサイズ・コンボリューションによるアップサンプリング)は左画像のみから4スケールで左右の視差マップを予測する。*ResidualNet*(12個の残差ブロック)はSimpleNetの出力とワーピングによる再構成、そして$\ell_1$再構成誤差$e_l$を受け取り、加算的な残差を学習する: $\mathit{disp}_s=\mathit{disp}_{\mathit{simple},s}\oplus\mathit{disp}_{\mathit{res},s}$。学習はステレオペア上で**半教師あり**で行われ、各スケールの損失は自己教師ありのフォトメトリック項、Stereo DSOのスパースな再構成に対する教師あり項(LiDAR不要)、左右一貫性、二次平滑化、オクルージョン正則化を組み合わせる。自己教師あり項は

$$\mathcal{L}_{U}^{\mathit{left}}=\frac{1}{N}\sum_{x,y}\alpha\,\frac{1-\mathrm{SSIM}\big(I^{\mathit{left}},I^{\mathit{left}}_{\mathit{recons}}\big)}{2}+(1-\alpha)\big\lVert I^{\mathit{left}}-I^{\mathit{left}}_{\mathit{recons}}\big\rVert_1,\qquad \alpha=0.84$$

であり、教師あり項はスパースな画素集合$\Omega_{\mathit{DSO}}$上で$\mathit{disp}^{\mathit{left}}-\mathit{disp}^{\mathit{left}}_{\mathit{DSO}}$に対する逆Huber(berHu)ノルム$\beta_{\epsilon}$を用いる — 古典的なステレオ幾何を単眼ネットワークに蒸留したものである。

**オドメトリ** — DVSOは単眼DSOのウィンドウ化された直接バンドル調整($N=7$キーフレーム、Schur補行列によるマージナライズ)を基盤とし、予測結果を2つの方法で利用する。(1) *初期化*: 新しい各点の逆深度は左視差から設定される、$d_{\mathbf{p}}=D^{L}(\mathbf{p})/(f_x b)$、これにより安定したメトリック初期化が得られる。左右一貫性チェック$e_{lr}=|D^{L}(\mathbf{p})-D^{R}(\mathbf{p}')|>1$に失敗した点はオクルージョンの可能性が高いとして棄却される。(2) *仮想ステレオ項*: DSOの時間方向フォトメトリックエネルギー

$$E_{ij}^{\mathbf{p}}=\omega_{\mathbf{p}}\left\lVert (I_j[\tilde{\mathbf{p}}]-b_j)-\frac{e^{a_j}}{e^{a_i}}(I_i[\mathbf{p}]-b_i)\right\rVert_{\gamma}$$

(アフィン輝度パラメータ$a,b$、勾配依存の重み$\omega_{\mathbf{p}}$、Huberノルム$\lVert\cdot\rVert_{\gamma}$を伴う)に加えて、各点は予測された右視差$D^R$から合成された*仮想*右画像に対する残差を持つ:

$$E_i^{\dagger\mathbf{p}}=\omega_{\mathbf{p}}\left\lVert I_i^{\dagger}[\mathbf{p}^{\dagger}]-I_i[\mathbf{p}]\right\rVert_{\gamma},\qquad I_i^{\dagger}[\mathbf{p}^{\dagger}]=I_i\big[\mathbf{p}^{\dagger}-(D^{R}(\mathbf{p}^{\dagger}),0)^{\top}\big]$$

ここで$\mathbf{p}^{\dagger}=\Pi_c(\Pi_c^{-1}(\mathbf{p},d_{\mathbf{p}})+\mathbf{t}_b)$は既知の仮想ベースライン$\mathbf{t}_b$を通して投影する。総エネルギー$E_{photo}=\sum_{i\in\mathcal{F}}\sum_{\mathbf{p}\in\mathcal{P}_i}\big(\lambda E_i^{\dagger\mathbf{p}}+\sum_{j\in\mathrm{obs}(\mathbf{p})}E_{ij}^{\mathbf{p}}\big)$はGauss-Newton法で最小化されるため、三角測量による深度と予測深度はロバストノルムを用いて最適化の内部でトレードオフされる — 右画像自体は実行時には一度も使われない。

## 実験結果

**深度(KITTI、Eigen split)**: StackNetはRMSE **4.442 m**(0–80 m範囲)を達成し、自己教師あり手法のSOTAであるGodardら(4.935)と、LiDAR半教師あり手法のKuznietsovら(4.621)をほとんどの指標で上回る。1–50 mでは3.390対3.518/3.729となる。推論は512×256で40 ms未満。**オドメトリ(KITTI)**: 単眼DSOは配列00–10全体で平均並進ドリフト($t_{rel}$)65.6%となるが、ベースライン調整なしのDVSOは1.06%に達し、完全版システム($in{,}vs{,}lr{,}tb$)は**0.77% / 0.20°**となり、Stereo DSO(0.84/0.20)、ループクロージングなしのステレオORB-SLAM2(0.81/0.26)、Stereo LSD-VO(1.14/0.40)を上回る — これらすべて単一カメラからの結果である。また、end-to-end手法(DeepVO、UnDeepVO、SfMLearner)を利用可能な全配列で上回り、StackNetをGodardの深度に置き換えると平均は1.51%まで悪化することから、深度ネットワークの重要性が確認される。

## SLAMにおける意義

DVSOは、学習された深度が単眼と両眼の視覚オドメトリ間の精度差を縮められることを示した。そして「仮想ステレオカメラとしてのCNN」という枠組み — 深度事前分布を幾何項と同じ単位のフォトメトリック残差として表現する手法 — は、ネットワークを直接的パイプラインに統合するうえで影響力のあるパターンとなった。これはCNN-SLAM → DVSO → D3VOという系譜の中間段階であり、D3VOは学習された深度の上に学習された姿勢と不確実性を加えて完成させた。幾何がネットワークを教える(Stereo DSOが単眼DSOをアップグレードするネットワークを教師する)というループも、後の自己改善型システムを先取りしていた。

## 関連ノート

- [DSO](dso.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [D3VO](d3vo.md)
- [CNN-SLAM](cnn-slam.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Scale ambiguity](scale-ambiguity.md)
