# Extended Kalman Filter (EKF)

**拡張カルマンフィルタ（Extended Kalman Filter）**は、非線形モデルを用いた逐次状態推定の主力手法である。状態に対するガウス信念 $\mathcal{N}(\hat{\mathbf{x}}, P)$ を保持し、**予測（predict）**（運動モデルを通じて信念を伝播する）と**更新（update）**（観測によってそれを補正する）の2つのステップを交互に行う — これは、すべての密度をガウス分布で近似し、すべてのモデルを現在の推定値で線形化した、まさに逐次ベイズフィルタである。

## セットアップ

システムは非線形な運動モデルと非線形な観測モデルによって記述される。

$$
\mathbf{x}_k = f(\mathbf{x}_{k-1}, \mathbf{u}_k) + \mathbf{w}_k, \qquad \mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, Q_k)
$$

$$
\mathbf{z}_k = h(\mathbf{x}_k) + \mathbf{v}_k, \qquad \mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, R_k)
$$

ここで $\mathbf{x}$ は状態（例えばカメラの姿勢、速度、ランドマーク位置）、$\mathbf{u}$ は制御入力またはIMU入力、$\mathbf{z}$ は観測（例えば追跡している特徴点のピクセル座標）、$Q$、$R$はプロセスノイズと観測ノイズの共分散である。EKFは、現在の推定値で評価したヤコビ行列を用いて$f$と$h$を線形化する。

$$
F_k = \left.\frac{\partial f}{\partial \mathbf{x}}\right|_{\hat{\mathbf{x}}_{k-1|k-1}}, \qquad
H_k = \left.\frac{\partial h}{\partial \mathbf{x}}\right|_{\hat{\mathbf{x}}_{k|k-1}}
$$

## 予測

$$
\hat{\mathbf{x}}_{k|k-1} = f(\hat{\mathbf{x}}_{k-1|k-1}, \mathbf{u}_k)
$$

$$
P_{k|k-1} = F_k P_{k-1|k-1} F_k^T + Q_k
$$

平均は完全な非線形モデルを通して伝播される。共分散のみが線形化を用いる。このステップでは不確実性が増大する（デッドレコニングによるドリフト）。

## 更新

$$
\mathbf{y}_k = \mathbf{z}_k - h(\hat{\mathbf{x}}_{k|k-1}) \qquad \text{(イノベーション)}
$$

$$
S_k = H_k P_{k|k-1} H_k^T + R_k \qquad \text{(イノベーション共分散)}
$$

$$
K_k = P_{k|k-1} H_k^T S_k^{-1} \qquad \text{(カルマンゲイン)}
$$

$$
\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} + K_k \mathbf{y}_k, \qquad
P_{k|k} = (I - K_k H_k)\, P_{k|k-1}
$$

ゲイン $K_k$ は観測を予測に対して重み付けする。確信度の高い予測（小さな$P$）や雑音の多いセンサー（大きな$R$）は小さな補正をもたらし、逆もまた同様である。イノベーション共分散 $S_k$ は**ゲーティング**もサポートする — マハラノビス検定 $\mathbf{y}^T S^{-1} \mathbf{y} < \chi^2$ の閾値により、外れ値の観測が状態を汚す前に棄却される。

## EKF-SLAM

EKF-SLAM（MonoSLAMの背後にある定式化）では、状態はカメラ/ロボットの姿勢とすべてのランドマーク位置を積み重ねたものである。

$$
\mathbf{x} = \begin{bmatrix} \mathbf{x}_{\text{robot}}^T & \mathbf{m}_1^T & \cdots & \mathbf{m}_n^T \end{bmatrix}^T,
$$

そして$P$は、姿勢-ランドマーク間およびランドマーク-ランドマーク間の相関を含む完全な結合共分散を保持する。これらの相互相関こそが、フィルタにおいてループ閉じ込みを機能させるものである。姿勢を補正すると、相関するすべてのランドマークも引き寄せられる。そのコストは構造的なものである。

- **二次スケーリング**: $P$は$O(n^2)$個の要素を持ち、各更新はそのすべてに触れる。これはリアルタイムEKF-SLAMを小規模なマップ（ランドマーク数十から百程度のオーダー）に制限する。
- **線形化誤差**: ヤコビ行列は現在の推定値で一度評価され、誤差は$P$の中に永久に焼き付けられる — 最適化手法とは異なり、フィルタは過去を再線形化することができない。これがEKF-SLAMのよく知られた**不整合性**（過信）の原因である。
- **回転の扱い**: 姿勢の素朴なパラメータ化はうまく振る舞わない。実用的なフィルタは**誤差状態（間接）EKF**を用い、フィルタが名目状態の周りの小さな誤差を推定し、クォータニオンのキネマティクスが姿勢を扱う。

これらの限界こそが、現代の視覚SLAMがキーフレームベースの非線形最適化に移行した理由である（「なぜフィルタなのか」論争、Strasdat et al.）。一方で、フィルタリングは、その定数時間の逐次形式が生きる領域で生き残っている。視覚慣性オドメトリ（MSCKF、ROVIO、誤差状態EKF）や、GPS/RADAR/ホイールエンコーダとのオドメトリ融合である。

## SLAMにおける意義

EKFはSLAMの歴史的な基盤であり（EKF-SLAMは10年間*唯一の*解であった）、今も実用VIOの背骨である（MSCKF系のフィルタは多くのARヘッドセットやドローンで動いている）。最適化中心のパイプラインにおいても、EKFの概念は至る所に存在する。予測/更新の構造、外れ値棄却のためのイノベーションゲーティング、不確実性伝播のための共分散、そしてマージナライゼーション（固定ラグスマザーのマージナライゼーションステップは、代数的にはカルマン更新である）。EKFの単一線形化という仮定がいつ破綻するかを理解することは、なぜバンドル調整が精度で勝るのか、そしてなぜMSCKF系フィルタが線形化を遅延させるのかを理解する鍵である。

## 関連ノート

- [MonoSLAM](../level-03-monocular-slam/monoslam.md)
- [MSCKF](../level-06-vio-vins/msckf.md)
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md)
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
- [Non-linear optimization](non-linear-optimization.md)
