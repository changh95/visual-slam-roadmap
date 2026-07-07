# OKVIS2-X

> Boche & Leutenegger 2025 · [論文](https://arxiv.org/abs/2510.04612)

**一行要約** — OKVIS2-XはOKVIS2を統一されたマルチセンサSLAMシステムに拡張し、視覚、慣性、計測または学習された深度、LiDAR、GNSSの測定値を融合しながら、推定器とタイトに結合した密な体積オキュパンシーサブマップを構築する——9 kmのシーケンスにリアルタイムでスケールする。

## 問題

最先端のVI-SLAMシステムの多くは疎なランドマークマップしか構築せず、それでは下流タスクに必要な幾何的詳細が不足する(プランニングには明示的な*自由空間*が必要だが、点群やメッシュはこれを表現していない)。また各システムは通常、1つの固定センサ構成に合わせて構築される。カメラ、IMU、深度/LiDAR、GNSS受信機を搭載したロボットは、従来は別々のVIO、LiDAR慣性、マッピングスタックを組み合わせる必要があった。OKVIS2-Xはこれらすべてを一度に要求する:最高の精度とロバスト性、密でグローバルに一貫した体積オキュパンシーマップ、大規模動作、そしてリアルタイム性能——すべてを単一の設定可能なファクタグラフフレームワークで。

## 手法とアーキテクチャ

OKVIS2-XはOKVIS2のフロントエンド(BRISKキーポイント、DBoW2場所認識、オプションのFast-SCNN空セグメンテーション)、リアルタイム推定器、非同期の全体グラフループ最適化を保持し、3つのモジュールを追加する:**Depth Network**、**Multi-Sensor Processor**(GNSS残差、LiDAR運動歪み補正、フレーム対マップファクタ)、そして**Submapping Interface**である。すべては1つの目的関数に結合される:

$$c(\mathbf{x}) = \frac{1}{2}\sum_{i,k,j} \rho_{\mathrm{c}}\left({\mathbf{e}_{\mathrm{r}}^{i,j,k}}^T \mathbf{W}_{\mathrm{r}} \mathbf{e}_{\mathrm{r}}^{i,j,k}\right) + \frac{1}{2}\sum_{k} {\mathbf{e}_{\mathrm{s}}^{k}}^T \mathbf{W}_{\mathrm{s}}^{k} \mathbf{e}_{\mathrm{s}}^{k} + \frac{1}{2}\sum_{r,c} {\mathbf{e}_{\mathrm{p}}^{r,c}}^T \mathbf{W}_{\mathrm{p}}^{r,c} \mathbf{e}_{\mathrm{p}}^{r,c} + \frac{1}{2}\sum \rho_{\mathrm{t}}\left(e_{\mathrm{m}}^2\right) + \frac{1}{2}\sum_{j\in\mathcal{G}} {\mathbf{e}_{\mathrm{g}}^{j}}^T \mathbf{W}_{\mathrm{g}}^{j} \mathbf{e}_{\mathrm{g}}^{j},$$

つまり再投影、プレインテグレーションされたIMU、周辺化から導出されたポーズグラフ、マップアライメント(フレーム対マップおよびマップ対マップ)、GNSSの各ファクタであり、Cauchy($\rho_{\mathrm{c}}$)とTukey($\rho_{\mathrm{t}}$)のロバスト化を用いる。

- **体積オキュパンシーサブマップ**(Supereight2、マルチ解像度):各サブマップはキーフレームに固定されるため、推定器の更新はサブマップを移動させつつ局所的な一貫性を保つ。オキュパンシーのログオッズ$l({}_M\mathbf{p}) = \log\frac{P_{\text{occ}}}{1 - P_{\text{occ}}}$は再帰的に融合される:$L_k = \frac{L_{k-1} w_{k-1} + l}{w_{k-1} + 1}$、飽和重み$w_k = \min(w_{k-1}+1,\, w_{\max})$。新しいサブマップは重複度/キーフレーム数の基準によって発生する(サブマップ内のドリフトは無視できると仮定される)。
- **マップアライメントファクタ**はマッピングと推定をタイトに結合する:計測されたすべての点は表面上にあるべきである($L = 0$)。その表面からの距離は、オキュパンシーフィールドから線形に外挿される:
  $$e_{\mathrm{m}}^{a,b} = \frac{d}{\sigma} = \frac{L({}_{S_a}\mathbf{p})}{\sqrt{\frac{L_{\min}^2}{9} + \sigma_d^2\, \lvert \nabla L({}_{S_a}\mathbf{p}) \rvert^2}}, \qquad d = \frac{L}{\lvert\nabla L\rvert},$$
  フレーム対マップ(ライブフレーム対直近完了サブマップ)とマップ対マップ(サブマップ完了時に重複するサブマップ間)の両方に適用される。
- **センサとしての学習深度**:ステレオネットワークとMVSネットワークにラプラス損失で訓練された不確かさデコーダを追加する: $\mathcal{L}_u = \sum_i \frac{\lvert u_i - u_{\text{gt}_i}\rvert}{\sigma_{u_i}} + \log \sigma_{u_i}$。2つの深度推定値は逆分散最適の形で融合される: $\hat{d}_{\text{fuse}} = \sigma^2_{\text{fuse}}\left(\sigma^{-2}_{\text{st}} \hat{d}_{\text{st}} + \sigma^{-2}_{\text{mvs}} \hat{d}_{\text{mvs}}\right)$、$\sigma^2_{\text{fuse}} = \left(\sigma^{-2}_{\text{st}} + \sigma^{-2}_{\text{mvs}}\right)^{-1}$。そしてピクセルごとの$\sigma_d$がマップファクタの重み付けをする——ヒューリスティックな(LiDARなら線形、RGB-Dなら二次の)ノイズモデルはネットワーク深度には当てはまらない。
- **GNSS融合**:状態はENU座標系への4自由度変換$\mathbf{T}_{GW}$で拡張される;残差$\mathbf{e}_{\mathrm{g}}^{j} = \mathbf{z}^{j} - \left[\mathbf{C}_{GW}\left({}_W\hat{\mathbf{r}}_{S_j} + \hat{\mathbf{C}}_{WS_j}\, {}_S\mathbf{r}_A\right) + {}_G\mathbf{r}_W\right]$は非同期の測定値に対してIMUで伝播した姿勢を用い、既知のアンテナレバーアーム${}_S\mathbf{r}_A$を用いる。初期化は推定された変換のヨー分散でゲートされる;長時間の断絶はループクロージャ的なグローバル再アライメントを引き起こす。
- **オンラインのカメラ・IMU外部パラメータキャリブレーション**:外部パラメータは再投影ファクタだけでなく相対ポーズグラフファクタにも入力される——2視点のGauss-Newton系はランドマークの周辺化前に拡張され、$N$個のカメラに対する相対姿勢誤差を$\mathbb{R}^{6+6N}$に拡張する。

## 実験結果

- **EuRoC**:VIO(因果的、ループクロージャなし)の平均ATEは0.066 mで、OpenVINSの0.117、Kimera2の0.112に対して41%の誤差削減。VI-SLAM非因果的は0.030 mでORB-SLAM3(0.035)とMAVIS-SLAM(0.034)を上回り、最終BAで0.028 m。V101–V103のメッシュ精度:0.031~0.039 m(SimpleMappingの0.071~0.086 mに対して)で、完全性も上回る。
- **Hilti-Oxford(Hilti22)**:VI構成はリーダーボード上の全ての公開競合手法を上回る;VI-LiDAR構成は平均位置誤差を4.1 cm(exp07を除くと2.8 cm)まで削減し、LiDAR慣性のWildcatと競合し、LiDARが視覚を無効化する暗い室内(exp03)を通してシステムを支える。
- **VBR(ローマ、最大9 km)**:VI性能はORB-SLAM3/OpenVINSに対して優れ、VI-LiDARは因果的に既にFAST-LIVOを1.771 m(軌跡長の0.06%)の平均誤差で上回り、競合手法を破綻させるIMU欠落エピソードを乗り越える。Campus1でのシミュレートされたRTK-GNSS(75秒/450 mの断絶)では、最終BA ATEは約3 kmで0.169 m。
- **タイミング/メモリ**(i7-13700 + RTX 3080):Ours-viはEuRoC MH05で最大47 Hzで動作する(フレームあたり38.1 ms、ORB-SLAM3の64.7 msに対して);深度ネットワークは13 Hz以上;GPUメモリ3.51 GB;NVIDIA Orin NX搭載ドローン上でもオンボードで動作。完全オープンソース。

## SLAMにおける意義

OKVIS2-Xは現在のオープンソースマルチセンサSLAMの最前線を代表するものである:OKVIS/OKVIS2が開拓したスライディングウィンドウ+ポーズグラフのアーキテクチャは、カメラ・IMUのペアからフルセンサスイートへとクリーンに一般化され、密なオキュパンシーマッピングは軌跡を*改善する*第一級のファクタとして、単なる受動的な副産物から昇格する。実務者にとっては、以前は別々のVIO、LiDAR慣性、マッピングスタックを組み合わせる必要があったユースケースをカバーする単一の設定可能なシステム(vi / vid / vil / vig / vidg / vilg)である——そしてそのマップは自由空間を明示的に表現し、安全なナビゲーションに直接利用できる。

## 関連ノート

- [OKVIS2](okvis2.md)
- [OKVIS](okvis.md)
- [LiDAR-Visual-Inertial (LVI)](../level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)
- [TSDF vs Surfel マップ](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
- [マルチセンサ融合SLAMサーベイ](../level-09-lidar-visual-lidar-slam/multi-sensor-fusion-slam-survey.md)
- [ファクタグラフ](../level-02-getting-familiar/factor-graph.md)
