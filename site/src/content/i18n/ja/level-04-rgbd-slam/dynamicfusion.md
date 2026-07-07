# DynamicFusion

> Newcombe 2015 · [論文](https://ieeexplore.ieee.org/document/7298631)

**一行要約** — 非剛体的に変形するシーンに対する最初のリアルタイム密なSLAMシステムであり、固定された正規空間のTSDFモデルを各ライブフレームへ変換する密なボリューメトリック6D変形場を推定することで、すべてが動いている中でもKinectFusion式の融合を機能させる。

## 問題

KinectFusionおよびすべての伝統的な密なSLAMの背後にある最も基本的な仮定は、観測されるシーンが概ね*静的*であるということであり、変形する対象(人、手、衣服、ペット)はいずれもトラッキングを破壊し、モデルを破損させる。これまでの非剛体キャプチャは、取得中に静止したまま保持される事前スキャン済みのテンプレートを必要とするか、リアルタイムの3〜4桁遅いオフライン処理として実行されるかのいずれかであった。本論文の核心的な問いは、KinectFusionをどのように一般化すれば、単一の深度カメラからテンプレートフリーで、動的なシーンをリアルタイムに再構成し追跡できるか、である。

## 手法とアーキテクチャ

DynamicFusionは、シーンを剛体の正規空間$\mathsf{S}\subseteq\mathbb{R}^3$(TSDF $\mathcal{V}$)で再構成された潜在的な幾何表面と、それをライブフレームへ変換するフレームごとのボリューメトリック変形場に分解する。新しい深度マップが来るたびに3つのステップが発生する: (1) 変形場の状態を推定する、(2) その変形場を通じてライブ深度を正規TSDFに融合する、(3) 新たに観測された幾何をカバーするよう変形場の構造を拡張する。

- **疎ノード+デュアルクォータニオン混合による密な6D変形場**: 密な点ごとの変換$\mathcal{W}: \mathsf{S} \mapsto \mathbf{SE}(3)$(密な$256^3$の場だとフレームあたり約1億パラメータが必要になる)は、$n$個の変形ノード$\mathcal{N}^t_{\mathrm{warp}} = \{\mathbf{dg}_v, \mathbf{dg}_w, \mathbf{dg}_{se3}\}_t$(位置、半径重み、6自由度変換)から補間される。正規空間の点$x_c$は、そのk個の最近傍ノードのデュアルクォータニオン混合によって変形される。

$$\mathcal{W}_t(x_c) = \mathbf{T}_{lw}\, SE3\big(\mathbf{DQB}(x_c)\big), \qquad \mathbf{DQB}(x_c) = \frac{\sum_{k\in N(x_c)} \mathbf{w}_k(x_c)\,\hat{\mathbf{q}}_{kc}}{\big\lVert \sum_{k\in N(x_c)} \mathbf{w}_k(x_c)\,\hat{\mathbf{q}}_{kc} \big\rVert},$$

  単位デュアルクォータニオン$\hat{\mathbf{q}}_{kc}\in\mathbb{R}^8$、ガウス影響重み$\mathbf{w}_i(x_c) = \exp\big(-\lVert \mathbf{dg}^i_v - x_c \rVert^2 / (2 (\mathbf{dg}^i_w)^2)\big)$を用い、共通の剛体(カメラ)運動は$\mathbf{T}_{lw}$として因数分解される。DQBは混合された変換を有効な剛体運動のまま保つ。
- **非剛体投影TSDF融合**: 各ボクセル中心$x_c$はライブフレームへ変形され、そこで投影的符号付き距離が計算される: $\mathbf{psdf}(x_c) = \big[\mathbf{K}^{-1} D_t(u_c) [u_c^\top, 1]^\top\big]_z - [x_t]_z$、続いて標準的な切り捨てられた重み付き平均TSDF更新が行われる。融合重みは、ボクセルのk最近傍ノードへの平均距離に応じて縮小され、変形の不確実性を符号化する。更新はカメラ座標系における視線に沿って計算されるため、剛体TSDF融合の最適性の特性が非剛体の場合にも引き継がれる。
- **変形場推定**: 深度$D_t$と現在の再構成$\mathcal{V}$が与えられると、ノードの変換は以下を最小化する。

$$E(\mathcal{W}_t, \mathcal{V}, D_t, \mathcal{E}) = \mathbf{Data}(\mathcal{W}_t, \mathcal{V}, D_t) + \lambda\,\mathbf{Reg}(\mathcal{W}_t, \mathcal{E}).$$

  データ項は、変形されたゼロレベル集合のメッシュをライブフレームにレンダリングしてデータアソシエーションを行い、予測されたピクセルにわたるロバストなTukeyペナルティ付きの点対平面誤差を合計する: $\mathbf{Data} \equiv \sum_{u\in\Omega} \psi_{\mathrm{data}}\big( \hat{\mathbf{n}}_u^\top (\hat{\mathbf{v}}_u - \mathbf{vl}_{\tilde{u}}) \big)$。正則化項は、変形グラフのエッジ$\mathcal{E}$にわたる不連続性を保持するHuberペナルティを備えた、極力剛体的(as-rigid-as-possible)な項である。

$$\mathbf{Reg}(\mathcal{W}, \mathcal{E}) \equiv \sum_{i=0}^{n} \sum_{j \in \mathcal{E}(i)} \alpha_{ij}\, \psi_{\mathrm{reg}}\big( \mathbf{T}_{ic}\,\mathbf{dg}^j_v - \mathbf{T}_{jc}\,\mathbf{dg}^j_v \big), \qquad \alpha_{ij} = \max(\mathbf{dg}^i_w, \mathbf{dg}^j_w),$$

  これは*階層的な*変形木の上に構築されるため、未観測の領域も区分的に滑らかに変形する。最適化は、ノードごとのツイスト$\xi_i \in se(3)$を用いたガウス・ニュートン法で行われる: まず密な剛体ICPが$\mathbf{T}_{lw}$を解き、続いて2〜3回の非剛体反復が、そのアローヘッド型ヘシアンの疎なブロックコレスキー分解によって線形化系を解く。これらすべてはGPU上で、事前計算されたk最近傍ノードボリュームを用いて実行される。
- **変形場の拡張**: 融合後、現在のノードによってサポートされていない表面頂点($\min_k \lVert \mathbf{dg}^k_v - v_c \rVert / \mathbf{dg}^k_w \ge 1$)は、少なくとも$\epsilon$以上離れた新しいノードを生成する(デフォルトの間引き密度$\epsilon = 25$mm)。これらは現在の変形場からDQBによって初期化され、$L{=}4$レベルの正則化階層(レベルごとに半径が$\beta{=}4$倍に増加)が再構築される。実運用で使われたパラメータ: $\lambda = 200$、Tukey幅0.01、Huber幅0.0001。

## 実験結果

評価は定性的である(ベンチマーク表はない)。結果は、単一の深度カメラを使う実際のリアルタイムシステムから、市販ハードウェア上でライブに取得された。動くカメラで撮影された動く人物、60秒にわたる「カップから飲む」動作(最初のフレームでは見えていなかった表面も含む、腕とカップの完全なモデルが出現する)、そして手を組む「指を交差させる」全身シーケンス(手を組む間もモデルは一貫性を保つ)である。最初はノイジーで不完全なモデルが、対象とカメラの両方が動く中で徐々にノイズ除去され補完されていき、キャプチャ中にループ閉じ込みも発生する。記載されている限界: シーンが閉じたトポロジーから開いたトポロジーへ急速に移行する場合(閉じた手で開始した再構成はその手を開くことができない)、大きなフレーム間運動、そしてシーンの複雑さが増すにつれて成長するオクルージョン領域。CVPR 2015で発表され、Best Paper賞を受賞した。

## SLAMにおける意義

DynamicFusionは、リアルタイム3D再構成とSLAM全体に浸透していた静的シーンの仮定を取り除き、ボリューメトリックTSDF融合を非剛体の場合に一般化し、密な6D変形場をフレームレートで推定できることを示した。その正規ボリューム+埋め込み変形グラフのレシピは、非剛体融合(VolumeDeform、KillingFusion、SurfelWarp)の雛形となり、現代の動的シーンSLAMシステムがカメラの動きとシーンの動きをどのように分離するかに影響を与えている。

## 関連ノート

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [MaskFusion](../level-03-monocular-slam/maskfusion.md)
- [MID-Fusion](../level-03-monocular-slam/mid-fusion.md)
