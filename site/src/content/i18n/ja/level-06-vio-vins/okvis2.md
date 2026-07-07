# OKVIS2

> Leutenegger 2022 · [論文](https://arxiv.org/abs/2202.09199)

**一行要約** — OKVIS2は、共通の観測を、ループクロージャ時に流動的にランドマークと観測へ戻すことができるポーズグラフの辺へと周辺化することで、古典的なOKVISのスライディングウィンドウVIOをリアルタイムでスケーラブルなビジュアル・インエルシャル*SLAM*システムへとアップグレードする。

## 問題

スライディングウィンドウVIOシステムは、古い状態を周辺化または固定することで計算量を有限に抑えるが、古典的な周辺化は一方通行の道である:ループクロージャと大規模マップ管理のタイトな統合は「古い状態やランドマークの周辺化を採用するスキームにとって本質的な課題を構成する」。ORB-SLAM3は代わりに単純に古い状態を*固定*する——より単純だが、「本質的に保守的な近似ではなく、過去の推定不確かさを事実上無視してしまう」。OKVIS2は、ロボティクスとAR/VRのためのロバストで正確な推定を目標とし、特に*長い*ループクロージャと*繰り返し*のループクロージャに注意を払い、オドメトリと完全なSLAMの両方のように振る舞う単一の有限なファクタグラフを用いる。

## 手法とアーキテクチャ

このシステムは、**フロントエンド**(状態初期化、BRISKキーポイントマッチング、ステレオ三角測量、セグメンテーションCNN、場所認識/再ローカライゼーション)と、マルチフレームごとに同期的に実行される**リアルタイム推定器**、そして**非同期の全体グラフループ最適化**に分割される。推定器は(Ceres、Cauchyロバスト化された観測)を最小化する:

$$c(\mathbf{x}) = \frac{1}{2}\sum_{i}\sum_{k\in\mathcal{K}}\sum_{j\in\mathcal{J}(i,k)} \rho\left({\mathbf{e}_{\mathrm{r}}^{i,j,k}}^T \mathbf{W}_{\mathrm{r}}\, \mathbf{e}_{\mathrm{r}}^{i,j,k}\right) + \frac{1}{2}\sum_{k\in\mathcal{P}\cup\mathcal{K}\setminus f} {\mathbf{e}_{\mathrm{s}}^{k}}^T \mathbf{W}_{\mathrm{s}}^{k}\, \mathbf{e}_{\mathrm{s}}^{k} + \frac{1}{2}\sum_{r\in\mathcal{P}}\sum_{c\in\mathcal{C}(r)} {\mathbf{e}_{\mathrm{p}}^{r,c}}^T \mathbf{W}_{\mathrm{p}}^{r,c}\, \mathbf{e}_{\mathrm{p}}^{r,c},$$

再投影誤差$\mathbf{e}_{\mathrm{r}}^{i,j,k} = \tilde{\mathbf{z}}^{i,j,k} - \mathbf{h}\big(\mathbf{T}_{SC_i}^{-1}\, \mathbf{T}_{S^k W}\, {}_{W}\mathbf{l}^{j}\big)$、プレインテグレーションされたIMU誤差$\mathbf{e}_{\mathrm{s}}^{k} = \hat{\mathbf{x}}^{n}(\mathbf{x}^{k}, \tilde{\mathbf{z}}_{\mathrm{s}}^{k,n}) \boxminus \mathbf{x}^{n} \in \mathbb{R}^{15}$、そして相対姿勢(ポーズグラフ)誤差にわたって計算される。$\mathcal{K}$は最も新しい$T$個のフレームとライブ観測を持つ$M$個のキーフレームを保持し、$\mathcal{P}$はさらに過去に遡るポーズグラフフレームを保持する。

- **ポーズグラフの生成(核心となる貢献)**:$|\mathcal{K}|$が上限$K$を超えると、共視性が最も低いキーフレームがポーズグラフノードに変換される。接続されたフレームとの共通観測は、相対姿勢ファクタに圧縮される:
  $$\mathbf{e}_{\mathrm{p}}^{r,c} = \mathbf{e}_{\mathrm{p},0}^{r,c} + \begin{bmatrix} {}_{S^r}\mathbf{r}_{S^c} - {}_{S^r}\tilde{\mathbf{r}}_{S^c} \\ \mathbf{q}_{S^rS^c} \boxminus \tilde{\mathbf{q}}_{S^rS^c} \end{bmatrix},$$
  その重みは、Schur補元によって共観測ランドマークを実際に周辺化することから得られる:$\mathbf{H}^{*} = \mathbf{H}_{\mathrm{p},\mathrm{p}} - \sum_j \mathbf{H}_{\mathrm{p},j}\mathbf{H}_{jj}^{+}\mathbf{H}_{\mathrm{p},j}^{T}$、$\mathbf{W}_{\mathrm{p}}^{r,c} = \mathbf{H}^{*}$、$\mathbf{e}_{\mathrm{p},0}^{r,c} = -\mathbf{H}^{*+}\mathbf{b}^{*}$を与える——デファクトスタンダードである恒等重みのポーズグラフ辺に対する原理的な代替案である。
- **辺の選択**:共観測数に対する最大スパニング木がどの辺を生成するかを決定し、グラフを疎に保つ;最も古いキーフレームは現在と観測を共有する限り保持され、長期にわたる方向精度を保存する。
- **ランドマーク復活を伴うループクロージャ**:DBoW2クエリと3D-2D RANSAC検証がアクティブウィンドウをマッチした姿勢に再アライメントする;それを接続するポーズグラフ辺はランドマークと観測へ「復活」し、ランドマークは統合され、ループ誤差は回転平均化によって分配され、背景での全体グラフ最適化(IMUファクタを含み、ループ内の状態が変数)が後にリアルタイムグラフに同期される。
- **有限のリアルタイム問題**:$A = \max(A_{\min}, A_{\Delta T})$個の最も新しい状態のみが変数として保持される;実験では$T{=}3$、$K{=}5$、$L{=}5$個のループクロージャフレーム、$A_{\min}{=}12$、$\Delta T{=}2$秒を使用する。
- **動的コンテンツの除去**:軽量なFast-SCNNセグメンテーションCNNがキーフレームのみでCPU上で非同期に実行され、Cauchyロバスト化器だけでは除去されない空/雲領域への観測を除去する。

## 実験結果

EuRoCとTUM-VI(位置+ヨーアライメント後のATE、因果的 vs 非因果的を別々に報告)で評価:

- **EuRoC**平均ATE:OKVIS2非因果的**0.031 m** vs ORB-SLAM3 0.035、因果的0.048、VIOモード0.071;元のOKVIS 0.089、Kimera 0.119、VINS-Fusion 0.138。
- **TUM-VI**:短い回廊/室内シーケンスではORB-SLAM3と同等(room平均0.01 m)、長いシーケンスでは明確に最良——magistrale平均0.28 m vs ORB-SLAM3 0.81 m、outdoors平均11.60 m vs 17.87 m、slides平均0.54 m vs 0.45 m——そしてORB-SLAM3がループクロージャを報告しないシーケンスでループクロージャを達成する。
- フレームあたりのタイミング(i7-11700K):検出・記述7.1 ms、マッチ・三角測量26.6 ms、ループクロージャ試行17.7 ms、リアルタイムグラフ最適化33.2 ms、ポーズグラフ辺処理14.0 ms;背景のループ最適化は数十msから、非常に長いループでは約1秒までかかる。

## SLAMにおける意義

OKVIS(2015)はVIOのためのスライディングウィンドウ最適化+周辺化のアーキテクチャを定義したが、ループが見つかったときに周辺化を取り消すことができなかった。OKVIS2の周辺化から導出されたポーズグラフ辺は、Schur補元事前分布と完全なランドマーク保持との間の原理的な中間点であり、推定器はマップをリセットすることなくオドメトリと完全なSLAMの間を流動的に移動する。これは、同じファクタグラフを深度、LiDAR、GNSSに拡張するOKVIS2-Xの直接の基盤である。

## 関連ノート

- [OKVIS](okvis.md)
- [OKVIS2-X](okvis2-x.md)
- [IMUプレインテグレーション](imu-preintegration.md)
- [周辺化](../level-02-getting-familiar/marginalization.md)
- [ポーズグラフ最適化](../level-02-getting-familiar/pose-graph-optimization.md)
- [VINS-Mono](vins-mono.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
