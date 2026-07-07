# Visual Odometry

> Nistér 2004 · [論文](https://ieeexplore.ieee.org/document/1315094)

**一行要約** — 「visual odometry(視覚オドメトリ)」という用語を生み出し、単眼およびステレオ映像からのリアルタイム・フレーム単位のカメラ姿勢推定を実証し、VOを実用的なナビゲーション能力として確立した。

## 問題

この研究以前、カメラベースの自己運動推定は主にオフラインのstructure-from-motionとして存在していた。すなわち、画像集合を数分から数時間かけて処理するバッチパイプラインである。自律ナビゲーションが必要としていたのはその正反対――映像ストリームからの逐次的・リアルタイム・フレーム単位の姿勢推定であり、移動中の車両上で動作するのに十分な頑健性を持つものだった。Nistér、Naroditsky、Bergen(CVPR 2004)はこれが実用可能であることを示した。彼らのシステムは「映像入力に基づいてステレオヘッドまたは単一の移動カメラの運動を推定する」もので、遅延の少ないリアルタイムで動作し、その運動推定値をナビゲーション目的に利用できる――そして彼らは、車輪オドメトリとの類推から、この能力を*visual odometry*と名付けた。

## 手法とアーキテクチャ

このパイプラインは4段階からなるフレーム単位のループである(どこにも大域的最適化は存在しない)。

1. **特徴検出とマッチング** — 各フレームでHarrisコーナーを検出し、連続フレーム間で局所画像パッチの正規化相関を用いてマッチングを行い、映像レートで特徴トラックを生成する。
2. **ロバストな相対姿勢推定** — キャリブレーション済みビュー間の相対姿勢は、Nistérの*五点法(five-point algorithm)*を用いたRANSACの仮説検証ループの中で計算される。この五点法は同時発表された姉妹論文("An Efficient Solution to the Five-Point Relative Pose Problem"、同じく2004年)として公開された。キャリブレーション済みの画像点 $\mathbf{q} \leftrightarrow \mathbf{q}'$ について、各対応点はエピポーラ制約を通じて基礎行列(essential matrix)を制約する。

$$
\mathbf{q}'^\top \mathbf{E}\,\mathbf{q} = 0, \qquad \mathbf{E} \equiv [\mathbf{t}]_\times \mathbf{R},
$$

   さらに、有効な基礎行列は三次の制約(five-point論文の定理1)も満たさなければならない。

$$
\mathbf{E}\mathbf{E}^\top\mathbf{E} - \tfrac{1}{2}\,\mathrm{trace}\big(\mathbf{E}\mathbf{E}^\top\big)\,\mathbf{E} = \mathbf{0}.
$$

   5つの対応点から $5 \times 9$ の線形系が得られ、その4次元の零空間 $\mathbf{E} = x\mathbf{X} + y\mathbf{Y} + z\mathbf{Z} + w\mathbf{W}$ は三次制約を通じて**十次多項式**に帰着され、その実根が候補となる運動である。*最小*の5点を用いることで、各RANSAC仮説の計算コストを抑え、全インライアのサンプルを引く確率を最大化できる。仮説は全マッチに対して評価され、外れ値は除外される。$\mathbf{R}, \mathbf{t}$ はその後 $\mathbf{E}$ のSVDから復元される。
3. **三角測量** — インライアとなったマッチは3D点へ三角測量される(ステレオ構成では既知のベースラインによってメトリックスケールが固定されるが、単眼の場合スケールは観測不能である)。
4. **逐次的な姿勢の連結** — フレーム間の相対姿勢を連結して、大域的な軌跡を得る。

このアーキテクチャを特徴づけているのは*欠けているもの*である。すなわちループ閉じ込みなし、大域的最適化なし、場所認識なし、地図の再利用なし――ドリフトは無制限に蓄積し、これこそがVOをフルSLAMと分ける決定的な点である。

## 実験結果

公開された評価(IEEEの有料コンテンツであり、本ノート作成時に全文は入手できなかった――完全な評価内容は論文を参照)では、ステレオヘッドと単一の移動カメラの両方から得た実映像において、遅延の少ないリアルタイム動作が実証され、その推定値は地上車両プラットフォームのナビゲーションに利用された。拡張されたジャーナル版は"Visual odometry for ground vehicle applications"(Journal of Field Robotics, 2006年)として発表されている。この研究が残した長期的な定量的遺産はアーキテクチャ的なものである。この研究と共に導入された五点法ソルバーは、キャリブレーション済み二視点幾何の標準的な手法となった(OpenCVの`findEssentialMat`はこれに由来する)。また「visual odometry」という語はこの分野全体を指す名称として定着した。

## SLAMにおける意義

この論文はvisual odometryを独立した問題として定義し、カメラが主要なナビゲーションセンサーとして機能できることを証明し、その後に続くすべての単眼SLAMシステムの基盤を築いた。そのパイプライン――特徴点、最小解法+RANSAC、三角測量、姿勢の合成――は、今なお多くの幾何ベースのフロントエンドの骨格である(PTAMでさえ地図初期化に同じ五点法を使用している)。この論文に欠けているもの(ループ閉じ込み、大域的整合性)を理解することが、SLAMがVOの上に何を付加しているのかを理解する最も明快な方法である。

## ハンズオン

- [MonoVOハンズオン](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_05)

## 関連ノート

- [VO vs SLAM](vo-vs-slam.md) — この論文が動機付けた概念的な区別
- [MonoSLAM](monoslam.md) — この直後に発表された最初のリアルタイム単眼SLAM
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md) — 基礎行列の背後にある理論
- [Triangulation](../level-01-beginner/triangulation.md) — 二視点から3D点を復元する手法
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md) — VOの根底にあるマッチング問題
- [Corner detector](../level-01-beginner/corner-detector.md) — オリジナルのパイプラインが追跡したHarris特徴
