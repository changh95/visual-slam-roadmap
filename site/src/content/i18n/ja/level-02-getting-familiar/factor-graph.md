# Factor graph

**ファクタグラフ（factor graph）**は、SLAM問題を記述するための標準的な現代的手法である。これは、2種類のノードを持つ二部グラフ $\mathcal{G} = (\mathcal{V}, \mathcal{F}, \mathcal{E})$ である。

- **変数ノード** $\mathcal{V}$: 推定すべき未知量 — ロボットの姿勢$T_i$、地図点（ランドマーク）$\mathbf{X}_j$、IMUバイアス$\mathbf{b}$、外部パラメータ、時刻オフセットなど。
- **ファクタノード** $\mathcal{F}$: 変数の部分集合に対する確率的制約 — 事前分布ファクタ、オドメトリファクタ、ランドマーク観測（再投影）ファクタ、IMUプリインテグレーションファクタ、ループ閉じ込みファクタなど。
- **エッジ** $\mathcal{E}$: 各ファクタを、それが関与する変数に正確に接続する。

このグラフは、すべての変数の結合確率が局所的なファクタの積にどのように分解されるかを符号化する。

$$
p(\mathcal{V}) \propto \prod_{f \in \mathcal{F}} f(\mathcal{V}_f)
$$

ここで $\mathcal{V}_f$ はファクタ $f$ に接続された変数である。ガウス雑音のもとでは、各ファクタは何らかの残差関数 $\mathbf{r}_f$ に対して $f(\mathcal{V}_f) \propto \exp\left(-\tfrac{1}{2}\|\mathbf{r}_f(\mathcal{V}_f)\|^2_{\Sigma_f}\right)$ という形を持つ。したがって、この積の負の対数を取ると、MAP推定はこのレベルの他項目で扱っているまさにその疎な非線形最小二乗問題に帰着する — 各ファクタは1つの二乗された、共分散で重み付けされた残差項になる。

## おもちゃのSLAMファクタグラフ

3つの姿勢、2つのランドマーク。

```
 prior
   |
  x0 ---odom--- x1 ---odom--- x2
   \           /  \           /
    \         /    \         /
    proj   proj    proj   proj
      \     /        \     /
       [l0]           [l1]
```

ファクタのリストは、$x_0$に対する1つの事前分布ファクタ（ゲージを固定する）、連続する姿勢間の2つのオドメトリファクタ、そして1つの姿勢を1つのランドマークに結びつける4つの投影ファクタである。疎性を読み取るのは容易である。$x_0$は$x_2$と直接相互作用することはなく、$l_0$は$l_1$と相互作用することはない — ヘッセ行列にはそこにゼロブロックがある。ここで、ロボットが後のある姿勢で$x_0$の近くに戻ってきたと想像してみよう。その姿勢と$x_0$の間の**ループ閉じ込みファクタ**は追加のエッジ1本にすぎず、推定器の仕組みは変わらない。

## 一般的なファクタの種類

| ファクタ | 接続対象 | 残差の内容 |
|---|---|---|
| 事前分布（Prior） | 1つの変数 | 固定された事前値からの偏差 |
| Between/オドメトリ | 2つの姿勢 | 相対姿勢観測における誤差 |
| 投影（再投影） | 姿勢+ランドマーク | ピクセル誤差 $\mathbf{z} - \pi(T\mathbf{X})$ |
| IMUプリインテグレーション | 姿勢+速度+バイアス | プリインテグレーションされた相対運動の誤差 |
| ループ閉じ込み | 2つの非連続な姿勢 | 認識された相対姿勢における誤差 |
| GPS/絶対位置 | 1つの姿勢 | 計測位置からの偏差 |

この表現の強力さは、**グラフ構造がそのまま疎性構造になる**という点にある。各観測は1つの姿勢と1つのランドマークのみに関与し、オドメトリは連続する姿勢のみを接続する。グラフはこの局所性を明示的にし、その結果得られるヤコビ行列/ヘッセ行列の疎性こそが、ソルバーが数千の姿勢と数十万のランドマークを持つ問題を扱えるようにするものである。また、この表現は素晴らしく構成的でもある。センサーを追加することは、推定器を再設計することではなく、新しいファクタの種類を追加することを意味する。ポーズグラフは、すべての変数が姿勢であり、すべてのファクタが相対姿勢制約であるという特殊な場合にすぎない。

## コードで見る

主要なライブラリはこの言葉を直接話す。

- **GTSAM**（Georgia Tech Smoothing and Mapping） — ファクタグラフをファーストクラスのAPIとして持ち、逐次ソルバーiSAM2を備える。VIOに優れている。
- **g2o** — 頂点/エッジという同じ考え方の定式化。ORB-SLAMやLSD-SLAMで使われている。
- **Ceres Solver** — 汎用の非線形最小二乗ライブラリ。「グラフ」は残差ブロックの集合として暗黙的に組み立てられる。

上記のおもちゃのグラフを、GTSAMのPython APIで書くと次のようになる。

```python
import gtsam

graph = gtsam.NonlinearFactorGraph()
graph.add(gtsam.PriorFactorPose2(0, gtsam.Pose2(0, 0, 0), prior_noise))
graph.add(gtsam.BetweenFactorPose2(0, 1, gtsam.Pose2(1, 0, 0), odom_noise))
graph.add(gtsam.BetweenFactorPose2(1, 2, gtsam.Pose2(1, 0, 0), odom_noise))
# ... projection / bearing-range factors for landmarks ...
result = gtsam.LevenbergMarquardtOptimizer(graph, initial_values).optimize()
```

コードそのものが*グラフ*である。`add`の呼び出しの一つ一つがファクタノードであり、整数のキー一つ一つが変数ノードである。

## SLAMにおける意義

ファクタグラフは、かつては別々の問題設定として扱われていたもの — フィルタリング、ポーズグラフ最適化、バンドル調整、センサーフュージョン — を1つの図に統合した。すなわち、変数を定義し、ファクタを接続し、解く、というものである。あなたが出会うあらゆる現代的なバックエンド（ORB-SLAMのBA、VINS-Monoのスライディングウィンドウ、KimeraのiSAM2スマザー、LIO-SAMのLiDAR慣性グラフ）は、特定の変数、ファクタ、解法スケジュールの選択を持つファクタグラフである。あるシステムの*ファクタグラフを描く*ことを学ぶことは、そのSLAM論文のバックエンドを理解する最も速い方法である。

## ハンズオン

- [g2o hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_13)
- [GTSAM hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_14)

## 関連ノート

- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Pose graph optimization](pose-graph-optimization.md)
- [Incremental smoothing (iSAM/iSAM2)](incremental-smoothing.md)
- [Marginalization](marginalization.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [Robust pose-graph optimization](robust-pose-graph-optimization.md)
