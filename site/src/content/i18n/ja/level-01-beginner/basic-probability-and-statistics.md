# Basic Probability & Statistics

SLAMはその本質において*確率的推定問題*である。すなわち、雑音を含むセンサーデータが与えられたとき、ロボットの最も尤らしい状態(ポーズ+マップ)は何かという問題である。確率論は、不確実性の下で推論するための厳密な言語を提供する。

## ガウス分布

平均 $\mu$、標準偏差 $\sigma$ を持つ一変量ガウス(正規)分布の確率密度関数は次の通りである:

$$p(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)$$

SLAMの状態は多次元であるため、**多変量ガウス分布**を用いる。平均 $\boldsymbol{\mu}$、共分散行列 $\boldsymbol{\Sigma}$(対称正定値)を持つ確率変数ベクトル $\mathbf{x} \in \mathbb{R}^n$ について:

$$p(\mathbf{x}) = \frac{1}{(2\pi)^{n/2}|\boldsymbol{\Sigma}|^{1/2}} \exp\!\left(-\frac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1}(\mathbf{x}-\boldsymbol{\mu})\right)$$

指数関数の引数 $(\mathbf{x}-\boldsymbol{\mu})^T\boldsymbol{\Sigma}^{-1}(\mathbf{x}-\boldsymbol{\mu})$ は**マハラノビス距離**であり、$\mathbf{x}$ が平均からどれだけ離れているかを尺度不変に測る指標である。SLAMでは、共分散 $\boldsymbol{\Sigma}$ は不確実性を符号化する。対角成分 $\Sigma_{ii}$ が大きいということは、状態の第 $i$ 成分について不確実であることを意味する。

ガウス分布が推定の中心的な道具である理由は、2つの性質にある:

- **線形写像に対する閉性**: $\mathbf{x} \sim \mathcal{N}(\boldsymbol{\mu}, \boldsymbol{\Sigma})$ ならば、$\mathbf{y} = A\mathbf{x} + \mathbf{b}$ は平均 $A\boldsymbol{\mu} + \mathbf{b}$、共分散 $A\boldsymbol{\Sigma}A^T$ を持つガウス分布となる。この**共分散伝播**の規則($\Sigma_y = A\Sigma A^T$、非線形写像の場合は $A$ をヤコビ行列に置き換える)は、不確実性がSLAMパイプラインをどのように伝わるか — ピクセルの雑音から三角測量された点の共分散、そしてポーズの共分散まで — を示すものである。
- **ガウス分布の積はガウス分布になる**(正規化を除いて)。これが、ガウス事前分布とガウス尤度によるベイズ更新が扱いやすいままである理由であり、カルマンフィルタの背後にある代数である。

## ベイズの定理

ベイズの定理は確率的SLAMの原動力である。これは*事後分布* $p(\mathbf{x}|\mathbf{z})$(観測 $\mathbf{z}$ が与えられたときの状態 $\mathbf{x}$ に関する我々の信念)を、*尤度* $p(\mathbf{z}|\mathbf{x})$ と*事前分布* $p(\mathbf{x})$ に関連づける:

$$p(\mathbf{x} \mid \mathbf{z}) = \frac{p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})}{p(\mathbf{z})} \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})$$

SLAMでは、$\mathbf{x}$ はロボットのポーズ(およびマップ)であり、$\mathbf{z}$ はカメラ画像(または特徴点の観測)である。事前分布は運動モデルから、尤度は観測モデルから得られる。ベイズの定理の再帰的な適用 — 予測してから更新する — は、拡張カルマンフィルタ(EKF-SLAM)やパーティクルフィルタの基礎である。

## MAPとMLE

事後分布を最大化する状態を求めることが**最大事後確率(MAP)**推定である:

$$\mathbf{x}^* = \arg\max_{\mathbf{x}}\, p(\mathbf{x} \mid \mathbf{z}) = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})$$

事前分布が一様分布であるとき、MAPは**最大尤度推定(MLE)**に帰着する。ガウス雑音モデルの場合、MLEは二乗誤差の和を最小化することと等価であり、これはまさにバンドル調整が行っていることである。

## MLEから最小二乗法へ(重要な導出)

独立な観測 $\mathbf{z}_i$ がガウス雑音を持つと仮定する: $\mathbf{z}_i = \mathbf{h}_i(\mathbf{x}) + \boldsymbol{\epsilon}_i$、$\boldsymbol{\epsilon}_i \sim \mathcal{N}(\mathbf{0}, \boldsymbol{\Sigma}_i)$。尤度は積であるため、その*負の対数*は和になる:

$$-\log \prod_i p(\mathbf{z}_i \mid \mathbf{x}) = \frac{1}{2}\sum_i \big(\mathbf{z}_i - \mathbf{h}_i(\mathbf{x})\big)^T \boldsymbol{\Sigma}_i^{-1} \big(\mathbf{z}_i - \mathbf{h}_i(\mathbf{x})\big) + \text{const}$$

したがって尤度の最大化は、**マハラノビス重み付き残差の二乗和の最小化**と等価である。この一行が確率と最適化を結びつける。バンドル調整、ポーズグラフ最適化、因子グラフ推論はすべて、ガウス雑音下でのMAP推定であり、情報行列 $\boldsymbol{\Sigma}_i^{-1}$ はまさに各残差に与えられる重みである。

## よくある落とし穴

- **尤度と事後分布の混同**: $p(\mathbf{z}|\mathbf{x})$ は固定されたデータが与えられたときの状態の関数であり、$\mathbf{x}$ について積分すると1になるわけではない。
- **相関を無視すること**: 誤差が相関している場合(例えば周辺化後)に $\boldsymbol{\Sigma}$ を対角行列として扱うと、推定器が過信的になる — これがSLAMにおける*不整合性(inconsistency)*の根本原因の一つである。
- **ガウス仮定と外れ値**: 単一の誤った特徴点マッチが、ガウス雑音モデルを大きく破り、推定全体を破壊するほどの影響を与えることがある。これがロバストカーネルやRANSACが存在する理由である。

## SLAMにおける意義

SLAMバックエンドの2つの主要な系統 — フィルタリング(EKF、パーティクルフィルタ)とスムージング(因子グラフ、バンドル調整) — は、いずれもガウス雑音下でのベイズ推定の直接的な応用である。ガウス分布、ベイズの定理、そしてMAP/MLEの結びつきを理解することで、カルマンフィルタの更新と最小二乗法の解が、同じ推論問題の2つの見方であることが見えてくる。

## 関連ノート

- [Basic Calculus](basic-calculus.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Visual-SLAM why filter?](../level-03-monocular-slam/visual-slam-why-filter.md)
- [Consistency](../level-02-getting-familiar/consistency.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
