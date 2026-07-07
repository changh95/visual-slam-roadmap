# PIN-SLAM

> Pan (Bonn) 2024 · [論文](https://arxiv.org/abs/2401.09101)

**一行要約** — PIN-SLAMは、明示的な点群マップを局所的な暗黙SDFを符号化する疎な最適化可能ニューラルポイント集合に置き換え、対応点探索不要なレジストレーションと — 決定的に — ループ閉じ込みが軌跡を補正した際にマップが弾性的に変形する能力を実現する。

## 問題

古典的なLiDARマップ — 点群、ボクセルグリッド、サーフェル、TSDFボリューム — は剛体的である: ループ閉じ込みが累積したドリフトを補正しても、すでに構築されたマップは補正済みの軌跡に合わせて滑らかに再形成することができず、そのためシステムはマップを再構築するか、サブマップを使うか、あるいは重複した構造を抱えたまま運用するかを迫られる。ニューラル暗黙マップはコンパクトかつ連続的であるが、これまでのニューラルSLAMシステムは部屋規模のRGB-D入力を対象としており、屋外LiDARのフレームレートには遅すぎた(Nerf-LOAM: 1フレームあたり4秒超)。PIN-SLAMは暗黙的ニューラルマッピングをLiDARのスケールに持ち込み、大域的整合性をマップ自体の第一級の性質にする。

## 手法とアーキテクチャ

各フレームについて: (1) スキャンをスキュー除去しボクセルダウンサンプリングして、レジストレーション用点群 $\mathcal{P}_r$ とマッピング用点群 $\mathcal{P}_m$ を得る; (2) $\mathcal{P}_r$ を局所マップのSDFに位置合わせする; (3) 増分学習でマップを更新する; (4) ニューラルポイント記述子でループを検出する; (5) ポーズグラフを最適化し、マップを変形する。

- **点ベース暗黙ニューラル(PIN)マップ**: $\mathcal{M} = \{\mathbf{m}_i = (\mathbf{x}_i, \mathbf{q}_i, \mathbf{f}_i^{g}, t_i^{c}, t_i^{u}, \mu_i)\}$ — 位置、姿勢クォータニオン、最適化可能な潜在特徴、生成/更新タイムステップ、安定性を含む。クエリ点 $\mathbf{p}$ におけるSDFは、特徴と*相対*座標から浅い共有MLPによって各近傍点ごとに復号される。

  $$s_j = D_{\theta}^{g}\left(\mathbf{f}_j^{g}, \mathbf{d}_j\right), \qquad \mathbf{d}_j = \mathbf{q}_j\left(\mathbf{p} - \mathbf{x}_j\right)\mathbf{q}_j^{-1},$$

  その後、逆二乗距離重み $w_j = \lVert \mathbf{p} - \mathbf{x}_j \rVert^{-2}$ を用いて $K$ 個の最近傍ニューラルポイントにわたって補間される: $S(\mathbf{p}) = \sum_j \frac{w_j}{\sum_k w_k} s_j$。$\mathbf{d}_j$ が各点自身の座標系で表現されているため、予測は点集合の剛体変換に対して不変である — これがマップの弾性の源である。ボクセルハッシング(1ボクセルにつき1つのアクティブなニューラルポイント)により定数時間の近傍探索が可能となる。
- **増分マップ学習**: サンプルは各レイに沿って(表面近傍と自由空間の両方から)射影SDFターゲットとともに抽出され、破滅的忘却に対抗するためスライディング学習プール $\mathcal{D}_p$ に保持される。損失は $\mathcal{L} = \mathcal{L}_{\text{bce}} + \lambda_e \mathcal{L}_{\text{eik}}$ であり、シグモイド写像されたSDF値に対する二値交差エントロピー損失(ソフトな切断)とEikonal正則化項

  $$\mathcal{L}_{\text{eik}} = \frac{1}{N}\sum_{i=1}^{N} \left( \lVert \nabla S(\mathbf{u}_W^{i}) \rVert_2 - 1 \right)^2.$$

  の和である。デコーダは最初の数フレームの後に固定され、ニューラルポイント特徴のみが学習を続ける。
- **対応点探索不要なオドメトリ**: スキャンは、すべての点をゼロレベル集合に乗せるように位置合わせされる。

  $$\mathbf{T}^{*} = \underset{\mathbf{T}}{\operatorname{argmin}} \sum_{\mathbf{p} \in \mathcal{P}_r} S\left(\mathbf{T}\mathbf{p}\right)^2,$$

  解析的ヤコビアン $\mathbf{J}_i = [\,\mathbf{g}_i^{\top},\ (\mathbf{p}_i' \times \mathbf{g}_i)^{\top}\,]$($\mathbf{g}_i = \nabla S(\mathbf{p}_i')$)を用いたLevenberg–Marquardtで解かれる — 最近傍データ対応付けは不要であり、フィールドが方向と大きさを直接供給する。Geman–McClureロバストカーネルがSDF残差と勾配異常 $\varepsilon_i = |\lVert \nabla S(\mathbf{p}_i') \rVert_2 - 1|$ によって点の重みを下げ、ヘッシアンの固有値チェックが退化を検出する。$F_{\text{ba}}$ フレームごとの暗黙的な局所バンドル調整が最近の姿勢と局所特徴を同時に精緻化する。
- **動的物体フィルタリング**: 安定な自由空間にあると予測される観測点 — $S(\mathbf{p}_W) > \gamma_d$ かつ安定性 $H(\mathbf{p}_W) > \gamma_\mu$ — はマッピングから除外される。
- **ループ閉じ込みと弾性マップ補正**: 大域ループは、局所マップの*ニューラルポイント特徴*をビン分割する極座標コンテキスト記述子(Scan-Context方式、$\mathbf{U}_t \in \mathbb{R}^{H_r \times H_s \times F_g}$)で検出される — 幾何符号化と場所認識が1つの学習済み表現を共有する。ポーズグラフ最適化の後、すべてのニューラルポイントはその関連フレームとともに移動する:

  $$\mathbf{x}_i \leftarrow \delta\mathbf{T}_{t_i^{m}}\, \mathbf{x}_i, \qquad \mathbf{q}_i \leftarrow \delta\mathbf{q}_{t_i^{m}}\, \mathbf{q}_i,$$

  これにより、マップは破れやゴーストを起こさず、補正された軌跡と整合的に変形する。

## 実験結果

- **KITTIオドメトリ**: 平均相対並進誤差0.51%(10シード over 標準偏差0.02%) — KISS-ICPおよびCT-ICPと同等で、比較した学習ベース手法すべてより優れており、事前学習なし。
- **KITTI SLAM**: ループありシーケンスでの平均ATE RMSE 1.0 m(PINオドメトリ単独: 3.2 m)、全11シーケンスで1.2 m — SC-LeGO-LOAMおよびSC-F-LOAM、さらにはオフライン後処理のHLBAベースラインをも上回りながら、オンラインで動作。
- **その他のドメイン**: MulRan、IPB-Car、Newer College、Hilti-21で全体最良の精度; Newer Collegeの階段シーケンスでは6 cm RMSEを達成し、比較手法の半数が失敗する。RGB-D拡張版はReplicaで競争力がある。
- **マップのコンパクトさ**: KITTI 00のマップは102.1 MB — 生の点群(13.6 GB)の約0.7% — であり、SuMaのサーフェルマップの887.7 MBやグリッドベースのSHINEマップの160.6 MBに対して優位である; ループ補正は重複したニューラルポイントを除去することでマップを約20%*縮小させる*こともある。
- **実行速度**: 軽量版は単一のNVIDIA A4000 GPU上で~11 Hz(センサーのフレームレート)で動作し、1フレームあたりの処理時間は一定である; もう1つの暗黙ニューラルLiDARオドメトリであるNerf-LOAMより約30倍高速。コード: `PRBonn/PIN_SLAM`。

## SLAMにおける意義

ニューラル暗黙SLAM(iMAP、NICE-SLAM)は遅く部屋規模のRGB-D手法として始まったが、PIN-SLAMは暗黙マップが大域的整合性を保ちながら屋外LiDAR SLAMに拡張できることを示した最初の実証例であり、弾性変形によってニューラルマップ自体をループ閉じ込み対応にした最初のシステムである。これは、FAST-LIO2やLOAMが古典的構造で支配していたLiDAR領域に学習済みマップ表現が信頼できる形で参入したことを示し、コンパクトでありながら密な再構成が可能で、かつ大域的に整合的なマップという方向性を示している。

## ハンズオン

- [PIN-SLAMを実行する](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/pin_slam)

## 関連ノート

- [FAST-LIO2](fast-lio2.md) — それが競合する古典的な直接レジストレーションのベースライン
- [SuMa](suma.md) — 以前の密な(サーフェル)LiDARマップ表現
- [iMAP](../level-03-monocular-slam/imap.md) — ニューラル暗黙SLAMの起源
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md) — 階層的ニューラル暗黙RGB-D SLAMの前身
- [Point-SLAM](../level-03-monocular-slam/point-slam.md) — RGB-D SLAM向けのニューラルポイント表現
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — 弾性マップが吸収する大域的調整
