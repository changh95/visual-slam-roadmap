# InstantSfM

> Zhong 2025 · [論文](https://arxiv.org/abs/2510.13310)

**一行要約** — 完全にGPU上で動作し、PyTorchと互換性のある疎性を活用した最適化を用いるグローバルSfMパイプラインであり、大規模シーンにおいてCOLMAPに対し最大約40倍の高速化を、同等の精度で達成する。

## 問題

成熟したSfMシステムは依然としてCPU中心であり、従来型の最適化ツールチェーン(Ceres系ソルバー)の上に構築されているため、「現代的なGPUベース・学習駆動型パイプラインとの隔たりが拡大」し、スケーラビリティを制限している — 大規模なコレクションは数時間から数日かかることもある。GPU加速されたバンドル調整は並列疎最適化の可能性を示していたが、それを*完全な*グローバルSfMシステムへ拡張することは、未解決の2つの問題によって阻まれていた: メトリックスケールの復元と、数値的頑健性(外れ値除去によってカメラ/点の制約が不足し、階数不足の正規方程式が生じてLevenberg–Marquardtソルバーを破綻させる可能性がある)である。InstantSfMはその完全なシステムを構築する。

## 手法とアーキテクチャ

InstantSfMは(GLOMAPのような)グローバルパラダイムに従う: 回転平均化、続いて**グローバル位置決め(GP)**、そして**バンドル調整(BA)** — すべての段階がGPU上のPyTorchで疎ヤコビアンとともに実装される。GPは、回転済みのレイ方向 $\mathbf{v}_{ij}$ から、点 $\mathbf{X}_j$、カメラ中心 $\mathbf{t}_i$、および観測ごとのスケール $s_{ij}$ を同時に推定する:

$$\boldsymbol{\theta}=\arg\min_{\mathbf{X},\mathbf{t},s}\sum_{i=1}^{C}\sum_{j=1}^{P}\rho\left(\|\mathbf{v}_{ij}-s_{ij}(\mathbf{X}_{j}-\mathbf{t}_{i})\|^{2}_{2}\right)$$

続いてBAは、再投影誤差 $\mathbf{r}_{ij}=\Pi(\boldsymbol{\zeta}_{i},\mathbf{X}_{j},\mathbf{K}_{i})-\mathbf{x}_{ij}$ を最小化することで、姿勢 $\boldsymbol{\zeta}_i$、内部パラメータ $\mathbf{K}_i$、点を精緻化する。両者はLMステップ $(\mathbf{J}^{\top}\mathbf{J}+\lambda\operatorname{diag}(\mathbf{J}^{\top}\mathbf{J}))\Delta\boldsymbol{\theta}=-\mathbf{J}^{\top}\mathbf{r}$ によって解かれ、BAのヤコビアン $\mathbf{J}\in\mathbb{R}^{2CP\times(7C+3P)}$ はブロック疎形式で保持・操作される。以下の2つの貢献がこれを完全なシステムにしている:

- **深度制約付きヤコビアン構造。** GPのスケール $s_{ij}$ は、カメラ$i$から見た $\mathbf{X}_j$ の逆深度に正確に対応する。メトリック深度 $\hat{d}_{ij}$ が(RGB-Dまたは単眼深度モデルにより)存在する場合、これは $s_{ij}=1/\hat{d}_{ij}$ に固定され、そのヤコビアン列が削除される。$\partial\mathbf{u}_{ij}/\partial\mathbf{t}_{i}=s_{ij}\mathbf{I}$ であるため、固定された観測は共有カメラ中心にメトリックスケールの勾配を課し、$\mathbf{J}^{\top}\mathbf{J}$ がこれらを自由なスケールと結合する — メトリックスケールは事後的なアラインメントによってではなく、ソルバーの*内部で*シーン全体に伝播する。BAでは、追加の逆深度残差が加えられる:

$$\mathbf{r}^{d}_{ij}=\frac{1}{\text{Depth}(\boldsymbol{\zeta}_{i},\mathbf{X}_{j},\mathbf{K}_{i})}-\frac{1}{\hat{d}_{ij}},\qquad \boldsymbol{\theta}=\arg\min\sum_{i,j}\rho\left(\mathbf{r}_{ij}+\lambda_{d}\mathbf{r}^{d}_{ij}\right)$$

  無効な深度ピクセル(空、鏡面反射)は二値マスク $m_{ij}$ によって処理され、参照値を $\tilde{d}^{-1}_{ij}=m_{ij}\cdot\hat{d}_{ij}^{-1}$ とすることで、この項は単一の一様なGPU演算内で再投影のみの項に縮退する — 観測ごとに分岐するスレッドダイバージェンスは発生しない。
- **動的パラメータ抽出による頑健な外れ値除去。** すべてのLMイテレーションにおいて、観測は幾何的妥当性($\mathcal{O}_{\text{valid}}=\{(i_{c},i_{p})\mid z_{i_{c},i_{p}}>0.1\}$、視野内であること)について再チェックされ、少なくとも1つの有効な観測を持つカメラ/点のみが(GPUの`torch.unique`とインデックス再マッピングにより)縮約されたパラメータベクトル $\hat{\mathbf{x}}$ にコンパクト化される。この構成により、$\hat{\mathbf{J}}$ には全ゼロの列が存在しないため、多数の点が一時的に無効であっても正規方程式は(ゲージを除いて)フルランクを維持する。更新は前処理付き共役勾配法によって計算され、元の空間に散布される。点は幾何が更新されるにつれて有効/無効の間を遷移でき、これはワンショットの前処理フィルタや残差を単に重み下げするだけのロバストカーネルとは異なる。

## 実験結果

- **実行時間**: 100~5,000枚(MipNeRF360+ダウンサンプリングした1DSfM)のシーンにおいて、COLMAPに対し1.5~40倍、GLOMAPに対し最大12倍の高速化。GPU加速版Ceresを用いたCOLMAP/GLOMAPと比較しても: Alamoで597秒 vs 12,855秒(COLMAP)、1,600秒(GLOMAP); Union_Squareで571秒 vs 4,697/966秒。
- **MipNeRF360(新規視点合成の評価指標)**: COLMAP、GLOMAP、VGGSfMの中で全体最良の性能。特に、GLOMAPが`kitchen`で起こす致命的な失敗(PSNR 27.79 vs 16.11)を回避する。
- **ScanNet**: COLMAPとGLOMAPはほとんどのシーンで失敗する(ビューグラフキャリブレーションでのCeresの発散、不完全な再構成)一方、InstantSfMは全シーンで成功し、深度事前情報によりさらに改善する。**ScanNet++**では平均チャンファー距離2.61を達成し、GLOMAPの3.80を上回る。
- DTU(構造化光による正解データ)でも評価。コード: [github.com/cre185/InstantSfM](https://github.com/cre185/InstantSfM)。

## SLAMにおける意義

オフラインSfMはSLAM研究を支える実働馬であり、疑似正解軌跡やキャリブレーション、NeRF/3DGSや学習ベースSLAMシステムの学習に使う姿勢付き画像を生成する — それを1桁高速化することは、そのエコシステムのあらゆる反復ループを短縮する。InstantSfMは、COLMAPが標準化した遅い逐次型CPUパイプラインからの脱却(GLOMAPのグローバル定式化に続く形で)を継続するものであり、そのヤコビアン内深度事前情報のトリックは、学習された事前情報を古典的推定に置き換えるのではなく融合させる、きれいな実例である。動的パラメータ抽出のアイデア — 各イテレーションで問題を再構成し正規方程式のフルランクを保つ — は、GPU常駐型のあらゆるSLAMバックエンドで広く有用である。

## 関連ノート

- [COLMAP](colmap.md)
- [GLOMAP](glomap.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [VGGT](vggt.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Depth Anything](../level-05-deep-learning/depth-anything.md)
