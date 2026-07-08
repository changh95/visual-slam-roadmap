# OpenVINS

> Geneva 2020 · [論文](https://docs.openvins.com/)

**一行要約** — OpenVINSは、デラウェア大学によるオープンソースのモジュール式MSCKFベースVIO研究プラットフォームであり、FEJ一致性を備えたオンマニフォルドのスライディングウィンドウカルマンフィルタ、カメラ内部/外部パラメータおよび時間オフセットのオンラインキャリブレーション、フルの視覚慣性シミュレータ、評価ツールをひとまとめにしたものである — 事実上標準のMSCKF実装となった。

## 問題

MSCKFは2007年以来影響力を持ってきたが、権威ある文書化されたオープンソース実装は存在せず、そのため結果の再現やフィルタベースと最適化ベースのVIOの比較は実際には困難であった。既存のコードベースにはハードコードされた仮定があり、評価ツールも欠けていた。さらに実運用では、カメラ-IMU間の外部パラメータ、カメラ内部パラメータ、カメラとIMUのクロック間の時間オフセットのオンラインキャリブレーションが必要であり、EKFの不整合性（観測不能な方向に沿った偽の情報獲得）は理論上よく理解されていたものの、公開されたコードで対処されることは稀であった。

## 手法とアーキテクチャ

- **状態.** フィルタは現在の慣性状態、$c$個の過去のIMUポーズクローン、$m$個のランドマーク、各カメラのキャリブレーションと時間オフセットを推定する（式1–5）。
$$
\mathbf{x}_k = \begin{bmatrix} \mathbf{x}_I^\top & \mathbf{x}_C^\top & \mathbf{x}_M^\top & \mathbf{x}_W^\top & {}^Ct_I \end{bmatrix}^\top, \qquad
\mathbf{x}_I = \begin{bmatrix} {}^{I_k}_G\bar{q}^\top & {}^G\mathbf{p}_{I_k}^\top & {}^G\mathbf{v}_{I_k}^\top & \mathbf{b}_{\omega}^\top & \mathbf{b}_{a}^\top \end{bmatrix}^\top,
$$
  ここで$\mathbf{x}_C$はクローンポーズを積み重ね、$\mathbf{x}_M$はランドマーク（グローバル3D、完全逆深度、またはアンカー表現）、$\mathbf{x}_W$は各カメラの内部パラメータ$\zeta$とIMU-カメラ外部パラメータである。慣性状態は$\mathcal{M} = \mathbb{H} \times \mathbb{R}^{12}$（15自由度）上に存在し、四元数のboxplusは$\bar q \boxplus \delta\boldsymbol{\theta} \simeq \begin{bmatrix} \tfrac{1}{2}\delta\boldsymbol{\theta} \\ 1 \end{bmatrix} \otimes \bar q$である。
- **マニフォルド上での伝播・更新.** IMUのキネマティクスは平均と共分散を伝播する、$\mathbf{P}_{k|k-1} = \boldsymbol{\Phi}_{k-1}\mathbf{P}_{k-1|k-1}\boldsymbol{\Phi}_{k-1}^\top + \mathbf{Q}_{k-1}$；クローン、ランドマーク、キャリブレーション状態は静的であるため、そのヤコビアンブロックは単位行列のままとなる（この疎性が活用される）。観測$\mathbf{z}_{m,k} = h(\mathbf{x}_k) + \mathbf{n}_{m,k}$はゼロ平均の誤差状態に関して線形化され、マニフォルド上で更新される。
  $$\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} \boxplus \mathbf{K}_k\big(\mathbf{z}_{m,k} - h(\hat{\mathbf{x}}_{k|k-1})\big), \qquad \mathbf{K}_k = \mathbf{P}_{k|k-1}\mathbf{H}_k^\top\big(\mathbf{H}_k\mathbf{P}_{k|k-1}\mathbf{H}_k^\top + \mathbf{R}_{m,k}\big)^{-1}.$$
  ランドマーク更新は標準的なMSCKFの確率的クローンモデルを用い、異なる特徴パラメータ化やカメラモデルをカバーする入れ子の観測関数を使う。First-Estimateヤコビアン（FEJ）により、フィルタが観測不能な方向に沿って情報を獲得しないようにしている。
- **オンライン時空間キャリブレーション.** 内部パラメータ$\zeta$と外部パラメータ$\{{}^C_I\mathbf{R}, {}^C\mathbf{p}_I\}$に関する追加のヤコビアンによってフィルタ内でこれらをキャリブレーションする；カメラとIMUのクロックは${}^It = {}^Ct + {}^Ct_I$の関係にあり、オフセット${}^Ct_I$はオンラインで推定される。
- **型ベースのインデックスシステム.** 各状態「型」（その推定値、誤差状態のサイズ、共分散インデックス、boxplus更新）は初期化・クローン化・マージナライズを通じて自動的に管理されるため、ユーザはある観測が触れる変数についてのみ疎なヤコビアンを書けばよい。新しい変数（例えばSLAMランドマーク）は、線形化されたシステムをQR分離（ギブンズ回転）によって新しい状態に依存する部分系と依存しない部分系に分けることで最適に初期化される。
- **研究インフラ.** ov_core（KLT型の疎な追跡、三角測量、マニフォルド数学）、ov_eval（軌道アライメント、ATE/RPE/NEESツール）、ov_msckf（推定器）、さらに任意のカメラリグに対してIMUと方位角観測を生成するSE(3) Bスプラインベースの視覚慣性シミュレータ、および完全な導出付きの文書。

## 実験結果

20回のモンテカルロシミュレーション（単眼カメラ10 Hz、IMU 400 Hz・ADIS16448相当のノイズ、ウィンドウサイズ11、フレームあたり最大100トラック、SLAMランドマーク50個、1画素ノイズ）において、オンラインキャリブレーションを有効にした場合、初期キャリブレーションが*悪い*場合でもATEは0.218°/0.139 mであり、これは真のキャリブレーションで得られる0.212°/0.134 mとほぼ一致し、NEESも一貫している（約2）；キャリブレーションを無効にして悪い初期推定を用いると、ATEは5.432°/508.7 mに爆発し、NEESも発散する。キャリブレーションパラメータは悪い初期推定から急速に収束する。EuRoC MAVのVicon-roomシーケンス（各10回実行、V2_03は除外）では、単眼のOpenVINS-SLAMは平均**1.445°/0.079 m ATE**であり — 比較対象の単眼システムの中で最良である — OKVIS（1.911°/0.154 m）、ROVIO（maplab、2.054°/0.140 m）、R-VIO（1.693°/0.149 m）、VINS-Fusion VIO（2.926°/0.104 m）に対して優位である；ステレオ版もBasalt、ICE-BA、S-MSCKFに対して同様に競争力がある。

## SLAMにおける意義

OpenVINSは、フィルタベースの系譜（MSCKF、FEJ/観測可能性制約付きEKFの研究）を、アクセスしやすく文書化されたコードベースへと変えた — VIO文献全体で参照される標準的なオープンMSCKFであり、マルチカメラ、マルチIMU、シュミットフィルタSLAMに関する後続研究の基盤となっている。FEJベースの観測可能性の強制とオンライン時空間キャリブレーションを、EKFベースVIOの標準的な既定機能とした。また、そのシミュレータと評価ツールボックスは、VIO研究への参入障壁を大幅に下げた。実運用品質のEKFベースVIOがどのように動作するかを学びたい場合、あるいは計算資源が限られたロボット向けの軽量な推定器が必要な場合、これは参照すべきシステムである。

## 関連ノート

- [MSCKF](msckf.md)
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md)
- [ROVIO](rovio.md)
- [Observability](observability.md)
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md)
- [IMU noise model](imu-noise-model.md)
