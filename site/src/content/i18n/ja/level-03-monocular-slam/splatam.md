# SplaTAM

> Keetha 2024 · [論文](https://arxiv.org/abs/2312.02126)

**一行要約** — 3D Gaussian Splattingをマップとして用いた最初期のSLAMシステムの一つ(GS-SLAMやMonoGSと同時期)。微分可能ラスタライザを通じたRGB-Dのsplat-track-mapループであり、レンダリングされたシルエットが姿勢最適化とGaussianの密度化の両方を導く。

## 問題

密なSLAM手法は「シーンを非ボリューメトリックあるいは陰的に表現する方法によってしばしば妨げられていた」。手作りの明示的マップ(点、サーフェル、SDF)は豊富な3D特徴がある場合にのみ信頼できるトラッキングを行い、観測された表面しか説明できない。一方で陰的なラディアンスフィールドSLAM(NICE-SLAM、Point-SLAM)は高コストなレイごとのボリューメトリックサンプリングを必要とし、損失をスパースなピクセル集合に対してしか計算できない。3D Gaussian Splattingは最大400 FPSでラスタライズできるが、常に既知の姿勢を前提としていた。SplaTAM(CVPR 2024、CMU/MIT)は「3D Gaussianによるシーン表現が、単一の姿勢未知の単眼RGB-Dカメラを用いた密なSLAMを可能にすることを初めて示した」。

## 手法とアーキテクチャ

**単純化されたGaussianマップ。** シーンは*等方的*で視点独立なGaussianの集合であり、各Gaussianは8つのパラメータ(RGB色$\mathbf{c}$、中心$\boldsymbol{\mu}\in\mathbb{R}^3$、半径$r$、不透明度$o$)を持ち、$f(\mathbf{x}) = o\exp\bigl(-\tfrac{\|\mathbf{x}-\boldsymbol{\mu}\|^{2}}{2r^{2}}\bigr)$として空間に影響を与える。色、デプス、*シルエット*はいずれも、Gaussianを前から後ろへソートしてその2Dスプラットをアルファ合成することでレンダリングされる。

$$C(\mathbf{p})=\sum_{i=1}^{n}\mathbf{c}_{i}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr), \quad D(\mathbf{p})=\sum_{i=1}^{n}d_{i}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr), \quad S(\mathbf{p})=\sum_{i=1}^{n}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr),$$

ここで$f_i(\mathbf{p})$は投影された中心$\boldsymbol{\mu}^{2D} = K\,E_{t}\boldsymbol{\mu}/d$と半径$r^{2D} = fr/d$($d=(E_{t}\boldsymbol{\mu})_{z}$)を用いる。シルエット$S$は各ピクセルがどれだけのマップ的証拠を持つかを表す——マップの認識的不確実性である。

各フレームは3つのステップを実行する。

1. **カメラトラッキング。** 新しい姿勢は等速伝播$E_{t+1}=E_{t}+(E_{t}-E_{t\text{-}1})$によって初期化され、その後Gaussianを固定した状態でラスタライザを通じた勾配降下によって精緻化される。ここでは十分にマップされたピクセルのみを用いる:
$$L_{t}=\sum_{\mathbf{p}}\Bigl(S(\mathbf{p})>0.99\Bigr)\Bigl(\mathrm{L}_{1}\bigl(D(\mathbf{p})\bigr)+0.5\,\mathrm{L}_{1}\bigl(C(\mathbf{p})\bigr)\Bigr).$$
2. **Gaussianの密度化。** マスクによって、マップがまだ説明していないピクセル——低いシルエット、あるいはレンダリングされた幾何よりも手前にある真の幾何——を選ぶ:
$$M(\mathbf{p})=\Bigl(S(\mathbf{p})<0.5\Bigr)+\Bigl(D_{\mathrm{GT}}(\mathbf{p})<D(\mathbf{p})\Bigr)\Bigl(\mathrm{L}_{1}\bigl(D(\mathbf{p})\bigr)>50\,\mathrm{MDE}\Bigr),$$
   ここでMDEは中央値デプス誤差である。マスクされた各ピクセルは、そのピクセルの色、逆投影されたデプスにある中心、不透明度0.5、1ピクセル分の半径$r = D_{\mathrm{GT}}/f$を持つGaussianを生成する。
3. **マップ更新。** 姿勢を固定した状態で、Gaussianのパラメータは$k$個のキーフレーム(現在のフレーム、最新のキーフレーム、そして現在のデプス点群とのフラスタム重なりが最も大きい$k-2$個のキーフレーム)にわたって最適化され、既存のマップからウォームスタートし、シルエットマスクなしの色+デプス損失とSSIM項を用いる。ほぼ透明または過大なGaussianは削除される。

## 実験結果

- **Replica**(ATE RMSE平均、8シーン): 0.36 cm——それまでのSOTAであるPoint-SLAM(0.52)より30%以上優れ、ESLAM(0.63)、NICE-SLAM(1.06)、Vox-Fusion(3.09)よりも大幅に優れている。
- **TUM-RGBD**: 平均5.48 cmで、Point-SLAMの8.92をほぼ40%削減している(NICE-SLAMは15.87)。特徴ベースのORB-SLAM2(1.98)はスパース手法の中では依然として優位である。品質が同程度に低い元のScanNetでは、11.88 cmはPoint-SLAM(12.19)やNICE-SLAM(10.70)と同等である。
- **ScanNet++**(高品質な撮影だがフレーム間の動きが非常に大きい、1ステップあたりReplicaの約30フレーム相当): SplaTAMは両シーケンスを平均誤差1.2 cmで追跡できるのに対し、Point-SLAMとRGB-D ORB-SLAM3は完全に失敗する。新規視点合成はPSNR 24.41 dB(訓練視点では27.98)に達し、新規視点のデプスL1は約2 cmである。
- **レンダリング**: Replicaの訓練視点PSNRは34.11 dBで、NICE-SLAM(24.42)やVox-Fusion(24.41)より約10 dB高く、Point-SLAM(35.17、サンプル配置にGTデプスを使用)と同等である。マップは876x584で400 FPSでレンダリングされる。
- **実行時間**(RTX 3080 Ti、Replica R0): トラッキング25ミリ秒、マッピング1イテレーション24ミリ秒で、イテレーションごとに約120万画素のフル画像をレンダリングする——ベースラインが200〜1000画素のサンプルのみを最適化するのに対して。SplaTAM-S(イテレーション数削減版)は5倍速く(フレームあたり0.19秒+0.33秒)動作し、ATE 0.39 cmを達成する。
- **アブレーション**(Room 0): シルエットマスクを除去するとトラッキングが崩壊する(ATE 115.8 cm)。0.5の代わりに0.99の閾値を使うと誤差が5倍低くなる(1.30に対して0.27)。速度伝播なしでは10倍以上悪化する。デプスのみの損失は完全に失敗する(86.03 cm)。論文が明記する限界は、モーションブラー、大きなデプスノイズ、急激な回転への感度である。

## SLAMにおける意義

SplaTAMは3DGS SLAM研究系列の立ち上げに寄与し、明示的で微分可能なボリューメトリックマップがトラッキング、マッピング、視点合成の各面でNeRF風SLAMを対話的なレートで上回れることを示した。またレンダリングがレイマーチングではなくラスタライゼーションになれば、密な画素ごとの損失が手頃になることも示した。そのシルエットマスクは標準的な密度化・不確実性ゲーティングのツールとなり、微分可能ラスタライザを通じたトラック-マップの交互ループは、Photo-SLAM、RTG-SLAM、GS-ICP SLAM、そして多数の後続研究が土台とするテンプレートとなった。

## 関連ノート

- [MonoGS](monogs.md)
- [NICE-SLAM](nice-slam.md)
- [Point-SLAM](point-slam.md)
- [Photo-SLAM](photo-slam.md)
- [RTG-SLAM](rtg-slam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
