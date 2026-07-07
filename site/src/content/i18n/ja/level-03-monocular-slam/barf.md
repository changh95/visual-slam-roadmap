# BARF

> Lin 2021 · [論文](https://arxiv.org/abs/2104.06405)

**一行要約** — Bundle-Adjusting NeRF: 不完全または未知の初期化から、NeRFのシーン表現*と*カメラ姿勢を粗から密への位置エンコーディングスケジュールを用いて同時最適化する — NeRFベースSLAMを実現するための鍵となる洞察。

## 問題

NeRFはフォトリアリスティックな新規視点合成を行うが、厳しい前提条件がある。学習用の各画像に対して正確なカメラ姿勢が必要で、通常はSfMパッケージで事前計算される。姿勢がノイジーまたは未知の場合、NeRFに対する素朴な姿勢最適化は「初期化に敏感」であり「3Dシーン表現の準最適解につながる可能性がある」。再構成とレジストレーションは鶏と卵の問題を形成する。3D構造の復元には既知の姿勢が必要であり、位置推定には再構成からの信頼できる対応関係が必要である。BARFは、不完全な(あるいは未知の)カメラ姿勢からNeRFを学習すること — ニューラル3D表現の学習とカメラフレームのレジストレーションの結合問題 — を、視点合成をプロキシ目的関数とするフォトメトリックバンドル調整の一形態として扱う。

## 手法とアーキテクチャ

BARFはまず2D画像アライメントを分析する。$\min_{\mathbf{p}}\sum_{\mathbf{x}}\|\mathcal{I}_1(\mathcal{W}(\mathbf{x};\mathbf{p}))-\mathcal{I}_2(\mathbf{x})\|_2^2$ の勾配降下による画像レジストレーションは、「最急降下画像」(ワープを通じて画像勾配を連鎖させたヤコビアン)が*一貫した*画素単位の更新を与える場合にのみ機能する — これが古典的なLucas-Kanadeアライメントが引き込み領域を広げるために画像を粗から密にブラーする理由である。同じ構造がNeRFを用いた3Dでも現れる。画素の色はMLP $f$ を通じてボリュームレンダリングされる。

$$\hat{\mathcal{I}}(\mathbf{u})=\int_{z_{\text{near}}}^{z_{\text{far}}}T(\mathbf{u},z)\,\sigma(z\bar{\mathbf{u}})\,\mathbf{c}(z\bar{\mathbf{u}})\,\mathrm{d}z\;,\qquad T(\mathbf{u},z)=\exp\Big(-\int_{z_{\text{near}}}^{z}\sigma(z'\bar{\mathbf{u}})\,\mathrm{d}z'\Big)$$

BARFは、$M$個のカメラ姿勢 $\mathbf{p}_i\in\mathbb{R}^6$(リー代数 $\mathfrak{se}(3)$ でパラメータ化)とNeRFの重み $\boldsymbol{\Theta}$ を、合成ベースの目的関数

$$\min_{\mathbf{p}_1,\dots,\mathbf{p}_M,\boldsymbol{\Theta}}\;\sum_{i=1}^{M}\sum_{\mathbf{u}}\big\|\hat{\mathcal{I}}(\mathbf{u};\mathbf{p}_i,\boldsymbol{\Theta})-\mathcal{I}_i(\mathbf{u})\big\|_2^2\;.$$

に対して同時に最適化する。

障害は位置エンコーディングである。NeRFは入力を $\gamma_k(\mathbf{x})=\big[\cos(2^k\pi\mathbf{x}),\sin(2^k\pi\mathbf{x})\big]$ で持ち上げるが、そのヤコビアン

$$\frac{\partial\gamma_k(\mathbf{x})}{\partial\mathbf{x}}=2^k\pi\cdot\big[-\sin(2^k\pi\mathbf{x}),\cos(2^k\pi\mathbf{x})\big]$$

は $2^k\pi$ で勾配を増幅しつつ同じ周波数で方向を反転させるため、サンプリングされた3D点からの姿勢勾配は「非一貫であり…互いに簡単に打ち消し合う」。BARFの修正は動的ローパスフィルタである。第$k$帯域を $\gamma_k(\mathbf{x};\alpha)=w_k(\alpha)\cdot\big[\cos(2^k\pi\mathbf{x}),\sin(2^k\pi\mathbf{x})\big]$ として重み付けし、

$$w_k(\alpha)=\begin{cases}0 & \text{if } \alpha<k\\[2pt] \dfrac{1-\cos((\alpha-k)\pi)}{2} & \text{if } 0\leq\alpha-k<1\\[2pt] 1 & \text{if } \alpha-k\geq 1\end{cases}$$

とする。ここで $\alpha\in[0,L]$ は最適化の進行とともに増加する。生の3D入力($\alpha=0$、滑らかな損失地形で姿勢が自由に動く)から完全なエンコーディング($\alpha=L$、シーンが完全な詳細まで鮮明化する)へ。NeRF実験では $\alpha$ は200Kのうち20Kから100Kのイテレーションまで線形に増加し、$L=10$の周波数帯域、姿勢とネットワークの両方にAdamを使用する。BARFはバッチでの同時最適化であり — リアルタイムやインクリメンタルではなく、内部パラメータは既知と仮定されているが — NeRFベースのSLAMシステムが必要とするトラッキング機構そのものである。

## 実験結果

- **2D平面アライメント**($\mathfrak{sl}(3)$におけるホモグラフィワープ): BARFはワープ誤差0.0096、パッチPSNR 35.30に達する。フル位置エンコーディングの0.2949 / 23.41、エンコーディングなしの0.0641 / 24.72に対して。
- **合成NeRFシーン**(8シーン、姿勢は $\delta\mathbf{p}\sim\mathcal{N}(\mathbf{0},0.15\mathbf{I})$ ≈ 14.9°回転、0.26並進で摂動): BARFはほぼ完全なレジストレーションを達成する — 例えばChairでは回転誤差0.096° / 並進誤差0.428、PSNR 31.16(正解姿勢で学習した参照NeRFの31.91に対して)。素朴なフルエンコーディングは7.19°、PSNR 19.02にとどまる。
- **LLFF実世界前向きシーン、すべての姿勢を単位姿勢で初期化**: 平均回転誤差0.573°、並進誤差0.331(素朴な位置エンコーディングの84.509° / 31.598に対して)。平均PSNRは23.97(素朴な手法の11.03、SfM姿勢で学習した参照NeRFの22.56に対して)。

結論はその帰結を明示的に述べている。BARFは「SfM/SLAMシステムの視覚的位置推定と、視点合成をプロキシ目的関数とする自己教師あり密な3D再構成フレームワークを再考する上で、興味深い道を開く」。

## SLAMにおける意義

NeRFは元々カメラ姿勢を(COLMAPから)*消費する*ものだったが、BARFは姿勢がラディアンスフィールド自体から*推定*できることを示し、ニューラルシーン表現による位置推定への道を開いた — 著者らがSLAMに向けて明示的に示す方向性である。レンダリング損失の最小化によってトラッキングを行うすべてのニューラルインプリシットSLAMシステムは、BARFの洞察をオンラインループで実行している。生の位置エンコーディングがなぜ姿勢レジストレーションを破綻させるか(そして粗密の工夫がなぜそれを修正するか)を理解することは、この分野の多くの設計上の選択を説明する。

## 関連ノート

- [NeRF](../level-05-deep-learning/nerf.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [GO-SLAM](go-slam.md)
