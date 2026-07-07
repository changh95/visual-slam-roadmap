# GO-SLAM

> Zhang 2023 · [論文](https://arxiv.org/abs/2309.02436)

**一行要約** — オンラインループクロージングと完全なバンドル調整をニューラル暗黙表現SLAMにもたらした: DROID-SLAM風の学習されたトラッキングにグローバルなキーフレームグラフを組み合わせ、姿勢がグローバルに補正されるたびにその場で再フィットされるInstant-NGPのSDFマップを備える。

## 問題

ニューラル暗黙表現SLAMは魅力的な密な結果を示してきたが、iMAP/NICE-SLAM世代のシステムは局所的にしか最適化しない: 「ループクロージング(LC)やグローバルバンドル調整(BA)のようなグローバルオンライン最適化が欠けているため、処理されるフレーム数が増えるにつれてカメラのドリフト誤差が蓄積し、3D再構成は急速に崩壊する」。DROID-SLAMのフロントエンドを共有するNeRF-SLAMさえ、「オンラインループクロージングと完全なBAを欠いている」。GO-SLAMの目標は、姿勢と再構成をグローバルにリアルタイムで同時最適化する深層学習ベースの密なSLAMフレームワークであり — さらに、補正のたびにニューラルマップを再フィットさせることで、軌道と表面が決して乖離しないようにする。

## 手法とアーキテクチャ

**フロントエンドのトラッキングとループクロージング。** RAFTベースの再帰的更新演算子が直前のキーフレームに対するオプティカルフローを計算する。平均フローが$\tau_{flow}$を超えると新しいキーフレームが生成される。共可視性行列($N_{local} \times N_{KF}$)からキーフレームグラフ$(\mathcal{V},\mathcal{E})$が構築される。共可視性はキーフレームペア間の平均剛体フローであり($\tau_{co}=25$を超えるフローを持つペアは除外される)。ループエッジは、履歴部分から共可視性降順にサンプリングされ、半径$r_{loop}=N_{local}/2$の近傍抑制を伴う。ループは3つの連続する候補が検証された場合にのみ受理される。エッジはリアルタイム最適化のために$s_{edge}\cdot N_{local}$個に制限される。すべてのエッジはDROID-SLAMの微分可能な密なバンドル調整層に供給され、姿勢$\mathbf{G} \in SE(3)$と画素ごとの逆深度$\mathbf{d}$に対して減衰Gauss-Newton法で最小化される:

$$\mathbf{E}(\mathbf{G},\mathbf{d})=\sum_{(i,j)\in\mathcal{E}}\bigl\lVert\mathbf{p}_{ij}^{*}-\Pi_{c}\bigl(\mathbf{G}_{ij}\circ\Pi_{c}^{-1}(\mathbf{p}_{i},\mathbf{d}_{i})\bigr)\bigr\rVert_{\Sigma_{ij}}^{2}, \qquad \Sigma_{ij}=\operatorname{diag}\,\mathbf{w}_{ij},$$

ここで$\mathbf{p}^*_{ij}$は予測フロー、$\mathbf{w}_{ij}$はその信頼度、$\Pi_c$/$\Pi_c^{-1}$は投影/逆投影である。

**バックエンドの完全なBA**は別スレッドで*完全な*キーフレーム履歴に対して実行される(高い共可視性を持つペアと時間的に隣接するペアからなる独自のグラフで、半径$r_{global}$で冗長性を抑制する)。ループクロージングがすでに誤差の大部分を除去しているため、「入力フレーム数万枚まで」効率的なまま保たれる。

**インスタント・マッピング。** マッピングスレッドはすべてのキーフレームの姿勢/深度をスナップショットし、更新するキーフレームを選択する: 常に最新の2枚とまだマッピングされていないもの、前回のマッピング以降の姿勢変化が大きい上位10枚、そして忘却対策のために層別サンプリングされた10枚である。各3Dサンプル$\mathbf{x}$はマルチ解像度ハッシュ符号化(Instant-NGP)を受け、1層のSDF MLPが$\Phi(\mathbf{x}), \mathbf{g} = f_{\Theta_{sdf}}(\mathbf{x}, h_{\Theta_{hash}}(\mathbf{x}))$を予測し、2層の色MLPがSDF勾配$\mathbf{n}$から$\Omega(\mathbf{x}) = f_{\Theta_{color}}(\mathbf{x}, \mathbf{n}, \mathbf{g})$を予測する。レンダリングはNeuS流の非バイアス体積レンダリングであり、重み$w_i = \alpha_i \prod_{j=1}^{i-1}(1-\alpha_j)$を用いる。ここで

$$\alpha_{i}=\max\left(\frac{\sigma(\Phi(\mathbf{x}_{i}))-\sigma(\Phi(\mathbf{x}_{i+1}))}{\sigma(\Phi(\mathbf{x}_{i}))},\,0\right), \qquad \hat{\mathbf{c}}=\sum_{i=1}^{N_{ray}}w_{i}\,\Omega(\mathbf{x}_{i}), \quad \hat{\mathbf{D}}=\sum_{i=1}^{N_{ray}}w_{i}\,D_{i}^{ray}.$$

学習は$\mathcal{L}=\lambda_{c}\mathcal{L}_{c}+\lambda_{dep}\mathcal{L}_{dep}+\lambda_{eik}\mathcal{L}_{eik}+\lambda_{sdf}\mathcal{L}_{sdf}$(重み1.0、1.0、0.1、1.0)を最小化する: L1色損失、レンダリングされた深度の分散で重み付けを下げた深度損失$\mathcal{L}_{dep}=\frac{1}{M}\sum_{m}\lvert\mathbf{D}_{m}-\hat{\mathbf{D}}_{m}\rvert/\sqrt{\hat{\mathbf{D}}_{m}^{var}}$、Eikonal項、そして疑似正解として$\mathbf{b}(\mathbf{x}_i)=\mathbf{D}_m - D^{ray}_{m,i}$を用いるSDF損失である — 16 cmのトランケーション帯域内では$\mathcal{L}_{near}=\lvert\Phi(\mathbf{x}_{i})-\mathbf{b}(\mathbf{x}_{i})\rvert$、自由空間では緩和された$\mathcal{L}_{free}=\max(e^{-\beta\Phi(\mathbf{x}_{i})}-1,\ \Phi(\mathbf{x}_{i})-\mathbf{b}(\mathbf{x}_{i}),\ 0)$($\beta=5$)を用いる。マッピングはグローバルに最適化された姿勢/深度をさらなる精緻化*なしに*使用する。同一のフレームワークが単眼($N_{local}=50$)、ステレオ、RGB-D($N_{local}=25$)で動作する。メッシュはSDF上のmarching cubesから得られる。

## 実験結果

- **ScanNet**(長い実系列、8シーンの平均ATE RMSE): 単眼17.59 cm(DROID-SLAM 52.60、DROID-SLAM(VO)63.61、ORB-SLAM3 119.74に対して); RGB-D 7.02 cm(DROID-SLAM 7.15、NICE-SLAM 13.05に対して)。
- **アブレーション**(ScanNet): LC/完全BAなしのベースラインは11.59 cm、30 FPS; +LCで8.83、20 FPS; +完全BAで7.11、12 FPS; 両方で7.02 cm、10 FPS — LCはほぼ無償でドリフトの大部分を除去する。
- **Replica**(8シーンの平均): RGB-D — ATE 0.34 cm、深度L1 3.38 cm、完全性比88.09%、8 FPS(NICE-SLAMのATE 1.95、L1 3.53、1 FPS未満に対して); 単眼 — ATE 0.39 cm、深度L1 4.39 cm(同時期のNeRF-SLAMの4.49、NICER-SLAMのATE 1.88に対して)。
- **TUM RGB-D**(RGB-Dモード): freiburg1/2/3セット全体でATE 0.015 / 0.006 / 0.013 m(NICE-SLAMの0.027 / 0.018 / 0.030に対して); EuRoCステレオでは最先端のステレオSLAMと同等の性能を示しつつ、密で整合した再構成も提供する。
- ハードウェア: RTX 3090、Replica RGB-Dで約15.6 GB GPU使用(最大18 GB)、8 FPS; フレームをスキップして2〜8倍高速に実行しても、F-scoreとATEの低下はごく小さい。

## SLAMにおける意義

GO-SLAMは、ニューラルレンダリングSLAMとORB-SLAMのような成熟したシステムとの間にある最も明白なギャップ — グローバル整合性 — に取り組んだ。ScanNetの単眼結果(17.59対52.60 cm)は、長い軌道でループクロージングが欠けることがいかに致命的かを示している。そして、その場でのマップ再フィットは、ニューラルマップが姿勢補正の後で凍結されたままである必要はないことを示した。DROID-SLAMフロントエンド+ニューラルマップバックエンドというパターン(NeRF-SLAMと共有しつつ、NeRF-SLAMに欠けていたグローバル最適化を追加したもの)は、グローバルに整合した密なニューラルSLAMの標準的な手法となり、単眼/ステレオ/RGB-Dのサポートによって、より実用的なNeRFベースシステムの1つとなっている。

## 関連ノート

- [DROID-SLAM](droid-slam.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [Co-SLAM](co-slam.md)
- [iMAP](imap.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
