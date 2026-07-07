# 数値計算ライブラリ

事実上すべてのC++製SLAMシステムの数値的な基盤を成しているのは4つのライブラリである:線形代数のための**Eigen**、そして非線形最小二乗最適化のための**Ceres Solver / g2o / GTSAM**である。どれがどれかを知り、システムの選択がいつ重要になるかを理解することは、SLAMの基本的な素養である。

**Eigen。** SLAMにおける*唯一の*線形代数ライブラリと言ってよい:すべての行列/ベクトル演算、分解(SVD、QR、コレスキー)、線形ソルバー。ヘッダーオンリーで、テンプレートによって大幅に最適化されているため、よく書かれたEigenコードはベクトル化された機械語コードにコンパイルされる。頻繁に使う型は `Eigen::Matrix3d`、`Eigen::Vector3d`、`Eigen::Isometry3d`(剛体変換)、`Eigen::Quaterniond`、そして `Eigen::Map`(コピーせずに生バッファをラップする)である。

```cpp
Eigen::Isometry3d T_wc = Eigen::Isometry3d::Identity();
T_wc.rotate(Eigen::AngleAxisd(0.1, Eigen::Vector3d::UnitZ()));
T_wc.pretranslate(Eigen::Vector3d(1.0, 0.0, 0.0));

Eigen::Vector3d p_c = T_wc.inverse() * p_w;   // world point into camera frame
```

誰もが一度は引っかかる実用的な小知識:固定サイズのEigenメンバーはアラインメントされたメモリ割り当てを必要とし(`EIGEN_MAKE_ALIGNED_OPERATOR_NEW`)、依存関係間でEigenのバージョンが混在するとビルドが苦しくなる — これがSLAMでDockerが好まれる大きな理由の一つである。

**Ceres Solver。** Googleの汎用非線形最小二乗フレームワーク。残差をテンプレート化されたコスト関手として定義すれば、Ceresが**自動微分**(手動でヤコビアンを導出する必要がない)、ロバスト損失関数、回転や姿勢のための多様体/ローカルパラメータ化サポート、そして一連の疎ソルバーを提供してくれる。共通のパターンは以下の通り。

```cpp
struct ReprojectionError {
  ReprojectionError(double u, double v) : u_(u), v_(v) {}

  template <typename T>
  bool operator()(const T* const pose, const T* const point, T* residual) const {
    // rotate+translate point by pose, project to pixel (pu, pv), then:
    // residual[0] = pu - T(u_);  residual[1] = pv - T(v_);
    return true;
  }
  double u_, v_;
};

problem.AddResidualBlock(
    new ceres::AutoDiffCostFunction<ReprojectionError, 2, 6, 3>(
        new ReprojectionError(u, v)),
    new ceres::HuberLoss(1.0), pose, point);
```

バンドル調整や姿勢グラフ最適化に用いられる。VINS-Monoのスライディングウィンドウ・バックエンドはCeresベースであり、残差が特殊で自動微分に計算を任せたい場合の既定の選択肢である。ソルバーの選択は重要だ:バンドル調整には `DENSE_SCHUR`(カメラ/ランドマークのブロック構造を利用する)、姿勢グラフには `SPARSE_NORMAL_CHOLESKY`。

**g2o。** 「General Graph Optimization」— 明示的にグラフ形状のAPIを持つ:**頂点(vertices)** は状態変数(姿勢、3D点)、**エッジ(edges)** は制約(観測、オドメトリ、ループクロージング)であり、疎コレスキーで解かれる。これはORB-SLAM(全バージョン)とLSD-SLAMのバックエンドである — ORB-SLAMのBAは文字通り `VertexSE3Expmap` の姿勢頂点と `EdgeSE3ProjectXYZ` の再投影エッジであり、g2oの頂点/エッジ定義を読めることはこれらのコードベースを読む前提条件である。ヤコビアンは通常手動で導出される(数値微分をフォールバックとして使う場合もある)ため、実行時は速いが記述には手間がかかる。

**GTSAM。** Georgia Tech Smoothing and Mapping — 変数消去、ベイズ木、リアルタイム平滑化のための**iSAM2増分ソルバー**という、最も理論的な系譜が強いファクターグラフライブラリ。高品質な組み込みファクター(IMUプリインテグレーション、投影ファクター、スマート/構造レスファクター)とPythonラッパーを備えている。

```cpp
gtsam::NonlinearFactorGraph graph;
graph.addPrior(X(0), gtsam::Pose3(), priorNoise);
graph.emplace_shared<gtsam::BetweenFactor<gtsam::Pose3>>(X(0), X(1), odom, odomNoise);

gtsam::ISAM2 isam;
isam.update(graph, initialValues);        // incremental smoothing step
gtsam::Values estimate = isam.calculateEstimate();
```

GTSAMはVIOやロボティクス推定の世界を席巻している:Kimera-VIOやLIO-SAMはこれを基盤にしている。

## 選び方

| 必要なもの | 使うべきもの |
|---|---|
| どこでも必要な行列演算 | Eigen(必須) |
| カスタム残差、自動微分、バッチBA | Ceres |
| ORB-SLAM式のグラフBA / PGO | g2o |
| 増分平滑化、IMUファクター、VIO | GTSAM |

持っておくべき性能に関する直感:自動微分は手動で導出した解析的ヤコビアンよりも1回の反復あたりのコストがやや高いが、導出ミスというバグの一クラス全体を排除できる。疎な線形ソルバーの選択(シュア vs. 単純な疎コレスキー)の方が通常、自動微分か解析的かという問題より重要である。そして3つの最適化エンジンはいずれも最終的に同じ減衰付き正規方程式を解いている — 違いはAPI、分解戦略、エコシステムであり、基礎となる数学ではない。

## SLAMにおける意義

あなたが学ぶすべてのシステムのバックエンドは、これらのライブラリのいずれかを用いて書かれており、そのAPIが論文の思考の仕方を形作っている:「ファクターを追加する」「エッジを定義する」「ロバストカーネルを取り付ける」。これらに堪能であれば、どのシステムの最適化コードも読めるようになり、新しい残差を午後の時間でプロトタイプできるようになり、そして手法がリアルタイムで動くかどうかを左右する性能の議論(自動微分 vs. 解析的ヤコビアン、疎ソルバーの選択、増分 vs. バッチ)を理解できるようになる。

## ハンズオン

- [Eigen + Sophus ハンズオン](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch03_05)
- [g2o ハンズオン](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_13)
- [GTSAM ハンズオン](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_14)
- [Ceres-solver ハンズオン](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_15)
- [SymForce ハンズオン](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_16)

## 関連ノート

- [C++](cpp.md)
- [ファクターグラフ](factor-graph.md)
- [MAP推定と疎な非線形最小二乗問題](map-inference-as-sparse-nonlinear-least-squares.md)
- [増分平滑化 (iSAM/iSAM2)](incremental-smoothing.md)
- [シュア補元 / 疎性](schur-complement-sparsity.md)
