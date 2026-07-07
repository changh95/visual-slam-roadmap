# Basic Linear Algebra

線形代数はSLAMの作業言語である。点、ポーズ、残差、観測はすべてベクトルと行列であり、あらゆるソルバーは最終的に行列計算に帰着する。

## ベクトルと行列

**ベクトル** $\mathbf{v} \in \mathbb{R}^n$ は $n$ 個の実数からなる列である。SLAMでは、ベクトルは点、平行移動、速度、残差を表す。**行列** $A \in \mathbb{R}^{m \times n}$ は $\mathbb{R}^n$ から $\mathbb{R}^m$ への線形写像を表す。SLAMの幾何における中心的な対象は、行列とベクトルの積 $A\mathbf{x} = \mathbf{b}$ である。

## 行列式

正方行列の行列式 $\det(A)$ は、線形写像 $A$ による符号付きの体積スケーリング係数を測る。重要な事実:

- $\det(A) \neq 0 \Leftrightarrow A$ は正則である。
- 回転行列 $R \in SO(3)$ について: $\det(R) = +1$。
- $\det(AB) = \det(A)\det(B)$。

## 内積と外積

$\mathbf{u}, \mathbf{v} \in \mathbb{R}^3$ の**内積**は $\mathbf{u} \cdot \mathbf{v} = \mathbf{u}^T\mathbf{v} = \|\mathbf{u}\|\|\mathbf{v}\|\cos\theta$ であり、射影や直交性のチェックに使われる。**外積** $\mathbf{u} \times \mathbf{v}$ は両方に垂直なベクトルを生成し、その大きさは $\|\mathbf{u}\|\|\mathbf{v}\|\sin\theta$ である。これは基本行列(essential matrix)の歪対称行列表現や、法線ベクトルの計算に現れる。

外積は**歪対称行列**を用いた行列とベクトルの積として書くことができる:

$$\mathbf{u} \times \mathbf{v} = [\mathbf{u}]_\times \mathbf{v}, \qquad [\mathbf{u}]_\times = \begin{bmatrix} 0 & -u_3 & u_2 \\ u_3 & 0 & -u_1 \\ -u_2 & u_1 & 0 \end{bmatrix}$$

この小さな恒等式はSLAMのあらゆる場所に現れる。基本行列(essential matrix)は $E = [\mathbf{t}]_\times R$ であり、$\mathfrak{so}(3)$ のリー代数元は歪対称行列である。

## ランク、逆行列、転置

$A$ の**ランク**はその列空間の次元である。SLAMでは、基礎行列(fundamental matrix)は構成上ランク2であり、点群の行列はすべての点が同一平面上にある場合(SLAM初期化における縮退構成)にランク不足となる。**逆行列** $A^{-1}$ は $AA^{-1} = I$ を満たし、$\det(A) \neq 0$ のときに限り存在する。回転行列については $R^{-1} = R^T$(直交性)が成り立ち、これは完全な逆行列の計算を避けるために常に活用される。

行列が有効な回転であることをチェックする簡単なNumPyの例:

```python
import numpy as np

theta = np.pi / 4
R = np.array([[np.cos(theta), -np.sin(theta), 0],
              [np.sin(theta),  np.cos(theta), 0],
              [0,              0,             1]])

print(np.allclose(R.T @ R, np.eye(3)))  # True: orthogonal
print(np.linalg.det(R))                 # 1.0: proper rotation
```

## 線形システムを解く

SLAMのバックエンドは明示的に行列を逆行列化することはない。*分解*して解くのである:

- **コレスキー分解**($A = LL^T$)は対称正定値システムに用いられる — バンドル調整の正規方程式 $J^TJ\,\Delta\mathbf{x} = -J^T\mathbf{e}$ はこの方法で解かれる(実際には疎コレスキーを使う)。
- **QR分解**は、$J^TJ$ を作らずに $J$ に直接作用するため($J^TJ$ は条件数を二乗してしまう)、最小二乗法に対して数値的により安全な代替手段である。
- **SVD**は最も頑健(かつ最も計算コストが高い)な選択肢であり、ランク不足の斉次系 $A\mathbf{x} = \mathbf{0}$ を明確に扱える唯一の方法である。

## 特異値分解(SVD)

SVDはSLAMにおいて最も重要な行列分解である。任意の行列 $A \in \mathbb{R}^{m \times n}$ は次のように分解される:

$$A = U \Sigma V^T$$

ここで $U$ と $V$ は直交行列であり、$\Sigma$ は非負の**特異値** $\sigma_1 \geq \sigma_2 \geq \cdots \geq 0$ を持つ対角行列である。幾何学的には、任意の線形写像は回転/反転、続いて座標ごとのスケーリング、そして再度の回転/反転として表される。SLAMにおける用途:

- **基本行列(essential matrix)の分解**: $E$ のSVDから4つの候補となる相対ポーズ $[R|\pm\mathbf{t}]$ が得られる。
- **DLT三角測量**: 解は $A$ の最小特異値に対応する右特異ベクトルである。
- **ICP位置合わせ**: 相互共分散行列 $H = \sum_i \mathbf{p}_i \mathbf{q}_i^T$ のSVDから最適な回転が得られる。

比 $\sigma_1/\sigma_n$ は**条件数**である。これは線形方程式を解く際に入力雑音がどの程度増幅されるかを測る。悪条件のシステム(巨大な条件数)は、8点アルゴリズムやDLTにおいて座標の正規化が重要である理由である。

## 固有値と固有ベクトル

$A\mathbf{v} = \lambda\mathbf{v}$ を満たす非零ベクトル $\mathbf{v}$ とスカラー $\lambda$ は、$A$ の**固有ベクトル**と**固有値**である。ハリスコーナー検出器は、構造テンソルの固有値から画像パッチを分類し、点群のPCAは共分散行列の固有ベクトルを用いて主方向(例えば平面のフィッティング)を求める。対称行列(共分散、構造テンソル、$J^TJ$)については、固有値は実数であり固有ベクトルは直交する — そして固有値分解はSVDと一致する。

## よくある落とし穴

- **行列を明示的に逆行列化すること**(`inv(A) @ b`)は、解を求めること(`np.linalg.solve`、コレスキー)よりも遅く、精度も低い。
- **斉次系を解く前に正規化を忘れること** — DLTと8点アルゴリズムは、生のピクセル座標に対しては大きく性能が低下する。
- **SVDベースの回転復元における符号/反転の曖昧性**: 常に $\det(R) = +1$ を確認し、反転が得られた場合は符号反転で修正すること。

## SLAMにおける意義

SLAMパイプラインのあらゆる段階は、変装した線形代数である。点の投影には行列積が使われ、最小限のソルバー(8点法、DLT、ICP)はSVDに帰着し、バンドル調整の正規方程式は大きな疎な線形システムである。ここでの習熟度 — 特にSVD、直交行列、ランクに関するもの — が、SLAMの論文を読み、幾何コードをデバッグする力を与えてくれる。

## 関連ノート

- [Basic Calculus](basic-calculus.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Triangulation](triangulation.md)
- [Math libraries](../level-02-getting-familiar/math-libraries.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
