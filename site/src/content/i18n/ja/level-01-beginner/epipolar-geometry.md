# Epipolar geometry

同一のシーンが2つの異なる視点から観測されるとき、**エピポーラ制約**は、一方の画像における3D点の投影がもう一方の画像のどこに現れるかを、**エピポーラ線**と呼ばれる直線上に制限する。これは、2視点再構成と単眼SLAM初期化の幾何学的基盤である。

## 幾何学

2つのカメラ中心と3D点は**エピポーラ平面**を張る。この平面は各画像をエピポーラ線で切断する。2つのカメラ中心を結ぶ直線(ベースライン)が各画像を貫く点が**エピポール**である。画像内のすべてのエピポーラ線はそのエピポールを通る。実用上の結果として、画像1中の特徴点が与えられると、画像2におけるそのマッチは既知の直線上に存在しなければならない — 2Dの探索が1Dに縮退する。

## 基本行列(Essential Matrix)

*キャリブレーション済み*の2つのカメラ(内部パラメータが既知)について、**基本行列** $E$ はカメラ間の相対的な回転 $R$ と平行移動 $\mathbf{t}$ を符号化する:

$$E = [\mathbf{t}]_\times R$$

ここで $[\mathbf{t}]_\times$ は $\mathbf{t} = [t_1, t_2, t_3]^T$ の歪対称行列である:

$$[\mathbf{t}]_\times = \begin{bmatrix} 0 & -t_3 & t_2 \\ t_3 & 0 & -t_1 \\ -t_2 & t_1 & 0 \end{bmatrix}$$

正規化カメラ座標 $\mathbf{x}_1$(カメラ1)と $\mathbf{x}_2$(カメラ2)で観測される3D点についての**エピポーラ制約**:

$$\mathbf{x}_2^T E\, \mathbf{x}_1 = 0$$

**その由来。** 光線の方向 $\mathbf{x}_2$、$R\mathbf{x}_1$、そしてベースライン $\mathbf{t}$ は同一平面上になければならない(すべてエピポーラ平面内にある)。3つのベクトルの同一平面性は、スカラー三重積がゼロになることを意味する: $\mathbf{x}_2 \cdot (\mathbf{t} \times R\mathbf{x}_1) = 0$。外積を $[\mathbf{t}]_\times$ として書くと、まさに $\mathbf{x}_2^T E\,\mathbf{x}_1 = 0$ が得られる。

$E$ は**5自由度**を持つ(回転に3、平行移動に3、スケールで1を引く)。これが最小解法が5つの対応点を必要とする理由である。そのSVDは $\Sigma = \mathrm{diag}(\sigma, \sigma, 0)$ という特別な形を持つ — 2つの等しい特異値と1つのゼロである。

**$E$ からポーズを復元する。** $\Sigma = \mathrm{diag}(1,1,0)$ を持つ $E = U\Sigma V^T$ が与えられると、4つの候補ポーズは $[R_1|\pm\mathbf{t}]$ と $[R_2|\pm\mathbf{t}]$ であり、以下で与えられる:

$$R_1 = UWV^T, \quad R_2 = UW^TV^T, \quad \mathbf{t} = \mathbf{u}_3, \quad W = \begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}$$

真のポーズは**カイラリティチェック(cheirality check)**によって曖昧さが解消される。三角測量された点は両方のカメラの前方に位置しなければならない。平行移動はスケールを除いて復元される — これが単眼のスケール曖昧性の根源である。

## 基礎行列(Fundamental Matrix)

*キャリブレーションされていない*2つのカメラについて、**基礎行列** $F$ は生のピクセル座標 $\mathbf{p}_1, \mathbf{p}_2$ を関連づける:

$$F = \mathbf{K}_2^{-T} E\, \mathbf{K}_1^{-1}, \qquad \mathbf{p}_2^T F\, \mathbf{p}_1 = 0$$

$F$ はランク2の $3 \times 3$ 行列であり、7自由度を持つ(スケールを除いて定義され、$\det(F) = 0$)。これは8点アルゴリズム(Longuet-Higgins、1981年)によって8個以上の点対応から推定できる。点 $\mathbf{p}_1$ に対する画像2のエピポーラ線は単純に $\boldsymbol{\ell}_2 = F\,\mathbf{p}_1$ であり、エピポールは $F$ と $F^T$ のヌルベクトルである。

## ホモグラフィ

シーン内のすべての点が同一平面上にある場合、あるいはカメラが純粋な回転をする場合、**ホモグラフィ** $H$ は画像点を直接写像する:

$$\lambda\mathbf{p}_2 = H\,\mathbf{p}_1, \qquad H \in \mathbb{R}^{3 \times 3}$$

ホモグラフィはORB-SLAMのマップ初期化で使用される。競合するホモグラフィモデルと基礎行列モデルが特徴マッチに適合され、より良いスコアを持つ方が選択される — これは平面的シーンと一般的シーンの両方を扱う頑健な方法である。

## 注意すべき縮退ケース

- **純粋な回転**($\mathbf{t} = \mathbf{0}$): $E = [\mathbf{0}]_\times R = 0$ — 基本行列は未定義となり、深度は復元できない。この場合はホモグラフィが運動を説明する。
- **平面的シーン**: 単一平面からの対応点はホモグラフィを満たし、$F$/$E$ の推定は曖昧になる。これがまさにORB-SLAMが両方のモデルを適合させる理由である。
- **微小なベースライン**: $E$ の推定は数値的に不安定になり、三角測量された深度は無意味になる。初期化は十分な視差が得られるまで待機する。

## SLAMにおける意義

エピポーラ幾何は、単眼SLAMシステムが自身を起動させる方法である。2D-2Dの特徴マッチのみから相対的なカメラポーズを復元し、最初のマップ点を三角測量する。また、ステレオマッチングやガイド付き特徴マッチングのための1D探索制約としてエピポーラ線を提供し、エピポーラ制約は誤ったマッチを排除するためのRANSAC内部における標準的な幾何学的検証手段でもある。

## ハンズオン

- [Epipolar geometry hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_02)
- [Homography hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_04)

## 関連ノート

- [Pinhole camera model](pinhole-camera-model.md)
- [Triangulation](triangulation.md)
- [Rigid body motion](rigid-body-motion.md)
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md)
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md)
