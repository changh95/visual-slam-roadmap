# ORB-SLAM

> Mur-Artal 2015 · [論文](https://arxiv.org/abs/1502.00956)

**一行要約** — トラッキング、マッピング、リローカリゼーション、ループ閉じ込みのすべてのタスクにORB特徴点を用いる、完全で汎用性の高いモノキュラーSLAMシステム。自動初期化と適者生存型のマップ管理を備える。

## 問題

従来のモノキュラーSLAMシステムは、それぞれ問題の一部分しか解決していなかった。PTAMはキーフレームBAを備えていたがループ閉じ込みがなく、パッチ特徴は場所認識に使えず、初期化も手動だった。他のシステムは大規模環境を扱えなかったり、トラッキング失敗からの復帰ができなかった。ORB-SLAM(IEEE TRO 2015、サラゴサ大学)は、PTAMの主要アイデア、DBoW2による場所認識、スケールを考慮したループ閉じ込みを基盤として、これらすべてを一つの統一されたフレームワークで解決し、屋内・屋外を問わず小規模・大規模環境においてリアルタイムに動作する。

## 手法とアーキテクチャ

**すべてを一つの特徴点でこなす。** 同じORB特徴点(oriented FAST + rotated BRIEF、Hamming距離でマッチング)がトラッキング、マッピング、リローカリゼーション、ループ検出のすべてに利用されるため、作業の重複がない。

**自動初期化。** 同じ対応点 $\mathbf{x}_c \leftrightarrow \mathbf{x}_r$ から、ホモグラフィと基礎行列が並行して計算される。すなわち $\mathbf{x}_c = \mathbf{H}_{cr}\,\mathbf{x}_r$ と $\mathbf{x}_c^{\top}\mathbf{F}_{cr}\,\mathbf{x}_r = 0$ であり、それぞれ外れ値を打ち切るカーネルを用いた対称転送誤差で評価される:

$$
S_M = \sum_i \Big( \rho_M\big(d_{cr}^2(\mathbf{x}_c^i, \mathbf{x}_r^i, M)\big) + \rho_M\big(d_{rc}^2(\mathbf{x}_c^i, \mathbf{x}_r^i, M)\big) \Big), \qquad
\rho_M(d^2) = \begin{cases} \Gamma - d^2 & \text{if } d^2 < T_M \\ 0 & \text{if } d^2 \geq T_M \end{cases}
$$

ここで $\chi^2$ の閾値は $T_H = 5.99$、$T_F = 3.84$ である。ヒューリスティック $R_H = \frac{S_H}{S_H + S_F}$ により、$R_H > 0.45$ の場合(平面的・低視差シーン)はホモグラフィが選ばれ、それ以外の場合は基礎行列が選ばれる($\mathbf{E}_{rc} = \mathbf{K}^{\top}\mathbf{F}_{rc}\,\mathbf{K}$)。縮退した、あるいは曖昧な構成は検出され、初期化は延期される。

**3つの並列スレッド。**
- *トラッキング*は、ローカルマップとのマッチングとモーションオンリーBAによる精緻化によって、すべてのフレームの位置を推定する。すべての最適化は、姿勢 $\mathbf{T}_{iw} \in \mathrm{SE}(3)$ と点 $\mathbf{X}_{w,j} \in \mathbb{R}^3$ に対するロバストな再投影誤差を最小化する:

$$
C = \sum_{i,j} \rho_h\big(\mathbf{e}_{i,j}^{\top}\,\mathbf{\Omega}_{i,j}^{-1}\,\mathbf{e}_{i,j}\big), \qquad
\mathbf{e}_{i,j} = \mathbf{x}_{i,j} - \pi_i(\mathbf{T}_{iw}, \mathbf{X}_{w,j}),
$$

  Huberカーネル $\rho_h$ を用い、$\mathbf{\Omega}_{i,j} = \sigma_{i,j}^2 \mathbf{I}_{2\times 2}$ はキーポイントのピラミッドスケールに結びついている。キーフレームは(例えばフレームが参照キーフレームの点の90%未満しか追跡できなくなった場合など)積極的に挿入される。
- *ローカルマッピング*は新しい点を三角測量し、共視性(covisibility)近傍に対してローカルBAを実行し、積極的に間引く: 新しい点は、それを可視と予測するフレームの25%を超える割合で見つかり、かつ少なくとも3つのキーフレームから観測されなければならない。点の90%が他の少なくとも3つのキーフレームから見えているキーフレームは削除される。*共視性グラフ(covisibility graph)*は、少なくとも15点の観測を共有するキーフレームを結ぶ(エッジの重み $\theta$ = 共有点数)。
- *ループ閉じ込み*はDBoW2で候補を検出し、2視点制約 $\mathbf{e}_1 = \mathbf{x}_{1,i} - \pi_1(\mathbf{S}_{12}, \mathbf{X}_{2,j})$、$\mathbf{e}_2 = \mathbf{x}_{2,j} - \pi_2(\mathbf{S}_{12}^{-1}, \mathbf{X}_{1,i})$ から7自由度の $\mathrm{Sim}(3)$ 位置合わせを計算する(モノキュラーではスケールがドリフトするため)。その後、*essential graph*(スパニングツリー + $\theta_{\min} = 100$ の共視性エッジ + ループエッジ)に対するポーズグラフ最適化によってドリフトを補正し、以下を最小化する:

$$
C = \sum_{i,j} \mathbf{e}_{i,j}^{\top} \mathbf{\Lambda}_{i,j}\, \mathbf{e}_{i,j}, \qquad
\mathbf{e}_{i,j} = \log_{\mathrm{Sim}(3)}\big(\mathbf{S}_{ij}\,\mathbf{S}_{jw}\,\mathbf{S}_{iw}^{-1}\big) \in \mathbb{R}^7,
$$

  その後任意でフルBAを実行する。

## 実験結果

すべての実験はIntel Core i7-4700MQ(4コア@2.40 GHz)、8GB RAMで、画像を実際のフレームレートで処理して行われた:

- **NewCollege(2.2 kmのロボットシーケンス)**: シーケンス全体を処理できたと報告された最初のモノキュラーシステム。トラッキングの中央値処理時間は30.57 ms/フレーム(ORB抽出11.10 ms、初期姿勢推定3.38 ms、ローカルマップトラッキング14.84 ms)。ローカルマッピングの中央値は383.59 ms/キーフレームで、大半はローカルBAの296.08 msが占める。
- **TUM RGB-D(16シーケンス)**: キーフレーム軌跡のRMSEは、例えばfr1_xyzで0.90 cm(PTAM 1.15、LSD-SLAM 9.00)、fr2_xyzで0.30 cm、fr2_desk_personで0.63 cm(LSD-SLAM 31.73)。PTAMは8シーケンスでトラッキングを失い、LSD-SLAMは3シーケンスで失った。ORB-SLAMはfr3_nstr_tex_farを除くすべてを実行できたが、このシーケンスでは二重の平面的曖昧性を正しく検出し、初期化を拒否する。
- **リローカリゼーション**: fr2_xyzのマップからの再現率はPTAMの34.9%に対して78.4%。walking_xyzのフレームをsitting_xyzのマップ(重い遮蔽あり)に対してリローカライズする場合、PTAMの0%に対して77.9%。
- **長期運用**: PTAM式のポリシーでは無制限に増大するのに対し、キーフレーム数は飽和する — マップはシーン内容とともに増大し、時間とともにではない。
- **KITTI(10シーケンス)**: 高速道路シーケンス01を除くすべてを10 fpsでリアルタイムに処理する。軌跡誤差は通常マップ寸法の約1%(03では0.3%、ループのない08では5%)で、フルBAを20回反復するとわずかに改善する。

## SLAMにおける意義

ORB-SLAMは、10年分の最良のアイデア — PTAMの並列トラッキング/マッピング、キーフレームBA、バグオブワーズ場所認識、共視性、Sim(3)ループ閉じ込み — を一つのロバストなオープンソースシステムに統合し、長年にわたりモノキュラーSLAMの事実上の標準ベースラインとなった。そのH/F初期化、共視性/essentialグラフの仕組み、適者生存型の間引きは、その後のほぼすべての特徴点ベースシステムに採用され、今日でもSLAMベンチマークの基盤となっているORB-SLAM2/3系列を生み出した。

## 関連ノート

- [PTAM](ptam.md)
- [ORB-SLAM2](orb-slam2.md)
- [ORB-SLAM3](orb-slam3.md)
- [Covisibility graph](covisibility-graph.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — essentialグラフの補正ステップ
