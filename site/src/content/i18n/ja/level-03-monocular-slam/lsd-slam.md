# LSD-SLAM

> Engel 2014 · [論文](https://cvg.cit.tum.de/research/vslam/lsdslam)

**一行要約** — 最初の大規模直接単眼SLAM: 半密な確率的深度マップをCPU上で光度誤差最小化によってトラッキングし、スケールドリフトを意識した $\mathrm{Sim}(3)$ キーフレームアラインメントとポーズグラフによるループクロージャを備える。

## 問題

2014年時点で、単眼SLAMには2つの既存の選択肢があり、それぞれに厳しい限界があった。特徴ベースのシステム(PTAM系譜)は精度が高いものの、キーポイント以外のすべてを捨てていた — 「直線または曲線のエッジに含まれる情報…は捨てられる」。直接的な密な手法(DTAM、変分VO)は画像データをすべて使うが「計算負荷が高く、最先端のGPUを要する」上、既存の直接法はすべてグローバルマップもループクロージャもない純粋なオドメトリだった。さらに、単眼システムは長い軌跡にわたって*スケール*方向にドリフトするが、これは6自由度のポーズグラフでは表現できない。LSD-SLAM(Engel、Schöps、Cremers、ECCV 2014)はこの3つすべて — 直接的、大規模で一貫性のある、CPUでのリアルタイム性 — を狙う。

## 手法とアーキテクチャ

3つのコンポーネントが並行して動作する(論文のFig. 3): **トラッキング**、**深度マップ推定**、**マップ最適化**。

- **トラッキング(直接 $\mathfrak{se}(3)$ アラインメント)**: 新しいフレーム $I_j$ はそれぞれ、現在のキーフレーム $K_i = (I_i, D_i, V_i)$ — 画像、半密な逆深度マップ、逆深度*分散* — に対して、有効な深度を持つすべてのピクセルにわたる分散正規化光度誤差を最小化することでアラインメントされる:

$$E_p(\boldsymbol{\xi}_{ji}) = \sum_{\mathbf{p}\in\Omega_{D_i}} \left\| \frac{r_p^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}^{2}} \right\|_{\delta}, \qquad r_p := I_i(\mathbf{p}) - I_j\big(\omega(\mathbf{p}, D_i(\mathbf{p}), \boldsymbol{\xi}_{ji})\big),$$

$$\sigma_{r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}^{2} := 2\sigma_I^2 + \left(\frac{\partial r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}{\partial D_i(\mathbf{p})}\right)^{2} V_i(\mathbf{p}),$$

  ここで $\omega$ は投影ワープ、$\|\cdot\|_\delta$ はHuberノルム、$\sigma_I^2$ は画像ノイズである。各ピクセルの深度分散を残差に伝播させることが、本論文の2つ目の主要な新規性であり、深度が不確かなピクセルは自動的に重みを下げられる。最小化はリー多様体上の反復重み付きガウス・ニュートン法によって行われる。
- **深度マップ推定**: トラッキングされたフレームは、多数のピクセル単位の小基線ステレオ比較によってキーフレームを精緻化し、それらは確率的にフィルタリングされて $D_i, V_i$ となる(Engel 2013に従う)。深度は画像勾度が十分な場所にのみ存在する — つまり*半密*である。カメラが十分に移動した場合($\mathrm{dist}(\boldsymbol{\xi}_{ji}) = \boldsymbol{\xi}_{ji}^T \mathbf{W} \boldsymbol{\xi}_{ji}$ がしきい値を超えたとき)、古い深度マップをそこに投影することで新しいキーフレームが作られ、各キーフレームは平均逆深度が1になるように再スケールされる。
- **$\mathfrak{sim}(3)$ キーフレームアラインメント(新規性1)**: キーフレームはスケール正規化されているため、それらの間のエッジは7自由度の相似変換である。$\mathfrak{sim}(3)$ 上での直接アラインメントは深度残差を追加する — これは光度誤差だけではスケールを観測できないために必要である:

$$E(\boldsymbol{\xi}_{ji}) := \sum_{\mathbf{p}\in\Omega_{D_i}} \left\| \frac{r_p^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_p}^{2}} + \frac{r_d^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_d}^{2}} \right\|_{\delta}, \qquad r_d := [\mathbf{p}']_3 - D_j\big([\mathbf{p}']_{1,2}\big),$$

  ここで $\mathbf{p}' = \omega_s(\mathbf{p}, D_i(\mathbf{p}), \boldsymbol{\xi}_{ji})$ である。ループ候補は最も近い10個のキーフレームに加え、見た目に基づく(FAB-MAP)提案であり、それぞれが両方向 $\boldsymbol{\xi}_{jk i}$ と $\boldsymbol{\xi}_{i jk}$ が統計的に一致することを確認する相互トラッキングチェックによって検証される。ESMと20×15ピクセルから始まる粗密ピラミッドが収束半径を拡大する。
- **マップ最適化**: $\mathrm{Sim}(3)$ 制約を持つキーフレームポーズグラフは、バックグラウンドで(g2oにより)継続的に最適化される:

$$E(\boldsymbol{\xi}_{W1} \dots \boldsymbol{\xi}_{Wn}) := \sum_{(\boldsymbol{\xi}_{ji}, \Sigma_{ji}) \in \mathcal{E}} \big(\boldsymbol{\xi}_{ji} \circ \boldsymbol{\xi}_{Wi}^{-1} \circ \boldsymbol{\xi}_{Wj}\big)^T \Sigma_{ji}^{-1} \big(\boldsymbol{\xi}_{ji} \circ \boldsymbol{\xi}_{Wi}^{-1} \circ \boldsymbol{\xi}_{Wj}\big).$$

## 実験結果

- **TUM RGB-Dベンチマーク**(絶対軌跡RMSE、cm単位; 単眼で、最初の深度マップでスケールをブートストラップ): fr2/desk **4.52**(116キーフレーム) vs 半密mono-VOの13.50、特徴点ベースmono-SLAM(PTAM)ではトラッキング失敗、センサー深度を用いる2つのRGB-Dシステムでは1.77 / 9.5; fr2/xyz **1.47** vs 3.79(半密VO)、24.28(PTAM)。シミュレーションシーケンス: sim/desk 0.04、sim/slowmo 0.35。
- **大規模環境**: 約500 m、6分間のハンドヘルド屋外軌跡が正しく閉じられ、20 cm未満から10 mを超える範囲まで平均逆深度が広がるシーケンスも一貫してマッピングされる — ループクロージャ前は、シーンの一部が異なるスケールで二重に存在していたが、閉じた後は整合する。
- CPU上でリアルタイムに動作する(640×480、30 Hz); オドメトリコアはスマートフォンでも動作することが示されている。ESMと追加のピラミッドレベルは $\mathfrak{sim}(3)$ の収束半径を広げるが、収束後の精度は変わらない。

## SLAMにおける意義

LSD-SLAMは、直接法が特徴ベースSLAMに対する本格的でスケーラブルな代替手段になり得ることを証明した: より多くの画像情報を使用し、より豊かな半密マップを持ち、コーナーが乏しい場所でも頑健である。その2つの輸出物 — トラッキングの基本要素としての分散正規化光度アラインメントと、単眼スケールドリフトのための $\mathrm{Sim}(3)$ ポーズグラフ — は今では標準的な語彙となっている(ORB-SLAMはループクロージングのために $\mathrm{Sim}(3)$ essential graphのアイデアを採用した)。直接的にはDSO(同じグループによる、ポーズグラフをウィンドウ光度BAに置き換えたもの)とCNN-SLAM(LSD-SLAMの骨格上で学習された深度を用いる)の種となった。

## 関連ノート

- [DTAM](dtam.md)
- [DSO](dso.md)
- [CNN-SLAM](cnn-slam.md)
- [Scale ambiguity](scale-ambiguity.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [LDSO](ldso.md)
