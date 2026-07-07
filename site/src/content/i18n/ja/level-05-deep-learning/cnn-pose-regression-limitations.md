# CNN Pose Regression Limitations

> Sattler 2019 · [論文](https://arxiv.org/abs/1903.07504)

**一行要約** — この CVPR 2019 の分析(「Understanding the Limitations of CNN-based Absolute Camera Pose Regression」)は、PoseNet 方式の絶対姿勢回帰が真の3D幾何ベースの位置特定ではなく、姿勢補間を伴う画像検索に近い挙動をすることを示した。

## 問題

視覚的位置特定——既知のシーンにおける正確なカメラ姿勢の推定——は従来、3D幾何によって解かれてきた: 2D-3D 対応を確立し、RANSAC 内で PnP ソルバーを実行する。画像を直接姿勢へ写す(PoseNet とその後継)エンドツーエンドの絶対姿勢回帰(APR)ネットワークは、その速度と単純さから人気を博したが、構造ベースの精度には一貫して到達できなかった。本論文は*なぜ*かを問う: APR ネットワークは実際に何を学習しているのか、そしてこのアプローチの根本的な限界は何か?

## 手法とアーキテクチャ

本論文は、すべての PoseNet 系アーキテクチャに共通する理論モデルを構築する。これらは3つの段階を共有する: 畳み込み特徴抽出器 $F(\mathcal{I})$、(非線形の)埋め込み $E(F(\mathcal{I})) = \alpha^{\mathcal{I}} \in \mathbb{R}^n$(最後から2番目の層)、そして埋め込みを姿勢空間に射影する最終線形層である。学習された位置特定関数は

$$L(\mathcal{I}) = \mathbf{b} + \mathtt{P} \cdot E(F(\mathcal{I})) = \mathbf{b} + \sum_{j=1}^{n} \alpha_j^{\mathcal{I}} \mathbf{P}_j,$$

であり、ここで $\mathtt{P} \in \mathbb{R}^{(3+r)\times n}$ は最終層の射影行列、$\mathbf{b}$ はバイアス、$\mathbf{P}_j = (\mathbf{c}_j^T, \mathbf{r}_j^T)^T$ はその列を並進部分と向き部分に分割したものである。分解すると、予測姿勢は

$$\begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{I}}\\ \hat{\mathbf{r}}_{\mathcal{I}}\end{pmatrix}=\begin{pmatrix}\mathbf{c}_{b}+\sum_{j=1}^{n}\alpha_{j}^{\mathcal{I}}\mathbf{c}_{j}\\ \mathbf{r}_{b}+\sum_{j=1}^{n}\alpha_{j}^{\mathcal{I}}\mathbf{r}_{j}\end{pmatrix}.$$

**解釈**: APR は*基底姿勢*の集合 $\mathcal{B} = \{(\mathbf{c}_j, \mathbf{r}_j)\}$ を学習し、すべての予測をそれらの(実際には ReLU のため錐状の)線形結合として表現し、画像の見え方は係数 $\alpha_j^{\mathcal{I}}$ を操作するだけである。出力をシーンの3D構造に結びつけるものは何もない。以下の2つの予測が導かれ、実験的に検証される:

- **確実な失敗ケース。** すべての学習位置が直線 $\mathbf{o} + \delta\mathbf{d}$ 上にある場合、許容される学習解の一つはすべての基底並進をその直線上に置く——そして直線上の点の線形結合はその直線上に留まるため、ネットワークは*汎化できない*。PoseNet と MapNet が学習した基底並進の可視化は、まさにこの崩壊を確認している(エスカレーターと建物ファサードのシーン)。
- **APR ≈ 検索。** テスト埋め込みを学習埋め込みとオフセットの和として書くと、$\alpha^{\mathcal{I}} = \alpha^{\mathcal{J}} + \Delta^{\mathcal{I}}$ から

$$\begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{I}}\\ \hat{\mathbf{r}}_{\mathcal{I}}\end{pmatrix} = \begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{J}}\\ \hat{\mathbf{r}}_{\mathcal{J}}\end{pmatrix} + \begin{pmatrix}\sum_{j=1}^{n}\Delta_j^{\mathcal{I}}\mathbf{c}_{j}\\ \sum_{j=1}^{n}\Delta_j^{\mathcal{I}}\mathbf{r}_{j}\end{pmatrix},$$

  が得られる。すなわち、APR は構造的に*類似した学習画像に対する相対姿勢*を予測している——これは画像検索と姿勢補間が行っていることと同じであり、相対姿勢回帰と密接に関連している。

実験ツールキット: APR の代表として PoseNet(学習された損失重み付け)と MapNet、構造ベースの黄金基準として Active Search(RootSIFT + P3P-RANSAC)、検索ベースラインとして DenseVLAD(手作りの密な RootSIFT を4096次元の VLAD 記述子にプールしたもの)、さらに上位 $k$ 個の検索画像の姿勢を補間するバリアントを使用する。

## 実験結果

- **Cambridge Landmarks と 7 Scenes**: 「絶対姿勢回帰と相対姿勢回帰のいずれのアプローチも、検索ベースラインを一貫して上回ることができない」、そして APR 手法は「構造ベースの手法よりも画像検索に性能が近いことが多い」(中央位置/向き誤差、表2)。最良のエンドツーエンドの手法である AnchorNet でさえ、最大のシーン(Street)では DenseVLAD を上回れない。
- **TUM LSI**(テクスチャの少ない屋内): 低レベルの SIFT 特徴が不利であるにもかかわらず、DenseVLAD は依然として姿勢回帰を上回る。
- **RobotCar**: MapNet+ と MapNet+PGO は1.1 kmの LOOP シーンで DenseVLAD を上回るが、9.6 kmの FULL シーンでは「著しく劣る」——スケーラビリティの失敗である。
- **密にサンプリングされた合成データ**(Shop Facade のレンダリング、学習軌跡から最大3 mまでの25 cmグリッド上の追加の姿勢): データが増えると改善するが、PoseNet と MapNet は「1桁多いデータを使っても Active Search には全く近づかない」。
- **DeepLoc**: DenseVLAD は単一画像の APR 手法を上回り、Active Search はシーケンスベースの VLocNet++ バリアントさえも上回る。

## SLAMにおける意義

本論文は、「CNN で姿勢を回帰するだけ」が幾何的な再局在化の代替にはならない理由を示す標準的な参照文献である。SLAM における再局在化とループクロージングの候補は、マップされた軌跡を超えて汎化する姿勢を必要とし、この分析はどの学習手法がそれを提供できるか(構造に根ざしたもの: シーン座標回帰、特徴マッチング+PnP)、どれができないか(直接回帰)を説明する。本論文が導入した検索ベースラインによる健全性チェックは、現在ではあらゆる学習ベース再局在化手法を評価する標準的な実践となっている。

## 関連ノート

- [PoseNet](posenet.md)
- [DSAC](dsac.md)
- [DSAC\*](dsac-star.md)
- [ACE](ace.md)
- [HF-Net](hf-net.md)
- [NetVLAD](netvlad.md)
