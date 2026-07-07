# Levenberg-Marquardt

Levenberg-Marquardt（LM）はSLAMにおける非線形最小二乗問題を解くための主力ソルバーである。これは[Gauss-Newton](gauss-newton.md)の減衰版であり、Gauss-Newton（最小値付近で高速）と勾度降下法（最小値から離れていても安全）の間を補間することで、初期化が悪くてもはるかにロバストになる。

## Gauss-NewtonからLMへ

コスト $F(\mathbf{x}) = \tfrac{1}{2}\|\mathbf{e}(\mathbf{x})\|^2$ に対し、Gauss-Newtonは残差を $\mathbf{e}(\mathbf{x}_k + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}_k) + J_k \Delta\mathbf{x}$ と線形化し、正規方程式を解く。

$$
(J_k^T J_k)\,\Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

これは、線形化が良い近似でない場合や $J_k^T J_k$ が（ほぼ）特異である場合に発散しうる。LMは**減衰項（damping term）** $\lambda I$ を追加する。

$$
(J_k^T J_k + \lambda I)\,\Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

ここで、

- $J_k$ は現在の推定値 $\mathbf{x}_k$ における残差ベクトルのヤコビ行列、
- $\lambda > 0$ は減衰パラメータ、
- $\Delta\mathbf{x}$ は更新量であり、$\mathbf{x}_{k+1} = \mathbf{x}_k + \Delta\mathbf{x}$ として適用される（あるいは多様体上の姿勢の場合は指数写像を介して適用される）。

2つの極限がこの挙動を説明する。

- $\lambda \to 0$: 方程式はGauss-Newtonに帰着する——最小値付近では大きく積極的なステップとほぼ二次的な収束を示す。
- $\lambda \to \infty$: 方程式は $\lambda\,\Delta\mathbf{x} = -J_k^T\mathbf{e}$ に近づく。すなわち負の勾度方向への小さなステップとなる——遅いが信頼できる降下である。

Marquardtの改良では、減衰を各座標の曲率でスケーリングし、$\lambda I$ を $\lambda\,\mathrm{diag}(J_k^T J_k)$ に置き換える。これにより、弱く制約された方向がより強く減衰され、手法がパラメータごとの再スケーリングに対して不変になる。

## 減衰の適応

$\lambda$ は、ステップが実際に有効だったかどうかに基づいて毎反復で調整される。

1. 現在の $\lambda$ で $\Delta\mathbf{x}$ を解く。
2. $\mathbf{x}_k + \Delta\mathbf{x}$ における真のコストを評価する。
3. コストが減少した場合: ステップを受理し、$\lambda$ を**減少**させる（線形化をより信頼する）。
4. コストが増加した場合: ステップを棄却し、$\lambda$ を**増加**させる（より勾度降下法に近い小さなステップを取る）、そして再度解く。

よく用いられる改良として、実際のコスト減少量を線形化モデルによって予測された減少量と比較する（**ゲイン比率、gain ratio**）。比率が1に近い場合、局所的な二次モデルは信頼でき、$\lambda$ を積極的に縮小してよい。比率が小さい、あるいは負の場合、モデルは不良であり $\lambda$ を増加させなければならない。これはまさに**トラストリージョン法（trust-region method）**の論理である——LMは、$\mathbf{x}_k$ の周りに線形化が信頼される領域を暗黙的に維持していると読むことができ、$\lambda$ はその領域の半径に反比例する。

## SLAM問題における実践的な注意点

- 減衰された系行列 $J^T J + \lambda I$ は $\lambda > 0$ に対して常に正定値であるため、コレスキー分解が常に成功する——これは単眼バンドル調整のようなゲージ不定な問題において重要である。
- SLAMヘッシアンのスパース性は保たれる。減衰は対角要素にのみ影響するため、バンドル調整のためのシューア補元トリックは変更なしに機能する。
- ロバストカーネル（[M-estimators](m-estimator.md)）は反復重み付き最小二乗としてLMに組み込まれる——重みが $J$ と $\mathbf{e}$ を変更するだけで、LMループそのものは変わらない。
- LMはCeres Solver、g2o、GTSAMのデフォルトオプティマイザであり、したがってほとんどのSLAMバックエンド内部で実際に動いているアルゴリズムである。

## SLAMにおける意義

現代のSLAMパイプラインにおけるほぼすべての最適化——[バンドル調整](bundle-adjustment.md)、ポーズグラフ最適化、PnP精緻化、カメラキャリブレーション——はLMで解かれる。SLAM問題は高度に非線形であり（投影、回転多様体）、初期化はしばしば平凡である（動きモデルによる予測、ノイズの多い三角測量）ため、純粋なGauss-Newtonステップは頻繁にオーバーシュートする。LMの自動減衰こそが、これらのソルバーがフレームごとに手動チューニングなしに安定して収束する理由であり、これが数十年にわたってSLAMバックエンドのデフォルトであった理由である。

## 関連ノート

- [Gauss-Newton](gauss-newton.md)
- [Non-linear optimization](non-linear-optimization.md)
- [Bundle Adjustment](bundle-adjustment.md)
- [Reprojection error](reprojection-error.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
