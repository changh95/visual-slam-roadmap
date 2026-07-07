# IMU Preintegration on Manifold
> Forster 2015 · [論文](https://arxiv.org/abs/1512.02363)

**一行要約** — $SO(3)$ 多様体上でのIMU計測値の理論的に厳密なプレインテグレーションを導出し、最適化ベースのVIOが生のIMUデータを一度も再積分せずにバイアス変化を解析的に補正できるようにする。

## 問題
非線形最適化は非常に高精度なVIOを与えるが、「軌道が時間とともに成長するにつれて、リアルタイム最適化は急速に非現実的になる; この問題は、慣性計測が高いレートで得られるという事実によってさらに強調され、最適化における変数の数が急速に増大することにつながる」(要旨)。素朴な積分は世界座標系で定義されているため、区間開始時点の絶対姿勢に依存する: 最適化器がその姿勢を動かすたびに、すべての生のIMUデータを再積分しなければならない — 数百Hzでは絶望的である。Lupton の(2012年の)プレインテグレーションは脱出口を示したが、回転をベクトル空間として扱っていた; 厳密な定式化は $SO(3)$ の多様体構造を尊重し、回転雑音を正しく特徴づける必要があった。

## 手法とアーキテクチャ
IMUは、ゆっくり変動するバイアスと白色雑音によって汚染された、機体座標系の角速度と比力を計測する(式27〜28):

$$\tilde{\boldsymbol{\omega}}(t) = \boldsymbol{\omega}(t) + \mathbf{b}^g(t) + \boldsymbol{\eta}^g(t), \qquad \tilde{\mathbf{a}}(t) = \mathtt{R}_{\mathrm{WB}}^{\mathsf{T}}(t)\big(\mathbf{a}(t) - \mathbf{g}\big) + \mathbf{b}^a(t) + \boldsymbol{\eta}^a(t),$$

運動学は $\dot{\mathtt{R}}_{\mathrm{WB}} = \mathtt{R}_{\mathrm{WB}}\,\boldsymbol{\omega}^{\wedge}$、$\dot{\mathbf{v}} = \mathbf{a}$、$\dot{\mathbf{p}} = \mathbf{v}$ である。パイプラインは以下のように動作する:

- **プレインテグレーションされた計測値。** キーフレーム $i$ と $j$ の間のすべての計測値は、フレーム $i$ を基準として、積分時刻におけるバイアス推定値 $\mathbf{b}_i$ を用いて一度だけ合成される:

$$\Delta\tilde{\mathtt{R}}_{ij} \doteq \prod_{k=i}^{j-1} \mathrm{Exp}\big((\tilde{\boldsymbol{\omega}}_k - \mathbf{b}^g_i)\Delta t\big), \qquad \Delta\tilde{\mathbf{v}}_{ij} \doteq \sum_{k=i}^{j-1} \Delta\tilde{\mathtt{R}}_{ik}\,(\tilde{\mathbf{a}}_k - \mathbf{b}^a_i)\Delta t,$$

  そして $\Delta\tilde{\mathbf{p}}_{ij}$ は類似の二重和から得られる — これらの量は計測値と $\mathbf{b}_i$ にのみ依存し、絶対状態には依存しない。
- **正しい回転雑音の扱い。** $\mathrm{Exp}$ の一次展開と随伴性を用いると、合成された回転は計測値と雑音の積に分解される: $\Delta\mathtt{R}_{ij} = \Delta\tilde{\mathtt{R}}_{ij}\,\mathrm{Exp}(-\delta\boldsymbol{\phi}_{ij})$、ここで $\delta\boldsymbol{\phi}_{ij}$ は $SO(3)$ の接空間に存在し、右ヤコビアン $\mathtt{J}_r^k$ を含む。これにより測定モデル(式38)が得られる:

$$\Delta\tilde{\mathtt{R}}_{ij} = \mathtt{R}_i^{\mathsf{T}}\mathtt{R}_j\,\mathrm{Exp}(\delta\boldsymbol{\phi}_{ij}), \quad \Delta\tilde{\mathbf{v}}_{ij} = \mathtt{R}_i^{\mathsf{T}}(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\Delta t_{ij}) + \delta\mathbf{v}_{ij}, \quad \Delta\tilde{\mathbf{p}}_{ij} = \mathtt{R}_i^{\mathsf{T}}\big(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\Delta t_{ij}^2\big) + \delta\mathbf{p}_{ij},$$

  ここで雑音ベクトル $[\delta\boldsymbol{\phi}_{ij}, \delta\mathbf{v}_{ij}, \delta\mathbf{p}_{ij}]$ は一次までは平均ゼロのガウス分布であり、共分散 $\mathbf{\Sigma}_{ij}$ は反復的に伝播される。
- **再積分なしのバイアス補正。** 最適化器がバイアスを $\delta\mathbf{b}$ だけ更新すると、差分計測値は再積分の代わりに、事前計算された一定のヤコビアンで補正される(式44):

$$\Delta\tilde{\mathtt{R}}_{ij}(\mathbf{b}^g_i) \simeq \Delta\tilde{\mathtt{R}}_{ij}(\bar{\mathbf{b}}^g_i)\,\mathrm{Exp}\!\Big(\tfrac{\partial\Delta\bar{\mathtt{R}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g\Big), \qquad \Delta\tilde{\mathbf{v}}_{ij} \simeq \Delta\tilde{\mathbf{v}}_{ij}(\bar{\mathbf{b}}_i) + \tfrac{\partial\Delta\bar{\mathbf{v}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g + \tfrac{\partial\Delta\bar{\mathbf{v}}_{ij}}{\partial\mathbf{b}^a}\delta\mathbf{b}^a.$$

- **プレインテグレーションされたIMU因子。** 1つの9自由度残差 $\mathbf{r}_{\mathcal{I}_{ij}} = [\mathbf{r}_{\Delta\mathtt{R}_{ij}}, \mathbf{r}_{\Delta\mathbf{v}_{ij}}, \mathbf{r}_{\Delta\mathbf{p}_{ij}}]$ が連続するキーフレーム状態を制約する。例えば $\mathbf{r}_{\Delta\mathtt{R}_{ij}} = \mathrm{Log}\big(\big(\Delta\tilde{\mathtt{R}}_{ij}(\bar{\mathbf{b}}^g_i)\,\mathrm{Exp}(\tfrac{\partial\Delta\bar{\mathtt{R}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g)\big)^{\mathsf{T}}\mathtt{R}_i^{\mathsf{T}}\mathtt{R}_j\big)$ であり — これは再投影残差と完全に並行しており、すべてのヤコビアンが解析的な形で得られる。
- **構造レスな視覚因子を持つファクターグラフバックエンド。** IMU因子は、iSAM2で解かれるファクターグラフ上のMAP推定に組み込まれる; 視覚ランドマークは閉形式で消去される(構造レス射影因子)。これは「3D点に対する最適化を回避し、計算をさらに高速化する」 — 固定ラグフィルタリングの代わりにリアルタイムの完全なスムージングを実現する。

## 実験結果
- **シミュレーション:** 正弦波状の垂直運動を伴う120 mの円軌道上で50回のモンテカルロ解析を行い、プレインテグレーションモデル(iSAM2で解かれる)の精度と整合性を確認した。
- **屋内(430 mの軌道、VI-Sensor: ADIS16448 IMU、800 Hz、カメラ20 Hz、Vicon地上真値):** フルパイプライン(SVOフロントエンド+プレインテグレーション+構造レス因子+iSAM2)は、**移動距離360 mあたり平均0.3 mのドリフト**を達成し、OKVISとMSCKFはいずれも0.7 mであり、ヨードリフトも顕著に少ない。
- **実行時間(Intel i7、2.4 GHzノートPC):** iSAM2の平均更新10 ms(10回のイテレーション、完全なMAP); SVOフロントエンドはフレームあたり約3 ms。対照的にOKVISは線形化点が変わるたびにIMU積分を繰り返す必要がある。
- **屋外 vs Google Tango:** オフィスビル周りでのエンドツーエンドのループ誤差は1.5 m(Tangoは2.2 m); 3階建ての軌道では0.5 m(Tangoは1.4 m)。
- IEEE TRO(2017年掲載; arXiv 2015年)に掲載; プレインテグレーションされたIMU因子と構造レス視覚因子の参照実装はGTSAMに搭載されている。

## SLAMにおける意義
これは、現代のほぼすべての最適化ベースVIOの基盤となる理論である: VINS-Mono、ORB-SLAM3、Kimera-VIO、Basalt、OKVIS2はいずれも、IMU因子にForster方式のオンマニフォルド・プレインテグレーションを用いている。これはLuptonの元のプレインテグレーションのアイデアを正しい多様体上の扱いによってアップグレードし — オイラー角の特異点を回避し — 高レートの慣性計測をキーフレームレートの非線形最適化と互換にした。VIO理論の一部を自分の手で実装するなら、これを実装せよ。

## 関連ノート
- [IMU preintegration](imu-preintegration.md) — 周辺のコンテキストを含む概念ノート。
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md) — オンマニフォルド状態推定の関連リファレンス。
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — 数学的な道具立て($\mathrm{Exp}/\mathrm{Log}$、ヤコビアン)。
- [VINS-Mono](vins-mono.md) — これらのIMU因子の上に構築された広く使われているシステム。
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — この論文が組み合わせているiSAM2バックエンド。
- [IMU noise model](imu-noise-model.md) — 共分散伝播に入力される雑音項の出所。
