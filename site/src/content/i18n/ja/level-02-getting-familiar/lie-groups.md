# Lie groups

カメラの姿勢は $\mathrm{SE}(3)$ に、回転は $\mathrm{SO}(3)$ に存在する——これらは**多様体（manifold）**であり、ベクトル空間ではない。2つの回転行列を足し合わせても回転にはならないため、標準的な「更新 $x \leftarrow x + \Delta x$」という最適化は直接適用できない。**リー理論（Lie theory）**はこのギャップを橋渡しする。各リー群（回転/姿勢の曲がった空間）には、対応する**リー代数（Lie algebra）**（単位元における群の接空間である平坦なベクトル空間）があり、指数写像と対数写像によって結び付けられる。オプティマイザは平坦な代数の中で作業し、更新を群の上に写し戻す。

**so(3)とSO(3)。** リー代数 $\mathfrak{so}(3)$ は $3 \times 3$ の反対称行列 $[\boldsymbol{\phi}]_\times$ から構成され、ベクトル $\boldsymbol{\phi} \in \mathbb{R}^3$（軸×角度）によってパラメータ化される。指数写像はロドリゲスの回転公式である。

$$
R = \exp([\boldsymbol{\phi}]_\times) = I + \frac{\sin\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|}[\boldsymbol{\phi}]_\times + \frac{1-\cos\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^2}[\boldsymbol{\phi}]_\times^2
$$

対数写像 $\log: \mathrm{SO}(3) \to \mathfrak{so}(3)$ はその逆写像であり、回転行列から回転ベクトルを復元する。

**se(3)とSE(3)。** 剛体姿勢について、$\mathfrak{se}(3)$ の元は $\boldsymbol{\xi} = [\boldsymbol{\rho}^T, \boldsymbol{\phi}^T]^T \in \mathbb{R}^6$（並進部分 $\boldsymbol{\rho}$、回転部分 $\boldsymbol{\phi}$）によってパラメータ化される。

$$
\hat{\boldsymbol{\xi}} = \begin{bmatrix} [\boldsymbol{\phi}]_\times & \boldsymbol{\rho} \\ \mathbf{0}^T & 0 \end{bmatrix}, \qquad
T = \exp(\hat{\boldsymbol{\xi}}) = \begin{bmatrix} \exp([\boldsymbol{\phi}]_\times) & J\boldsymbol{\rho} \\ \mathbf{0}^T & 1 \end{bmatrix}
$$

ここで $J$ は $\mathrm{SO}(3)$ の**左ヤコビ行列（left Jacobian）**である。

$$
J = I + \frac{1 - \cos\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^2}[\boldsymbol{\phi}]_\times + \frac{\|\boldsymbol{\phi}\| - \sin\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^3}[\boldsymbol{\phi}]_\times^2
$$

**このパラメータ化が優れている理由。** 姿勢は正確に6自由度を持ち、$\boldsymbol{\xi} \in \mathbb{R}^6$ は局所更新のための*最小*で特異点管理されたパラメータ化である。維持すべき制約がなく（$3\times4$ 行列や単位クォータニオンとは異なり）、ジンバルロックも起きない（特異点を持つオイラー角とは異なり）。SLAM最適化では、各反復で代数における小さな更新 $\boldsymbol{\xi}$ を解き、それを群に対する**摂動（perturbation）**として適用する。

$$
T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}}) \quad \text{（右摂動）} \qquad \text{または} \qquad T \leftarrow \exp(\hat{\boldsymbol{\xi}}) \cdot T \quad \text{（左摂動）}
$$

残差（例えば再投影誤差）のヤコビ行列は $\boldsymbol{\xi}$ に関して導出され、$\boldsymbol{\xi} = 0$ で評価される。

## 摂動ヤコビ行列の実例

この計算全体は1つの操作に帰着する。$\exp$ を一次まで展開し $\exp([\delta\boldsymbol{\phi}]_\times) \approx I + [\delta\boldsymbol{\phi}]_\times$ とし、$[\mathbf{a}]_\times \mathbf{b} = -[\mathbf{b}]_\times \mathbf{a}$ を用いる。左摂動下での回転点 $R\mathbf{p}$ について、

$$
\exp([\delta\boldsymbol{\phi}]_\times)\, R\,\mathbf{p} \;\approx\; (I + [\delta\boldsymbol{\phi}]_\times) R \mathbf{p}
= R\mathbf{p} + [\delta\boldsymbol{\phi}]_\times R\mathbf{p}
= R\mathbf{p} - [R\mathbf{p}]_\times\, \delta\boldsymbol{\phi}
$$

したがって $\partial(R\mathbf{p})/\partial\,\delta\boldsymbol{\phi} = -[R\mathbf{p}]_\times$ となる。右摂動版も同じ2行の手順で導出でき、$-R[\mathbf{p}]_\times$ を与える。これを投影のヤコビ行列 $\partial\pi/\partial\mathbf{p}$ と連鎖させれば、すべてのバンドル調整実装が使う再投影誤差のヤコビ行列を——行列微分の表を一切参照せずに——導出したことになる。

## コードで見る

Sophusは、この仕組み（Eigenベース）のスタンドアロンC++実装であり、そのAPIは数式と一対一に対応する。

```cpp
#include <sophus/se3.hpp>

Eigen::Matrix<double, 6, 1> xi = ...;      // twist in se(3)
Sophus::SE3d T = Sophus::SE3d::exp(xi);    // exp map: algebra -> group
Eigen::Matrix<double, 6, 1> back = T.log();// log map: group -> algebra

T = T * Sophus::SE3d::exp(delta);          // right-perturbation update step
```

同じパターンはすべてのSLAMライブラリに組み込まれている。g2oの `SE3` 頂点、Ceresのmanifold（局所パラメータ化）、GTSAMの `Pose3` である。この仕組みは $\mathrm{Sim}(3)$（姿勢＋スケール）にも拡張され、単眼SLAMは軌道に沿ってスケールがドリフトするため、これをループクロージングに用いる。

## よくある落とし穴

- **小角度の数値計算**: $\exp$、$\log$、$J$ における $\sin\theta/\theta$ 型の係数は $\theta = 0$ で $0/0$ となる。実装はゼロ付近でテイラー展開に切り替える必要がある（ライブラリはこれを行っている——自作の実装でも同様に行うべきである）。
- **$\pi$ 付近での$\log$**: ほぼ$180°$の回転から軸を復元することは条件が悪い。大きな回転を平均化・補間する際には注意が必要である。
- **左右の慣習**: 論文やライブラリは左右の摂動を自由に混在させる。ヤコビ行列は異なり（実例を参照）、慣習を暗黙に混在させることは「オプティマイザがゴミに収束する」バグの典型的な原因である。
- **クォータニオンの二重被覆**: $q$ と $-q$ は同じ回転を符号化する。残差や補間はこの符号を処理しなければならず、そうしなければ $2\pi$ 付近で誤差が現れる。
- **ソルバーで多様体を忘れること**: 局所パラメータ化なしに生の4パラメータクォータニオンや9パラメータ回転行列をオプティマイザに与えると、更新が多様体から外れてしまう。Ceresのmanifold API、g2oの頂点実装、GTSAMの型はまさにこれを防ぐために存在する。

## SLAMにおける意義

最適化ベースのSLAMコンポーネント——バンドル調整、ポーズグラフ最適化、IMUプリインテグレーション、直接画像位置合わせ——はすべて、姿勢に関して残差を微分する。リー群の仕組みは、それを正しく行う*方法*である。姿勢間の残差自体も $\log$ を介して表現される（ポーズグラフコスト $\|\log(T_{ij}^{-1} T_i^{-1} T_j)\|^2$ のように）。$\exp$/$\log$/摂動の記法を流暢に読めなければバックエンドの論文は読めない。一度読めるようになれば、それらはすべて心地よく似通って見える。

## ハンズオン

- [Eigen + Sophus ハンズオン](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch03_05)

## 関連ノート

- [Rigid body motion](../level-01-beginner/rigid-body-motion.md)
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Pose graph optimization](pose-graph-optimization.md)
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
- [Lietorch](../level-05-deep-learning/lietorch.md)
