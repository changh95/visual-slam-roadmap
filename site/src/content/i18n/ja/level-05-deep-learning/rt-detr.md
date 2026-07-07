# RT-DETR

> Zhao (Baidu) 2023 · [論文](https://arxiv.org/abs/2304.08069)

**一行要約** — 初のリアルタイムend-to-end Transformer検出器。YOLOと同等の速度を維持しつつ、DETR本来のNMS不要なセット予測というクリーンな特性を保っている（"DETRs Beat YOLOs on Real-time Object Detection"）。

## 問題

YOLO系列は合理的な速度/精度のトレードオフによりリアルタイム検出を支配しているが、その速度と精度の両方がNMS後処理によって悪影響を受ける。信頼度とIoUという2つの閾値をシナリオごとに調整する必要があり、NMSの実行時間はボックス数によって変動する。論文はこれを定量化している——YOLOv8では、信頼度閾値を0.001から0.05に変更するとAPは52.9%から51.2%に低下する一方、NMS時間は2.36msから1.06msに減少する。アンカーベースのYOLOはアンカーフリーのものと比べて約3倍のボックスを生成するため、より多くのNMS時間を必要とする。end-to-endのTransformer検出器（DETR）は二部マッチングによってNMSを排除するが、その計算コスト——特に多スケールTransformerエンコーダは、Deformable-DETRのGFLOPsの49%を占める一方でAPへの貢献はわずか11%——がリアルタイム領域から遠ざけていた。

## 手法とアーキテクチャ

RT-DETR = バックボーン + 効率的なハイブリッドエンコーダ + 補助予測ヘッドを持つTransformerデコーダ。バックボーンの最後の3ステージ $\{\mathcal{S}_3, \mathcal{S}_4, \mathcal{S}_5\}$ がエンコーダに供給され、デコーダは固定数のオブジェクトクエリを反復的に精緻化して(カテゴリ, ボックス)のペアにする——アンカーなし、NMSなし。

**効率的ハイブリッドエンコーダ**は、通常の多スケールエンコーダが一度に行う2つの仕事を分離する。

- **AIFI**（Attention-based Intra-scale Feature Interaction）: 最上位レベルの特徴 $\mathcal{S}_5$ にのみ*適用*される単層のTransformer自己注意——高レベルの特徴は関連付ける価値のある意味的概念を担っており、より低いレベルでのスケール内注意は冗長である（注意を $\mathcal{S}_5$ に限定することで、variant Dは35%高速化され*かつ*APが+0.4%向上する）。
- **CCFF**（CNN-based Cross-scale Feature Fusion）: PANet風の畳み込み融合パスで、その融合ブロック（2つの $1\times1$ 畳み込み + $N$ 個のRepBlock、要素ごとの加算）が隣接スケールを統合する。

$$\mathcal{Q}=\mathcal{K}=\mathcal{V}=\texttt{Flatten}(\mathcal{S}_5),\quad \mathcal{F}_5=\texttt{Reshape}(\texttt{AIFI}(\mathcal{Q},\mathcal{K},\mathcal{V})),\quad \mathcal{O}=\texttt{CCFF}(\{\mathcal{S}_3,\mathcal{S}_4,\mathcal{F}_5\})$$

**不確実性最小化クエリ選択**: 従来のクエリ選択方式は分類スコアのみでエンコーダ特徴の上位$K$個（$K=300$）を選ぶため、位置精度の低い特徴が初期クエリになってしまう。RT-DETRはエンコーダ特徴 $\hat{\mathcal{X}}$ の不確実性を、その予測された位置分布 $\mathcal{P}$ と分類分布 $\mathcal{C}$ の間の不一致として定義し、損失の中でそれを最適化する。

$$\mathcal{U}(\hat{\mathcal{X}})=\|\mathcal{P}(\hat{\mathcal{X}})-\mathcal{C}(\hat{\mathcal{X}})\|,\quad \hat{\mathcal{X}}\in\mathbb{R}^{D}$$

$$\mathcal{L}(\hat{\mathcal{X}},\hat{\mathcal{Y}},\mathcal{Y})=\mathcal{L}_{box}(\hat{\mathbf{b}},\mathbf{b})+\mathcal{L}_{cls}(\mathcal{U}(\hat{\mathcal{X}}),\hat{\mathbf{c}},\mathbf{c})$$

ここで $\hat{\mathbf{c}},\hat{\mathbf{b}}$ は予測されたカテゴリとボックス、$\mathbf{c},\mathbf{b}$ はグラウンドトゥルースである。これにより、分類とIoUの両方で高品質な選択済み特徴の割合がおおよそ倍増する（両方のスコアが0.5を超える特徴の割合が0.67%対0.30%）。

**柔軟な速度チューニング**: デコーダ層が均質であるため、推論時に末尾のデコーダ層を削除することで再学習なしに精度と速度をトレードオフできる——例えば、6層のRT-DETR-R50において層5を使用するとAPが0.1%低下する（53.1 → 53.0）が0.5ms短縮される。エンコーダとデコーダの幅/深さはバックボーン（R18/R34/CSPResNetからS/Mクラスモデルまで）に応じてスケールする。

## 実験結果

COCO val2017、TensorRT FP16によるT4 GPUでの速度、end-to-end（論文が提案するend-to-end速度ベンチマークによりYOLOのNMS時間を含む）。

- **RT-DETR-R50: 53.1% AP、108 FPS（4200万パラメータ）; RT-DETR-R101: 54.3% AP、74 FPS**——YOLOv5/PP-YOLOE/YOLOv6/YOLOv7/YOLOv8のL/Xモデルを速度・精度の両方で上回る（例: YOLOv8-Lは71 FPSで52.9% AP; YOLOv8-Xは50 FPSで53.9% AP）。
- 同じバックボーンを持つDETRとの比較: RT-DETR-R50はDINO-Deformable-DETR-R50を**+2.2% AP（53.1対50.9）、約21倍のFPS（108対5）**で上回る。
- エンコーダのアブレーション: ハイブリッドエンコーダ（variant E、47.9% AP、9.3ms）対結合型多スケールエンコーダ（variant C、45.6% AP、13.3ms）——分離することでより高速かつより高精度になる。
- クエリ選択のアブレーション: 不確実性最小化選択は通常のスコアベース選択に対して**+0.8% AP（48.7対47.9）**を得る。
- Objects365事前学習を用いると: RT-DETR-R50/R101は**55.3% / 56.2% AP**に到達する。
- 明示された限界: 小物体のAPは依然として最良のYOLOに劣る（RT-DETR-R50はYOLOv8-Lより0.5% AP-S低い）。

## SLAMにおける意義

セマンティックSLAMのフロントエンドはフレームレートでのオブジェクト検出を必要とし、これまではYOLOとNMSヒューリスティクスを意味していた。RT-DETRは同じ計算量の範囲内でTransformer品質の検出を提供し、そのNMS不要で決定的な出力はSLAMパイプラインへの統合をより容易にする（データアソシエーションのための安定したインスタンス数、閾値調整の不要、予測可能なレイテンシ）。リアルタイムセマンティックマッピングと動的物体フィルタリングにおける自然な検出器の選択肢である。

## 関連ノート

- [DETR](detr.md) — 元となるend-to-end Transformer検出器
- [YOLO](yolo.md) — 競合するリアルタイムCNNベースライン
- [Grounding DINO](grounding-dino.md) — オープン語彙のDETR型検出
- [SAM](sam.md) — 検出器としばしば組み合わされるプロンプト可能なセグメンテーション
