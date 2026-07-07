# DSAC\*

> Brachmann 2021 · [論文](https://arxiv.org/abs/2002.12324)

**一行要約** — DSAC系列を統合したTPAMI版:RGBまたはRGB-D画像からの視覚的リローカライズのための、単一の統一されたシーン座標回帰フレームワークであり、学習の安定性と効率を大幅に改善した。

## 問題

2020年までにDSAC系列は、設定ごとに別々のレシピを積み重ねてきた——RGB入力かRGB-D入力か、3Dシーンモデルを使うか使わないかで学習方法が異なり、それぞれ独自の初期化段階と安定性上の注意点を持っていた。DSAC\*はこれらのバリアントを単一で信頼性の高いフレームワークに統合し、シーン座標回帰を入力モダリティや教師信号の種類にわたって統一的に適用できるようにする。

## 手法とアーキテクチャ

**シーン座標回帰+ロバストな姿勢解法。** 全層畳み込みネットワーク$f$はグレースケール画像$I$を密なシーン座標$\mathcal{Y}=f(I;\mathbf{w})$——各ピクセルが観測するシーン空間内の3D点——に写す。これはカメラ空間の点と$\mathbf{y}_i = \mathbf{h}\mathbf{e}_i$の関係で結ばれる。出力は8倍にサブサンプリングされ、各予測は81ピクセルの受容野を持ち、地図とは28MBのネットワーク重み*そのもの*である。姿勢の最適化は古典的なRANSACで行う:最小解法$\mathbf{h}_j = g(\mathcal{C}_j)$で$M{=}64$個の仮説をサンプリングする——RGBの場合は2D-3D対応に対するP3P/PnP解法(残差$r^{\text{RGB}}(\mathbf{y}_i,\mathbf{h}) = ||\mathbf{p}_i - K\mathbf{h}^{-1}\mathbf{y}_i||$)、RGB-Dの場合は3D-3D対応に対するKabsch解法($r^{\text{RGB-D}}(\mathbf{y}_i,\mathbf{h}) = ||\mathbf{e}_i - \mathbf{h}^{-1}\mathbf{y}_i||$)——その後、インライア数が最大の仮説$s(\mathbf{h},\mathcal{Y})=\sum_{\mathbf{y}_i\in\mathcal{Y}}\mathbf{1}[\,r(\mathbf{y}_i,\mathbf{h})<\tau\,]$($\tau{=}$RGBで10ピクセル/RGB-Dで10cm)を選び、そのインライアに対して反復的に洗練する(Levenberg-Marquardt PnPまたはKabsch)。

**3つの設定に対する1つの初期化目的関数。** DSAC\*は次のいずれかで学習する:RGB-D;RGB+3Dモデル(レンダリングされた正解座標$\mathbf{y}^*_i$を使用);RGBのみ。統一されたピクセルごとの損失は、予測が有効になった時点で*ピクセルごとに動的に*3D距離から再投影誤差に切り替わる。

$$\ell^{\text{RGB+M}}(\mathbf{y}_{i},\mathbf{y}^{*}_{i},\mathbf{h}^{*})=\begin{cases}\hat{r}^{\text{RGB}}(\mathbf{y}_{i},\mathbf{h}^{*})&\text{if }\mathbf{y}_{i}\in\mathcal{V}\\ ||\mathbf{y}^{*}_{i}-\mathbf{y}_{i}||&\text{otherwise},\end{cases}$$

ここで$\hat{r}^{\text{RGB}}$は再投影誤差をソフトクランプする(100ピクセルを超えると平方根)。3Dモデルがない場合、$\mathbf{y}^*_i$は一定の10m深度で仮想的に生成されるヒューリスティックな目標$\bar{\mathbf{y}}_i = \mathbf{h}^*\bar{\mathbf{e}}_i$に置き換えられる。これはDSAC++の無駄の多い2つの独立した初期化段階を置き換え、事前学習を4日から2日へ半減させる。

**微分可能RANSACによるエンドツーエンド学習。** パイプライン全体は姿勢損失$\ell^{\text{Pose}}(\hat{\mathbf{h}},\mathbf{h}^{*})=||\hat{\mathbf{t}}-\mathbf{t}^{*}||+\gamma\measuredangle(\hat{\bm{\theta}},\bm{\theta}^{*})$($\gamma{=}100$)で学習される。すべての構成要素が微分可能にされる:KabschはSVDの勾配を通じて;PnPは最後のGauss-Newton反復の解析的勾配を通じて、$\frac{\partial}{\partial\mathcal{Y}}\mathbf{h}(\mathcal{Y})\approx-J_{\mathbf{r}}^{+}\frac{\partial}{\partial\mathcal{Y}}\mathbf{r}_{\mathcal{I}}(\mathcal{Y},\mathbf{h}^{t=\infty})$;インライア計数はシグモイド緩和$s(\mathbf{h},\mathcal{Y})=\sum_{i}\sigma[\beta\tau-\beta r(\mathbf{y}_{i},\mathbf{h})]$($\beta = 5/\tau$)を通じて;仮説選択はDSACを通じて——スコアに対するソフトマックスから$j\sim p(j|\mathcal{Y})$をサンプリングし、期待姿勢損失を最小化する。

$$\mathcal{L}^{\text{Pose}}(\mathcal{Y},\mathbf{h}^{*})=\mathbb{E}_{j\sim p(j|\mathcal{Y})}\left[\hat{\ell}^{\text{Pose}}(\mathbf{R}(\cdot),\mathbf{h}^{*})\right],$$

その勾配は、スコア関数項$\hat{\ell}^{\text{Pose}}(\cdot)\,\partial_{\mathcal{Y}}\log p(j|\mathcal{Y})$と経路依存微分(pathwise derivative)を組み合わせたものである。幾何学的データ拡張(±30°の回転、66〜150%のリスケーリング)が学習中に加えられる。

## 実験結果

- **7Scenes**(5cm/5度以内のフレーム割合):RGB+3Dモデル設定で85.2%——最高水準であり、モデルサイズが小さいながら(28MB対165MB)SCoCRと同等;RGBのみの学習ではDSAC++より+27.6%の改善;RGB-Dの精度はOtF Forestsの93.4%(ICP後処理なし)をわずかに上回る。データ拡張は設定に応じて+9.1/+7.7/+4.1%貢献する(Stairs・RGBのみでは+51.5%)。
- **12Scenes**:すべての設定で最高水準、約99%——「解決済み」、DSAC\*のRGBのみでさえそうである。
- **Cambridge Landmarks**(並進の中央値cm/回転°、3Dモデルあり):St Mary's Church 13/0.4、Great Court 49/0.3、Old Hospital 21/0.4、King's College 15/0.3、Shop Facade 5/0.3——DSAC++と同等だが2.5日で学習可能(DSAC++は6日)。3Dモデル*なし*ではDSAC\*はすべてのシーンでDSAC++を上回る(例:Great Court 34/0.2——SfM再構成が外れ値の多いモデルを*用いた*どの手法よりも良い)。
- **効率**:順伝播50ms(DSAC++の150msに対し)、総推論75ms(200msに対し);4MBの「Tiny」バリアントでも73.6%(7Scenes)、98.1%(12Scenes)に達する;28MBのDSAC\*はCambridgeにおけるシーン圧縮比較で最高の平均精度を示す。

## SLAMにおける意義

リローカライズ——追跡失敗後や既知環境での再起動時に6自由度カメラ姿勢を回復すること——はSLAMシステムに必要とされる能力である。DSAC\*はシーン座標回帰による解答の成熟形であり、地図はネットワーク重みに暗黙的に格納されつつ、幾何的なPnP/Kabsch+RANSAC解法をループ内に保持し、単一画像からセンチメートル精度の屋内位置合わせを実現する。その安定して統合された学習レシピは、後にACE系列が桁違いに高速化する際の基準ベースラインとなった。

## 関連ノート

- [DSAC](dsac.md) — カメラローカライズのための元の微分可能RANSAC
- [DSAC++](dsacpp.md) — カメラ姿勢のみからの自己教師あり学習
- [ACE](ace.md) — 数分の学習でDSAC\*の精度に匹敵
- [ACE Zero](ace-zero.md) — SCRを拡張し、姿勢と地図をゼロから同時に学習
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — SCRが直接姿勢回帰を上回る理由
