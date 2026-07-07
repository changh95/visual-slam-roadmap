# MLEとMAP

最大尤度推定(MLE)と最大事後確率(MAP)推定は、「SLAM」を曖昧な目標から具体的な最適化問題に変える2つの統計的原理である。フィルタであれ平滑化であれ、ほぼすべてのSLAMバックエンドはこの2つの推定量のいずれかを計算している。

## ベイズの定理が舞台を整える

$\mathbf{x}$ を状態(ロボットの姿勢と地図)、$\mathbf{z}$ を観測(特徴点観測、IMU読み取り値)とする。ベイズの定理は、私たちが求めたいもの(事後分布)を、センサーモデルと運動モデルが与えてくれるものに結びつける。

$$
p(\mathbf{x} \mid \mathbf{z}) = \frac{p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})}{p(\mathbf{z})} \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})
$$

- $p(\mathbf{z} \mid \mathbf{x})$ — **尤度**:状態が $\mathbf{x}$ であったとしたら観測がどれくらい確からしいか(観測モデルから得られる)。
- $p(\mathbf{x})$ — **事前分布**:$\mathbf{z}$ を見る前に私たちが信じていたこと(運動モデル、または過去の推定値から得られる)。
- $p(\mathbf{z})$ — 正規化項であり、最適化には無関係。

## 2つの推定量

**MAP** は事後分布を最大化する状態を選ぶ。

$$
\mathbf{x}^*_{\text{MAP}} = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})
$$

**MLE** は事前分布を捨てて(等価的に、一様事前分布を仮定して)尤度だけを最大化する。

$$
\mathbf{x}^*_{\text{MLE}} = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})
$$

MAP = MLE + 事前分布である。SLAMの言葉で言えば:画像観測に対する純粋な[バンドル調整](bundle-adjustment.md)はMLEであり、運動モデルのファクター、IMUファクター、または最初の姿勢に対する事前分布を加えると、MAPを行っていることになる。

## 確率から最小二乗へ

SLAMバックエンドが*最小二乗ソルバー*であり、汎用の確率推論エンジンではない理由は、ガウス雑音の仮定である。測定モデル $\mathbf{z} = h(\mathbf{x}) + \mathbf{v}$、$\mathbf{v} \sim \mathcal{N}(\mathbf{0}, \Sigma)$ を考える。すると、

$$
p(\mathbf{z} \mid \mathbf{x}) \propto \exp\!\left(-\tfrac{1}{2}\,\|\mathbf{z} - h(\mathbf{x})\|^2_{\Sigma^{-1}}\right)
$$

ここで $\|\mathbf{e}\|^2_{\Sigma^{-1}} = \mathbf{e}^T \Sigma^{-1} \mathbf{e}$ は二乗**マハラノビス距離**である。負の対数を取ると — これは最大化を最小化に、独立な観測の積を和に変える — MAP問題は次のようになる。

$$
\mathbf{x}^* = \arg\min_{\mathbf{x}} \left[ \sum_t \|h(\mathbf{x}_t) - \mathbf{z}_t\|^2_{R_t^{-1}} + \sum_t \|f(\mathbf{x}_{t-1}, \mathbf{u}_t) - \mathbf{x}_t\|^2_{Q_t^{-1}} \right]
$$

最初の和は観測コスト(例えば測定共分散 $R_t$ を持つ[再投影誤差](reprojection-error.md))であり、2番目は運動モデルのコスト(オドメトリ/IMU、プロセス共分散 $Q_t$ を持つ)である。心に留めておくべき3つの結論がある。

- **二乗誤差は任意のものではない** — それらはガウス分布の負の対数である。雑音がガウス分布でない場合(外れ値!)、二乗損失は誤った尤度になる。これが[M推定量](m-estimator.md)が存在する理由そのものである。
- **共分散は重みになる**:自信のあるセンサー(小さな $\Sigma$)は強く重み付けされた残差を生む。g2o/GTSAMにおける情報行列 $\Omega = \Sigma^{-1}$ はまさにこの重みである。
- **独立性は疎性になる**:各観測はごく少数の状態変数にのみ依存するため、対数事後分布は小さな局所項の和 — [ファクターグラフ](factor-graph.md) — になり、ソルバーはこの構造を利用する。

## フィルタ vs. 平滑化

拡張カルマンフィルタは、事後分布の再帰的なガウス近似を一時刻ずつ計算する($p(\mathbf{x})$ で予測、$p(\mathbf{z} \mid \mathbf{x})$ で更新)。一方、現代の平滑化バックエンドは[非線形最適化](non-linear-optimization.md)によって軌跡全体にわたる完全なMAP問題を解く。両者は同じ事後分布を追いかけているが、何を近似し、いつ線形化するかが異なる。

## SLAMにおける意義

MLE/MAPは、SLAMの確率論的*定式化*とそれを解く最適化の*仕組み*との間の橋渡しである。以降のすべての設計上の決定 — 残差が逆共分散で重み付けされる理由、バンドル調整が二乗再投影誤差を最小化する理由、事前ファクターがゲージの自由度を固定する理由、外れ値がロバストカーネルを必要とする理由 — は、「ガウス雑音下のMAPは重み付き非線形最小二乗に等しい」という一行の直接的な系である。この一行を自分で再導出できれば、大半のバックエンドの論文は読みやすくなる。

## 関連ノート

- [基礎的な確率と統計](../level-01-beginner/basic-probability-and-statistics.md)
- [MAP推定と疎な非線形最小二乗問題](map-inference-as-sparse-nonlinear-least-squares.md)
- [ファクターグラフ](factor-graph.md)
- [非線形最適化](non-linear-optimization.md)
- [拡張カルマンフィルタ](extended-kalman-filter.md)
