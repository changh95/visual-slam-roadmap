# R3LIVE

> Lin 2022 · [論文](https://arxiv.org/abs/2109.07982)

**一行要約** — R3LIVEはLiDAR、慣性、視覚センシングを融合し、LiDAR-慣性オドメトリが大域マップの幾何構造を構築する一方で、直接法の視覚-慣性サブシステムがその上にテクスチャを描き込み、リアルタイムで密なRGB彩色点群を生成する。

## 問題

LiDARベースのSLAMは、特に小視野角のソリッドステートLiDARでは十分な幾何特徴が得られない場面で失敗し、そのマップは無彩色であるため測量、シミュレータ、その他の3Dアプリケーションでの利用が制限される。R3LIVEは、各センサーに最も得意な役割を割り振り、1つの共有マップと1つのフィルタを介してそれらを結合することで、頑健で高精度な状態推定*と*密なRGB彩色マップの両方を目指す。

## 手法とアーキテクチャ

2つのサブシステムが、29次元の状態 $\mathbf{x} \in \mathbb{R}^{29}$ を共有する。この状態にはIMU姿勢 $({^G}\mathbf{R}_I, {^G}\mathbf{p}_I)$、速度、ジャイロ/加速度バイアス、重力 ${^G}\mathbf{g}$、カメラ-IMU外部パラメータ $({^I}\mathbf{R}_C, {^I}\mathbf{p}_C)$、カメラ-IMU時間オフセット ${^I}t_C$、カメラ内部パラメータ $\boldsymbol{\phi} = [f_x, f_y, c_x, c_y]^T$ が含まれ、すべて誤差状態反復カルマンフィルタ(ESIKF)でオンライン推定される。

- **マップ**: 固定サイズのボクセル(例: $0.1$ m立方体、最近点が追加された場合は*アクティブ*とマークされる)であり、点 $\mathbf{P} = [{^G}\mathbf{p}^T, \mathbf{c}^T]^T$ — 3D位置とRGB色 — を、それぞれ共分散 $\boldsymbol{\Sigma}_{\mathbf{p}}, \boldsymbol{\Sigma}_{\mathbf{c}}$ とともに含む。
- **LIOサブシステム**(FAST-LIOに基づく): IMU逆方向積分が各スキャンのスキューを除去し、ESIKFが点-平面残差を最小化し、収束したスキャンは大域マップに追加される — この幾何構造がVIOに深度も提供する。
- **VIOサブシステム**: 特徴抽出を伴わない2段階の直接法パイプライン。
  1. *フレーム間更新*: LKオプティカルフローがマップ点の投影を追跡し、PnP再投影残差 $\mathbf{r} = \boldsymbol{\rho}_{s_k} - \boldsymbol{\pi}({^C}\mathbf{p}_s, \check{\mathbf{x}}_k)$($\boldsymbol{\pi}$内にオンライン時間オフセット補正項を含む)がESIKF更新を駆動する。
  2. *フレーム-マップ更新*: フォトメトリック残差 $\mathbf{o}(\check{\mathbf{x}}_k, {^G}\mathbf{p}_s, \mathbf{c}_s) = \mathbf{c}_s - \boldsymbol{\gamma}_s$ は、各追跡点に格納されたマップ色 $\mathbf{c}_s$ と、現在の画像から補間された色 $\boldsymbol{\gamma}_s$ を比較する — マップ色はパッチピラミッドとは異なり、カメラの回転/並進に対して不変である。
- 両方の更新は同一のMAP問題を解いており、IMU伝播による事前分布と積み重ねられた残差を組み合わせる:

$$\min_{\delta\check{\mathbf{x}}_k} \Big( \big\|\check{\mathbf{x}}_k \boxminus \hat{\mathbf{x}}_k + \boldsymbol{\mathcal{H}}\delta\check{\mathbf{x}}_k\big\|^2_{\boldsymbol{\Sigma}_{\delta\hat{\mathbf{x}}_k}} + \sum_{s=1}^{m} \big\|\mathbf{o}(\check{\mathbf{x}}_k, {^G}\mathbf{p}_s, \mathbf{c}_s) + \mathbf{H}^o_s \delta\check{\mathbf{x}}_k\big\|^2_{\boldsymbol{\Sigma}_{\boldsymbol{\beta}_s}} \Big)$$

  カルマンゲイン $\mathbf{K} = (\mathbf{H}^T\mathbf{R}^{-1}\mathbf{H} + \mathbf{P}^{-1})^{-1}\mathbf{H}^T\mathbf{R}^{-1}$(ガウス-ニュートン法と等価)で収束するまで反復される。
- **テクスチャレンダリング**: 各収束姿勢の後、アクティブなボクセル内で画像に写り込む点はベイズ更新によって色が融合される — 格納された色の共分散は(照明変化をモデル化する)ランダムウォーク項 $\boldsymbol{\sigma}_s^2 \cdot \Delta t_{\mathbf{c}_s}$ によって新しい観測とブレンドされる前に増大する。
- **追跡点の維持**: 再投影誤差またはフォトメトリック誤差が大きい点は破棄され、半径50ピクセル以内に追跡点が存在しない箇所に新しいマップ点が追加される。

## 実験結果

ハンドヘルドデバイス: Livox AVIA LiDAR(視野角 70.4°×77.2°)、FLIR Blackflyグローバルシャッターカメラ、DJI Manifold-2c(Intel i7-8550U、8 GB RAM)。

- **LiDAR退化+テクスチャレステスト**: 白い壁に向かいながら狭い「T」字型の通路を通過する(単一平面によるLiDAR制約、ほぼゼロのテクスチャ)場面で、R3LIVEは生き残り、エンドツーエンドでの並進ドリフトは4.57 cm、回転ドリフトは1.62°にとどまる(ArUcoによる地上真値)。
- **大規模キャンパスマッピング**(HKUST、1317/1524/1372/1191 mの4軌跡): 並進ドリフト0.093/0.154/0.164/0.102 m、回転ドリフト2.140/0.285/2.342/3.925°で、ループ閉じ込みモジュールなしで軌跡が閉じる。
- **RTK-GPSベンチマーク**(港湾、2シーケンス): R3LIVE-HiResは最良の相対誤差を達成する。例えばシーケンス(a)の300 mサブシーケンスで0.21°/0.17%(RRE/RTE)であり、LVI-SAMの0.43°/2.40%、VINS-Monoの0.59°/2.31%を上回る; R2LIVEやFAST-LIO2もわずかに上回る。
- **実行速度**: VIOはPC上で320×256/0.10 mマップ解像度において1フレームあたり7.01 msであり、オンボードコンピュータ上でも十分にリアルタイムである。

## SLAMにおける意義

R3LIVEは、LVIシステムにおける「LiDARから幾何、カメラからテクスチャ」というパターンを確立し、彩色されたLiDARマップに対する直接的なフォトメトリック位置合わせが、特徴ベースの視覚融合に代わる実用的なリアルタイム手法であることを示した。これは状態推定と彩色3D再構成 — デジタルツイン、点検、AR — を橋渡しするものであり、その完全なオープンソース公開(コード、メッシュテクスチャリングツール、デバイスの機械設計まで)により、R3LIVE++とFAST-LIVOが発展させていく参照設計となった。

## 関連ノート

- [FAST-LIO2](fast-lio2.md) — この系統の研究が基盤とするLiDAR-慣性コア
- [R3LIVE++](r3livepp.md) — 輝度マップとフォトメトリックキャリブレーションを追加した後継システム
- [FAST-LIVO](fast-livo.md) — 視覚もパッチを介して姿勢推定に寄与する姉妹システム
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — 融合カテゴリ
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — フォトメトリック融合の原理
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md) — ESIKFを支える誤差状態の仕組み
