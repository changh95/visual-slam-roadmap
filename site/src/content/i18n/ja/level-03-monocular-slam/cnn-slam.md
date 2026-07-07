# CNN-SLAM

> Tateno 2017 · [論文](https://arxiv.org/abs/1704.03489)

**一行要約** — CNNが予測した密な深度マップと、LSD-SLAM式のセミデンスなフォトメトリック深度リファインメントを融合し、単一カメラから絶対スケール、密な再構成、融合されたセマンティックラベルを復元する。

## 問題

直接法モノキュラーSLAM(LSD-SLAM)はセミデンスな深度マップを生成するが、低テクスチャ領域では失敗し、純粋な回転下では(ステレオベースラインがないため)破綻し、絶対スケールを復元できない。CNNによる単眼深度予測はどこでも密なメトリック深度を与えるが、深度境界がローカルにブラーし、多視点整合性がない。CNN-SLAM("CNN-SLAM: Real-time dense monocular SLAM with learned depth prediction", Tateno, Tombari, Laina, Navab)は、これらの相補的なソースをどのように融合させれば「モノキュラーSLAM手法が失敗しがちな画像位置(例えば低テクスチャ領域)では深度予測が優先され、逆もまた然り」となるかを問う。

## 手法とアーキテクチャ

LSD-SLAMを基盤としたキーフレームベースの直接法SLAM。各キーフレーム $k_i$ は姿勢 $\mathbf{T}_{k_i}$、*密な*深度マップ $\mathcal{D}_{k_i}$、不確かさマップ $\mathcal{U}_{k_i}$ を保持する。2つのCNN(Laina et al.のResNet-50全層畳み込みアーキテクチャ、ImageNet初期化。1つはberHu損失で深度を回帰し、もう1つはsoft-max/クロスエントロピーでセマンティックラベルを予測)は**キーフレームごとに一度だけ**GPU上で実行され、トラッキングとリファインメントはCPU上でフレームごとに(2スレッドで)実行され、システムをリアルタイムに保つ。

**トラッキング** — 各フレーム $t$ は、高勾配画素 $\tilde{\mathbf{u}}$ に限定したフォトメトリック残差のガウス・ニュートン法によって最も近いキーフレームにアラインされる。

$$E(\mathbf{T}^{k_i}_t)=\sum_{\tilde{\mathbf{u}}\in\Omega}\rho\left(\frac{r(\tilde{\mathbf{u}},\mathbf{T}^{k_i}_t)}{\sigma(r(\tilde{\mathbf{u}},\mathbf{T}^{k_i}_t))}\right),\qquad r(\tilde{\mathbf{u}},\mathbf{T})=\mathcal{I}_{k_i}(\tilde{\mathbf{u}})-\mathcal{I}_t\big(\pi(\mathbf{K}\,\mathbf{T}\,\mathcal{V}_{k_i}(\tilde{\mathbf{u}}))\big)$$

ここで $\rho$ はHuberノルム、$\sigma$ は残差不確かさ関数、$\pi$ は透視投影、$\mathcal{V}_{k_i}(\mathbf{u})=\mathbf{K}^{-1}\dot{\mathbf{u}}\,\mathcal{D}_{k_i}(\mathbf{u})$ はキーフレーム頂点マップである。

**キーフレーム初期化** — 回帰された深度 $\tilde{\mathcal{D}}_{k_i}$ は、現在のカメラの焦点距離 $f_{cur}$ と学習時のセンサーの焦点距離 $f_{tr}$ の不一致に対して調整され、これにより絶対スケール誤差の大部分が解消される。

$$\mathcal{D}_{k_i}(\mathbf{u})=\frac{f_{cur}}{f_{tr}}\,\tilde{\mathcal{D}}_{k_i}(\mathbf{u})$$

LSD-SLAMの大きな定数初期不確かさとは異なり、$\mathcal{U}_{k_i}$ はキーフレームのCNN深度と最も近いキーフレームのワープされた深度との差の二乗として初期化される — 予測された各深度値に対するフレーム間の信頼度である。

**フレームごとの深度リファインメント** — 各フレームは、スモールベースライン5画素エピポーラステレオマッチング(Engel et al. 2013)を介して深度/不確かさ推定 $(\mathcal{D}_t,\mathcal{U}_t)$ を生成し、不確かさによる重み付けでキーフレームに融合される。

$$\mathcal{D}_{k_i}(\mathbf{u})=\frac{\mathcal{U}_t(\mathbf{u})\,\mathcal{D}_{k_i}(\mathbf{u})+\mathcal{U}_{k_i}(\mathbf{u})\,\mathcal{D}_t(\mathbf{u})}{\mathcal{U}_{k_i}(\mathbf{u})+\mathcal{U}_t(\mathbf{u})},\qquad \mathcal{U}_{k_i}(\mathbf{u})=\frac{\mathcal{U}_t(\mathbf{u})\,\mathcal{U}_{k_i}(\mathbf{u})}{\mathcal{U}_{k_i}(\mathbf{u})+\mathcal{U}_t(\mathbf{u})}$$

高勾配画素(低ステレオ不確かさ)はリファインされた多視点深度に収束する — まさにCNNの境界がブラーしている場所である — 一方で低テクスチャ画素はCNN事前分布を保持する。キーフレーム姿勢はポーズグラフ最適化(g2o)によって大域的にリファインされ、大域セグメンテーションモデルがキーフレームごとのセマンティックマップを3D再構成に段階的に融合する。

## 実験結果

ICL-NUIM(合成)とTUM RGB-Dで評価。CNNはNYU Depth v2のみで学習(異なるセンサーと環境)し、汎化性能を検証。Xeon 2.4 GHz + Quadro K5200で実行、ネットワークは304×228、SLAMは320×240。9シーケンスにわたる平均絶対軌跡誤差は**0.246 m**で、*正解スケールでブートストラップした*LSD-SLAMの0.562 m、LSD-SLAMの0.772 m、ORB-SLAMの0.643 m、Lainaのpoint-based fusionに供給したCNN深度の0.512 mに対して優れている。正しく推定された深度の平均割合(正解の10%以内)は**22.5%**で、18.5%(生のCNN + fusion)、7.6%(REMODE)、3.0%(LSD-SLAMブートストラップ)、0.2%(LSD-SLAM)に対して優れている。回転が主体のTUM fr1/rpyシーケンスでは、LSD-SLAMが激しくノイジーになりORB-SLAMが初期化に失敗する状況でも、CNN-SLAMはシーンを再構成できる。本論文はまた、単眼カメラからの初の3D+セマンティック統合再構成を示している(4つのNYUスーパークラス)。

## SLAMにおける意義

CNN-SLAMは、深層学習による深度予測を古典的なSLAMパイプラインと組み合わせた最初期のシステムの一つで、DVSO、D3VO、および後続の多くのシステムが従った「古典+学習」パラダイムを開拓した。その中核レシピ — 学習された深度を不確かさ付きの画素ごとの測定値として扱い、逆分散重み付けで多視点深度と融合する — は、学習された深度がメトリックスケールを復元し純粋な回転下でも生き残ることができること、そして幾何とセマンティクスが1つの単眼システムで同時に再構成できることを示した。

## 関連ノート

- [LSD-SLAM](lsd-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [DeepFusion](deepfusion.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Self-supervised depth](self-supervised-depth.md)
