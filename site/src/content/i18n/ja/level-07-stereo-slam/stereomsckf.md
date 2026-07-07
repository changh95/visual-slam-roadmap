# StereoMSCKF

> Sun 2018 · [論文](https://arxiv.org/abs/1712.00036)

**一行要約** — StereoMSCKF(S-MSCKF)はフィルタベースのMSCKF VIOフレームワークをステレオカメラに適応させ、単眼手法と同等の計算コストでありながら、はるかに高い頑健性を提供し、組み込みプロセッサ上での高速な自律MAV飛行を可能にする。

## 問題

視覚支援型慣性オドメトリはすでに成熟していたが、サイズと重量の制約から高品質センサーや高性能プロセッサを使えないマイクロ航空機(MAV)による自律飛行にとって、計算効率と頑健性は依然として未解決の課題だった。捜索救助任務におけるMAVは、激しい照明変化、低テクスチャ、突風による急な姿勢変化に見舞われる — VIOは頑健でなければならないが、同時に計画・制御と搭載計算機を共有しつつCPUスパイクを起こしてはならない。従来のステレオ視覚慣性ソリューションは計算コストが高く最適化ベースだった。S-MSCKFは、ステレオが単眼よりはるかに高コストであるはずだという通説に反論し、GPU加速なしで搭載機上で動作する初のオープンソースなフィルタベースのステレオVIOを実現した。

## 手法とアーキテクチャ

**フロントエンド(計算量の約80%)。** FASTコーナーをKLTオプティカルフローで時間方向に追跡し — 珍しいことに — 左右のステレオマッチングにも記述子の代わりにKLTを用いる。これは、記述子ではわずかな精度向上のためにCPUコストがはるかに高くなることを著者らが確認したためである。外れ値は、時間的トラックに対する2点RANSACと、前後のステレオペアにわたる周回マッチング(circular matching)によって除去される。実験的には、20cmのベースラインでは深度1m以上の特徴が信頼性高くマッチする。

**フィルタ状態。** EKFは、IMU状態(カメラ-IMU外部パラメータを含む)と$N$個のカメラ位置のスライディングウィンドウを推定する:

$$\mathbf{x}_{I}=\left({}^{I}_{G}\mathbf{q}^{\top}\;\; \mathbf{b}_{g}^{\top}\;\; {}^{G}\mathbf{v}^{\top}_{I}\;\; \mathbf{b}_{a}^{\top}\;\; {}^{G}\mathbf{p}^{\top}_{I}\;\; {}^{I}_{C}\mathbf{q}^{\top}\;\; {}^{I}\mathbf{p}^{\top}_{C}\right)^{\top}$$

ここで${}^{I}_{G}\mathbf{q}$はワールド座標系からIMUへの回転、${}^{G}\mathbf{v}_I,{}^{G}\mathbf{p}_I$は速度・位置、$\mathbf{b}_g,\mathbf{b}_a$はジャイロ・加速度計バイアスである。誤差状態表現($\delta\mathbf{q}\approx(\tfrac12\,{}^{G}_{I}\tilde{\boldsymbol\theta}^\top\;\;1)^\top$)は姿勢の不確かさを3次元に保つ。伝播にはIMU力学$\dot{\tilde{\mathbf{x}}}_I=\mathbf{F}\tilde{\mathbf{x}}_I+\mathbf{G}\mathbf{n}_I$の4次Runge-Kutta積分を用いる。

**ステレオ計測モデル。** カメラ位置$i$で観測された各特徴$f_j$は、両ビューを縦に並べた4次元の計測を提供する:

$$\mathbf{z}_{i}^{j}=\left(u_{i,1}^{j}\;\; v_{i,1}^{j}\;\; u_{i,2}^{j}\;\; v_{i,2}^{j}\right)^{\top},$$

これは左カメラフレーム($C_{i,1}$)と右カメラフレーム($C_{i,2}$)における特徴位置の射影である。$\mathbb{R}^3$ではなく$\mathbb{R}^4$として保持することで、ステレオ整列の必要がなくなる。トラックが終了すると、特徴位置${}^{G}\mathbf{p}_j$が最小二乗法で三角測量され、縦に並んだ残差が$\mathbf{r}^{j}=\mathbf{H}_{\mathbf{x}}^{j}\tilde{\mathbf{x}}+\mathbf{H}_{f}^{j}\,{}^{G}\tilde{\mathbf{p}}_{j}+\mathbf{n}^{j}$として線形化され、特徴は$\mathbf{H}_f^j$の零空間$\mathbf{V}$を通じて消去される:

$$\mathbf{r}^{j}_{o}=\mathbf{V}^{\top}\mathbf{r}^{j}=\mathbf{H}_{\mathbf{x},o}^{j}\tilde{\mathbf{x}}+\mathbf{n}^{j}_{o}$$

これにより、ランドマークは状態に一切現れない — structureless MSCKFのトリックであり、今回はステレオ幾何によって単一フレームからメトリック深度が供給される。

**整合性とマージナライズ。** VIOには4つの不可観測方向(グローバル位置とヨー)が存在する。素朴なEKFは偽のヨー情報を得てしまう。S-MSCKFはFEJよりも観測可能性制約付きEKF(OC-EKF)を選んでいる。これは初期化の精度への依存が少ないためである。MSCKFのようにポーズの1/3を一度にマージナライズする(CPUスパイクを生む)代わりに、相対運動に基づくキーフレームに似た2方向戦略により、2つのカメラ状態を1回の更新ごとに交互に除去する。

## 実験結果

- **EuRoC**(20Hzステレオ、200Hz IMU)、OKVIS(ステレオ最適化)、ROVIO(単眼フィルタ)、VINS-Mono(単眼最適化)との比較、各5回実行: ROVIOがmachine-hallシーンでより大きくドリフトすることを除けば、4手法の精度は似通っている。S-MSCKFは`V2_03_difficult`でのみ失敗し、この場合はステレオ画像間の継続的な輝度不整合がKLTステレオマッチングを破綻させる。フィルタベース手法はCPU使用量が最も少なく、S-MSCKFのフィルタ自体は20Hzで1コアの約10%を使用し、総計算量の約80%はフロントエンドに集中する。
- **Fast flight dataset**(公開データセット): 空港の跑道上で最高速度5, 10, 15, 17.5 m/sの4回の走行(40Hz、960×800ステレオ、200Hz IMU)。S-MSCKFはOKVISおよびVINS-Monoと同程度の精度(GPSに対するx-y RMSE)を保ちながら最も低いCPU使用率を達成した。ROVIOは大きなスケールドリフトのため除外された。
- **自律飛行**: 樹木地帯、倉庫入口、帰還を通した完全な搭載推定 — 往復700mにわたり、最終ドリフトは約3m、移動距離の0.5%未満であり、屋内屋外の照明変化にもかかわらずこの結果を達成した。
- オープンソース公開: `KumarRobotics/msckf_vio`。

## SLAMにおける意義

S-MSCKFは、標準的なステレオフィルタベースVIOのレシピを確立した: 瞬時の深度を得るためのステレオKLTフロントエンド、効率のためのstructureless MSCKFバックエンド、整合性のためのOC-EKF。計算資源が限られた空中ロボットにおいて、うまく設計されたEKFが最適化ベースのシステムに一部のコストで匹敵し得ることを具体的に示し、この妥協は後にOpenVINSによって体系化された。あなたのプラットフォームが小型ドローンや組み込みボードであれば、このMSCKF → S-MSCKF → OpenVINSという系譜が通常の出発点である。

## 関連ノート

- [MSCKF](../level-06-vio-vins/msckf.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [OKVIS](../level-06-vio-vins/okvis.md)
- [ROVIO](../level-06-vio-vins/rovio.md)
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md)
- [Scale observability](scale-observability.md)
