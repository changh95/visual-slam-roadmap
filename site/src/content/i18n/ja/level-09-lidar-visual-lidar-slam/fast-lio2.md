# FAST-LIO2

> Xu 2022 · [論文](https://arxiv.org/abs/2107.06829)

**一行要約** — FAST-LIO2は、インクリメンタルなk-d木（ikd-Tree）をマップとして用いた密結合の反復カルマンフィルタ内で、生のLiDAR点を直接マップに対して位置合わせすることが、特徴ベースのLiDAR-慣性オドメトリよりも高速*かつ*高精度であることを示した。

## 問題

特徴ベースのLiDARパイプラインは、エッジ／平面抽出の過程で各スキャンの大部分を捨ててしまい、微妙な環境構造を失い、明確な特徴が乏しい場所では失敗する——この状況は、新興のソリッドステートLiDARの狭い視野によってさらに悪化する。特徴抽出器はスキャンパターン（回転式、プリズム式、MEMS式）によっても挙動が変わるため、新しいセンサごとに手作業の調整が必要になる。代わりに*すべての*生の点をレジストレーションするには、効率的なkNNクエリと実時間のインクリメンタル更新の両方をサポートする大規模な密なマップが必要になる——これがFAST-LIO2が取り除こうとした実際のボトルネックである。

## 手法とアーキテクチャ

生の点はスキャン（10〜100 ms）に蓄積され、反復カルマンフィルタによって大規模なローカルマップに位置合わせされ、直ちにマップへ統合される——オドメトリとマッピングは同じレートで動作する。

- **多様体上の状態**：$\mathcal{M} \triangleq SO(3) \times \mathbb{R}^{15} \times SO(3) \times \mathbb{R}^3$（次元24）で、$\mathbf{x} = [{}^{G}\mathbf{R}_I,\ {}^{G}\mathbf{p}_I,\ {}^{G}\mathbf{v}_I,\ \mathbf{b}_{\omega},\ \mathbf{b}_{a},\ {}^{G}\mathbf{g},\ {}^{I}\mathbf{R}_L,\ {}^{I}\mathbf{p}_L]$——ポーズ、速度、IMUバイアス、重力、そして*オンライン較正される*LiDAR-IMU外部パラメータである。IMUサンプルごとの離散伝播は $\mathbf{x}_{i+1} = \mathbf{x}_i \boxplus \left(\Delta t\, \mathbf{f}(\mathbf{x}_i, \mathbf{u}_i, \mathbf{w}_i)\right)$ で表される。
- **逆伝播によるスキュー除去**：IMU測定値を用いて各点個別のサンプリング時刻におけるLiDARのポーズを推定し、更新前にすべての点をスキャン終了時刻に投影する。
- **直接点対平面測定モデル**：グローバル座標系に投影された各測定点は、マップ上の最近傍5点にフィットした小さな平面上に乗っていなければならない。

  $$\mathbf{0} = {}^{G}\mathbf{u}_j^{\top}\left({}^{G}\mathbf{T}_{I_k}\, {}^{I}\mathbf{T}_{L}\left({}^{L}\mathbf{p}_j + {}^{L}\mathbf{n}_j\right) - {}^{G}\mathbf{q}_j\right),$$

  ここで ${}^{G}\mathbf{u}_j$ は平面の法線、${}^{G}\mathbf{q}_j$ はその平面上の点、${}^{L}\mathbf{n}_j$ は測定雑音である。特徴抽出は行わない——微妙な構造を活用でき、どのスキャンパターンでも動作する。
- **多様体上の反復更新**：現在の反復点で線形化することで残差 $\mathbf{z}_j^{\kappa}$ が得られ、MAP問題

  $$\min_{\widetilde{\mathbf{x}}_k^{\kappa}} \left( \lVert \mathbf{x}_k \boxminus \widehat{\mathbf{x}}_k \rVert_{\widehat{\mathbf{P}}_k}^2 + \sum_{j=1}^{m} \lVert \mathbf{z}_j^{\kappa} + \mathbf{H}_j^{\kappa}\widetilde{\mathbf{x}}_k^{\kappa} \rVert_{\mathbf{R}_j}^2 \right)$$

  は、ゲイン $\mathbf{K} = (\mathbf{H}^{\top}\mathbf{R}^{-1}\mathbf{H} + \mathbf{P}^{-1})^{-1}\mathbf{H}^{\top}\mathbf{R}^{-1}$ を持つ反復カルマンフィルタで解かれる——測定次元（数千点）ではなく*状態*次元（24）の行列を反転するというトリックが、直接レジストレーションを実現可能にする。$\lVert \widehat{\mathbf{x}}_k^{\kappa+1} \boxminus \widehat{\mathbf{x}}_k^{\kappa} \rVert < \epsilon$ になるまでの反復により、高速な運動下での線形化誤差に対処する。
- **ikd-Treeマッピング**：最適化されたスキャンは、*ツリー上でのダウンサンプリング*、遅延ラベルによるボックス単位の削除、並列スレッドで実行されるスケープゴート方式の部分的再バランシングをサポートするインクリメンタルk-d木に挿入される——完全な再構築も、断続的な遅延もない。マップは長さ$L$の立方体（デフォルト1000 m）をカバーし、LiDARの検出球がその境界に触れるとスライドし、外に出た点をボックス単位で削除する。

## 実験結果

- **精度**：5つの公開データセット（lili、liosam、utbm、ulhk、nclt——ソリッドステートおよび回転式LiDAR）から19系列で評価し、FAST-LIO2またはその変種が19系列中18で最良となった。例としてRMSE：liosam_1で4.58 m（対LIO-SAM 4.75 m、LILI-OM 18.78 m、LINS 880.92 m）；唯一の例外はulhk_4で、LILI-OMがわずかに上回った（2.29 m対2.57 m）。直接手法はほとんどの系列で同システムの特徴ベース版を上回った。
- **速度**：DJI Manifold 2-C（i7-8550U）上で、1スキャンあたりの総処理時間がLILI-OMの約8倍、LIO-SAMの約10倍、LINSの約6倍高速である。またARM Khadas VIM3上で10 Hzのリアルタイム動作を達成し——これはこれまでどのLIOシステムでも実証されていなかった。
- **ikd-Tree**：18系列でオクトリー、R\*木、nanoflann k-d木と比較したベンチマークで、インクリメンタル更新とkNN探索の両面で最良の総合性能を達成した。
- **ロバスト性**：クアッドロータのフリップ実験では、100 Hzオドメトリで1スキャンあたり平均2.01 msの処理時間で最大角速度1198 °/sに達した；高速なハンドヘルド走行（最大7 m/s）では81 mのループを0.06 m未満の端点誤差で閉じた。

## SLAMにおける意義

FAST-LIO2は、この分野のデフォルトを「まず特徴を抽出し、それから位置合わせする」から「すべてを高速に位置合わせする」へと転換した。そのikd-Treeは広く再利用されるオープンソースコンポーネントとなり、多様体上のiEKF formulationはフィルタベースのLiDAR-慣性オドメトリの標準的な参照設計となった。またHKU MARSエコシステムの基盤でもあり——R3LIVEおよびFAST-LIVO／FAST-LIVO2はこのLIOコア上に視覚融合を構築している——今日、純粋なLiDAR-慣性オドメトリ、特に安価なソリッドステートセンサにおける実用的な第一選択である。

## ハンズオン

- [FAST-LIO2を実行する](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/fast_lio2)

## 関連ノート

- [LOAM](loam.md) — 置き換えられた特徴ベースのパラダイム
- [LIO-SAM](lio-sam.md) — ループ閉じ込みとGPSを備えたファクタグラフ方式の代替案
- [FAST-LIVO](fast-livo.md) — 同じマップ上に直接視覚融合を追加
- [R3LIVE](r3live.md) — FAST-LIOを幾何的バックボーンとして使用
- [PIN-SLAM](pin-slam.md) — 直接LiDARレジストレーションの後継となるニューラルマップ
