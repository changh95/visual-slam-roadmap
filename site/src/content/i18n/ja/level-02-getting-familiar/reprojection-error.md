# Reprojection Error

**再投影誤差(reprojection error)**は視覚SLAMの基本的な幾何学的残差であり、仮説上の3D点とカメラ姿勢が、実際の2D特徴観測をどれだけよく説明できるかを計測する。3D点 $\mathbf{X}_j$ (ワールドフレーム)、カメラ姿勢 $T_i \in SE(3)$ (ワールドからカメラへの変換)、そしてその点が画像 $i$ の中で観測されたピクセル位置 $\mathbf{z}_{ij}$ を考える。

$$
\mathbf{e}_{ij} = \mathbf{z}_{ij} - \pi\!\left(T_i \mathbf{X}_j\right)
$$

ここで $\pi : \mathbb{R}^3 \to \mathbb{R}^2$ はカメラの投影関数である。内部パラメータ $(f_x, f_y, c_x, c_y)$ を持つピンホールカメラと、カメラフレームの点 $\mathbf{X}^c = (X, Y, Z)^T = T_i \mathbf{X}_j$ に対して、

$$
\pi(\mathbf{X}^c) = \begin{bmatrix} f_x \, X / Z + c_x \\ f_y \, Y / Z + c_y \end{bmatrix}
$$

この誤差は**ピクセル**単位で存在し、特徴検出器の位置決め誤差(通常は1ピクセル前後)と直接比較できる。これにより、閾値や共分散を設定しやすくなる。

## 残差からコスト関数へ

観測雑音がガウス分布 $\mathbf{z}_{ij} \sim \mathcal{N}\left(\pi(T_i\mathbf{X}_j), \Sigma_{ij}\right)$ に従うという仮定の下では、姿勢と点の最大尤度推定は、まさに重み付き非線形最小二乗問題

$$
C = \sum_{(i,j) \in \mathcal{O}} \mathbf{e}_{ij}^T \, \Omega_{ij} \, \mathbf{e}_{ij}
$$

となる。ここで $\Omega_{ij} = \Sigma_{ij}^{-1}$ は**情報行列**であり、$\mathcal{O}$ は(姿勢、点)の観測対の集合である。各項は二乗マハラノビス距離であり、実際には $\Sigma_{ij}$ はしばしば等方的であり、その特徴が検出された画像ピラミッドの階層でスケールされる(粗い階層 = 雑音が多い = 重みが低い)。

誤ったマッチは二次コストを支配してしまうほど巨大な残差を生じるため、実際のシステムでは各項を**ロバストカーネル** $\rho$(Huber、Cauchy)でラップし、$\sum \rho\left(\mathbf{e}_{ij}^T \Omega_{ij} \mathbf{e}_{ij}\right)$ とし、カイ二乗値が閾値を超える観測を枝刈りする。

## 最適化

このコストは姿勢に関して非線形である($SE(3)$の作用と透視除算を通じて)。現在の推定値の周りで $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J \Delta\mathbf{x}$ を線形化し、Gauss–Newton正規方程式 $\left(J^T \Omega J\right)\Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$ を反復的に解くのが標準的な手法である。連鎖律により、ヤコビアンは以下のように因数分解される。

$$
\frac{\partial \mathbf{e}}{\partial (\cdot)} = -\frac{\partial \pi}{\partial \mathbf{X}^c} \cdot \frac{\partial \mathbf{X}^c}{\partial (\cdot)}
$$

$\partial \pi / \partial \mathbf{X}^c$ は $1/Z$ と $-X/Z^2$、$-Y/Z^2$ の項を含む $2 \times 3$ 行列であり、2番目の因子は、姿勢に関して微分する(リー代数の摂動を経由、$2 \times 6$)か、点に関して微分する($2 \times 3$)かによって異なる。

## どの問題がこれを最小化するか

- **motion-only(モーションオンリー)**(PnP精密化/トラッキング): 点を固定し、1つの姿勢を最適化する。
- **structure-only(ストラクチャーオンリー)**(三角測量の精密化): 姿勢を固定し、点を最適化する。
- **完全なバンドル調整**: すべての姿勢と点を同時に最適化する — ゴールドスタンダード。

比較対象となる代替手法: **測光誤差(photometric error)**(direct methodはピクセルの位置ではなく画素強度を比較する)と**3D点対点/点対平面誤差**(ICP)。信頼できる特徴の対応関係が存在する場合には、ピクセル空間の雑音モデルが計測が実際に行われた方法と一致するため、再投影誤差が好まれる。

## SLAMにおける意義

- これは視覚SLAMの観測モデルである。ほぼすべての特徴ベースの推定器 — PnP精密化、三角測量、局所・大域バンドル調整、ファクターグラフ中の視覚ファクター — がこれを最小化する。
- そのカイ二乗統計量は、マッチの枝刈りやRANSACのインライア数え上げのための、理論的根拠のある**外れ値検定**を提供する。
- そのヤコビアン構造(各誤差はちょうど1つの姿勢と1つの点を結びつける)は、Schur補完によってバンドル調整を実用的にするスパース性を生み出す。

## 関連ノート

- [Bundle Adjustment](bundle-adjustment.md)
- [PnP (Perspective-n-Point)](pnp.md)
- [Gauss-Newton](gauss-newton.md)
- [M-estimator](m-estimator.md)
- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md)
