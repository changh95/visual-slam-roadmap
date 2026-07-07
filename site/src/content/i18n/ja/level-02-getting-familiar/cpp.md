# C++

C++はSLAMの作業言語である。後のレベルで学ぶほぼすべてのシステム——ORB-SLAM、DSO、VINS-Mono、KinectFusion——はC++で書かれている。なぜなら、SLAMはカメラフレーム、IMUパケット、最適化問題を、制約のあるハードウェア上でリアルタイムに処理しなければならないからだ。このレベルにおいて「C++を知っている」とは、単に文法を知っているということではなく、SLAMのコードベースが使う特有のイディオムとツールチェインで生産的に働けるということを意味する。

**モダンC++(C++11/14/17/20)。** SLAMのコードはモダンなイディオムに生死を懸けている。範囲for文、`auto`、ラムダ関数、`std::thread`、スマートポインタ、ムーブセマンティクスなどである。特にムーブセマンティクスが重要なのは、SLAMが大きなオブジェクト(画像、点群、記述子行列)を持ち歩くため、ホットループ内での不意の深いコピーを許容できないからである。

**OOPとデザインパターン。** SLAMシステムは、トラッカー、ローカルマッパー、ループクローザー、マップデータベースといった、スレッド間で状態を共有する相互作用するモジュールとして構成されている。継承と合成の違い、センサー抽象化のためのインターフェース、そして一般的なパターン(マップデータベースのためのシングルトン、センサードライバのためのファクトリー、pub/sub風のコールバックのためのオブザーバー)を理解していれば、ORB-SLAMのような大規模なコードベースが読みやすくなる。

**データ構造とアルゴリズム。** 複雑度について常に考える必要がある。最近傍探索のためのkd-treeやハッシュグリッド、キーフレーム削減のための優先度付きキュー、共視性やポーズグラフ構造のためのグラフなどである。適切なコンテナ(`std::vector`対`std::unordered_map`)を選ぶことは、フレームレートに目に見える影響を与える。

**コンパイラとビルドシステム。** 実際のプロジェクトは、MakeやNinjaを駆動するCMakeでビルドされる。Eigen/OpenCVを見つけ、最適化フラグ(`-O3`、`-march=native`)を設定し、サードパーティのサブモジュールを管理する`CMakeLists.txt`を読み書きできるようになっておくこと。SLAM風の最小限の`CMakeLists.txt`は以下のようになる。

```cmake
cmake_minimum_required(VERSION 3.16)
project(my_vo)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_BUILD_TYPE Release)          # forget this and everything is "slow"

find_package(OpenCV REQUIRED)
find_package(Eigen3 REQUIRED)

add_executable(vo main.cpp)
target_link_libraries(vo ${OpenCV_LIBS} Eigen3::Eigen)
```

コンパイラが何をしているのか(インライン化、ベクトル化、デバッグビルドとリリースビルドの違い)をおおまかに知っていれば、なぜ「遅い」SLAMシステムが実は単にデバッグビルドだったというだけの話であることが多いのかが理解できる。

**C++でのOpenCV。** OpenCVは画像処理層のデフォルトである。画像の読み込みとディストーション補正、特徴点検出(`cv::ORB`、`cv::SIFT`)、マッチング(`cv::BFMatcher`、`cv::FlannBasedMatcher`)、姿勢推定(`cv::solvePnP`)、そしてキャリブレーション(`cv::calibrateCamera`)がある。最小限の特徴点パイプラインは以下のようになる。

```cpp
cv::Ptr<cv::ORB> orb = cv::ORB::create(2000);
std::vector<cv::KeyPoint> kps;
cv::Mat desc;
orb->detectAndCompute(img, cv::noArray(), kps, desc);

cv::BFMatcher matcher(cv::NORM_HAMMING);
std::vector<cv::DMatch> matches;
matcher.match(desc_prev, desc, matches);
```

## 実際のSLAMシステムにおける並行処理

リアルタイムSLAMシステムは、複数の粒度で並列性を積極的に利用する。

- **スレッド化** — 時間的に重要なトラッキングと、バックグラウンドのマッピングに別々のスレッドを割り当てる。ORB-SLAM3はTracking、Local Mapping、Loop Closingの3つのスレッドを使う。マップが共有状態であるため、ミューテックスと注意深い所有権規律はアーキテクチャの一部であり、後付けの対策ではない。
- **SIMD(x86ではSSE/AVX、ARMではNeon)** — 1命令あたり4〜16個の浮動小数点数を処理する。記述子の計算とマッチング(例: ARM上のNeonイントリンシックを使ったORB)は典型的な恩恵を受ける対象である。
- **OpenMP** — `#pragma omp parallel for`による粗粒度のCPU並列性で、画像領域やピラミッドレベルにわたる特徴抽出の並列化に適している。
- **CUDA** — 密な深度推定、ニューラルネットワークの推論、密なマッピング(KinectFusion風のTSDF統合)のためのGPUプログラミング。

## よくある落とし穴

- **デバッグビルド。** Eigenを多用するコードの最適化されていないビルドは、`-O3`と比べて劇的に遅い。システムがリアルタイム性を持たないと結論づける前に、必ず`CMAKE_BUILD_TYPE`を確認すること。
- **Eigenのアライメントとバージョン混在。** ヒープに割り当てられたクラスのメンバーとして、固定サイズでベクトル化可能なEigenのメンバーを持つ場合、アラインされたアロケーション(`EIGEN_MAKE_ALIGNED_OPERATOR_NEW`)が必要になる。また、異なるEigenバージョンに対してビルドされたライブラリをリンクすると、微妙なクラッシュを引き起こす——これがSLAMプロジェクトがDockerfileを提供する主な理由の一つである。
- **`cv::Mat`の浅いコピーのセマンティクス。** 代入とコピー構築は基盤となるバッファを共有する。独立したコピーが必要な場合は`.clone()`を使い、マルチスレッドパイプライン内でどちらが欲しいのかを把握しておくこと。
- **Eigenの式に対する`auto`の使用。** Eigenは遅延評価の式テンプレートを構築する。それを`auto`で受け取ると、一時オブジェクトへのダングリング参照が生まれる可能性がある。疑わしい場合は、具体的な行列型に代入すること。
- **マップ上のデータ競合。** マッパーがランドマークを挿入/削減している間にトラッカーがそれを読むことは、SLAMにおける典型的な競合状態である。自分自身のコードを書く前に、ORB-SLAMがマップアクセスをどのように保護しているかを研究すること。

## SLAMにおける意義

このレベル以上のすべては、あなたが中規模のC++コードベースを読み、ビルドし、修正できることを前提としている。論文を再現するとは、通常、C++リポジトリをクローンし、そのCMakeビルドをあなたのローカルのEigen/OpenCVバージョンに対して修正し、時間がどこに使われているかをプロファイルすることを意味する。C++の流暢さは、SLAMシステムを*使う*ことから*変える*ことへ——特徴点検出器を交換したり、センサーを追加したり、スレッド化やSIMDでボトルネックを最適化したりすることへ——移行するために必要なものでもある。

## ハンズオン

- [Basic C++ programming](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_02)
- [Building C++ libraries](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_03)
- [C++ CPU profiler](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_04)
- [C++ memory profiler](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_05)

## 関連ノート

- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [OpenCV](opencv.md)
- [C++/Python interop](cpp-python-interop.md)
- [Concurrency](concurrency.md)
- [Git/GitHub](git-github.md)
