# Bundle Adjustment

**バンドル調整(Bundle Adjustment、BA)**は、総再投影誤差を最小化する、カメラ姿勢と3Dランドマーク位置の同時非線形refinementである。名前は、各カメラ中心とそのカメラが観測する3D点を結ぶ「光線の束(bundles of rays)」から来ている ―― BAは、これらの束が画像の測定値とできる限り一致するまで姿勢と点を調整する。これは特徴点ベースSLAMおよびStructure-from-Motionにおけるゴールドスタンダードのバックエンドである。

## コスト関数

カメラ姿勢 $T_i \in SE(3)$ が、ピクセル測定値 $\mathbf{z}_{ij}$ でランドマーク $\mathbf{X}_j \in \mathbb{R}^3$ を観測しているとき、**再投影誤差**は

$$\mathbf{e}_{ij} = \mathbf{z}_{ij} - \pi\big(T_i\, \mathbf{X}_j\big)$$

である。ここで $\pi : \mathbb{R}^3 \to \mathbb{R}^2$ はカメラ投影関数(ピンホールモデルと歪み)である。BAは以下を解く

$$\min_{\{T_i\},\, \{\mathbf{X}_j\}} \sum_{(i,j) \in \mathcal{O}} \rho\big(\mathbf{e}_{ij}^T\, \Omega_{ij}\, \mathbf{e}_{ij}\big)$$

ここで $\mathcal{O}$ は(姿勢, 点)観測ペアの集合、$\Omega_{ij} = \Sigma_{ij}^{-1}$ は情報行列(測定共分散の逆行列。典型的にはピラミッドレベルごとにスケーリングされる)、$\rho$ は外れ値マッチの影響を抑える任意のロバストカーネル(例: Huber)である。ガウスノイズと正しい関連付けの下では、これはまさに最大尤度推定である。

## どのように解かれるか

BAは非線形最小二乗問題であり、Gauss-NewtonまたはLevenberg-Marquardtによって反復的に解かれる。各反復は現在の推定値のまわりで残差を線形化する $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J\,\Delta\mathbf{x}$ ―― そして(減衰させた)正規方程式を解く

$$\big(J^T \Omega J + \lambda I\big)\, \Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$$

姿勢は $SE(3)$ 多様体上に存在するため、更新にはローカルパラメータ化を用いる: 6次元ベクトル $\boldsymbol{\xi}$ は指数写像を通して写され、現在の姿勢と合成される、$T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})$ ―― これにより状態は各ステップで有効な剛体変換のままに保たれる。

## 疎性とSchur補行列

各残差はちょうど**1つの姿勢と1つの点**だけを含むため、ヘッセ行列近似 $H = J^T \Omega J$ は以下のブロック構造を持つ

$$H = \begin{bmatrix} B & E \\ E^T & C \end{bmatrix}$$

ここで $B$($6m \times 6m$)は姿勢だけを結合し、$C$($3n \times 3n$)は点だけを結合し、$E$ は姿勢-点の交差項である。決定的に重要なのは、$C$ がランドマークごとに独立な $3 \times 3$ ブロックを持つ**ブロック対角**であり、そのため自明に逆行列を求められることである。**Schur補行列**はまず点を消去する:

$$\big(B - E\, C^{-1} E^T\big)\, \Delta\mathbf{x}_{\text{cam}} = -\mathbf{b}_{\text{cam}} + E\, C^{-1}\, \mathbf{b}_{\text{pts}}$$

これにより $(6m + 3n)$ 次元の求解が $6m$ 次元の求解に縮小される ―― $n \gg m$(数千の点、数十のキーフレーム)のときに決定的である。ランドマークの更新はその後、安価な逆代入によって復元される。この構造の活用こそが、リアルタイムBAを実現可能にしているものであり、g2o、Ceres、GTSAMに組み込まれている。

**ゲージの自由度(gauge freedom)**: コストは、すべての姿勢と点に対する大域的な剛体変換に対して不変である(単眼の場合はスケールも自由であるため7自由度)。ソルバーは、最初のキーフレームを固定する(単眼の場合は1つのスケール基準も)か、事前分布を加えることでこれを解消する ―― そうしないと $H$ は特異になる。

## 実践で使われる種類

- **Motion-only BA**: ランドマークを固定し、単一のカメラ姿勢のみを最適化する ―― ORB-SLAMのトラッキングスレッドにおける姿勢refinementである。
- **Local BA**: 最近の/共視性のあるキーフレームのウィンドウとそのランドマークを最適化し、近傍のキーフレームはアンカーとして固定する ―― マッピングスレッドで継続的に実行される。
- **Global BA**: すべてを最適化する。典型的にはループクロージング後に実行され、しばしば高価なフル refinementの前に軌道を近づけるためポーズグラフ最適化によって初期化される。
- **Structure-only BA**: 姿勢を固定し、点をrefinementする(例えば新しいランドマークを三角測量した後)。

## SLAMにおける意義

BAは現代の視覚SLAMの精度エンジンである: キーフレームベースのシステムは、増分的な推定を信頼するのではなく、姿勢と構造を生の画像測定値に対して繰り返し再最適化することによって精度を得ている。Strasdatらによる「最適化はフィルタリングに勝る(optimization beats filtering)」という視覚SLAMに関する比較は、本質的にBAに関する主張である。その疎な構造 ―― そしてSchurトリック ―― を理解することは、あらゆる本格的なSLAMバックエンドライブラリのアーキテクチャを説明し、キーフレーム選択($m$ を小さく保つこと)がなぜそれほど重要なのかを説明する。

## 関連ノート

- [Reprojection error](reprojection-error.md)
- [Gauss-Newton](gauss-newton.md)
- [Levenberg-Marquardt](levenberg-marquardt.md)
- [Schur complement / Sparsity](schur-complement-sparsity.md)
- [M-estimator](m-estimator.md)
