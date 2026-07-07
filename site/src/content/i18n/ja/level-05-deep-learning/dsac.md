# DSAC

> Brachmann 2017 · [論文](https://arxiv.org/abs/1611.05705)

**一行要約** — 決定論的な仮説選択を確率的選択に置き換えることでRANSACを微分可能にし、シーン座標ベースのカメラローカライズパイプライン全体を、ロバストな姿勢推定器を通してエンドツーエンドで学習可能にする。

## 問題

RANSACは幾何的視覚(多視点幾何、姿勢推定、SLAM)におけるロバスト推定の中心的な手法であり、「局所的に予測し、大域的に適合させる」という手順に従う。しかし、その仮説選択——最大の合意スコアを持つモデル仮説を取る、$\mathbf{h}_{\mathrm{AM}}=\arg\max_{\mathbf{h}_J} s(\mathbf{h}_J,Y)$——は微分不可能であり、そのためRANSACはエンドツーエンドで学習される深層パイプラインの内部に組み込むことができなかった。カメラリローカライズに特化して言えば、深層学習はこれまで従来手法を上回ることに失敗していた:直接姿勢回帰(PoseNet)は不正確であり(シーンごとの並進誤差の中央値は約40cm)、シーン座標回帰は幾何を保持していたものの、その学習可能な構成要素は代理損失でしか学習できず、実際に重要な姿勢損失そのものでは学習できなかった。

## 手法とアーキテクチャ

このパイプラインは、シーン座標回帰(SCoRF)フレームワークに従い、既知のシーン内でのRGB画像の6自由度姿勢$\tilde{\mathbf{h}}$を推定する:

- **座標CNN**($\mathbf{w}$;VGGスタイル、13層、3300万パラメータ):42x42パッチごとにシーン座標$\mathbf{y}_i \in \mathbb{R}^3$——2D-3D対応——を予測する;画像1枚あたり40x40個の予測。
- **仮説生成**:$n{=}4$個の対応の最小集合を一様にサンプリングし、PnPにより256個の姿勢仮説$\mathbf{h}_J$のプールを得る。
- **スコアCNN**($\mathbf{v}$;13層、600万パラメータ):各仮説は、再投影誤差の40x40画像$e_i = \lVert\mathbf{p}_i - C\mathbf{h}_J\mathbf{y}_i\rVert$からスコア付けされる。ここで$\mathbf{p}_i$はピクセル$i$の2D位置、$C$はカメラ投影行列。
- **選択+洗練**:1つの仮説を選択し、その後インライア座標(再投影誤差が$\tau=10$ピクセル未満、最大100個のインライア)に対して8回反復して洗練する。

選択ステップを微分可能にする2つの手法が比較される:

- **SoftAM(ソフトargmax)**:選択をソフトマックス加重平均に置き換える、$\mathbf{h}_{\mathrm{SoftAM}}=\sum_J P(J|\mathbf{v},\mathbf{w})\,\mathbf{h}_J$($P(J|\mathbf{v},\mathbf{w}) \propto \exp(s(\mathbf{h}_J,Y;\mathbf{v}))$)——しかしこれはRANSACの決定的な選択を放棄し、代わりにロバストな平均を学習する。
- **DSAC(確率的選択)**:決定的な選択を保持しつつサンプリングする、$\mathbf{h}_{\mathrm{DSAC}}=\mathbf{h}_J$($J \sim P(J|\mathbf{v},\mathbf{w})$)、そして方策勾配型強化学習に着想を得て、*期待される*タスク損失を最小化する:

$$\tilde{\mathbf{w}},\tilde{\mathbf{v}}=\arg\min_{\mathbf{w},\mathbf{v}}\sum_{I\in\mathcal{I}}\mathbb{E}_{J\sim P(J|\mathbf{v},\mathbf{w})}\left[\ell(\mathbf{R}(\mathbf{h}_J^{\mathbf{w}},Y^{\mathbf{w}}))\right]$$

  その勾配自体が期待値である:

$$\frac{\partial}{\partial\mathbf{w}}\mathbb{E}_{J}\left[\ell(\cdot)\right]=\mathbb{E}_{J}\left[\ell(\cdot)\frac{\partial}{\partial\mathbf{w}}\log P(J|\mathbf{v},\mathbf{w})+\frac{\partial}{\partial\mathbf{w}}\ell(\cdot)\right]$$

学習損失は姿勢誤差$\ell_{\text{pose}}(\mathbf{h},\mathbf{h}^{*})=\max(\measuredangle(\boldsymbol{\theta},\boldsymbol{\theta}^{*}),\lVert\mathbf{t}-\mathbf{t}^{*}\rVert)$である(回転は度、並進はcm)。両CNNはまず要素ごとに学習され($L_1$座標損失;スコアは$-\beta\,\ell_{\text{pose}}$($\beta{=}10$)に対して回帰される)、その後エンドツーエンドで学習される;PnPと洗練の微分は中心差分によって取られる。

## 実験結果

7-Scenesデータセットでの結果(精度=テストフレームのうち5cm/5度以内の割合):

- **要素ごと**:完全なセット(17,000フレーム)でRANSAC 61.0%、SoftAM 61.6%、DSAC 60.3%——いずれもすでに疎な特徴のベースライン(38.6%)やBrachmannらのauto-context forestパイプライン(55.2%)を上回っており、主にScore CNNによるものである。
- **エンドツーエンド**:DSACは**62.5%**に改善(+2.2%、SEM±0.4%)、Kitchenでは+5.0%、Pumpkinでは+3.3%;SoftAMは57.8%へ*低下*する(−3.8%)、深刻に過学習する(Officeで−14.7%)——その平均化が積極的な重み減衰を強制し、スコア分布を崩壊させるのに対し、DSACは分布を広く保つ。エンドツーエンドのDSACは、完全なセットで従来の最高水準を7.3%上回る(シーン平均で4.9%)。
- **姿勢誤差の中央値**:3.9cm/1.6度、Brachmannらの4.5cm/2.0度に対して;PoseNet(並進中央値約40cm)は太刀打ちできない。
- エンドツーエンドの学習後、テスト時に元のargmax選択を復元しても精度の損失はない(62.4%)。弱点:Stairsシーン(4.5%)は繰り返し構造上での単峰性の点予測に悩まされる。

## SLAMにおける意義

DSACはシーン座標回帰を、屋内カメラリローカライズにおける支配的な学習パラダイムとして確立し、絶対姿勢回帰を大きく上回った。これは、幾何的な解法をループ内に保持し、タスクが実際に重視する姿勢損失に対して学習するためである。微分可能RANSACという考え方は幾何的深層学習全体に広く伝播した——論文はこれを、SfMやSLAMをエンドツーエンドで学習するためのロバストな最適化コンポーネントとして明示的に提案している——そしてDSACはDSAC++、DSAC\*、そして今日使われる高速学習のACE系列リローカライザの直接の祖先である。

## 関連ノート

- [PoseNet](posenet.md) — SCRが取って代わった絶対姿勢回帰のベースライン
- [DSAC++](dsacpp.md) — 後継:学習可能な構成要素は1つのみで、姿勢のみから学習可能
- [DSAC\*](dsac-star.md) — 学習を安定化した統一RGB/RGB-Dフレームワーク
- [ACE](ace.md) — 数時間でなく数分で学習できるシーン座標回帰
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — 直接姿勢回帰が及ばない理由
