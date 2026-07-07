# ROVIO

> Bloesch 2015 · [論文](https://github.com/ethz-asl/rovio)

**一行要約** — ROVIO（Robust Visual Inertial Odometry）は、多階層画像パッチの直接的な画素強度誤差をイノベーション項としてそのままEKFに投入するタイトカップリング型単眼VIOであり、完全にロボセントリックな状態と方位ベクトル/逆距離のランドマークを用いる — これにより初期化手順を必要としない「電源を入れればすぐ動く」推定器を実現している。

## 問題

特徴点ベースのVIOシステム（MSCKF、OKVIS）は記述子の抽出とマッチングに依存しており、これは低テクスチャ環境や高速動きによるブラー下で破綻する。それとは独立に、標準的なワールドセントリックなEKFは、その状態にグローバルに観測不能な量（絶対位置、ヨー角）を保持しており、ゲージフリーダムと一致性の問題を引き起こす。ROVIOはこの両方に対処する — フォトメトリックなパッチ誤差が特徴マッチングのパイプラインを置き換え、ロボセントリックな定式化と最小限のオンマニフォルドランドマークパラメータ化によって、観測不能なグローバル位置をそもそも表現しないようにしている。

## 手法とアーキテクチャ

- **ロボセントリックな状態.** IMUフレーム$B$、ワールドフレーム$I$、カメラフレーム$V$を用いると、フィルタの状態（論文の式1）は
  $$\mathbf{x} := \big(\mathbf{r},\ \mathbf{v},\ \mathbf{q},\ \mathbf{b}_f,\ \mathbf{b}_\omega,\ \mathbf{c},\ \mathbf{z},\ \mu_0,\dots,\mu_N,\ \rho_0,\dots,\rho_N\big),$$
  ここで$\mathbf{r}, \mathbf{v}$は（$B$で表された）ロボセントリックなIMU位置と速度、$\mathbf{q}$は姿勢（$B\to I$の写像）、$\mathbf{b}_f, \mathbf{b}_\omega$は加速度計/ジャイロのバイアス、$\mathbf{c}, \mathbf{z}$はオンラインでキャリブレーションされるIMU-カメラ外部パラメータであり、各ランドマークは方位ベクトル$\mu_i \in S^2$と距離パラメータ$\rho_i$（$d(\rho_i) = 1/\rho_i$、逆距離）から構成される。回転と単位ベクトルは最小限のboxplus差分を用いるため、ランドマークのコストは共分散の3列のみ（方位2 + 深度1）であり、検出時に大きな深度不確実性を持って*遅延なく*初期化できる。
- **IMU駆動の伝播.** バイアス補正済みの観測$\hat{\mathbf{f}}, \hat{\boldsymbol{\omega}}$を用いると、連続力学（式2–4）は
  $$\dot{\mathbf{r}} = -\hat{\boldsymbol{\omega}}^\times\mathbf{r} + \mathbf{v} + \mathbf{w}_r, \qquad \dot{\mathbf{v}} = -\hat{\boldsymbol{\omega}}^\times\mathbf{v} + \hat{\mathbf{f}} + \mathbf{q}^{-1}(\mathbf{g}), \qquad \dot{\mathbf{q}} = -\mathbf{q}(\hat{\boldsymbol{\omega}}),$$
  であり、各ランドマークの方位と距離はカメラフレームの速度に応じて進展する（式9–10）：$\dot{\mu}_i = N^T(\mu_i)\hat{\boldsymbol{\omega}}^V - \begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix} N^T(\mu_i)\frac{\hat{\mathbf{v}}^V}{d(\rho_i)}$および$\dot{\rho}_i = -\mu_i^T\hat{\mathbf{v}}^V / d'(\rho_i)$、ここで$N^T(\mu)$は$\mu$の接空間への射影である。
- **直接的なフォトメトリック更新.** 各ランドマークは多階層パッチを持つ：因数2の画像ピラミッドの各レベルにおける$8{\times}8$画素のパッチ$P_l$（4レベル → 特徴あたり$256 = 4\times8\times8$個の強度誤差）。レベル$l$とパッチ画素$\mathbf{p}_j$について、強度誤差（式17）は
  $$e_{l,j} = P_l(\mathbf{p}_j) - I_l\big(\mathbf{p}\,s_l + \mathbf{W}\mathbf{p}_j\big) - m,$$
  であり、視点歪みに対するアフィンワープ$\mathbf{W}$、レベルごとのスケール$s_l$、照明不変性のために減算される平均誤差$m$を含む。全ての項を積み重ねると$\bar{\mathbf{b}}(\hat{\mathbf{p}}) = \bar{\mathbf{A}}(\hat{\mathbf{p}})\,\delta\mathbf{p}$が得られ、QR分解によってこれを等価な2D系$\mathbf{b}(\hat{\mathbf{p}}) = \mathbf{A}(\hat{\mathbf{p}})\,\delta\mathbf{p}$に圧縮する。これがイノベーション$\mathbf{y}_i = \mathbf{b}_i(\pi(\hat{\mu}_i)) + \mathbf{n}_i$としてEKFに投入され、ヤコビアンは$\mathbf{H}_i = \mathbf{A}_i(\pi(\hat{\mu}_i))\frac{d\pi}{d\mu}(\hat{\mu}_i)$である — 記述子も明示的なマッチングも不要である。
- **ロバスト性の仕組み.** 予測される不確実性が大きい特徴（例えば新しく検出されたもの）は、更新前にEKFの線形化点を改善するパッチベースの事前アライメントを受ける；マハラノビス距離によるイノベーションテストが外れ値/動体を排除する；検出には多階層Shi-Tomasi基準（$\mathbf{H} = \bar{\mathbf{A}}^T\bar{\mathbf{A}}$、最小固有値）によってスコア付けされたFASTコーナー検出器がバケッティングを用いて使われ、局所/大域の追跡品質スコアが特徴の入れ替えを制御する。

## 実験結果

VI-Sensor（120°FOVレンズを持つ20 HzのワイドVGAグローバルシャッターカメラ1台；200 HzのADIS16448 IMU、角度ランダムウォーク0.66 deg/√Hz）から得られたデータで評価、最大50特徴、4ピラミッドレベル、モーションキャプチャによる正解データを使用。約1分間のハンドヘルドシーケンス（平均回転速度約1.5 rad/s）では、走行距離に対する相対位置誤差は**参照となるバッチ最適化フレームワークと同程度か、しばしばやや優れている**；特徴数が20未満に落ちると精度は著しく低下する。Intel i7-2760QMのシングルコアでの1画像あたりの処理時間は、特徴10個で6.65 ms、特徴50個では**29.72 ms**まで — 20 Hzでの実時間処理に十分余裕がある。高速動作のデータセット（平均3.5 rad/s、最大8 rad/s）では、姿勢とロボセントリックな速度は正解値の3σ範囲内で追従し、観測不能なヨー角のみがゆっくりと漂う；IMU-カメラの外部パラメータは（並進をゼロで初期化した）粗い推定からオンラインで収束する。このフィルタはマルチローターUAVにも搭載され、オンラインキャリブレーションを行いながら離陸から着陸まで飛行を安定化させた。

## SLAMにおける意義

ROVIOは、直接法とカルマンフィルタリングが自然に組み合わせられることを示した — カメラはEKFに対して強度イノベーションを生成する「単なる別のセンサ」となり、ロボセントリック+逆距離の定式化によって初期化手順とワールドセントリックなフィルタを悩ませる観測不能な大域状態の両方が取り除かれる。これはmaplabマッピングフレームワークのVIOフロントエンド（ROVIOLI）となり、MSCKFやOKVISと並ぶEuRoC時代の標準的なベースラインとなった。そのフォトメトリック残差の思想は、VI-DSOやDM-VIOといった後の直接法VIOシステムにも引き継がれている。低テクスチャや動きブラーに耐えられる軽量でロバストなオドメトリが必要な場合には、これを選ぶべきである。

## 関連ノート

- [MSCKF](msckf.md)
- [OpenVINS](openvins.md)
- [DM-VIO](dm-vio.md)
- [maplab](maplab.md)
- [VI-DSO](vi-dso.md)
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md)
