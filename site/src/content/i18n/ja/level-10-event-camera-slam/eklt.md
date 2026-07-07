# EKLT

> Gehrig 2020 · [論文](https://rpg.ifi.uzh.ch/docs/IJCV19_Gehrig.pdf)

**一行要約** — EKLTは、Lucas-Kanade(KLT)風の特徴追跡をイベントカメラに持ち込む。特徴は標準フレーム上で初期化され、その後生成的イベントモデルを用いた最大尤度フレームワークでフレーム間を非同期に追跡され、従来の特徴ベースパイプラインに組み込める高レート・ブラーフリーなトラックを生成する。

## 問題

KLT追跡は特徴ベースVO/VIOのワークホースとなるフロントエンドであり、輝度一定性のもとで光度誤差を最小化することで連続するフレーム間の特徴パッチを追跡する。高速では、フレーム間で特徴が多数の画素分移動し、モーションブラーがパッチの見た目を破壊し、最小化が発散するため、この手法は破綻する。イベントはマイクロ秒レイテンシかつブラーなしで発火し、まさに欠けているフレーム間の運動信号を運ぶ。しかし同じシーンパターンでも運動方向によって*異なる*イベントが生成されるため、時間をわたるイベントの対応付けは難しい。EKLTは、運動に依存しないフレームを参照として、運動に依存するイベントを測定値として用いることでこれを回避する。

## 手法とアーキテクチャ

理想的なイベントカメラは、画素 $\mathbf{u}_k$ での対数輝度 $L$ がコントラストしきい値 $\pm C$ だけ変化したときにイベント $e_k = (x_k, y_k, t_k, p_k)$ を発火する。

$$\Delta L(\mathbf{u}_k, t_k) = L(\mathbf{u}_k, t_k) - L(\mathbf{u}_k, t_k - \Delta t_k) = p_k C,$$

極性は $p_k \in \{-1,+1\}$ である。区間 $\tau$ にわたって極性を積算すると、**観測された輝度増分画像** $\Delta L(\mathbf{u}) = \sum_{t_k \in \tau} p_k C\, \delta(\mathbf{u} - \mathbf{u}_k)$ が得られる。微小な $\tau$ に対して、生成モデルは増分がオプティカルフロー $\mathbf{v}$ とともに動く勾度によって生じると述べる。

$$\Delta L(\mathbf{u}) \approx -\nabla L(\mathbf{u}) \cdot \mathbf{v}(\mathbf{u})\, \tau,$$

したがってエッジに平行な運動はイベントを生成せず、垂直な運動が最も高い発火率でイベントを生成する。フレーム $\hat{L}$($t=0$で与えられる)から候補ワープ $\mathbf{W}$ の下での**予測増分**は $\Delta \hat{L}(\mathbf{u}; \mathbf{p}, \mathbf{v}) = -\nabla \hat{L}(\mathbf{W}(\mathbf{u};\mathbf{p})) \cdot \mathbf{v}\, \tau$ である。ガウス誤差を仮定すると、最大尤度は最小二乗レジストレーションに帰着する。$C$ が未知であるため、EKLTはパッチ領域 $\mathcal{P}$ 上で*単位ノルム*のパッチを比較する。

$$\min_{\mathbf{p},\mathbf{v}} \left\| \frac{\Delta L(\mathbf{u})}{\|\Delta L(\mathbf{u})\|} - \frac{\Delta \hat{L}(\mathbf{u};\mathbf{p},\mathbf{v})}{\|\Delta \hat{L}(\mathbf{u};\mathbf{p},\mathbf{v})\|} \right\|^2_{L^2(\mathcal{P})},$$

これにより $C$ と $\tau$ が打ち消される。ワープは画像平面上の剛体運動であり、$\mathbf{W}(\mathbf{u};\mathbf{p}) = \mathrm{R}(\mathbf{p})\mathbf{u} + \mathbf{t}(\mathbf{p})$、$(\mathrm{R}, \mathbf{t}) \in SE(2)$ で、Ceresで最適化される。パイプラインは以下の通り。フレーム上でHarrisコーナーを検出し、強度パッチと $\nabla \hat{L}$ を抽出する。次に入ってくる各イベントについて、そのイベントが触れるパッチに積算する。あるパッチ上で $N_e$ 個のイベントが集まったら、目的関数を最小化して $\mathbf{p}$ と $\mathbf{v}$ を更新し、パッチをリセットして繰り返す。したがって追跡は非同期であり、更新は $N_e$ 個のイベントが到着するたびに発生する(典型的にはフレームレートの約10倍)。各パッチはそのフレームテンプレートに対して独立に追跡され、画素対画素の暗黙のデータアソシエーションを持つ(イベント対特徴のICP対応付けはない)。最小コストを監視することでトラックロストを検出し、新しいフレームでの再初期化を発動する。

## 実験結果

- **シミュレーションデータ**(イベントカメラシミュレータ、4シーン): 平均追跡誤差は約0.4画素 — sim_april_tagsで0.20 px、sim_3planesで0.29 px、sim_rocksで0.42 px、sim_3wallで0.67 px — これはノイズのない条件での下限である。
- **実データ、8シーケンス**: shapes_6dof、checkerboard、boxes_6dof、poster_6dof(Event Camera Dataset)、pipe_2、bicycles、outdoor_day1(MVSEC)、outdoor_forward5(UZH-FPV)、4つのベースライン(Cannyの点集合上のICP、EM-ICP、動き補償されたイベントフレーム上のKLT、ハイパスフィルタで再構成された画像上のKLT)との比較。真値はDAVISフレーム上のKLTから得ている。
- トラック正規化誤差: EKLTは8シーケンス全体で0.64〜1.21 pxであり(例: poster_6dofで0.64に対しICPは2.48、EM-ICPは3.10、KLT-MCEFは0.97、KLT-HFは1.18; boxes_6dofで0.72に対しICPは4.59)、すべてのシーケンスで全ベースラインを精度で上回った。
- 黒白のシーンではEKLTは平均でICPの2倍長いトラックで2倍の精度を持つ。特徴の年齢はKLT-MCEFおよびKLT-HFベースラインと同程度である。
- IJCV(2020年)に掲載。「フレームの勾度からイベントを予測し、観測されたイベントに対して整列する」というパラダイムは、比較対象となる標準的なイベントベース特徴トラッカーとなった(例えばEKLT-VIOはこれをVIOフロントエンドとして用いている)。

## SLAMにおける意義

EKLTは、既存のSLAMシステムにイベントカメラを取り込むための最も実用的な入り口である。パイプライン全体を置き換えるのではなく、特徴トラッカーだけをアップグレードすることで、フレームベースのKLTがトラックを失う速度レジームまで古典的なVIOフロントエンドを拡張する。また、特徴レベルで「イベントとフレームは相補的である」という原理を明確にした。これは、Ultimate-SLAMが推定器レベルで、EDSが直接法に対して適用するのと同じ哲学である。

## 関連ノート

- [EVO](evo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [ESVIO](esvio.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Event cameras (DVS)](event-cameras-dvs.md)
