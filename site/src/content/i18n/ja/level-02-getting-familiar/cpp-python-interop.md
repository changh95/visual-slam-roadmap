# C++/Python相互運用

現代のSLAM研究は2つの世界に生きている。性能が重要な推定コードはC++で書かれ、実験、深層学習、評価はPythonで行われる。C++/Python相互運用はその橋渡しである。C++コアをPythonバインディングでラップすることで、同じトラッカーやオプティマイザをノートブックから動かしたり、PyTorchモデルと組み合わせたり、Pythonツールでベンチマークしたりできるようになる。何も書き直す必要はない。

**PyBind11**は、これらのバインディングを書くためのデファクトスタンダードである。ヘッダーオンリーのC++ライブラリであり、非常に少ないボイラープレートでC++のクラスや関数をPythonモジュールとして公開できる。

```cpp
#include <pybind11/pybind11.h>
#include <pybind11/eigen.h>   // automatic Eigen <-> NumPy conversion

Eigen::Matrix4d track(const Eigen::Matrix4d& T_prev, const cv::Mat& img);

PYBIND11_MODULE(myslam, m) {
    m.def("track", &track, "Track one frame and return the new pose");
}
```

`pybind11/eigen.h`ヘッダーは、`Eigen`の行列とNumPy配列を自動的に相互変換する。これはまさにSLAMコードが必要とするものだ。姿勢、点群、ヤコビアンは、手動のコピーコードなしに配列として言語の境界を越える。あなたが使う多くのライブラリはこの方式でラップされている——GTSAMは公式のPythonラッパーを提供しており、COLMAPの`pycolmap`のようなプロジェクトも同じパターンに従っている。

自由関数ではなく、システム全体をバインドする場合は以下のようになる——GILガードに注目してほしい。これは、Pythonが待機している間もマルチスレッドのSLAMコアを動かし続けるために必要なものである。

```cpp
namespace py = pybind11;

py::class_<SlamSystem>(m, "SlamSystem")
    .def(py::init<const std::string&>())              // config file path
    .def("track", &SlamSystem::track,
         py::call_guard<py::gil_scoped_release>())    // release GIL during C++ work
    .def_property_readonly("map_points", &SlamSystem::mapPoints);
```

**nanobind**は、同じ作者による後継ライブラリで、バインディングのオーバーヘッドを下げ、バイナリサイズを小さくし、コンパイル時間を短くするために再設計されている。そのAPIは意図的にPyBind11に近く、知識がそのまま転用できる。呼び出しオーバーヘッドを重視する新しいプロジェクト(例: 特徴点ごとやフレームごとに呼ばれる小さな関数のバインディング)は、nanobindを選ぶ傾向が増えている。

## SLAMコードをラップする際に理解すべきこと

- **所有権と生存期間** — C++のスレッド間とPython間で共有される`Map`オブジェクトを誰が解放するのか。戻り値ポリシー(`return_value_policy::reference_internal`対`copy`)は、Pythonがビューを保持するか、所有された複製を保持するかを決定する。
- **GIL** — 長時間実行されるC++呼び出しは、(上記のように)PythonのGlobal Interpreter Lockを解放すべきである。これにより、バックグラウンドのマッピングスレッドは動作を継続でき、Python呼び出し側はコアの周りでマルチスレッド化できる。
- **ゼロコピービュー** — 大きなバッファ(画像、点群)をコピーではなくNumPyビューとして公開することで、橋渡しのコストを低く抑えられる。C++側では、変換を強制しないよう`Eigen::Ref<const Eigen::MatrixXd>`や`py::array_t`を受け取ること。
- **レイアウトとdtypeの不一致** — Eigenは列優先(column-major)がデフォルトだが、NumPyは行優先(row-major)がデフォルトである。また`float32`と`float64`の不一致は静かにコピーを発生させる。フレームごとのデータが大きい場合は、この境界をプロファイルすること。
- **ビルドとパッケージング** — CMakeの`pybind11_add_module`と`pyproject.toml`(例: scikit-build-core)を組み合わせることで、全体を`pip install`可能なパッケージにできる。これにより、C++のSLAMシステムがCIや共同作業者にとって使いやすいものになる。

## よくある落とし穴

- 拡張モジュールとPythonインタプリタ、あるいは他のC++依存関係との間でコンパイラ/ABIの不一致が起きると、インポート時にクラッシュする。すべてを一つの一貫した環境でビルドすること(これもDockerが好まれる理由の一つである)。
- 例外は境界を越えて変換される必要がある——PyBind11は`std::exception`をPythonの例外にマッピングするが、カスタムのエラー型は明示的な登録が必要である。
- デバッグは両側で行う必要がある。C++側については`gdb`/`lldb`をPythonプロセスにアタッチし、バインディング内のセグメンテーションフォルトは通常Pythonのバグではなく、生存期間のバグを意味することを覚えておくこと。

## SLAMにおける意義

この分野は、古典的なC++バックエンドと、Python/PyTorchで動作する学習済みフロントエンド(特徴点検出器、深度ネットワーク、マッチャー)を組み合わせたハイブリッドシステムへと収束しつつある。C++のオプティマイザをPythonにバインドできること——あるいはエクスポートされたモデルを介してC++から学習済みマッチャーを呼び出せること——が、こうした組み合わせを実用的にしている。それはまた、あなた自身のC++コードも変える。一度ラップすれば、それはスクリプト可能になり、pytestから単体テスト可能になり、Pythonツールでデータセットに対して評価しやすくなる。

## ハンズオン

- [PyBind hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_08)

## 関連ノート

- [C++](cpp.md)
- [Python](python.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [Edge deployment](edge-deployment.md)
