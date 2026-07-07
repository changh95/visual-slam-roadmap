# Gauss-Newton

**Gauss-Newton法**は非線形最小二乗問題を解く基本的な反復アルゴリズムであり、SLAMのバックエンド計算のほぼすべて（バンドル調整、ポーズグラフ最適化、PnPの精密化、直接的な画像アライメント）が帰着する問題クラスである。コストが持つ特別な*二乗和*構造を利用することで、一次導関数のみを計算しながら二次に近い収束性を得る。

## 導出

状態 $\mathbf{x} \in \mathbb{R}^n$ に対する残差ベクトル $\mathbf{e}(\mathbf{x}) \in \mathbb{R}^m$ から構築されるコストを最小化する。

$$
F(\mathbf{x}) = \frac{1}{2} \|\mathbf{e}(\mathbf{x})\|^2
$$

現在の推定値 $\mathbf{x}_k$ の周りで（コストではなく）残差を、$\mathbf{x}_k$ で評価したヤコビアン $J_k = \partial \mathbf{e} / \partial \mathbf{x}$ を用いて線形化する。

$$
\mathbf{e}(\mathbf{x}_k + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}_k) + J_k \Delta\mathbf{x}
$$

これを代入すると、$\Delta\mathbf{x}$ に関する*二次*モデルのコストが得られる。

$$
F(\mathbf{x}_k + \Delta\mathbf{x}) \approx \frac{1}{2}\|\mathbf{e}_k\|^2 + \Delta\mathbf{x}^T J_k^T \mathbf{e}_k + \frac{1}{2} \Delta\mathbf{x}^T J_k^T J_k \Delta\mathbf{x}
$$

$\Delta\mathbf{x}$ に関する導関数をゼロと置くと、**正規方程式**が得られる。

$$
(J_k^T J_k)\, \Delta\mathbf{x} = -J_k^T \mathbf{e}_k
$$

$\Delta\mathbf{x}$ を解き（実際には疎な $J^T J$ のコレスキー分解によって行い、明示的な逆行列計算は決して行わない）、$\mathbf{x}_{k+1} = \mathbf{x}_k + \Delta\mathbf{x}$ で更新し、再線形化し、更新量またはコストの変化が無視できるほど小さくなるまで繰り返す。

計測共分散がある場合、残差は情報行列 $\Omega = \Sigma^{-1}$ で重み付けされ、正規方程式は $J^T \Omega J \,\Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$ となる。これは同じ代数であり、ガウス雑音下でのMAP推定に正確に対応する。

## ニュートン法との関係

ニュートン法は $F$ の真のヘッセ行列を用いる。

$$
\nabla^2 F = J^T J + \sum_i e_i \, \nabla^2 e_i
$$

Gauss-Newton法は**第2項を捨て**、$H \approx J^T J$ と近似する。これは（二次導関数が不要なため）計算コストが低く、最適解付近で残差が小さい場合（モデルがうまく適合している場合）やほぼ線形である場合、すなわち収束途中のSLAM問題の典型的な状況において精度が良い。解の近くでは収束はほぼ二次的になる。この近似はさらに $H \succeq 0$ を保証するため、$H$ が非特異である限り、計算されるステップは常に降下方向となる。

## 失敗モード

- **最適解から遠い場合の発散**：線形化があまりにも不正確になり、フルステップを取るとコストがむしろ増大することがある。Gauss-Newton法にはステップサイズ制御がなく、Levenberg-Marquardt法は正規方程式に減衰を加えることでこれを解決する。
- **特異または悪条件な $J^T J$**：観測不可能な方向（単眼スケール、BAの大域的なゲージ自由度、すなわち全体解が自由に平行移動・回転できる問題）は $H$ を階数不足にする。対処法は、あるポーズを固定する、事前分布を追加する、あるいはLMの減衰を用いることである。
- **局所最小値**：すべての局所解法と同様に、開始した盆地に収束する。これがSLAMにおいて良い初期化に執着する理由である。

## 多様体上での扱い

ポーズは $\mathbb{R}^n$ ではなく $\mathrm{SE}(3)$ 上に存在するため、更新は指数写像を通じて適用される。増分を $\boldsymbol{\xi} \in \mathbb{R}^6$ としてパラメータ化し、$\boldsymbol{\xi}$ について正規方程式を解き、$T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})$ で更新する。ヤコビアンはこの局所的な摂動に関して取られる。すべてのSLAMソルバ（g2o、Ceres、GTSAM）は、この「局所ベクトルを最適化し、多様体上へリトラクトする」形でGauss-Newton/LM法を実装している。

## SLAMにおける意義

Gauss-Newton法はSLAMの*内側のループ*そのものである。バンドル調整は再投影誤差に対するGauss-Newton/LM法であり、$J^T J$ の疎なブロック構造（ポーズは観測を通じてのみ点と結合する）はシュア補行列を介して利用される。ポーズグラフ最適化は相対ポーズ残差に対するGauss-Newton法であり、直接法（LSD-SLAM、DSO）は測光誤差に対してこれを実行し、ICPのアライメントステップさえGauss-Newton法の反復である。SLAMバックエンドの論文を読むには、ここで定義された語彙（残差、ヤコビアン、ヘッセ行列近似、正規方程式、減衰）に精通していることが必要であり、実践的なデバッグ（なぜ最適化が発散したのか、なぜヘッセ行列が特異なのか）のほとんどは、上に挙げた仮定に遡ることができる。

## 関連ノート

- [Non-linear optimization](non-linear-optimization.md)
- [Levenberg-Marquardt](levenberg-marquardt.md)
- [Reprojection error](reprojection-error.md)
- [Bundle adjustment](bundle-adjustment.md)
- [Schur complement / Sparsity](schur-complement-sparsity.md)
