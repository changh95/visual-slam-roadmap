# VI-DSO

> von Stumberg 2018 · [論文](https://arxiv.org/abs/1804.05625)

**一行要約** — VI-DSOは、プレインテグレーションされたIMU因子をDSOの直接的な疎フォトメトリックバンドル調整に密に統合し、メトリックスケールと重力方向を明示的に最適化することで、任意のスケールで即座に初期化できるようにしている — この一貫性は新しい「動的マージナライズ」の仕組みによって維持される。

## 問題

単眼の直接オドメトリ（DSO）は優れた精度を提供するが、未知のスケールまでしか到達できない。IMUによってスケールが観測可能になるが — しかし多くの場合*即座には*観測可能にならない：特定の運動（例えば一定速度での加速度ゼロ）では即座の初期化は不可能であり、これがVI ORB-SLAMがEuRoCで初期化前に15秒間のカメラ運動を待つ理由である。一方、スライディングウィンドウ推定器は部分的なマージナライズによって計算量を有界に保つが、線形化された事前分布は、後にスケール推定がその事前分布が線形化された値から大きくずれると不整合になる。VI-DSOはこの両方の問題を同時に解決する。

## 手法とアーキテクチャ

2つの構成要素が並行して動作する：**粗いトラッキング**は、最新のキーフレームに対する直接的な画像アライメントと慣性項（幾何とスケールは固定）によって各フレームのポーズを推定し、新しいキーフレームが作成されるたびに**視覚慣性バンドル調整**が、結合エネルギーを最小化することで全ての活動中のキーフレームの幾何とポーズを再推定する。

$$E_{\text{total}} = \lambda \cdot E_{\text{photo}} + E_{\text{inertial}}$$

フォトメトリック項は、キーフレーム$i$に保持され、フレーム$j$で観測される点$\boldsymbol{p}$に対するDSOの誤差である。

$$E_{\boldsymbol{p}j} = \sum_{\mathbf{p}\in\mathcal{N}_{\boldsymbol{p}}} \omega_{\boldsymbol{p}} \left\lVert (I_j[\boldsymbol{p}'] - b_j) - \frac{t_j e^{a_j}}{t_i e^{a_i}} (I_i[\boldsymbol{p}] - b_i) \right\rVert_{\gamma}$$

ここで$\mathcal{N}_{\boldsymbol{p}}$は小さな画素近傍、$t_i, t_j$は露光時間、$a_i, b_i, a_j, b_j$はアフィン照明パラメータ、$\omega_{\boldsymbol{p}}$は勾度に依存する重み、$\gamma$はフーバーノルムである — そのため、コーナーだけでなく十分に大きな強度勾度を持つ*任意の*画素を追跡できる。連続するキーフレーム間のIMU観測は単一の因子としてプレインテグレーションされる：予測状態$\widehat{\boldsymbol{s}}_j$と共分散$\widehat{\boldsymbol{\Sigma}}_{s,j}$を用いて、

$$E_{\text{inertial}}(\boldsymbol{s}_i, \boldsymbol{s}_j) = \left(\boldsymbol{s}_j \boxminus \widehat{\boldsymbol{s}}_j\right)^{T} \widehat{\boldsymbol{\Sigma}}_{s,j}^{-1} \left(\boldsymbol{s}_j \boxminus \widehat{\boldsymbol{s}}_j\right)$$

各キーフレームの状態は、ポーズ、速度、IMUバイアス、アフィン輝度、保持している点の逆深度を積み重ねたものである。

$$\boldsymbol{s}_i = \big[(\boldsymbol{\xi}^{D}_{cam_i\_w})^{T},\ \boldsymbol{v}_i^{T},\ \boldsymbol{b}_i^{T},\ a_i,\ b_i,\ d_i^{1}, \dots, d_i^{m}\big]^{T}$$

そして全体の状態はさらに、カメラの内部パラメータと、スケール/重力を持たない「DSOフレーム」とメトリックフレームの間の並進なしのSIM(3)変換$\boldsymbol{\xi}_{m\_d} \in \mathfrak{sim}(3)$を含む。フォトメトリック誤差はDSOフレーム（スケール独立）で評価され、慣性誤差はメトリックフレームで評価される — そのため**スケールと重力方向は明示的な変数**となり、他の全てと共にガウス・ニュートン法によって共同で最適化される。ここで$\mathbf{H} = \mathbf{H}_{\text{photo}} + \mathbf{H}_{\text{imu}}$であり、慣性ブロックは相対ヤコビアン$\mathbf{J}_{\text{rel}}$を介して2つの状態表現の間でマッピングされる。連続するキーフレーム間のギャップは0.5秒未満に保たれ、プレインテグレーションの精度が維持される。

**初期化** — DSOの視覚初期化器（平均深度を1に正規化）、最大40個の加速度計観測の平均から得られる重力方向、ゼロの速度とバイアス、スケール1.0；これらすべてはその後結合的に精緻化されるため、慣性データは最初のフレームからポーズ推定を改善する。

**動的マージナライズ** — シュール補元（First-Estimateヤコビアンを用いる）によって古いキーフレームをマージナライズすると線形化点が固定されるが、これはスケールがまだ収束している間には安全ではない。そのためVI-DSOは3つのマージナライズ事前分布を維持する：$M_{\text{visual}}$（スケール独立な視覚因子のみ）、$M_{\text{curr}}$（スケール線形化点以降の全因子；最適化で使用される）、そして$M_{\text{half}}$（現在の推定に近いスケールを持つ最近の状態のみ）であり、

$$\forall i \in M_{\text{curr}}:\ s_i \in \left[\, s_{\text{middle}}/d_i,\ s_{\text{middle}} \cdot d_i \,\right]$$

を強制する。スケール推定が区間の境界を超えるたびに、事前分布はカスケードされ（$M_{\text{curr}} \leftarrow M_{\text{half}}$、$M_{\text{half}} \leftarrow M_{\text{visual}}$）、区間の中心$s_{\text{middle}}$が移動する — こうして最適化は常に一貫したスケールを持つ*何らかの*慣性履歴を保持し、区間サイズ$d_i$は動的に適応される（$d_{\text{min}} = \sqrt{1.1}$）。

## 実験結果

EuRoC（左カメラ、各シーケンス10回実行、中央値RMSE、リアルタイム）において：MH1–MH5で0.062 / 0.044 / 0.117 / 0.132 / 0.121 m、V11–V23で0.059 / 0.067 / 0.096 / 0.040 / 0.062 / 0.174 m — 全シーケンスで0.23 m未満であり、比較対象の手法の中でROVIO以外で失敗しないのはVI-DSOだけである。VI-DSOは単眼VIオドメトリ（Leutenegger et al.）を全シーケンスで上回り、ステレオ/SLAM版（Kasyanov et al.）さえも11シーケンス中9で上回る。VI ORB-SLAM（完全なSLAMシステムであり、バンドル調整済みのキーフレーム軌道で評価）に対しては、ループクロージングなしでRMSEで競争力があり、より堅牢である — ORB-SLAMの初期化はV1_03_difficultで失敗する。スケール推定も優れている：平均スケール誤差0.7%対1.0%、最大1.2%対3.4%。視覚のみのDSOはV1_03/V2_03を全く処理できず；ROVIOは堅牢だがフィルタであるため精度は大幅に劣る。

## SLAMにおける意義

VI-DSOは、視覚慣性融合が特徴点ベースのパイプラインだけのものではないことを示した：直接的なフォトメトリックバンドル調整はIMU因子に対応でき、成熟した特徴点ベースVIOに匹敵するEuRoC精度を実現する。これはDSOの系譜（DSO → Stereo DSO / LDSO → VI-DSO → DM-VIO）における重要な連結点である：ウィンドウ内でのスケールと重力の結合推定は視覚慣性初期化における共通のパターンとなり、動的マージナライズはDM-VIOの遅延マージナライズの直接的な先駆けとなった。

## 関連ノート

- [DSO](../level-03-monocular-slam/dso.md)
- [DM-VIO](dm-vio.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [IMU preintegration](imu-preintegration.md)
- [VINS-Mono](vins-mono.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
