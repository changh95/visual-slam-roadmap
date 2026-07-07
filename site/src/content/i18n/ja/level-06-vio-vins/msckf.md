# MSCKF
> Mourikis 2007 · [論文](https://ieeexplore.ieee.org/document/4209642)

**一行要約** — Multi-State Constraint Kalman Filter(MSCKF)は、カメラの*姿勢*(ランドマークではない)のスライディングウィンドウをEKF状態に保持し、特徴測定をランドマークヤコビアンの左零空間に射影することで、計算量を特徴数に対して線形に保ったまま効率的な単眼VIOを実現する。

## 問題
古典的なEKF-SLAMはすべての3Dランドマーク位置を状態ベクトルに入れるため、共分散更新はマップサイズに対して二次的にスケールする——これは、特徴抽出器が1枚の画像で数百点を日常的に追跡する、視覚支援慣性航法においては禁止的である。ペアワイズの代替手法(エピポーラ制約、画像対間の相対姿勢測定)は情報を捨ててしまい、同じピクセルを統計的に相関のある制約で再利用してしまう。MSCKFが答えた問いはこうだ:*複数の*カメラ姿勢から観測された特徴トラックは、その特徴が状態変数になることなく、最適に軌跡を制約できるか?

## 手法とアーキテクチャ
このフィルタは3ステップのループ(論文のAlgorithm 1)に従う:IMUサンプルごとに**伝播**、画像ごとに**拡張**、特徴トラック完了時に**更新**。

- **状態。** 進化するIMU状態は
  $$\mathbf{X}_{\mathrm{IMU}} = \begin{bmatrix} {}^I_G\bar{q}^{\,T} & \mathbf{b}_g^T & {}^G\mathbf{v}_I^T & \mathbf{b}_a^T & {}^G\mathbf{p}_I^T \end{bmatrix}^T,$$
  単位クォータニオン${}^I_G\bar{q}$(グローバル→IMU回転)、ランダムウォークとしてモデル化されたジャイロ/加速度バイアス、グローバル座標系における速度/位置を持ち、姿勢誤差は誤差クォータニオン$\delta\bar q$の最小3自由度$\delta\boldsymbol{\theta}$を用いる。フルステートは最大$N_{\max}$個の過去のカメラ姿勢$({}^{C_i}_G\bar q,\, {}^G\mathbf{p}_{C_i})$を付加する。
- **伝播。** IMU推定値は5次ルンゲ・クッタ法で積分され、共分散はリャプノフ方程式$\dot{\mathbf{P}}_{II} = \mathbf{F}\mathbf{P}_{II} + \mathbf{P}_{II}\mathbf{F}^T + \mathbf{G}\mathbf{Q}_{\mathrm{IMU}}\mathbf{G}^T$に従い、状態遷移行列$\boldsymbol{\Phi}$を数値的に積分する。
- **状態拡張。** 各新しい画像で、カメラ姿勢${}^{C}_G\hat{\bar q} = {}^{C}_I\bar q \otimes {}^{I}_G\hat{\bar q}$、${}^G\hat{\mathbf{p}}_C = {}^G\hat{\mathbf{p}}_I + \mathbf{C}_{\hat q}^T\,{}^I\mathbf{p}_C$が付加され、そのヤコビアンを介して共分散が拡張される。
- **Structureless測定モデル(核心となる貢献)。** $M_j$個の姿勢にわたって追跡された特徴$f_j$が失われたとき、その位置${}^G\hat{\mathbf{p}}_{f_j}$は逆深度パラメータ化を用いたGauss-Newton最小二乗法で三角測量される。その特徴のすべての観測の線形化された再投影残差を積み重ねると
  $$\mathbf{r}^{(j)} \simeq \mathbf{H}^{(j)}_{\mathbf{X}}\widetilde{\mathbf{X}} + \mathbf{H}^{(j)}_{f}\,{}^G\widetilde{\mathbf{p}}_{f_j} + \mathbf{n}^{(j)}.$$
  三角測量には状態推定値が使われたため、$\mathbf{r}^{(j)}$は$\widetilde{\mathbf{X}}$と相関している;$\mathbf{H}^{(j)}_f$の左零空間(基底$\mathbf{A}$)への射影は、特徴誤差を正確に除去する:
  $$\mathbf{r}^{(j)}_o = \mathbf{A}^T(\mathbf{z}^{(j)} - \hat{\mathbf{z}}^{(j)}) \simeq \mathbf{A}^T\mathbf{H}^{(j)}_{\mathbf{X}}\widetilde{\mathbf{X}} + \mathbf{A}^T\mathbf{n}^{(j)},$$
  $(2M_j-3)$次元の制約となり、その特徴を見た*すべて*の姿勢を結合する——線形化を除いて最適であり、$O(M_j^2)$でGivens回転を用いて暗黙的に計算される。
- **更新。** 完了したすべての$L$個の特徴の残差が積み重ねられ、QR分解$\mathbf{H}_X = \begin{bmatrix}\mathbf{Q}_1 & \mathbf{Q}_2\end{bmatrix}\begin{bmatrix}\mathbf{T}_H \\ \mathbf{0}\end{bmatrix}$がそれらを$\mathbf{r}_n = \mathbf{Q}_1^T\mathbf{r}_o = \mathbf{T}_H\widetilde{\mathbf{X}} + \mathbf{n}_n$に圧縮した後、通常のEKF更新をゲイン$\mathbf{K} = \mathbf{P}\mathbf{T}_H^T\big(\mathbf{T}_H\mathbf{P}\mathbf{T}_H^T + \mathbf{R}_n\big)^{-1}$で行う。移動物体の外れ値はマハラノビス検定で除去される。ウィンドウが満杯になると、等間隔に配置された$N_{\max}/3$個の姿勢が刈り込まれる(最も古いものは保持される——より長い基線はより多くの情報を持つため)。

総コスト:特徴数に対して線形、(有限な)ウィンドウ姿勢数に対して最大でも三次。

## 実験結果
ミネアポリスでの実世界の市街地走行で評価:Pointgrey FireFlyカメラ(640×480 @ 3 Hz)とISIS IMU(100 Hz)を車に搭載し、約9分間で1598枚の画像、SIFT特徴、状態には最大30個のカメラ姿勢。3.2 kmの軌跡において142,903個の特徴トラックがEKF更新に使われ、2 GHz Intel T7200の単一コアで14 Hzで処理された——センサレートの3 Hzより高速である。最終的な位置誤差は約10 m、すなわち**走行距離の0.31%**であり、ループクロージャも運動事前分布も用いていない。推定された3σ精度は姿勢で1°未満、速度で0.35 m/s未満であった。

## SLAMにおける意義
MSCKFはVIOのフィルタベースの系譜を確立し、そのstructureless測定モデルはフィルタリングをはるかに超えて標準となった(例:GTSAM/Kimeraのスマートファクタ)。S-MSCKF(ステレオ)、ROVIO世代のEKF設計、OpenVINSの直接の祖先であり、その線形化挙動に関するフォローアップ文献は、すべての最新のフィルタベースVIOが依拠する可観測性/一貫性解析(First-Estimate Jacobians)を生み出した。その効率性のプロファイルは、MSCKF系推定器がデプロイ済みのAR/VRトラッキングスタックと広く関連付けられている理由である。CPUサイクルあたりの精度が絶対精度より重要な場合、MSCKFは今でも参照設計である。

## 関連ノート
- [OpenVINS](openvins.md) — FEJとオンラインキャリブレーションを備えた現代的なオープンソースMSCKF。
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md) — ステレオ拡張(S-MSCKF)。
- [ROVIO](rovio.md) — 直接的な光度更新を用いる、もう一つの代表的なフィルタベースVIO。
- [フィルタベース vs 最適化ベース](filter-based-vs-optimization-based.md) — MSCKFが設計空間のどこに位置するか。
- [可観測性](observability.md) — MSCKFが生み出した解析の系譜。
- [デプロイされたVIO](deployed-vio.md) — MSCKF級の効率が最も重要になる場面。
