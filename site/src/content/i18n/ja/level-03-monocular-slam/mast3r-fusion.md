# MASt3R-Fusion

> Zhou 2025 · [論文](https://arxiv.org/abs/2509.20757)

**一行要約** — フィードフォワードの視覚モデルMASt3RをIMUおよびGNSS計測と階層的なファクターグラフの中で密結合させ、基盤モデルによる高密度SLAMにメトリックスケールと大域的な地理参照を与える。

## 問題

古典的な視覚SLAMは「低テクスチャ環境、スケールの曖昧さ、そして視覚条件が悪化する場合の性能低下にしばしば苦しむ」。フィードフォワードのポイントマップ回帰(MASt3R)は画像から直接高忠実度の幾何を復元することで、こうした問題の多くを解決する。しかしこれらの新しいパイプラインは「広く実証されてきた確率的マルチセンサー情報融合の利点」を捨ててしまう。IMUによるメトリックスケールも、GNSSによる絶対的な地理参照も、体系的な不確実性の管理も持たない。MASt3R-Fusionは、フィードフォワードの視覚モデルを事後的にではなく*密結合*で慣性・GNSSセンシングと結合する方法を問う。

## 手法とアーキテクチャ

2つのステージからなる。**リアルタイムSLAM**(フィードフォワードフロントエンドを持つスライディングウィンドウVIO)と**大域最適化**(ループ閉じ込み+全軌道にわたるGNSS)。

**フィードフォワードによる視覚計測。** MASt3R-SLAMに従い、各画像はトークン $\mathbf{F}_i=\mathcal{F}_{\mathrm{enc}}(\mathbf{I}_i)$ にエンコードされ、画像ペアはポイントマップとディスクリプタマップに同時にデコードされる。

$$\mathbf{X}^{ij}_{i},\,\mathbf{X}^{ij}_{j},\,\mathbf{D}^{ij}_{i},\,\mathbf{D}^{ij}_{j}=\mathcal{F}_{\mathrm{dec}}\left(\mathbf{F}_{i},\mathbf{F}_{j}\right)$$

ここで $\mathbf{X}^{ij}_i,\mathbf{X}^{ij}_j$ はフレーム $i$ の基準座標系での2D-to-3Dポイントマップである。高密度マッチングはポイントマップ上でのレイ近接最適化によって行われ、その後ディスクリプタの内積とサブピクセル精度のための4倍双線形アップサンプリングされたディスクリプタマップによって精緻化される。深度残差が大きい対応点はマスクされ、これは動的物体の除去にもつながる。

**Sim(3)ポイントマップ整合制約。** 各キーフレームはポイントマップ $\mathbf{X}_i$ と、カメラ座標系からワールド座標系への相似変換 $\mathbf{S}_i\in\mathrm{Sim}(3)$(スケール $s$、回転 $\mathbf{R}$、並進 $\mathbf{t}$)を持つ。マッチしたペアについて、残差は既知深度での再投影と、純回転の場合のための深度項を組み合わせる。

$$\mathbf{r}_{ij}\left(\mathbf{S}^{i}_{j}\right)=\begin{bmatrix}\mathbf{u}^{i}_{j}-\pi\left(\mathbf{S}^{i}_{j}\circ\mathbf{X}_{j}\right)\\ \left(\mathbf{X}_{i}\left[\mathbf{u}^{i}_{j}\right]\right)_{z}-\left(\mathbf{S}^{i}_{j}\circ\mathbf{X}_{j}\right)_{z}\end{bmatrix}$$

ここで $\mathbf{S}^i_j=\mathbf{S}_i^{-1}\circ\mathbf{S}_j$ は相対的なSim(3)変換である。バンドル調整と異なり、点ごとの深度は最適化されない — ネットワークの3D構造はスケールを除いて信頼されるため、視覚制約はコンパクトな対ごとのファクターになる。各高密度制約はGPU上でヘッセ行列形式 $\mathbf{H}_{ij}=(\mathbf{J}^{r}_{ij})^{\top}\mathbf{J}^{r}_{ij}$、$\mathbf{v}_{ij}=(\mathbf{J}^{r}_{ij})^{\top}\mathbf{r}_{ij}$ に圧縮される — CPUソルバーに渡されるのはペアごとにわずか $7\times 7$ のブロックである。

**同型群変換。** メトリックスケールのセンサーと融合するために、Sim(3)は $\mathrm{SE}(3)\times\mathbb{R}$ として因数分解され、リー代数の摂動は以下のように線形に関連付けられる。

$$\begin{bmatrix}\boldsymbol{\omega}\\ \boldsymbol{\nu}\\ \sigma\end{bmatrix}=\underbrace{\begin{bmatrix}1&&\\ &s\mathbf{I}&\\ &&s\end{bmatrix}}_{\boldsymbol{\Lambda}}\begin{bmatrix}\boldsymbol{\theta}\\ \boldsymbol{\tau}\\ \delta s\end{bmatrix}$$

これによりSim(3)の視覚ヘッセ行列はSE(3)姿勢とキーフレームごとのスケール $s_i$ に直接接続される。

**スライディングウィンドウのファクターグラフ。** ウィンドウの状態は $\mathcal{X}_i=(\mathbf{T}_i,s_i,\mathbf{v}_i,\mathbf{b}_i)$ — SE(3)姿勢、スケール、速度、IMUバイアス — であり、float64で保持される(高密度なGPU処理はfloat32でローカルに留まる)。標準的なIMU事前積分ファクター $\mathbf{r}_b$ が連続するキーフレームを結び、古い状態はシューア補元を介して事前分布 $(\mathbf{H}_m,\mathbf{v}_m)$ にマージン化される。リアルタイムのコストは次のとおりである。

$$\sum_{i\in\mathcal{W}}\left\|\mathbf{r}_{\mathrm{b}}(\mathcal{X}_{i},\mathcal{X}_{i+1})\right\|^{2}+\sum_{(i,j)\in\mathcal{E}}\mathbf{E}_{\mathrm{v}}(\mathcal{X}_{i},\mathcal{X}_{j})+\mathbf{E}_{m}(\mathcal{X})$$

**大域SLAM。** ループ候補はフィードフォワードのエンコーダトークン検索から得られ、高コストな高密度検証の前に効率的なVIO不確実性テスト(沿軌道/横断軌道誤差伝播による距離不確実性 $\sigma_{p,q}$)によってフィルタされる。GNSS位置は、時間オフセットを扱うための一時的なIMU事前積分ノードを介してキーフレームに結び付けられたファクター $\mathbf{r}_g$ として入力される。2段階の大域最適化では、まずCauchyでロバスト化された相対姿勢ループ制約を用い、その後インライアループを完全なヘッセ行列形式の視覚ファクターに置き換える — これにより姿勢グラフへの縮約ではなく、すべてのV-I情報を保持する。

## 実験結果

- **KITTI-360(単眼VIO)**: 平均相対並進誤差はDM-VIOより43.0%低く、DBA-Fusionより17.7%低い(例: ハイウェイのseq 0003で $t_{rel}$ 0.406% vs 1.146%/1.041%)。この規模では視覚のみのMASt3R-SLAMは実質的に失敗する(RTEは21〜55%)。
- **KITTI-360(ループ閉じ込みを伴う大域SLAM)**: 正規化ATEは軌道長の0.05%であり、ORB-SLAM3の0.63%、VGGT-Longの2.91%に対して優れる — 例えば8.4 kmのseq 0000でATE 2.13 m、対してORB-SLAM3は26.03 m、VGGT-Longは103.64 m。
- **SubT-MRS(洞窟、屋内外混在)**: VIOのATEは長さの0.23%であり、DBA-Fusion/ORB-SLAM3/DM-VIOの0.41〜1.74%に対して優れる。ループ閉じ込みありでは0.13%(ORB-SLAM3の0.37%に対して)であり、視覚のみのVGGT-Longは3シーケンスすべてで失敗する。
- **武漢の都市データセット(V-I-GNSS)**: 実際のGNSS RTKを用いた場合、2つのシーケンスで水平RMSEはそれぞれ0.21 m / 0.09 mであり、VINS-Fusionの疎結合な大域融合の2.54/0.62 mに対して優れる。100秒間のGNSS遮断を模擬した状況下でも0.37/0.46 mのRMSEを維持する。
- ノートPCのRTX 4080 Mobile GPU上でリアルタイム実行が可能であり、任意の長さのシーケンスを8 GBのGPUメモリで処理できる。コード: [GREAT-WHU/MASt3R-Fusion](https://github.com/GREAT-WHU/MASt3R-Fusion)。

## SLAMにおける意義

MASt3R-Fusionは、3D基盤モデルのフロントエンドが、実運用システムが依拠する古典的なマルチセンサー・ファクターグラフの仕組みと両立可能であることを示している — 学習による高密度な幾何と厳密なセンサー融合のどちらかを選ぶ必要はない。Sim(3)制約をSE(3)グラフに組み込む仕組み($\boldsymbol{\Lambda}$同型を介したもの)は、覚えておくべき鍵となるパターンである。それはスケールの曖昧な学習された幾何が、いかにしてメトリックセンサーによって地に足をつけるかという方法である。これは実運用SLAMが向かう先を示している。知覚にはフィードフォワードモデル、推定にはファクターグラフ、地に足をつけるためには絶対センサーである。

## 関連ノート

- [MASt3R-SLAM](mast3r-slam.md)
- [MASt3R](mast3r.md)
- [VINS-Fusion](../level-06-vio-vins/vins-fusion.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Tightly-coupled vs Loosely-coupled](../level-06-vio-vins/tightly-coupled-vs-loosely-coupled.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
