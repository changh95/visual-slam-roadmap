# VINS-Mono

> Qin 2018 · [論文](https://arxiv.org/abs/1708.03852)

**一行要約** — VINS-Monoは完全な密結合単眼視覚慣性推定器である — ロバストな初期化、両方向マージナライズを伴うスライディングウィンドウ最適化、密結合の再位置推定、4自由度ポーズグラフループクロージング — であり、ロボティクスで最も広く使われるVIOシステムの一つとなった。

## 問題

低コストIMUを備えた単眼カメラは、メトリックな6自由度状態推定のための*最小限の*センサスイートを形成する — しかし直接的な距離観測が存在しないことは、IMU処理、推定器の初期化、外部キャリブレーション、非線形最適化において大きな課題を生む。初期化は通常、単眼VINSにおいて最も脆弱なステップであり、長期的なドリフトを排除するには、ループ検出、再位置推定、大域最適化を一つのシステムに含める必要がある。VINS-Monoの目標は、故障回復を含めて、これらすべてをカバーする単一のロバストで多用途、完全なパッケージであった。

## 手法とアーキテクチャ

パイプライン：Shi-Tomasiコーナーに対するKLTオプティカルフロー（RANSACによる基礎行列外れ値除去）→ 視覚慣性アライメントによる初期化 → スライディングウィンドウVIO（Ceres）→ マージナライズ → DBoW2/BRIEFによるループ検出 → 密結合の再位置推定 → 4自由度ポーズグラフ。

- **視覚慣性アライメントによる初期化.** ビジョンのみのSfMがスケール不定のポーズを与える；ジャイロバイアスは、プレインテグレーションされた回転に対して$\sum_k \lVert \mathbf{q}_{b_{k+1}}^{c_0\,-1} \otimes \mathbf{q}_{b_k}^{c_0} \otimes \boldsymbol{\gamma}_{b_{k+1}}^{b_k} \rVert^2$を最小化することでキャリブレーションされ、その後速度、重力$\mathbf{g}^{c_0}$、メトリックスケール$s$がプレインテグレーションされた$\hat{\boldsymbol{\alpha}}, \hat{\boldsymbol{\beta}}$項から一つの線形系で解かれる。同じモジュールが故障回復も担う。
- **スライディングウィンドウの状態とコスト.** 状態$\mathcal{X} = [\mathbf{x}_0, \dots, \mathbf{x}_n, \mathbf{x}_c^b, \lambda_0, \dots, \lambda_m]$は、$n{+}1$個のIMU状態$\mathbf{x}_k = [\mathbf{p}^w_{b_k}, \mathbf{v}^w_{b_k}, \mathbf{q}^w_{b_k}, \mathbf{b}_a, \mathbf{b}_g]$、カメラ-IMU外部パラメータ、逆深度$\lambda_l$を保持する。MAP問題（式22）は
  $$\min_{\mathcal{X}} \Big\{ \big\lVert \mathbf{r}_p - \mathbf{H}_p\mathcal{X} \big\rVert^2 + \sum_{k \in \mathcal{B}} \big\lVert \mathbf{r}_{\mathcal{B}}(\hat{\mathbf{z}}^{b_k}_{b_{k+1}}, \mathcal{X}) \big\rVert^2_{\mathbf{P}^{b_k}_{b_{k+1}}} + \sum_{(l,j) \in \mathcal{C}} \rho\big( \lVert \mathbf{r}_{\mathcal{C}}(\hat{\mathbf{z}}^{c_j}_{l}, \mathcal{X}) \rVert^2_{\mathbf{P}^{c_j}_{l}} \big) \Big\},$$
  であり、マージナライズの事前分布$\{\mathbf{r}_p, \mathbf{H}_p\}$と視覚項に対するフーバー損失$\rho$を含む。
- **プレインテグレーションされたIMU残差**（式24）：プレインテグレーションされた項$\hat{\boldsymbol{\alpha}}^{b_k}_{b_{k+1}}, \hat{\boldsymbol{\beta}}^{b_k}_{b_{k+1}}, \hat{\boldsymbol{\gamma}}^{b_k}_{b_{k+1}}$に対する位置/速度/回転/バイアス誤差、例えば$\delta\boldsymbol{\alpha} = \mathbf{R}^{b_k}_w\big(\mathbf{p}^w_{b_{k+1}} - \mathbf{p}^w_{b_k} + \tfrac{1}{2}\mathbf{g}^w\Delta t_k^2 - \mathbf{v}^w_{b_k}\Delta t_k\big) - \hat{\boldsymbol{\alpha}}^{b_k}_{b_{k+1}}$、$\delta\boldsymbol{\theta} = 2\big[\mathbf{q}^{w\,-1}_{b_k} \otimes \mathbf{q}^w_{b_{k+1}} \otimes (\hat{\boldsymbol{\gamma}}^{b_k}_{b_{k+1}})^{-1}\big]_{xyz}$であり、バイアスはオンラインで補正される。
- **単位球面上の視覚残差**（式25）：再投影誤差は、観測された単位方位の接平面$[\mathbf{b}_1\ \mathbf{b}_2]^T$に射影されるため、広角/魚眼カメラも自然に扱える。
- **両方向マージナライズ.** 2番目に新しいフレームがキーフレームであれば、*最古の*フレームとその観測はシュール補元によって事前分布にマージナライズされる；そうでなければ、2番目に新しいフレームは単純に破棄される（その視覚観測は捨てられるが、IMUは保持される）— これにより疎性を保ちながら空間的に分離されたキーフレームを保持する。
- **再位置推定 + 4自由度ポーズグラフ.** DBoW2によるループ候補は、2D-2DおよびPnP RANSACを用いたBRIEF記述子マッチングで検証される；取得された特徴はループフレームのポーズを固定した状態でスライディングウィンドウ最適化に投入される（密結合の再位置推定）。マージナライズされたキーフレームは、相対的な位置とヨーのみを持つエッジからなる大域ポーズグラフに参加し、残差は$\mathbf{r}_{i,j} = \big[\mathbf{R}(\hat{\phi}_i, \hat{\theta}_i, \psi_i)^{-1}(\mathbf{p}^w_j - \mathbf{p}^w_i) - \hat{\mathbf{p}}^i_{ij};\ \psi_j - \psi_i - \hat{\psi}_{ij}\big]$である — ドリフトしやすい4自由度（x, y, z, ヨー）のみが最適化されるのは、重力によってロールとピッチが観測可能になるためである。

## 実験結果

EuRoC（MH_03_median、MH_05_difficult）において、VINS-Monoの純粋なVIOはOKVISの単眼/ステレオに精度で匹敵し、ループクロージングを行うと並進誤差は最小となる。2.5 kmの屋内/屋外混合の徒歩コースでは、ループクロージングなしの最終ドリフトは[−5.47, 2.76, −0.29] m（軌道の**0.88%**）でOKVISの2.36%に対して優位であり、ループ補正ありでは[−0.032, 0.09, −0.07] mであった。HKUSTキャンパスの5.62 km、1時間34分のハンドヘルド周回（25 Hzカメラ/200 Hz IMU）は、i7-4790上でリアルタイムに実行され（特徴追跡は25 Hzで15+5 ms、ウィンドウ最適化は10 Hzで50 ms、ループ検出は100 ms、ポーズグラフ最適化は130 ms）、地図に対してほぼドリフトフリーであった。8の字を描くMAVの機上閉ループ飛行の追跡（61.97 m、ループクロージング無効）では最終ドリフトが[0.08, 0.09, 0.13] m — **0.29%**であった。このシステムはiOS（VINS-Mobile）にも移植され、264 mの歩行でGoogle Tangoと比較された。PCとスマートフォンの両方でオープンソース版が公開されている。

## SLAMにおける意義

VINS-Monoは、間違いなく参照すべき単眼VIOシステムである：OKVISによって開拓されたスライディングウィンドウ+マージナライズのアーキテクチャを、実用的な線形初期化と完全な再位置推定/ループクロージングのバックエンドとともにパッケージ化し、これらすべてをドローンやスマートフォンで動作する単一のオープンソース版にまとめた。その設計上の選択 — プレインテグレーション、フーバーロバストな単位球面再投影因子、両方向マージナライズ、4自由度ポーズグラフ — は、後のシステム（VINS-Fusion、ORB-SLAM3の慣性モード、多くの市販トラッカー）が従うか改良する標準的なパターンとなった。

## 関連ノート

- [IMU preintegration](imu-preintegration.md)
- [OKVIS](okvis.md)
- [VINS-Fusion](vins-fusion.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
