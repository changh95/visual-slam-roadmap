# DreamFusion

> Poole 2023 · [論文](https://arxiv.org/abs/2209.14988)

**一行要約** — DreamFusionは、事前学習済みの2D テキスト画像拡散モデル(Imagen)を固定された事前分布として用い、Score Distillation Sampling(SDS)損失によってテキストプロンプトのみからNeRFを最適化することで、3D学習データを一切用いずにテキストから3D生成を実現する。

## 問題

テキストから画像への合成は、数十億の画像-テキストペアで学習された拡散モデルによって一変したが、このレシピを3Dに適応させるには、存在しない2つのものが必要だった。大規模なラベル付き3Dデータと、3Dデータを直接ノイズ除去する効率的なアーキテクチャである。NeRFは、3Dシーンがそのレンダリング結果に対する画像空間の損失だけを通じて最適化されるネットワークとして表現できることを示していた。DreamFusionは、固定された2D拡散モデルがその画像空間損失そのものになり得るかを問う——ピクセル空間ではなくNeRFのパラメータ空間でサンプリングを行うことで、すべての3D知識を純粋な2Dの事前分布から蒸留する。

## 手法とアーキテクチャ

**拡散事前分布。** テキスト条件付き拡散モデルは、重み付きノイズ除去目的関数

$$\mathcal{L}_{\text{Diff}}(\phi, \mathbf{x}) = \mathbb{E}_{t \sim \mathcal{U}(0,1),\, \epsilon \sim \mathcal{N}(\mathbf{0},\mathbf{I})}\big[ w(t)\, \| \epsilon_\phi(\alpha_t \mathbf{x} + \sigma_t \epsilon; t) - \epsilon \|_2^2 \big],$$

で学習され、DreamFusionは分類器フリーガイダンスによるノイズ予測 $\hat{\epsilon}_\phi(\mathbf{z}_t; y, t) = (1+\omega)\,\epsilon_\phi(\mathbf{z}_t; y, t) - \omega\,\epsilon_\phi(\mathbf{z}_t; t)$ を、異例に大きなガイダンス重み $\omega = 100$ で用いる。

**Score Distillation Sampling。** 微分可能な画像パラメータ化 $\mathbf{x} = g(\theta)$(ここではNeRFレンダラー)が、そのレンダリング結果がサンプルのように見えるよう最適化される。$\mathcal{L}_{\text{Diff}}$ をU-Netを通して微分するのは計算コストが高く条件も悪いため、U-Netのヤコビアンを省略するとSDS勾度が得られる

$$\nabla_\theta \mathcal{L}_{\text{SDS}}(\phi, \mathbf{x} = g(\theta)) \triangleq \mathbb{E}_{t,\epsilon}\Big[ w(t)\big(\hat{\epsilon}_\phi(\mathbf{z}_t; y, t) - \epsilon\big) \tfrac{\partial \mathbf{x}}{\partial \theta} \Big],$$

論文はこれが重み付き確率密度蒸留損失の勾度であることを証明している: $\nabla_\theta\, \mathbb{E}_t\big[ (\sigma_t / \alpha_t)\, w(t)\, \text{KL}\big(q(\mathbf{z}_t \mid g(\theta); y, t)\ \|\ p_\phi(\mathbf{z}_t; y, t)\big)\big]$。拡散モデルを通じた逆伝播は不要である——それはプロンプト $y$ に対してより高密度の画像を指すノイズ残差を持つ、固定された批評家として機能する。

**シェーディング付きNeRF。** 3Dのキャンバスはmip-NeRF 360の変種で、そのMLPは密度と*アルベド*を出力する: $(\tau, \boldsymbol{\rho}) = \text{MLP}(\boldsymbol{\mu}; \theta)$。これは標準的なボリュームレンダリング重み $w_i = \alpha_i \prod_{j<i}(1-\alpha_j)$、$\alpha_i = 1 - \exp(-\tau_i\|\boldsymbol{\mu}_i - \boldsymbol{\mu}_{i+1}\|)$ で合成される。表面法線は密度勾度から得られる: $\mathbf{n} = -\nabla_{\boldsymbol{\mu}}\tau / \|\nabla_{\boldsymbol{\mu}}\tau\|$。各点は、ランダムに配置された点光源 $\boldsymbol{\ell}$ によってランバートシェーディングされる:

$$\mathbf{c} = \boldsymbol{\rho} \circ \big(\boldsymbol{\ell}_\rho \circ \max(0,\ \mathbf{n} \cdot (\boldsymbol{\ell} - \boldsymbol{\mu}) / \|\boldsymbol{\ell} - \boldsymbol{\mu}\|) + \boldsymbol{\ell}_a\big).$$

アルベドをランダムに白色に置き換えることで「テクスチャなし」レンダリングが得られ、シーン内容がフラットなジオメトリに描き込まれる退化解(フラットなビルボード)を防ぐ。

**プロンプトごとの最適化ループ。** 各イテレーションは以下の手順を踏む: (1) ランダムなカメラ(仰角 $-10°$〜$90°$、全方位角、距離1〜1.5)と光源をサンプリングする; (2) シェーディングされたNeRFを64×64でレンダリングし、照明あり・アルベドのみ・テクスチャなしのレンダリングから選択する; (3) 視点依存のテキスト(「正面/側面/背面/俯瞰ビュー」)をプロンプトに追加し、固定された64×64のImagenベースモデル($w(t)=\sigma_t^2$、$t \sim \mathcal{U}(0.02, 0.98)$)でSDS勾度を計算する; (4) Distributed ShampooでNeRFの重みを更新する。15,000イテレーションは4チップのTPUv4で約1.5時間かかり、不透明度と向きの正則化項が密度場をクリーンに保つ。

## 実験結果

**CLIP R-Precision**(CLIPがレンダリング画像から正しいキャプションを検索できるか)を用いて、Dream Fieldsの153個の物体中心COCOプロンプトで、色付きレンダリングと*テクスチャなしジオメトリ*("Geo")レンダリングの両方を評価する:

| Method | B/32 Color | B/32 Geo | B/16 Color | B/16 Geo | L/14 Color | L/14 Geo |
|---|---|---|---|---|---|---|
| GT MS-COCO images | 77.1 | – | 79.1 | – | – | – |
| Dream Fields | 68.3 | – | 74.2 | – | – | – |
| CLIP-Mesh | 67.8 | – | 75.8 | – | 74.5 | – |
| **DreamFusion** | **75.1** | **42.5** | **77.5** | **46.6** | **79.7** | **58.5** |

DreamFusionは色付きレンダリングにおいて正解画像との整合性に近づく一方、ジオメトリスコアが高い唯一の手法である(CLIPで学習されたベースラインはGeoスコアが約1に崩壊し、フラットな形状にテクスチャが描き込まれていることが露見する)。アブレーションでは、視点の拡張、視点依存のプロンプト、照明、テクスチャなしレンダリングがそれぞれジオメトリを改善し、フルレンダリングでは+12.5%の改善が見られる。最適化されたモデルは任意の角度から見ることができ、再照明したり3D環境に合成したりできる。論文で示されている既知の限界: SDSはモード探索型であり、彩度過多/過度に滑らかな結果や、シード間での多様性の欠如をもたらす。

## SLAMにおける意義

DreamFusionは、それまで別々だった2つの流れ——ニューラルレンダリング(NeRF)と生成的拡散モデル——を結びつけ、そのSDS損失は後続の多数のテキストから3D生成の研究(Magic3D、ProlificDreamerなど)で即座に再利用された。SLAMにとっては、生成的な2D事前分布がもっともらしい3D構造を幻視できるという発想を確立した点が重要である。同じ仕組みは、原理的にはSLAMマップの未観測領域でテクスチャとジオメトリを補完できる。これは生成的なマップ補完とSpatial AI研究における繰り返し現れるテーマである。

## 関連ノート

- [NeRF](../level-05-deep-learning/nerf.md)
- [World Labs / Marble](world-labs-marble.md)
- [Sora / DiT](sora-dit.md)
- [Spatial AI](spatial-ai.md)
- [World model](world-model.md)
