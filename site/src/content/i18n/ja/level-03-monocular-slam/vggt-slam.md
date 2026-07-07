# VGGT-SLAM

> Maggio 2025 · [論文](https://arxiv.org/abs/2505.12549)

**一行要約** — VGGTをフロントエンドとして使う密なモノキュラーRGB SLAM。フィードフォワードのサブマップ再構成を、SL(4)多様体上で最適化されたファクターグラフで逐次的にアライメントする——未キャリブレーションのサブマップは、単なる相似変換ではなく完全な15自由度の射影変換だけ異なりうるためである。

## 問題

VGGTは1回のフォワードパスでフレームのバッチを再構成するが、GPUメモリはRTX 4090（24 GB）上で1回の推論を約60フレームに制限するため、長い動画はサブマップに分割し、その後1つのマップに統合する必要がある。関連研究はサブマップを相似変換（回転+並行移動+スケール）でアライメントするが、VGGT-SLAMはこれが未キャリブレーションカメラには不十分であることを示す。射影復元定理（Projective Reconstruction Theorem）により、カメラ運動、シーン構造、内部パラメータについて何の仮定もない場合、シーンは真の幾何の15自由度射影変換までしか復元できない。したがって7自由度のSim(3)アライメントでは、特にフレーム間の視差が小さくVGGTの学習されたメトリック事前情報が信頼できなくなる場合、2つのサブマップを常に一致させることはできず、サブマップ間にせん断、伸縮、パースペクティブ歪みが残ってしまう。

## 手法とアーキテクチャ

- **サブマップ生成**: 直前のキーフレームに対するLucas-Kanade視差が$\tau_{\text{disparity}}$を超えると、フレームはキーフレームになる。$w$個のキーフレームが蓄積されると、サブマップの画像集合は$\mathcal{I}_{\mathrm{latest}} \leftarrow \{\mathbf{M}_{\mathrm{prior}}\} \cup \mathcal{I}_{\mathrm{latest}} \cup \mathcal{I}_{\mathrm{loop}}$として構成される——前のサブマップの最後の非ループ閉じ込みフレームと、検索された最大$w_{\text{loop}}$個のループフレーム——これがVGGTに1回のフォワードパスとして渡される。密な点$\mathbf{X}^{\mathcal{S}}$は、VGGTのカメラ推定値を用いてVGGTの深度マップを逆投影することで得られ（点ヘッドより正確）、平均の$\tau_{\text{conf}}$を下回る信頼度の点は刈り込まれる。
- **SL(4)上のサブマップアライメント**: 2つの重複するサブマップにおける対応点について、アライメントは$4\times 4$ホモグラフィである
  $$\mathbf{X}^{\mathcal{S}_i}_a = \mathbf{H}^i_j\,\mathbf{X}^{\mathcal{S}_j}_b, \qquad \mathbf{H}^i_j \in \mathrm{SL}(4),$$
  Sim(3)の7自由度に対し、15自由度を持つ。連続するサブマップは同一のフレームを共有するため、密な対応関係はマッチング処理を一切行わずに既知である: $\mathbf{H}$は同次線形系$\mathbf{A}_k \mathbf{h} = 0$（$\mathbf{h} \in \mathbb{R}^{16}$がホモグラフィを平坦化して保持する）から、RANSAC内の5点ソルバーで求められ、$\det \mathbf{H} = 1$となるようその行列式の4乗根でスケールされる。カメラ行列は$\mathbf{P}_i = (\mathbf{H}^i_j)^{-1}\mathbf{P}_j$を介して補正される。
- **ループ閉じ込み**: 各キーフレームにSALAD記述子が付与され、過去のサブマップに対する検索（L2類似度が$\tau_{\text{desc}}$超）は現在のサブマップに最大$w_{\text{loop}}$個のフレームを追加する。したがってループ閉じ込みのホモグラフィも、推定された対応関係ではなく、正確な共有フレームの対応関係から得られる。
- **バックエンド——SL(4)多様体上のファクターグラフ**: 各サブマップを大域フレームに写す絶対ホモグラフィ$\mathbf{H}_i$はMAP最適化によって推定される
  $$\hat{\mathcal{H}} = \operatorname{argmin}_{\mathbf{H} \in \mathrm{SL}(4)} \sum_{(i,j) \in \mathcal{L}} \left\| \mathrm{Log}\left( \mathbf{H}^{-1}_i \mathbf{H}_j \left(\mathbf{H}^i_j\right)^{-1} \right) \right\|^2_{\Omega^{\mathbf{H}}_{ij}},$$
  ここで$\mathcal{L}$はオドメトリおよびループ閉じ込み制約を添字付けし、$\mathrm{Log}$はリー代数$\mathfrak{sl}(4)$への写像であり、$\boldsymbol{\xi} \in \mathbb{R}^{15}$でパラメータ化され、15個の生成子$\mathbf{G}_k$にわたって$\boldsymbol{\xi}^{\wedge} = \sum_{k=1}^{15} \boldsymbol{\xi}_k \mathbf{G}_k$である。Levenberg-Marquardt法はポーズを多様体上で$\mathbf{H} \leftarrow \mathbf{H}\,\mathrm{Exp}(\hat{\boldsymbol{\delta}})$として更新し、ヤコビアンは$\mathbf{J}_i = -\mathrm{Ad}_{\mathbf{H}_i^{-1}\mathbf{H}_j}$、$\mathbf{J}_j = \mathbf{I}_{15\times 15}$である。
- 本システムはカメラ内部パラメータ、フレーム間で一貫したキャリブレーション、追加の学習を一切必要としない。比較用にSim(3)版（VGGTのポーズ+スケールアライメント）も構築されている。

## 実験結果

RTX 4090上で5回の実行を平均し、7-ScenesとTUM RGB-D（evoによるATE RMSE）で評価。パラメータは$w_{\text{loop}}=1$、$\tau_{\text{disparity}}=25$ px、$\tau_{\text{conf}}=25\%$、RANSAC反復300回。

- **TUM RGB-D（未キャリブレーション）**: $w=32$のSL(4)版が全体最良で平均ATE**0.053 m**——MASt3R-SLAM*の0.060 m、DROID-SLAM*（自動キャリブレーション）の0.158 m、Sim(3)版の0.074 mに対して。
- **7-Scenes（未キャリブレーション）**: $w=32$でSL(4)版とSim(3)版の両方が平均ATE 0.067 m——最上位ベースラインのMASt3R-SLAM*（0.066 m）とほぼ同等。
- **密な再構成（7-Scenes）**: 比較手法の中で最良の精度（0.052 m）とChamfer距離（0.055 m）（MASt3R-SLAM*は精度0.068 m/Chamfer 0.056 m、Spann3R@20は0.069/0.058に達する）。
- **定性的評価**: 55 mのオフィス回廊ループが22個のサブマップから大域的に整合したマップに統合される。図の例では、Sim(3)がサブマップをアライメントできないがSL(4)は射影曖昧性を修正できるシーンが示されている。
- **既知の失敗モード**: 平面的なTUMの`floor`シーン（0.141 m）——15自由度ホモグラフィは平面上の点に対して退化し、15自由度はスケール/回転/並行移動だけでなく、シーンのパースペクティブにおけるドリフトも許容してしまう。この両問題がVGGT-SLAM 2.0を動機付けた。

## SLAMにおける意義

VGGT-SLAMは、多視点フィードフォワード基盤モデルを適切なSLAMループ——サブマップ、ループ閉じ込み、そしてこのようなモデルが未解決のまま残す再構成曖昧性への原理的な対処——に組み込んだ最初のシステムである。未キャリブレーションのフィードフォワードサブマップはSim(3)ではなくSL(4)でアライメントされなければならないという中心的な観察は、学習された幾何の上にSLAMを構築する人々にとって概念的に重要であり、そのSL(4)ファクターグラフソルバーはその後GTSAMにマージされた。DROID-SLAMとMASt3R-SLAMから、ますます学習ベース化するSLAMスタックへの直接的な系譜上に位置する。

## 関連ノート

- [VGGT](vggt.md) — フィードフォワードフロントエンドモデル
- [VGGT-SLAM 2.0](vggt-slam-2-0.md) — 15自由度のドリフトと平面退化を除去する後継システム
- [MASt3R-SLAM](mast3r-slam.md) — ペアワイズポイントマップ予測に基づくSLAM
- [DROID-SLAM](droid-slam.md) — 最適化バックエンドを持つ、より初期のend-to-end学習ベースSLAM
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md) — SALADがループ閉じ込みのために解く検索問題
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md) — 射影曖昧性の議論の背景となる知識
