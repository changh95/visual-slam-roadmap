# Basic Calculus

SLAMのバックエンドは、その処理時間の大半を非線形コスト関数の最小化に費やしている。これを可能にするのが、微積分学の2つの道具である**微分**(ヤコビ行列)と**テイラー展開**(線形化)である。

## 微分とヤコビ行列

スカラー関数 $f: \mathbb{R}^n \to \mathbb{R}$ は勾配 $\nabla f = \left[\frac{\partial f}{\partial x_1}, \ldots, \frac{\partial f}{\partial x_n}\right]^T$ を持つ。ベクトル関数 $\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$ は**ヤコビ行列**を持つ:

$$J = \frac{\partial \mathbf{f}}{\partial \mathbf{x}} =
\begin{bmatrix}
\frac{\partial f_1}{\partial x_1} & \cdots & \frac{\partial f_1}{\partial x_n} \\
\vdots & \ddots & \vdots \\
\frac{\partial f_m}{\partial x_1} & \cdots & \frac{\partial f_m}{\partial x_n}
\end{bmatrix} \in \mathbb{R}^{m \times n}$$

ヤコビ行列は、SLAMの最適化における中心的な道具である。残差 $\mathbf{e}(\mathbf{x})$(例えば再投影誤差)が与えられたとき、そのヤコビ行列 $J = \frac{\partial \mathbf{e}}{\partial \mathbf{x}}$ は、状態に対する微小な摂動によって残差がどのように変化するかを示す — これはガウス・ニュートン法やレーベンバーグ・マーカート法がまさに必要としている情報である。

## SLAM残差における連鎖律

SLAMの残差はほとんど常に単純な関数の*合成*であるため、そのヤコビ行列は**連鎖律**から導かれる。ポーズ $T$ の下でピクセル $\mathbf{z}$ で観測されるマップ点 $\mathbf{X}$ の再投影誤差は

$$\mathbf{e} = \mathbf{z} - \pi\big(T\,\mathbf{X}\big)$$

であり、これは(1)剛体変換、(2)透視除算、(3)内部パラメータによる写像の合成である。そのヤコビ行列は積に分解される:

$$\frac{\partial \mathbf{e}}{\partial \mathbf{x}} = -\,\frac{\partial \pi}{\partial \mathbf{X}_c}\cdot\frac{\partial \mathbf{X}_c}{\partial \mathbf{x}}$$

ここで $\mathbf{X}_c = T\mathbf{X}$ はカメラ座標系における点である。各因子を個別に導出して乗じる方が、全体の式を一度に微分するよりもはるかに誤りが少ない — そしてこれは、SLAMライブラリが解析的ヤコビ行列を構成する際に実際に行っている方法である。

## テイラー展開

テイラー級数は、滑らかな関数 $f$ を点 $x_0$ の周りで展開する:

$$f(x) = f(x_0) + f'(x_0)(x - x_0) + \frac{1}{2!}f''(x_0)(x - x_0)^2 + \cdots$$

多変数関数 $f(\mathbf{x})$ を $\mathbf{x}_0$ の周りで展開すると:

$$f(\mathbf{x}) \approx f(\mathbf{x}_0) + J(\mathbf{x}_0)(\mathbf{x} - \mathbf{x}_0) + \frac{1}{2}(\mathbf{x} - \mathbf{x}_0)^T H(\mathbf{x}_0)(\mathbf{x} - \mathbf{x}_0)$$

ここで $J$ はヤコビ行列(1次)、$H$ はヘッセ行列(2次)である。1次で打ち切るとガウス・ニュートン法で使われる*線形近似*になり、2次で打ち切るとニュートン法で使われる*二次近似*になる。

## テイラー展開からガウス・ニュートン法へ

残差の二乗和 $F(\mathbf{x}) = \frac{1}{2}\|\mathbf{e}(\mathbf{x})\|^2$ を最小化する問題を考える。現在の推定値の周りで残差を線形化し、$\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e} + J\Delta\mathbf{x}$ を代入すると:

$$F(\mathbf{x} + \Delta\mathbf{x}) \approx \frac{1}{2}\|\mathbf{e}\|^2 + \mathbf{e}^T J\,\Delta\mathbf{x} + \frac{1}{2}\Delta\mathbf{x}^T J^T J\,\Delta\mathbf{x}$$

これは $\Delta\mathbf{x}$ に関する二次関数であり、その導関数をゼロと置くと**正規方程式**が得られる:

$$(J^T J)\,\Delta\mathbf{x} = -J^T \mathbf{e}$$

したがってガウス・ニュートン法は「$H \approx J^T J$ としたニュートン法」である — 真のヘッセ行列の二次微分項が省略されるが、残差が小さい場合には良い近似となる。レーベンバーグ・マーカート法は減衰項を加え、$(J^TJ + \lambda I)\Delta\mathbf{x} = -J^T\mathbf{e}$ を解くことで、ガウス・ニュートン法($\lambda \to 0$)と勾配降下法($\lambda$ が大きい)の間を補間する。

## ヤコビ行列の数値的検証

解析的ヤコビ行列は、符号の誤りや転置ブロックの誤りなど、間違いを起こしやすいことで知られている。標準的な妥当性チェックは**中心差分法**である。状態の1次元ずつを摂動させ、次を比較する:

$$J_{:,k} \approx \frac{\mathbf{e}(\mathbf{x} + h\,\mathbf{1}_k) - \mathbf{e}(\mathbf{x} - h\,\mathbf{1}_k)}{2h}$$

微小なステップ(例えば $h \sim 10^{-6}$)を用いる。まっとうなSLAMコードベースには、各残差タイプに対してこれを実行する単体テストが必ず存在する。

## よくある落とし穴

- **符号の誤り**: 残差を $\mathbf{z} - \pi(\cdot)$ とするか $\pi(\cdot) - \mathbf{z}$ とするかで $J$ の符号が反転する。一貫性を保つこと。
- **回転を素朴に微分すること**: 回転行列には制約があるため、微分は9個の行列成分に対してではなく、局所的な摂動に関して取る必要がある([Lie groups](../level-02-getting-familiar/lie-groups.md)を参照)。
- **正規化や歪み関数を通る連鎖律の因子を忘れること** — 上記の数値チェックはこれを即座に検出する。

## SLAMにおける意義

バンドル調整では、再投影誤差 $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J\Delta\mathbf{x}$ が現在の推定値の周りで線形化される。これにより、非線形最小二乗問題が線形システム $(J^T J)\Delta\mathbf{x} = -J^T \mathbf{e}$ の系列に変換され、反復的に解かれる。ポーズグラフ最適化からフルバンドル調整まで、最適化ベースのSLAMシステムはすべてこの「線形化・解・更新」というループの上に構築されている。したがって、ヤコビ行列を手で導出し(そして数値的に検証する)能力は、中核的なスキルである。

## 関連ノート

- [Basic Linear Algebra](basic-linear-algebra.md)
- [Logarithm & Exponential](logarithm-and-exponential.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
