# LM-Reloc

> von Stumberg 2020 · [論文](https://arxiv.org/abs/2010.06323)

**一行要約** — 深層直接再定位: Levenberg-Marquardtベースの直接画像位置合わせに合わせて調整されたCNN特徴を学習し、特徴マッチングやRANSACなしにクエリ画像と参照画像間の相対姿勢を推定する。

## 問題

視覚的再定位はほぼ普遍的に特徴ベースの定式化で取り組まれる——キーポイントを検出し、記述子をマッチングし、RANSACで外れ値を除外し、姿勢を解く。このパイプラインはコーナー以外のすべてを捨ててしまう。直接画像位置合わせは勾配を持つ*任意の*画像領域を活用できるが、生の光度ベースの位置合わせは照明、天候、季節変化の下で破綻し、収束の基底が狭いため再定位に典型的な大きなベースラインの下では脆弱である。LM-Relocは、直接的な定式化を維持しながら、様々な条件下で頑健にする方法を問う。

## 手法とアーキテクチャ

LM-Relocは、直接SLAMシステム(Stereo DSO)からの疎な深度を与えられて、画像$I$と$I'$の間の6自由度姿勢$\boldsymbol{\xi} \in SE(3)$を推定する。3つの要素が連携して動作する: **LM-Net**(複数スケールの特徴マップ$F_l, F'_l$、$l = 1,\dots,4$を生成するシャム構造のエンコーダ・デコーダ)、**CorrPoseNet**(粗い姿勢初期化)、そして古典的な**Levenberg-Marquardt最適化器**である。

**学習済み特徴上での直接位置合わせ。** 生の輝度値ではなく、最適化器は粗から細へのピラミッド($(w/8, h/8)$の$F_1$から全解像度の$F_4$まで)における特徴メトリックエネルギーを最小化する:

$$E(\boldsymbol{\xi})=\sum_{\mathbf{p}\in P}\big\lVert F_{l}^{\prime}(\mathbf{p}^{\prime})-F_{l}(\mathbf{p})\big\rVert_{\gamma}, \qquad \mathbf{p}^{\prime}=\Pi\left(\mathbf{R}\,\Pi^{-1}(\mathbf{p},d_{\mathbf{p}})+\mathbf{t}\right),$$

Huberノルム$\lVert\cdot\rVert_\gamma$と点ごとの深度$d_{\mathbf{p}}$を用いる。各LM反復はガウス-ニュートン系$\mathbf{H}=\mathbf{J}^{T}\mathbf{W}\mathbf{J}$、$\mathbf{b}=-\mathbf{J}^{T}\mathbf{W}\mathbf{r}$を構築し、$\mathbf{H}'=\mathbf{H}+\lambda\mathbf{I}$(Levenberg)または$\mathbf{H}'=\mathbf{H}+\lambda\,\mathrm{diag}(\mathbf{H})$(Marquardt)によりダンピングし、$\boldsymbol{\delta}=\mathbf{H}'^{-1}\mathbf{b}$、$\boldsymbol{\xi}^{i}=\boldsymbol{\delta}\boxplus\boldsymbol{\xi}^{i-1}$として更新する。$\lambda$は成功したステップの後で半分に、失敗したステップの後で4倍にされる。

**最適化器を中心に設計された損失。** 中心となる考え方は、最適化中に投影された点が取りうる4つの状態を区別し、それぞれ独自のサンプリング対応点と損失項を持って、LMがうまく振る舞うように特徴を学習することである:

1. 正しい位置: $E_{\text{pos}}=\lVert F^{\prime}(\mathbf{p}_{\text{gt}}^{\prime})-F(\mathbf{p})\rVert^{2}$はゼロになるべき。
2. 外れ値(任意の場所でサンプリングされた負例): $E_{\text{neg}}=\max\left(M-\lVert F^{\prime}(\mathbf{p}_{\text{neg}}^{\prime})-F(\mathbf{p})\rVert^{2},0\right)$、マージン$M=1$——誤ったマッチは大きな残差を生じるべき。
3. 最適解から離れている(約5px離れた負例、大きな$\lambda$、勾配降下法の領域): ダンピングされた点ごとのフローステップ$\mathbf{p}_{\text{after}}^{\prime}=\mathbf{p}_{\nabla}^{\prime}+(\mathbf{H}_{\mathbf{p}}+\lambda_{f}\mathbf{I})^{-1}\mathbf{b}_{\mathbf{p}}$が真値へ向かって動くべき: $E_{\text{GD}}=\max\left(\lVert\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime}\rVert^{2}-\lVert\mathbf{p}_{\nabla}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime}\rVert^{2}+\delta,0\right)$(収束の基底を広げる; $\lambda_f{=}2.0$、$\delta{=}0.1$)。
4. 最適解に近い(1px以内の負例、小さな$\lambda$、ガウス-ニュートンの領域): GN-Netによる確率的ガウス-ニュートン損失、$E_{\text{GN}}=\frac{1}{2}(\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime})^{T}\mathbf{H}_{\mathbf{p}}(\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime})+\log(2\pi)-\frac{1}{2}\log(|\mathbf{H}_{\mathbf{p}}|)$(サブピクセル精度のため最小値を鋭くする)。

**初期化のためのCorrPoseNet。** 相関層$\mathbf{c}(i,j,(i^{\prime},j^{\prime}))=\mathbf{f}_{\text{corr}}(i,j)^{T}\mathbf{f}_{\text{corr}}^{\prime}(i^{\prime},j^{\prime})$を持つ回帰ネットワークが、オイラー角と並進を回帰して、大きなベースライン/回転の下でLMを起動する。頑健だが不正確であるため、最終推定値は常に幾何最適化から得られる。

## 実験結果

再定位追跡ベンチマーク(CARLA + Oxford RobotCar)で評価され、0.5 m / 0.5°までの累積姿勢誤差曲線のAUCを報告する:

- **CARLA(テスト)**: LM-Relocは$t_{\text{AUC}}/R_{\text{AUC}}$で**80.65 / 77.83**に達する(SuperGlueの78.99 / 59.31、R2D2の73.47 / 54.42、SuperPointの72.76 / 53.38、D2-Netの47.62 / 16.47に対して)。CorrPoseNetなしでは63.88 / 61.9、GN-Netは43.72 / 44.08——LM損失単体でも既にGN-Netを大きく上回る。
- **Oxford RobotCar**(晴れ/曇り/雨/雪の間の6つの条件間ペア): LM-Relocはほぼ一貫して回転AUCで勝る(例: Sunny-OvercastでSuperGlueの52.83に対し55.48)一方、並進では競争力を保つ。LiDAR-ICPの正解自体が約16cm RMSの誤差を持ち、0.15m未満の並進上の改善はそれに隠れてしまう。
- **GN-Netとの直接比較**(CorrPoseNetなし、同じ位置合わせパイプライン): 6つのシーケンスすべてでより良い結果、例えばSunny-Rainyで70.46 / 42.86対64.58 / 37.27。
- **アブレーション**: $E_{\text{GD}}$は主に頑健性を改善し、$E_{\text{GN}}$は精度を改善する。両者を合わせることで両方が得られる。

## SLAMにおける意義

LM-RelocはTUMの直接SLAM系譜(DSOとその後継)から生まれ、直接法の核心的な弱点——外観変化の下での再定位とマップの再利用——に取り組む。これは有効な設計パターンを例示している——古典的な幾何最適化器を保ちつつ、それが作用する表現を学習し、学習損失を最適化器の実際の収束挙動を中心に形成する。直接法の精度が必要だが、セッションや条件を超えて再定位しなければならない場合には、このアイデア群を使うとよい。

## 関連ノート

- [DSO](../level-03-monocular-slam/dso.md) — この手法が基づく直接オドメトリの系譜
- [D3VO](../level-03-monocular-slam/d3vo.md) — 同じグループによる深層直接オドメトリ; CorrPoseNetに影響を与えた
- [PoseNet](posenet.md) — 純粋な姿勢回帰、ここでは初期化にのみ使用
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — 回帰だけでは不十分な理由
- [HF-Net](hf-net.md) — 再定位のための特徴マッチングベースの代替手法
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — 再定位対象となる参照画像の検索
