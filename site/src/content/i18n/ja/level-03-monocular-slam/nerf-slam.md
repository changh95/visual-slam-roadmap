# NeRF-SLAM

> Rosinol 2023 · [論文](https://arxiv.org/abs/2210.13641)

**一行要約** — 密な単眼SLAMフロントエンド(DROID-SLAM)とInstant-NGPラディアンスフィールドのバックエンドを結合し、NeRFの深度損失をSLAMの深度周辺共分散で重み付けした——リアルタイムかつ幾何的・測光的に正確な密な単眼再構成。

## 問題

最初のニューラル陰関数SLAMシステム(iMAP、NICE-SLAM)はRGB-D入力を必要としており、測光損失のみで訓練されたラディアンスフィールドは「フロータ(floaters)」——初期化不良や局所解の悪さから生じる幻影の幾何——を生じやすい。深度による教師信号を加えることでこれを取り除き、収束を高速化できる。密な単眼SLAMはその深度をリアルタイムに供給できるが、その深度マップは「密であるがゆえに極めてノイズが多く、テクスチャのない領域にさえ深度値が与えられてしまう」。NeRF-SLAMの着眼点は、密な単眼SLAMがNeRFをリアルタイムに適合させるのにまさに適した情報——正確な姿勢と*関連する不確かさ付きの*密な深度マップ——を提供できる、という点である。これにより、マップは各深度を推定器が信頼する度合いに応じてのみ信頼できる。

## 手法とアーキテクチャ

1つのGPU(RTX 2080 Ti、11GB、PyTorch + CUDA)上で2つのスレッドが並列に動作する。

**トラッキング: 共分散付き密なSLAM。** DROID-SLAMは、フレーム対間の密なオプティカルフロー$\mathbf{p}_{ij}$を、測定ごとの重み$\mathbf{\Sigma}_{\mathbf{p}_{ij}}$も出力するRAFT型ConvGRUで計算し、幾何をキーフレームごとの逆深度マップとしてパラメータ化した密なバンドル調整を解く。線形化すると、ブロック疎な系が得られる。

$$H\mathbf{x}=\mathbf{b}, \quad \begin{bmatrix} C & E \\ E^{T} & P \end{bmatrix} \begin{bmatrix} \Delta\boldsymbol{\xi} \\ \Delta\mathbf{d} \end{bmatrix} = \begin{bmatrix} \mathbf{v} \\ \mathbf{w} \end{bmatrix},$$

ここで$C$はカメラブロック、$P$は(対角の)逆深度ブロック、$E$はカメラ/深度の結合、$\Delta\boldsymbol{\xi}$は$SE(3)$姿勢更新、$\Delta\mathbf{d}$はピクセルごとの逆深度更新である。シュア補元(Schur complement)によって縮約カメラ行列$H_T$が得られ、コレスキー分解$H_T = LL^{T}$で解かれる。Rosinolらの確率的ボリューメトリック融合(WACV 2022)に従い、深度と姿勢の周辺共分散は同じ分解から得られる。

$$\mathbf{\Sigma}_{\mathbf{d}} = P^{-1} + P^{-T}E^{T}\mathbf{\Sigma}_{\mathbf{T}}EP^{-1}, \qquad \mathbf{\Sigma}_{\mathbf{T}} = (LL^{T})^{-1}.$$

**マッピング: 確率的ボリューメトリックNeRF。** Instant-NGPのハッシュグリッドラディアンスフィールドが、(スライディングウィンドウなしで)すべてのキーフレーム上でマッピング損失により訓練され、姿勢$\mathbf{T}$とネットワークパラメータ$\Theta$の両方について最小化される。

$$\mathcal{L}_{M}(\mathbf{T},\Theta) = \mathcal{L}_{\text{rgb}}(\mathbf{T},\Theta) + \lambda_{D}\,\mathcal{L}_{\text{D}}(\mathbf{T},\Theta), \qquad \lambda_D = 1.0,$$

ここで深度損失はトラッキング共分散によってマハラノビス重み付けされる。

$$\mathcal{L}_{\text{D}}(\mathbf{T},\Theta) = \|D - D^{\star}(\mathbf{T},\Theta)\|^{2}_{\Sigma_{D}},$$

そして$\mathcal{L}_{\text{rgb}} = \|I - I^{\star}(\mathbf{T},\Theta)\|^{2}$である。レンダリングされた深度は、標準的なボリュームレンダリングにおける期待されるレイ終端距離である。

$$d^{\star} = \sum_{i}\mathcal{T}_{i}\bigl(1-\exp(-\sigma_{i}\delta_{i})\bigr)d_{i}, \qquad \mathcal{T}_{i} = \exp\Bigl(-\sum_{j<i}\sigma_{j}\delta_{j}\Bigr),$$

$\sigma_i$はサンプル$i$における密度、$d_i$はその深度、$\delta_i = d_{i+1} - d_i$である。色も同様の合成で$\mathbf{c}_i$として求められる。

**スレッド間インターフェース。** トラッキングスレッドは最大8キーフレームのアクティブウィンドウを保持し、平均オプティカルフローが2.5ピクセルを超えるたびにキーフレームを生成する。新しいキーフレームが生成されるたびに、姿勢・画像・深度マップ・深度共分散をマッピングスレッドに送る——これがスレッド間の唯一の通信である。

## 実験結果

Replica(8シーン、深度L1とPSNRで評価)において、

- **本手法(単眼、自前の深度): 平均深度L1 4.49cm、PSNR 41.40dB**——正解深度*付き*のNICE-SLAM(4.08cm、24.61dB)、深度なしのNICE-SLAM(14.18cm、17.76dB)、正解深度付きのiMAP(7.64cm、6.95dB)、同じ推定深度によるTSDF-Fusion(21.88cm、7.07dB)、$\sigma$-Fusion(20.10cm、7.08dB)に対して。
- office-1では最大**PSNRで179%改善**、room-2では**深度L1で86%改善**、NICE-SLAMに対して。office-1は両指標を合わせて最良の改善(PSNR 179%、L1 80%)を示す。
- アブレーション(Cube-Diorama): 重み付けなしの生の深度教師は、共分散重み付けの場合に比べ120秒後にPSNRで4dB、L1で7cm劣る; 姿勢のみでは500秒後にL1 7.8cmだが、生の深度は4.1cmながらPSNRが3dB劣る——重み付けが両者の良さを兼ね備える。
- 実行時間: 640x480でパイプライン全体が12fps(トラッキング約15fps、マッピング約10fps)、GPUメモリ約11GB。

## SLAMにおける意義

NeRF-SLAM(Kimeraで知られるRosinolが、MITのLeonardおよびCarloneと共に発表)は、ハイブリッドなレシピを明確化した——姿勢・幾何・不確かさのための推定理論に基づくSLAMと、マップのためのニューラルフィールドは、競合するものではなく相補的であるという点である。これはiMAPの純粋主義的な「ネットワークがシステム全体である」という立場への対案であり、おそらくより影響力のある設計指針である。今日の実用的なニューラルおよびGaussian SLAMシステムの多くが、まさにこの方式で堅牢なトラッカーと微分可能なマップを組み合わせている。また、その不確かさ重み付けの深度教師は、ノイズを含む推定幾何をニューラル表現に融合するための繰り返し用いられる手法となった。

## 関連ノート

- [DROID-SLAM](droid-slam.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [GO-SLAM](go-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)
