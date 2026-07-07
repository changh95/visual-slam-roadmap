# DROID-SLAM

> Teed 2021 · [論文](https://arxiv.org/abs/2108.10869)

**一行要約** — 密なオプティカルフローを反復的に精緻化し、微分可能なDense Bundle Adjustment層を通じて姿勢と深度を解くエンドツーエンドの学習型SLAMシステムであり、古典的システムと比較して致命的な失敗を劇的に減らした。

## 問題

古典的なSLAMパイプラインは手作りの特徴抽出とマッチングに依存しており、これはロボットが最も必要とする場面——テクスチャのない表面、モーションブラー、繰り返し構造——でまさに脆弱になる。「失敗は特徴トラックの消失、最適化アルゴリズムの発散、ドリフトの蓄積など、多様な形をとる」。既存の学習型システム(DeepVO、TartanVO、DeepV2D、BA-Net)は、完全なバンドル調整、ループクロージング、大域的な精緻化を欠くため、「一般的なベンチマークにおいて古典的な対応手法の精度に遠く及ばない」。DROID-SLAMの問いは次の通りである。SLAMを正確にする最適化の構造を保ちながら、古典的SLAMを脆弱にする部分を学習によって置き換えるエンドツーエンドで学習可能なシステムを作れるか、というものである。

## 手法とアーキテクチャ

**状態とフレームグラフ。** 各画像$t$についてシステムは姿勢$\mathbf{G}_t \in SE(3)$と逆深度マップ$\mathbf{d}_t \in \mathbb{R}_+^{H\times W}$を保持する。フレームグラフ$(\mathcal{V},\mathcal{E})$は共視のフレームを連結する。カメラがマッピング済みの領域を再訪した際に追加される長距離エッジが、同じ機構の中でループクロージングを実現する。

**特徴と相関。** RAFT様式の特徴・コンテキストネットワークが1/8解像度のマップを生成する。各エッジ$(i,j)\in\mathcal{E}$について、全ペアの内積から4次元相関ボリュームが構築される。$C^{ij}_{u_1 v_1 u_2 v_2} = \langle g_\theta(I_i)_{u_1 v_1},\, g_\theta(I_j)_{u_2 v_2} \rangle$、これは4レベルピラミッドにプーリングされ、半径$r$のルックアップ演算子でインデックスされる。

**再帰的更新演算子。** 各反復ではまず、現在の幾何によって誘導される密な対応場を計算する。

$$\mathbf{p}_{ij} = \Pi_c(\mathbf{G}_{ij} \circ \Pi_c^{-1}(\mathbf{p}_i, \mathbf{d}_i)), \qquad \mathbf{G}_{ij} = \mathbf{G}_j \circ \mathbf{G}_i^{-1}$$

ここで$\Pi_c$はカメラ投影、$\mathbf{p}_i$は画素グリッドである。$\mathbf{p}_{ij}$における相関ルックアップ、誘導フロー、直前のBA残差が$3\times 3$のConvGRUに入力され、フロー修正$\mathbf{r}_{ij}$と信頼度$\mathbf{w}_{ij} \in \mathbb{R}_+^{H\times W\times 2}$を出力する。これにより修正済み対応$\mathbf{p}^*_{ij} = \mathbf{r}_{ij} + \mathbf{p}_{ij}$と、画素ごとの減衰係数$\lambda$が得られる。

**Dense Bundle Adjustment(DBA)層。** フロー修正は、フレームグラフ全体にわたって次式を最小化することで姿勢/深度の更新にマッピングされる。

$$\mathbf{E}(\mathbf{G}', \mathbf{d}') = \sum_{(i,j)\in\mathcal{E}} \left\lVert \mathbf{p}^*_{ij} - \Pi_c(\mathbf{G}'_{ij} \circ \Pi_c^{-1}(\mathbf{p}_i, \mathbf{d}'_i)) \right\rVert^2_{\Sigma_{ij}}, \qquad \Sigma_{ij} = \operatorname{diag} \mathbf{w}_{ij}$$

これは信頼度重み付き(マハラノビス)再投影誤差である。1回のGauss-Newtonステップは、深度ブロック$\mathbf{C}$が対角であることを利用したSchur補元によって解かれる。すなわち$\Delta\boldsymbol{\xi} = [\mathbf{B} - \mathbf{E}\mathbf{C}^{-1}\mathbf{E}^{T}]^{-1}(\mathbf{v} - \mathbf{E}\mathbf{C}^{-1}\mathbf{w})$、$\Delta\mathbf{d} = \mathbf{C}^{-1}(\mathbf{w} - \mathbf{E}^{T}\Delta\boldsymbol{\xi})$であり、リトラクションによって適用される:$\mathbf{G}^{(k+1)} = \operatorname{Exp}(\Delta\boldsymbol{\xi}^{(k)}) \circ \mathbf{G}^{(k)}$、$\mathbf{d}^{(k+1)} = \Delta\mathbf{d}^{(k)} + \mathbf{d}^{(k)}$。この層は微分可能であるため、ループ全体をエンドツーエンドに学習できる(姿勢損失$\mathcal{L}_{pose} = \sum_i \lVert \operatorname{Log}_{SE3}(\mathbf{T}_i^{-1}\cdot\mathbf{G}_i) \rVert_2$とフロー損失を組み合わせ、7フレームのTartanAirクリップ上で15回展開したイテレーション、RTX-3090を4台使って1週間学習)。

**システム。** フロントエンドスレッドが到着するフレームを追跡し、キーフレームウィンドウ上でローカルBAを実行する。バックエンドスレッドはフレームグラフを再構築し、キーフレーム履歴全体に対して大域BA(カスタムのブロック疎CUDAカーネル)を実行する。ステレオは固定ベースラインのカメラ間エッジを追加するだけであり、RGB-Dは目的関数に深度残差項を追加する——同じ単眼学習済みの重みが3つのモダリティすべてを処理する。

## 実験結果

合成データセットTartanAirで一度だけ単眼のみで学習し、4つのデータセットと3つのモダリティでゼロショット評価:

- **TartanAir**(単眼、Hardテストセット): 平均ATE 0.24mであり、TartanVOの1.92、DeepV2Dの5.03に対しそれぞれ8倍、20倍低く、失敗はゼロ。ECCV 2020 SLAMコンペティション分割では、単眼0.129、ステレオ0.047であり、最上位のCOLMAPベースの提出に対してそれぞれ62%、60%低い誤差を16倍の速度で達成。
- **EuRoC**(単眼): 全11シーケンスにわたる平均ATE 0.022mで失敗ゼロ——従来の無失敗手法より82%低く、ORB-SLAM3が完了する10/11シーケンスに対して43%低い;ステレオではORB-SLAM3に対し誤差を71%低減。
- **TUM-RGBD**(freiburg1、単眼): 平均ATE 0.038mであり、ORB-SLAM2/3が大半のシーケンスで失敗する中、全9シーケンスをトラッキング;DeepFactorsより83%、DeepV2Dより90%低い誤差。
- **ETH3D-SLAM**(RGB-D): 学習・テストのリーダーボードで1位(テストAUC 207.79 vs 次点BAD-SLAMの153.47)、32データセットのうち30をトラッキングに成功(次点は19/32)。
- **コスト**: リアルタイム動作には2台のRTX-3090が必要(EuRoCで約20fps);長い映像ではバックエンドが最大24GBのGPUメモリを要する——これがDPVO/DPV-SLAMの明確な動機となった。

## SLAMにおける意義

DROID-SLAMは学習型SLAMのための微分可能BAというパラダイムを確立し、学習されたシステムが数十年にわたる手作りのSLAMパイプラインに匹敵し、あるいはそれを超えられることを示し、学習ベースSLAM研究の波を触発した。その再帰的更新+DBAというアーキテクチャは、DPVO、DPV-SLAM、MAC-VOの直接の祖先であり、NeRF-SLAMやGO-SLAMなどのシステム内部で姿勢/深度のフロントエンドとしても機能している。

## 関連ノート

- [RAFT](raft.md)
- [DPVO](dpvo.md)
- [TartanVO](tartanvo.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
- [NeRF-SLAM](nerf-slam.md)
- [GO-SLAM](go-slam.md)
