# EGG-Fusion

> Pan 2025 · [論文](https://arxiv.org/abs/2512.01296)

**一行要約** — SIGGRAPH Asia 2025のリアルタイムRGB-D再構成手法で、幾何を意識したガウシアン・サーフェルをオンザフライで融合する際にセンサノイズを明示的にモデル化した情報フィルタ更新を用いるため、微分可能最適化はすでにほぼ収束したマップを仕上げるだけで済む。

## 問題

微分可能レンダリングSLAM(NeRFおよび3DGSベース)はフォトリアリスティックなマップを提供するが、「現在の微分可能レンダリング手法はリアルタイム計算とセンサノイズ感度という2つの課題に同時に直面しており、シーン再構成における幾何的忠実度の低下と実用性の限界につながっている」。3DGSの楕円体の高い自由度は幾何的なあいまいさを生み、逆伝播によるマッピングはフレームごとに多くの勾配反復コストを要し、ノイズの多い民生用深度を正解として扱うと復元されるサーフェスが損なわれる。EGG-Fusionはリアルタイムのスループットとノイズを意識した高精度な表面幾何を同時に狙う。

## 手法とアーキテクチャ

シーンは2Dガウシアン・サーフェルの集合$\mathcal{S}=\{S_{i}:(\textbf{p}_{i},\textbf{s}_{i},\textbf{r}_{i},o_{i},\textbf{c}_{i})\}$として表現される — 中心、2つの楕円軸スケール、回転、不透明度、SH色を持つディスク状のプリミティブであり、深度順のアルファ合成によりレンダリングされる($T_{i}=\prod_{j<i}(1-\alpha_{j})$、$\hat{C}=\sum_{i}T_{i}\alpha_{i}\textbf{c}_{i}$、深度/法線マップも同様にブレンドされる)。フレームごとに2つのモジュールが動作する: スパースからデンスへのカメラトラッキング、その後の明示的なサーフェル融合と短い微分可能最適化である。

- **幾何を意識したサーフェル初期化**: 新しいサーフェルは低不透明度の領域と正の深度視差領域(新しい前景)にのみ生成され、深度に適応したスケール$\mathbf{s}=[\alpha_{s}\cdot d/f_{x},\,\alpha_{s}\cdot d/f_{y}]$($d$=深度、$\alpha_s=2.0$)を持つため、遠くのサーフェルは大きくなるが画像上の投影面積は一定に保たれる — 固定スケールに比べて同じサーフェル数でより良いレンダリングが得られる。
- **情報フィルタによるサーフェル融合**(中核となる貢献): 各サーフェルの幾何状態$\mathbf{x}^{t}=[\mathbf{p},\mathbf{n}]^{\top}\in\mathbb{R}^{6}$は共分散$\boldsymbol{\Sigma}^{t}$を持つ。再観測$\mathbf{z}^{t}=[V_{t}(\mathbf{u}),N_{t}(\mathbf{u})]^{\top}$は$\mathbf{z}^{t}=\mathbf{H}\mathbf{x}^{t}+\bar{\mathbf{t}}+\boldsymbol{\epsilon}$、$\boldsymbol{\epsilon}\sim\mathcal{N}(0,\boldsymbol{\Sigma}_{\mathbf{z}}^{t})$に従う。ここで$\mathbf{H}$はカメラ回転を保持し、ノイズ分散$\sigma_p,\sigma_n$は深度の二乗に応じて増加する(センサモデル)。再帰的ベイズ更新は情報形式で行われる:

$$\boldsymbol{\Lambda}^{t}=\boldsymbol{\Lambda}^{t-1}+\mathbf{H}^{\top}\boldsymbol{\Lambda}^{t}_{\mathbf{z}}\mathbf{H},\qquad \boldsymbol{\eta}^{t}=\boldsymbol{\eta}^{t-1}+\mathbf{H}^{\top}\boldsymbol{\Lambda}^{t}_{\mathbf{z}}\mathbf{z}^{t},\qquad \hat{\mathbf{x}}^{t}=(\boldsymbol{\Lambda}^{t})^{-1}\boldsymbol{\eta}^{t},$$

  これは観測ごとに閉形式で1回計算されるだけである(対角共分散により計算コストが低く保たれる)。更新された法線は、サーフェルに適用される$\mathbf{n}_{tg}=\mathbf{n}_{g}\times\mathbf{n}_{t}$を軸とする一意な回転増分$\Delta\textbf{R}(\textbf{n}_{tg},\theta)$を定義する。$\text{tr}(\boldsymbol{\Lambda})$は信頼できるサーフェスを抽出するためのサーフェルごとの信頼度としても機能する。
- **微分可能サーフェル最適化**: 直近$N_{\text{batch}}$フレームのローカルマップは$\mathcal{L}_{total}=\mathcal{L}_{c}+w_{d}\mathcal{L}_{d}+w_{n}\mathcal{L}_{n}+w_{reg}\cdot\mathcal{L}_{reg}$で精緻化される。ここで$\mathcal{L}_{c},\mathcal{L}_{d}$は$L_1$色/深度損失、$\mathcal{L}_{n}=|1-\gamma|$は法線ずれへのペナルティ、$\mathcal{L}_{reg}=|\textbf{p}-\textbf{p}_{f}|+w^{n}_{reg}\cdot|1-\textbf{n}\cdot\textbf{n}_{f}|$はサーフェルをフィルタで融合された幾何$\textbf{p}_f,\textbf{n}_f$に固定する。融合によってサーフェルはすでに収束近くにあるため、マッピングステップあたり約9回の反復のみで済む。
- **スパースからデンスへのトラッキング**: スパースな2D-3D再投影誤差に対するLMによる初期姿勢$\boldsymbol{\xi}_{t}^{(0)}=\arg\min\sum_{\mathcal{M}}\rho(|\mathbf{u}_{i}-\Pi(\exp(\boldsymbol{\xi}_{t})\cdot\textbf{X}_{i}^{w})|^{2})$を、密な結合アラインメント$E_{\text{dense}}=E_{\text{icp}}+\lambda_{\text{photo}}E_{\text{photo}}$(グローバルモデルに対するpoint-to-plane ICPとフォトメトリック誤差)で精緻化し、退化した精緻化を拒否する収束チェックを併用する。

## 実験結果

Replica、TUM-RGBD、ScanNet++、および3つの自己収集Azure Kinect屋外シーンで評価:

- **表面再構成(ガウシアンからサンプリングされた点)**: 精度はReplicaで0.60 cm、ScanNet++で0.67 cmであり、3 cm以内の精度比はそれぞれ99.99% / 99.98% — RTG-SLAMの0.80/1.06 cm、SplaTAMの2.87/1.71 cmに対して優れる。要旨にある「最先端GSベース手法と比較して精度20%以上の改善」に対応する。
- **トラッキング**: Replica ATE平均0.17 cm(RTG-SLAM 0.18、SplaTAM 0.39); TUM平均4.47 cm(オンライン) — リアルタイム微分可能システムの中で最良(RTG-SLAM 5.12、SplaTAM 5.48) — グローバル最適化を伴うオフライン版では1.98 cm。
- **レンダリング(ScanNet++)**: 新規視点PSNR 25.70 / SSIM 0.907(RTG-SLAM 24.77/0.882、SplaTAM 24.75/0.900に対して); 学習視点PSNR 29.06。
- **速度/メモリ(Replica off0)**: 24.21 FPS、マッピングは1フレームあたり0.071 s(7.5 ms × 9反復)、メモリ1.8 GB — RTG-SLAMの15.73 FPS / 2.7 GB、SplaTAMの0.19 FPS / 9.1 GBに対して優れる。
- **アブレーション**: スパース初期化なしでは、fr1/roomおよびfr3/officeで密トラッキングが完全に失敗する。情報フィルタ融合を除去すると、ScanNet++の点精度は0.67から0.73 cmに悪化し、遠方のノイズが多い物体で明らかにノイズの多い表面が現れる。

## SLAMにおける意義

多くの3DGS-SLAMシステム(SplaTAM、MonoGS)は、レンダラを通じた逆伝播によってマップを最適化し、損失が収束するまで反復する。EGG-Fusionは別の系譜を示す: ガウシアンを学習されるパラメータではなく、*フィルタリングされる状態*として扱う — 古典的なサーフェルSLAM(ElasticFusion)の推定理論的で信頼度に基づく融合を、微分可能かつレンダリング可能な表現へとアップグレードしたものである。閉形式の融合と少数の仕上げ反復により、密なフォトリアリスティックマップを真のリアルタイム逐次動作と両立させ、原理に基づいたプリミティブごとの不確実性を与える — いずれも実用的なガウシアンマップSLAMにとって不可欠である。

## 関連ノート

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [RTG-SLAM](rtg-slam.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
