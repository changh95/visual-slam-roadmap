# PnP (Perspective-n-Point)

**Perspective-n-Point(PnP)問題**とは、既知の地図(ワールド)座標系で表された $n$ 個の3D点 $\mathbf{X}_i$、カメラ画像上でのそれらの2D投影 $\mathbf{u}_i$、そして内部パラメータ行列 $\mathbf{K}$ が与えられたとき、次を満たすカメラ姿勢 $[R \mid \mathbf{t}]$ を推定する問題である。

$$
\lambda_i \begin{bmatrix} \mathbf{u}_i \\ 1 \end{bmatrix} = \mathbf{K} \left( R \mathbf{X}_i + \mathbf{t} \right)
$$

ここで $\lambda_i$ は正の深度である。PnPは**2D–3D対応**の主力手法である。2D–2Dマッチからの本質行列推定とは異なり、3D点がすでにスケールを持っているため、並進を**メトリックスケール**で回復できる。

## 主なソルバー

**P3P(最小ソルバー)。** 3組の対応で十分である(姿勢は6自由度を持ち、各2D点は2つの制約を与える)。各画像レイの対は既知の角度 $\theta_{ij}$(キャリブレーションされた方位ベクトルから計算される)を成し、余弦定理が未知の点の深度 $d_i = \lVert R\mathbf{X}_i + \mathbf{t} \rVert$ を制約する。

$$
d_i^2 + d_j^2 - 2 d_i d_j \cos\theta_{ij} = \lVert \mathbf{X}_i - \mathbf{X}_j \rVert^2
$$

こうした方程式を3つ組み合わせると、**最大4つの実数解**を持つ4次多項式に帰着する。4番目の対応があれば曖昧さが解消される。P3PはRANSAC内で使われる最小ソルバーであり、小さなサンプルによって必要な反復回数を低く抑えられる。

**DLT(直接線形変換)。** $n \geq 6$ 個の対応から、$3 \times 4$の投影行列 $P$ を線形に解く(各点は2つの同次線形方程式を与える。それらを積み重ねてSVDによって $A\mathbf{p} = 0$ を解く)。その後、$P = \mathbf{K}[R \mid \mathbf{t}]$ を分解して姿勢を取り出す(RQ分解)。単純ではあるが、解の過程で既知の内部パラメータを無視しており、代数的(幾何的ではない)誤差を最小化するため、専用のソルバーより精度が低い。

**EPnP。** すべての $n$ 個の3D点を**4つの仮想制御点**の重み付き和として表現する。

$$
\mathbf{X}_i = \sum_{j=1}^{4} \alpha_{ij} \mathbf{c}_j, \qquad \sum_j \alpha_{ij} = 1
$$

重心座標系の重み $\alpha_{ij}$ は剛体変換に対して不変であるため、問題は $n$ に関わらず、カメラ座標系における制御点の12個の座標を推定することに帰着する。計算量は $O(n)$ であり、これによりEPnPは大きな対応集合(例:リローカライゼーション)に対する標準的な非最小ソルバーとなっている。

**反復的な精緻化。** どのソルバーが初期姿勢を提供するにせよ、最終的な答えは、次の総**再投影誤差**を最小化することで洗練される。

$$
\min_{R, \mathbf{t}} \sum_i \left\lVert \mathbf{u}_i - \pi\!\left(\mathbf{K}, R\mathbf{X}_i + \mathbf{t}\right) \right\rVert^2
$$

Gauss–NewtonまたはLevenberg–Marquardtを用いる(これは`cv::solvePnP`のiterativeフラグ、そしてORB-SLAMにおける「モーションのみのバンドル調整」が行っていることである)。

## ロバスト推定

実際の2D–3Dマッチ集合には外れ値が含まれる(誤った記述子マッチ、動いた物体)。標準的なパイプラインは**P3P + RANSAC**である。3組の対応をサンプリングしてP3Pを解き、再投影誤差のしきい値(数ピクセル)によってインライア数を数え、最良のモデルを保持し、その後すべてのインライアに対してM推定量または通常の最小二乗で精緻化する。

## SLAMにおける意義

- **トラッキング**:特徴ベースSLAM(PTAM、ORB-SLAM)は、現在フレームのキーポイントを既に三角測量済みの地図点にマッチングし、PnPを解くことで各フレームの姿勢を推定する——これがトラッキングスレッドの中核である。
- **リローカライゼーションとループクロージング**:トラッキングが失われた後、あるいはループ候補が見つかった後、保存された地図に対するPnPが姿勢を最初から回復する。
- **メトリックスケール**:3D点がスケールを固定するため、PnPベースのトラッキングは純粋な2D–2D運動推定が持つスケール曖昧性に悩まされない。
- 実用的なVOパイプラインは:ORBを検出し、マッチングし、RANSACで外れ値を除去し、EPnP/P3Pで姿勢を推定し、Gauss–Newton/LMで精緻化する、という流れである。

## ハンズオン

- [Perspective-n-Pointsハンズオン](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_09)

## 関連ノート

- [2D-3D対応](2d-3d-correspondence.md)
- [RANSAC](ransac.md)
- [再投影誤差](reprojection-error.md)
- [Gauss-Newton法](gauss-newton.md)
- [ピンホールカメラモデル](../level-01-beginner/pinhole-camera-model.md)
