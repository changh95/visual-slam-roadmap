# MonoSLAM

> Davison 2007 · [論文](https://ieeexplore.ieee.org/document/4160954)

**一行要約** — 最初のリアルタイム単眼SLAMシステム: 1台の手持ちカメラと拡張カルマンフィルタが、カメラの動きと疎な3Dランドマーク地図を30 Hzで同時に推定する。

## 問題

MonoSLAM以前、リアルタイムSLAMシステムはステレオリグ、レーザースキャナ、あるいは車輪オドメトリを必要としていた。単一のカメラは不十分と考えられていた。1つの視点は方位角を提供するが深度は提供せず、素のカメラには動きの計測が一切ないためである。Davison、Reid、Molton、Stasse(IEEE TPAMI 2007)は、単一の手持ちカメラでリアルタイムSLAMが十分に実現できることを示した — ただし、推定フレームワークが単眼特徴初期化の深度不確実性を明示的に扱い、オドメトリの代わりに動きの事前分布を供給することが条件である。

## 手法とアーキテクチャ

**カメラ+地図の単一EKF。** 状態は完全な結合共分散を持つ単一の連結ベクトルである。

$$
\hat{\mathbf{x}} = \begin{pmatrix} \hat{\mathbf{x}}_v \\ \hat{\mathbf{y}}_1 \\ \hat{\mathbf{y}}_2 \\ \vdots \end{pmatrix}, \qquad
\mathbf{P} = \begin{pmatrix} P_{xx} & P_{xy_1} & P_{xy_2} & \cdots \\ P_{y_1x} & P_{y_1y_1} & P_{y_1y_2} & \cdots \\ P_{y_2x} & P_{y_2y_1} & P_{y_2y_2} & \cdots \\ \vdots & \vdots & \vdots & \end{pmatrix},
$$

ここで各ランドマーク $\mathbf{y}_i$ は3D点であり、13パラメータのカメラ状態は位置、方向を表すクォータニオン、線速度/角速度から構成される: $\mathbf{x}_v = (\mathbf{r}^W, \mathbf{q}^{WR}, \mathbf{v}^W, \boldsymbol{\omega}^R)$。非対角ブロックが要点であり、1つの特徴を観測することでカメラ*と*相関するすべての特徴の推定値が改善される。記憶容量と更新コストは地図サイズに対して $O(N^2)$ であり、30 Hzでの地図をおよそ100個の特徴に制限する。

**等速運動モデル(予測)。** オドメトリがないため、平滑性の事前分布が制御入力の代わりになる。各タイムステップで、平均ゼロのガウス分布に従う未知の加速度が速度インパルス $\mathbf{n} = (\mathbf{V}^W, \boldsymbol{\Omega}^R) = (\mathbf{a}^W \Delta t, \boldsymbol{\alpha}^R \Delta t)$ を加え、状態更新は次のようになる。

$$
\mathbf{f}_v = \begin{pmatrix} \mathbf{r}^W + (\mathbf{v}^W + \mathbf{V}^W)\Delta t \\ \mathbf{q}^{WR} \times \mathbf{q}\big((\boldsymbol{\omega}^R + \boldsymbol{\Omega}^R)\Delta t\big) \\ \mathbf{v}^W + \mathbf{V}^W \\ \boldsymbol{\omega}^R + \boldsymbol{\Omega}^R \end{pmatrix},
\qquad
\mathbf{Q}_v = \frac{\partial \mathbf{f}_v}{\partial \mathbf{n}} P_n \frac{\partial \mathbf{f}_v}{\partial \mathbf{n}}^{\top}.
$$

小さな $P_n$ は滑らかな動きを仮定する。大きな $P_n$ は激しい動きを許容するが、フレームあたりより多くの計測を要求する。

**能動的探索(計測)。** ランドマークの予測されるカメラ座標系での位置は $\mathbf{h}_L^R = \mathbf{R}^{RW}(\mathbf{y}_i^W - \mathbf{r}^W)$ であり、これはキャリブレーションされた広角(視野角約100°)カメラモデルに半径方向の歪みを含めて投影される。状態の不確実性を投影のヤコビ行列を通じて伝播させると、$2\times 2$ のイノベーション共分散が得られる。

$$
\mathbf{S}_i = \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v} P_{xx} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v} P_{x y_i} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i} P_{y_i x} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i} P_{y_i y_i} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i}^{\top} + \mathbf{R},
$$

これは楕円形のゲート(3標準偏差)を定義し、その内部で正規化相互相関によるテンプレートマッチングが実行される。$\mathbf{S}_i$ は情報量の尺度としても機能する。1フレームあたり最も情報量の多い10〜12個の特徴が選択され、最も長い軸に沿って不確実性を圧縮する。

**確率的特徴初期化。** 新しい顕著なパッチ(Shi–Tomasi)は1本のレイのみを定義する。深度は、そのレイに沿って0.5〜5.0 mの範囲に均一に分布する100個のパーティクルによって表現される。各フレームで、すべての深度仮説はそれぞれの探索楕円に投影され、マッチングの尤度がベイズ則によってパーティクルを再重み付けする。深度比 $\sigma_d / d < 0.3$ になると分布はガウス分布に収束し、その特徴はEKFの状態に加わる — 通常2〜4フレーム後である。地図管理は、任意の姿勢から目標数の特徴が可視であるように、特徴の追加・削除を行う。

## 実験結果

- **リアルタイム予算**: 1.6 GHzのPentium M上で30 Hz(利用可能な33 ms)で動作する場合、典型的な1フレームのコストは19 ms — 画像読み込み2 ms、相互相関探索3 ms、カルマンフィルタ更新5 ms、特徴初期化探索4 ms、グラフィカルレンダリング5 ms。
- **正解に対する精度**: 手持ちカメラが4つの測量済みウェイポイント(約1 cmの精度で既知)を再訪した結果、1〜2 cmのジッターで数センチメートルの精度で位置推定された — 例えばウェイポイント(1.00, 0.00, 0.62) mが(0.93±0.03, 0.06±0.02, 0.63±0.02) mと推定された。残差バイアスは、SLAMが地図を整合性へと引き込むにつれて、1周あたり約1 cmずつ縮小した。
- **応用**: 0.75 m半径の円を歩くHRP-2ヒューマノイドのリアルタイム位置推定(その200 Hzの胸部ジャイロを追加のEKF計測として融合)、および手持ちカメラによるライブ拡張現実。コードはオープンソースのSceneLibライブラリとして公開された。

## SLAMにおける意義

MonoSLAMは1台の安価なカメラがリアルタイムSLAMに十分であることを証明し、実質的に視覚SLAMという分野を築いた(そしてDavisonの研究室の系譜 — 数十年後のiMAP、MonoGS、MASt3R-SLAMも同じグループから生まれている — を始めた)。これはまた、フィルタベースのSLAMの最も明快な教育的な実例でもある。1つのEKF、1つの結合状態、予測された不確実性からの能動的探索 — これは、それ以降のすべてのキーフレーム最適化システムが対比されてきた基準線である。論文自体がその後継への道筋を示している。深度パーティクルによる初期化は逆深度パラメータ化に直接的な影響を与え、$O(N^2)$ の上限はPTAMと「Visual SLAM: Why Filter?」が答えた課題を設定した。

## 関連ノート

- [PTAM](ptam.md)
- [Visual-SLAM why filter?](visual-slam-why-filter.md)
- [Visual Odometry](visual-odometry.md)
- [ORB-SLAM](orb-slam.md)
- [Scale ambiguity](scale-ambiguity.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — MonoSLAMが依拠する広角モデル
