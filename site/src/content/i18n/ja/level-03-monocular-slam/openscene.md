# OpenScene

> Peng (ETH) 2023 · [論文](https://arxiv.org/abs/2211.15654)

**一行要約** — 2Dビジョン言語特徴を逆投影して3Dネットワークへ蒸留することで、3D点群に対する密な点ごとのCLIP空間特徴を予測し、ラベル付き3Dデータを一切使わずにゼロショット・タスク非依存のオープン語彙3Dシーン理解を可能にする。

## 問題

従来の3Dシーン理解は、教師あり学習でタスクごとに1つのモデルを訓練するためにラベル付き3Dデータセットに依存している。つまり、どのタスクにも高価な3Dアノテーションが必要であり、どのモデルも事前定義されたカテゴリリストに縛られる。一方で、インターネット規模のデータで訓練された2Dビジョン言語モデルは、すでに画像とテキストを共有空間に埋め込んでいる。OpenSceneが問うのは、3D点をその同じCLIP特徴空間に埋め込むことで、単一の教師なし表現がクエリ時に物体・材質・アフォーダンス・活動・部屋の種類といった*任意の*クエリに応えられるようになるか、である。

## 手法とアーキテクチャ

点群$\mathbf{P} \in \mathbb{R}^{M \times 3}$とポーズ既知のRGB画像が与えられたとき、3つの段階を経て点ごとのCLIP空間特徴が生成される。

1. **画像特徴融合(2D→3D)。** 凍結された2Dビジョン言語セグメンテーションモデル$\mathcal{E}^{\text{2D}}$(OpenSegまたはLSeg)が、ピクセルごとの埋め込み$\mathbf{I}_i \in \mathbb{R}^{H \times W \times C}$を生成する。各表面点$\mathbf{p}$は、ピンホールモデル$\tilde{\mathbf{u}} = I_i \cdot E_i \cdot \tilde{\mathbf{p}}$を介してフレーム$i$に投影され(深度に基づくオクルージョン判定付き)、可視な$K$個のビューが平均プーリングされて1つの融合特徴$\mathbf{f}^{\text{2D}} = \phi(\mathbf{f}_1, \cdots, \mathbf{f}_K)$となり、特徴点群$\mathbf{F}^{\text{2D}} \in \mathbb{R}^{M \times C}$が得られる。
2. **3D蒸留。** 疎な畳み込みを用いるMinkowskiNet18Aの$\mathcal{E}^{\text{3D}}$が、幾何のみからその特徴を予測するよう学習する。

$$\mathbf{F}^{\text{3D}} = \mathcal{E}^{\text{3D}}(\mathbf{P}), \qquad \mathcal{E}^{\text{3D}} : \mathbb{R}^{M \times 3} \mapsto \mathbb{R}^{M \times C},$$

   コサイン蒸留損失で訓練される。

$$\mathcal{L} = 1 - \cos\big(\mathbf{F}^{\text{2D}}, \mathbf{F}^{\text{3D}}\big),$$

   そのため、画像を一切用いずに新しい点群を埋め込むことができる。
3. **2D–3Dアンサンブル。** 融合された2D特徴は小さい、または幾何的に曖昧な物体(マグカップ、絵画)で優れており、蒸留された3D特徴は特徴的な形状(壁、床)で優れる。点ごとに、両方がクエリ集合のCLIPテキスト埋め込み$\mathbf{t}_n$に対してスコア化される: $\mathbf{s}^{\text{2D}}_n = \cos(\mathbf{f}^{\text{2D}}, \mathbf{t}_n)$、$\mathbf{s}^{\text{3D}}_n = \cos(\mathbf{f}^{\text{3D}}, \mathbf{t}_n)$。より高い$\max_n$スコアを持つ特徴が$\mathbf{f}^{\text{2D3D}}$となる。

**推論**は単純なコサイン類似度である: ゼロショットセグメンテーションは各点を$\arg\max_n \cos(\mathbf{f}^{\text{2D3D}}, \mathbf{t}_n)$でラベル付けする; 任意のオープン語彙テキストも同様に関連度ヒートマップを生成する。訓練のどこにも2Dや3Dの正解ラベルは使われない。

## 実験結果

- **ゼロショット3Dセマンティックセグメンテーション**(ScanNet、未知クラス4個、3DGenZのプロトコル): OpenScene-LSegは**62.8 mIoU**に達し、3DGenZの7.7を上回る——3DGenZは他の16クラスで正解を使って訓練しているにもかかわらず——さらにOpenScene-OpenSegは83.7 mAccに達する。
- **全ベンチマーク**(全クラス、mIoU/mAcc): Ours-OpenSegはScanNet valで47.5/70.7、Matterport3D testで42.6/59.2、nuScenes valで42.1/61.8を達成——ゼロショットのMSeg-Votingベースライン(45.6/54.4、33.4/39.0、31.0/36.9)をすべてで上回り、「数年前の教師あり手法と同等」; Matterport3Dでは完全教師ありSOTAとの差はわずか-11.6 mIoU/-8.0 mAccである。
- **長尾スケーリング**(頻出上位K個のクラスによるMatterport3D mAcc): 完全教師ありのMinkowskiNetはKが21→160と増えると64.5→18.4に低下するが、単一の固定OpenSceneモデルは59.2→23.1で、K≥40で教師あり手法を上回る(K=40で50.9対50.8)。
- **アブレーション**: 2D–3Dアンサンブルは、すべてのデータセット/指標でどちらか一方の分岐単独より優れる(例: OpenSeg ScanNetで47.5/70.7、対し融合2Dのみでは41.4/63.6、蒸留3Dのみでは46.0/66.3); 約70%の点が3D特徴を選択し、ラベル集合が長尾になるほど2Dの割合が増える。
- 材質・アフォーダンス・活動・部屋の種類に関する3Dシーンのオープン語彙クエリを、単一モデルかつラベル付き3Dデータなしで初めて実証した。

## SLAMにおける意義

OpenSceneは、インターネット規模の2Dビジョン言語知識を3Dマップに転移できることを示した——これは言語に基づく空間AIの中核的な構成要素である。SLAMにとって、これは固定されたラベル集合ではなく自由形式の言語でクエリされるマップを指し示す: 融合してから蒸留するというレシピ(ピクセル特徴を幾何に投影し、それを予測するよう3Dネットワークを訓練する)は、ConceptFusion、ConceptGraphs、LERFに取り入れられ、ロボットのマッピングスタックにますます求められるようになっている。

## 関連ノート

- [ConceptFusion](conceptfusion.md)
- [LERF](lerf.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [SpatialLM](spatiallm.md)
