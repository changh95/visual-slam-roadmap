# FlowFormer

> Huang 2022 · [論文](https://arxiv.org/abs/2203.16194)

**一行要約** — 4Dコストボリュームを中心に構築された初のオプティカルフロー用Transformerアーキテクチャ:コストボリュームをトークン化し、alternate-group attentionで潜在的な「コストメモリ」にエンコードし、動的な位置的コストクエリを用いてフローを再帰的にデコードする。

## 問題

オプティカルフローは、各ソース画像位置$\mathbf{x}$をターゲット画像の対応点$\mathbf{p}=\mathbf{x}+\mathbf{f}(\mathbf{x})$に写す、ピクセルごとの変位場$\mathbf{f}:\mathbb{R}^{2}\rightarrow\mathbb{R}^{2}$を推定する。RAFTはすべてのペアの類似度を持つ$H \times W \times H \times W$の4Dコストボリュームを構築するが、局所的なウィンドウからのみコストを取得するため、大きな変位や隠蔽に苦労する。Transformerはグローバルな推論を提供するが、数千個のコストボリュームトークンに対する素朴なself-attentionは計算上耐えられない——Perceiver IOは代わりに生のピクセルに対してアテンションを行い、約80倍多くの学習例を必要とする。FlowFormerは、コンパクトなコストボリュームを保持しつつ、どうすればTransformer風のグローバルな集約を得られるかを問う。

## 手法とアーキテクチャ

3つの段階:4Dコストボリュームを構築し、それをコストメモリにエンコードし、フローを再帰的にデコードする。

- **コストボリューム**:ImageNetで事前学習されたTwins-SVTバックボーンの最初の2段階が$H \times W \times D_f$の特徴($D_f{=}256$、1/8解像度)を抽出する;すべてのソース/ターゲット特徴ペア間の内積類似度が$H \times W \times H \times W$のボリュームを形成し、これはソースピクセル$\mathbf{x}$ごとの2Dコストマップ$\mathbf{M_x} \in \mathbb{R}^{H \times W}$の集合として見なされる。
- **2段階のトークン化**:各コストマップは3つのstride-2畳み込みによって$8{\times}8$パッチの特徴$\mathbf{F_x}$($D_p{=}64$チャネル)にパッチ化され、その後学習された符号語$\mathbf{C}\in\mathbb{R}^{K\times D}$(ピクセル間で共有、逆伝播で学習)によって$K$個の潜在トークンに要約される:

$$\mathbf{K_x}=\mathrm{Conv}_{1\times 1}(\mathrm{Concat}(\mathbf{F_x},\mathrm{PE})),\quad \mathbf{V_x}=\mathrm{Conv}_{1\times 1}(\mathrm{Concat}(\mathbf{F_x},\mathrm{PE})),\quad \mathbf{T_x}=\mathrm{Attention}(\mathbf{C},\mathbf{K_x},\mathbf{V_x})$$

  これにより4Dボリュームは$H \times W \times K$のトークングリッドに変換される($K \times D \ll H \times W$;最終モデルでは次元128のトークン8個)。
- **Alternate-Group Transformer(AGT)層**(最終モデルで3層)は2つの直交するグルーピングを交互に行う:*コストマップ内(intra-cost-map)*のself-attentionは各ピクセルの$K$個のトークンに対して行われ、$\mathbf{T_x}=\mathrm{FFN}(\mathrm{SelfAttention}(\mathbf{T_x}(1),\dots,\mathbf{T_x}(K)))$、また*コストマップ間(inter-cost-map)*の空間的に分離可能なself-attention(Twinsから)は$K$個の$H \times W$トークンのグループそれぞれに対して行われ、$\mathbf{T}_i=\mathrm{FFN}(\mathrm{SSSelfAttention}(\mathbf{T}_i))$、ソース画像の文脈特徴がクエリ/キーに注入されることで視覚的に似たピクセルが整合したフローを得る。出力トークンが**コストメモリ**である。
- **動的位置的コストクエリを持つ再帰デコーダ**:各反復で現在のフローが$\mathbf{p}=\mathbf{x}+\mathbf{f}(\mathbf{x})$を与える;局所的な$9{\times}9$のコストパッチ$\mathbf{q_x}=\mathrm{Crop}_{9\times 9}(\mathbf{M_x},\mathbf{p})$はクエリ$\mathbf{Q_x}=\mathrm{FFN}(\mathrm{FFN}(\mathbf{q_x})+\mathrm{PE}(\mathbf{p}))$を構築し、これがコストメモリにクロスアテンションする、$\mathbf{c_x}=\mathrm{Attention}(\mathbf{Q_x},\mathbf{K_x},\mathbf{V_x})$(キー/値は一度だけ計算され再利用される)。ConvGRUが残差を回帰する:

$$\Delta\mathbf{f}(\mathbf{x})=\mathrm{ConvGRU}(\mathrm{Concat}(\mathbf{c_x},\mathbf{q_x}),\,\mathbf{t_x},\,\mathbf{f}(\mathbf{x}))$$

  フローは全解像度に凸アップサンプリングされ、反復ごとに重みを増しながら教師される。

## 実験結果

- **Sintelテスト(C+T+S+K+H)**:clean 1.159 AEPE/final 2.088——これまでの最良の公表結果(GMA、warm-startあり、1.388と2.47)から16.5%と15.5%の誤差削減であり、warm-startなしで両パスとも1位;warm-startなしのGMAと比較すると17.2%/27.5%の削減。
- **一般化(C+Tのみ)**:Sintel訓練cleanで1.01 AEPE、finalで2.40、KITTI-2015訓練で4.09 F1-epe/14.72 F1-all——GMAと比較して、Sintel clean/finalで22.3%と12.4%低い誤差、KITTI F1-allで13.9%低い誤差;cleanの1.01 AEPEはこれまでの最良の公表結果(1.29)を21.7%上回る。
- **KITTI-2015テスト**:KITTIファインチューニング後にF1-all 4.68で2位(S-Flowの4.64は0.85%低いが、S-FlowはSintel clean/finalで31.6%/22.5%劣る)。
- ImageNetで事前学習されたtransformerバックボーンがオプティカルフロー推定に有益であることの最初の検証。

## SLAMにおける意義

密なオプティカルフローは、現代の学習型SLAMフロントエンド(DROID-SLAM、DPVOの系譜)内部の対応エンジンであり、FlowFormerは、マッチングコストに対するグローバルなアテンションが、広ベースライン運動にとって最も重要な長距離で曖昧な対応関係——まさにそのコストメモリが対象とする難しい事例(大きな変位、隠蔽)——を解決することを実証した。これは今日のトレードオフのTransformer側を確立した——Transformerの精度(FlowFormer)対畳み込みの効率(SEA-RAFT)——SLAM設計者がフローバックボーンを選択する際に比較検討するものである。

## 関連ノート

- [RAFT](raft.md) — FlowFormerがトークン化する、全ペアコストボリュームを持つ畳み込み型の先行研究
- [SEA-RAFT](sea-raft.md) — 学習の改善によってTransformerに匹敵する、効率重視の対抗手法
- [FlowNet 2.0](flownet-2-0.md) — 深層フローにおける反復洗練のより初期の系譜
- [DROID-SLAM](droid-slam.md) — 密な再帰的フローを中心に構築されたSLAMシステム
- [LoFTR](loftr.md) — Transformerのアテンションを検出器不要の画像マッチングに適用した手法
