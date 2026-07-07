# M-Estimator

通常の最小二乗法（OLS）はガウス雑音の下では統計的に最適であるが、外れ値の下では致命的に脆い。二乗損失は無限に増大するため、単一の重大な外れ値が推定値を任意に大きく引っ張ってしまう。**M推定量（M-estimators、最大似度型推定量）**は、二乗損失を大きな残差に対してより緩やかに増大する**ロバストカーネル** $\rho$ に置き換えることでこれを解決する。

$$
\min_{\theta} \sum_i \rho\!\left(\frac{r_i(\theta)}{\sigma}\right)
$$

ここで $r_i$ は $i$ 番目の残差（例えば再投影誤差）、$\sigma$ は残差をノイズの単位に正規化するスケールパラメータである。

## 一般的なロバストカーネル

- **Huber**: 小さな残差では二次関数、しきい値 $k$ を超えると線形になる。

$$
\rho(r) = \begin{cases} r^2/2 & |r| \leq k \\ k|r| - k^2/2 & |r| > k \end{cases}
$$

  凸で安全、穏やかである——不明な場合のデフォルトの選択肢。

- **Cauchy（ローレンツ）**: $\rho(r) = \frac{c^2}{2}\log\!\left(1 + r^2/c^2\right)$。対数的な増大を示し、大きな外れ値を強く抑制するが、非凸である。

- **Tukey biweight**: 完全に飽和する——しきい値 $c$ を超える残差は一定のコストを与え、勾度は正確に**ゼロ**になる。つまり確定した外れ値は解にまったく影響を与えなくなる。このような*redescending*（再下降型）カーネルは外れ値を最も厳しく拒絶するが、遠方の測定値が推定値を引き戻すことができないため、まともな初期化を必要とする。

導関数 $\psi(r) = \rho'(r)$ は**影響関数（influence function）**と呼ばれ、残差 $r$ にあるデータが推定値をどれだけ引っ張るかを測る。最小二乗法では $\psi(r) = r$（無制限の影響）であり、Huberでは $\pm k$ で切り捨てられ、Tukeyではゼロへと再下降する。

## IRLSによる求解

ロバストコストの勾度をゼロとすると $\sum_i \psi(r_i)\,\partial r_i/\partial\theta = 0$ が得られる。重み $w_i = \psi(r_i)/r_i$ を定義すると、これは**重み付き**最小二乗問題の条件となり、**反復重み付き最小二乗法（Iteratively Reweighted Least Squares、IRLS）**が示唆される。

1. 現在の推定値で残差 $r_i$ を計算する。
2. 重み $w_i = \rho'(r_i)/r_i$ を計算する（小さな残差→重みは1に近い、大きな残差→重みは0に近い）。
3. 重み付き最小二乗問題 $\min_\theta \sum_i w_i\, r_i(\theta)^2$ を解く（Gauss-Newton/LMの1ステップ）。
4. 収束するまで繰り返す。

実際には、これは[Gauss-Newton](gauss-newton.md)や[Levenberg-Marquardt](levenberg-marquardt.md)のループにシームレスに統合される。ロバストカーネルは各残差ブロックのヤコビ行列と誤差をスケール変更するだけである。Ceresはこれらを `LossFunction` と呼び、g2oは `RobustKernel` と呼ぶ。

スケール $\sigma$ はカーネルと同じくらい重要である——何を「大きい」とみなすかを定義する。標準的なロバスト推定は絶対偏差の中央値（median absolute deviation）から導出される。$\hat{\sigma} = 1.4826 \cdot \mathrm{median}_i\,|r_i - \mathrm{median}(r)|$ であり、この定数はガウス標準偏差と一致するように選ばれている。

## M推定量対RANSAC

両者は相補的であり、実際のパイプラインは両方を使う。

- [RANSAC](ransac.md)は**ハード**な内点/外れ値の判定を行い、圧倒的な外れ値比率からも回復できるが、その出力は1つの最小サンプルの良さに依存する。
- M推定量は**ソフト**で連続的な判定を行い、すべてのパラメータを同時に精緻化するが、正しい盆地の近くから始めなければ収束しない。

標準的な手順は、まずRANSACで粗いモデルと内点集合を見つけ、その後、内点に対してロバストな非線形精緻化（Huber/Cauchy）を行い、残りの不一致を吸収するというものである。

## SLAMにおける意義

SLAMにおけるすべての残差は時折誤っている。マッチングの誤り、動く物体、誤ったループクロージングなどである。これらのほんの一握りでも純粋な最小二乗の[バンドル調整](bundle-adjustment.md)に投入すると、軌跡全体が破壊される。したがってロバストカーネルは至る所で使われている——ORB-SLAMは再投影誤差をHuberカーネルで包み、ポーズグラフバックエンドはループクロージングエッジをCauchyやswitchable-constraint formulationで包み、現代のグローバルにロバストな手法（graduated non-convexity）はredescending型のM推定量の上に直接構築されている。あるシステムがどのカーネルを、どのしきい値で使っているかを知ることは、フロントエンドが誤情報を伝えたその日に、そのシステムがどう振る舞うかを教えてくれる。

## 関連ノート

- [RANSAC](ransac.md)
- [Non-linear optimization](non-linear-optimization.md)
- [Bundle Adjustment](bundle-adjustment.md)
- [Robust pose-graph optimization](robust-pose-graph-optimization.md)
- [GNC](../level-05-deep-learning/gnc.md)
