# Python

C++は大半のSLAMシステムのリアルタイムコアを動かすが、**Python**はそのコアの周囲にある全てのものの言語である。典型的なSLAMのワークフローでは、Pythonを3つの用途で使用する。

- **ディープラーニング**: PyTorch(および同種のツール)はPythonファーストである。学習された特徴(SuperPoint)、マッチャー(SuperGlue/LightGlue)、単眼深度、そしてDROID-SLAMのようなエンドツーエンドのシステムは、いずれもPythonで学習され — そして通常は最初にプロトタイピングされる。
- **解析とプロッティング**: 配列演算のためのNumPy、軌跡やエラープロットのためのMatplotlib、そしてグラウンドトゥルースに対するATE/RPEを計算するための評価ツール。SLAMの実行がおかしくなったとき、軌跡、特徴数、残差ヒストグラムをプロットする簡易なノートブックは、しばしば最速のデバッグ手段である。
- **システムスクリプトとグルーコード**: データセットのダウンロードと変換、バッチ実験ランナー、キャリブレーションパイプライン、CIジョブ、そして時間的制約の緩いコンポーネント向けのROS 2ノード(`rclpy`)。

多くの中核的なSLAMライブラリはPythonバインディングを公開しているため、C++に触れずに完全なパイプラインをプロトタイピングできる。

| ライブラリ | Pythonエントリーポイント |
|---|---|
| OpenCV | `opencv-python` (`cv2`) |
| GTSAM | 公式Pythonラッパー |
| g2o | コミュニティによるバインディング(例: g2opy) |
| Open3D | ネイティブPython API(点群、ICP、TSDF) |

一般的かつ生産的なパターンは*Pythonでプロトタイピングし、C++に移植する*ことである。データセットに対して`cv2`とNumPyでアルゴリズムを検証し、設計が固まったらホットループをC++/Eigenに再実装する。Pythonにとどまる必要がある研究コードについては、pybind11によってパフォーマンスが重要なC++部分をラップしつつ、実験ロジックはPythonに残すことができる — 両方の利点を得られる。

早期に身につけておくべき実践的な習慣: プロジェクトごとに仮想環境(venv/conda/uv)を使用すること、再現性のために依存関係のバージョンを固定すること、そしてNumPyは行優先の規約を使い、OpenCVの画像は`[row, col]` = `[y, x]`でインデックスされることを覚えておくこと — これは座標の転置に関する典型的なバグの原因である。

## PythonにおけるSLAMツールの一例

ツールボックスに持っておくべき最も有用な1つのスクリプトは軌跡評価である。閉形式の最小二乗剛体アラインメント(Umeyamaの方法、SVD経由)で推定値をグラウンドトゥルースに整合させ、ATE RMSEを計算するのは、NumPyでたった十数行で書ける。

```python
import numpy as np

def align_and_ate(P_est, P_gt):          # both Nx3
    mu_e, mu_g = P_est.mean(0), P_gt.mean(0)
    U, S, Vt = np.linalg.svd((P_gt - mu_g).T @ (P_est - mu_e))
    D = np.diag([1, 1, np.sign(np.linalg.det(U @ Vt))])
    R = U @ D @ Vt                        # rotation aligning est -> gt
    t = mu_g - R @ mu_e
    err = P_gt - (P_est @ R.T + t)        # residuals after alignment
    return np.sqrt((err ** 2).sum(1).mean())   # ATE RMSE
```

これは基本的に、広く使われている`evo`パッケージ(`pip install evo`)が行っていることと同じである — 実際には、TUM/KITTI/EuRoCフォーマット、プロット、RPEには`evo`を使うが、上記の数学を知っておくことで、その出力がブラックボックスにならなくなる。

## Pythonを十分に高速にする

Pythonの遅さは、ほぼ全て*ループ*の問題である。以下は経験則である。

- **NumPyでベクトル化する** — 10万点の変換は`for`ループではなく1回の行列積(`(R @ pts.T).T + t`)であり、その差はしばしば100倍に及ぶ。
- **GILがどこで影響するかを知る** — Pythonスレッドは、CPUバウンドの純粋なPythonコードを並列化しない。NumPy/OpenCVの呼び出しはGILを解放し、`multiprocessing`はバッチ実験でGILを回避する。
- **最適化の前にプロファイリングする** — `cProfile`や行単位のプロファイラは通常1つのホットループを明らかにする。すべてを移植するのではなく、まさにその部分だけをNumPy、Numba、または小さなpybind11拡張に移すこと。
- **dtypeに注意する** — 意図しない`float64`は`float32`に比べてメモリトラフィックを倍増させる。`uint8`として届く画像配列は算術演算で暗黙的にオーバーフローする(`img1 - img2`はラップアラウンドする)。

## よくある落とし穴

- **座標/レイアウトの混乱** — `img[y, x]`、`(x, y)`としての`pts`: OpenCVはそのAPI全体で両方の規約を混在させている(OpenCVのノートを参照)。
- **エイリアシングとコピーの混同** — NumPyのスライスは*ビュー*を返す。スライスを変更すると元の配列が変更される。コピーを意図する場合は`.copy()`を使うこと。
- **環境の腐敗** — `opencv-python`と`opencv-contrib-python`の衝突、CUDA/PyTorchのバージョン不整合。プロジェクトごとに固定された環境ファイルを1つ持つことで、何週間にも及ぶデバッグセッションを防げる。
- **クォータニオンの規約** — ライブラリによって`(w, x, y, z)`と`(x, y, z, w)`のどちらの順序を使うかが異なる(例えばSciPyは`xyzw`を使う)。順序を誤ると、明らかに壊れているのではなく微妙に間違った回転が生成される。

## SLAMにおける意義

現代のSLAM研究は幾何学と学習の交差点に位置しており、学習の側はPythonを言語としている。古典的なシステムであっても、評価・可視化・データセットツールのエコシステムはPythonベースである。それに習熟することで、実験を実行し、C++システムが実際に何をしているかを理解する速度が大幅に向上する。

## ハンズオン

- [Basic Python programming](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_07)

## 関連ノート

- [C++](cpp.md)
- [C++/Python interop](cpp-python-interop.md)
- [OpenCV](opencv.md)
- [Bash/Linux](bash-linux.md)
