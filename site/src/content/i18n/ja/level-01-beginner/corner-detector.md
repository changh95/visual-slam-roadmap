# Corner detector

コーナーとは、輝度が*複数の方向*で大きく変化する画像上の位置である。コーナーは安定的で再現性の高いランドマークである。平坦な領域(勾配なし)やエッジ(1方向のみに勾配)とは異なり、コーナーは2Dで曖昧さなく位置決めできるため、追跡やマッチングに理想的である。古典的な検出器は**ハリスコーナー検出器**である。

## 構造テンソル

局所ウィンドウ $W$ 上で $w(x,y)$(多くの場合ガウス関数)により重み付けして計算される、あるピクセルにおける**構造テンソル**(二次モーメント行列):

$$M = \sum_{(x,y) \in W} w(x,y) \begin{bmatrix} I_x^2 & I_x I_y \\ I_x I_y & I_y^2 \end{bmatrix}$$

ここで $I_x = \frac{\partial I}{\partial x}$、$I_y = \frac{\partial I}{\partial y}$ は(Sobel演算子で計算される)画像勾配である。$M$ の固有値 $\lambda_1, \lambda_2$ は局所構造を特徴づける:

| $\lambda_1$ | $\lambda_2$ | 解釈 |
|---|---|---|
| $\approx 0$ | $\approx 0$ | 平坦な領域(勾配なし) |
| $\gg 0$ | $\approx 0$ | エッジ(1方向のみの勾配) |
| $\gg 0$ | $\gg 0$ | コーナー(両方向の勾配) |

直感的には、$M$ はウィンドウがシフトされたときに輝度差の二乗和がどのように変化するかを要約している。コーナーとは、*どの*シフト方向でも大きな変化が生じる点であり、これはまさに「両方の固有値が大きい」という条件そのものである。

## コーナー応答関数

固有値を直接計算する(計算コストが高い)代わりに、ハリスは次の応答を提案した:

$$R = \det(M) - k\,(\mathrm{trace}(M))^2 = \lambda_1\lambda_2 - k(\lambda_1 + \lambda_2)^2$$

ここで $k \in [0.04, 0.06]$ は経験的な値である。$R > 0$ はコーナーを、$R < 0$ はエッジを、$|R|$ が小さい場合は平坦な領域を示す。非最大値抑制(non-maximum suppression)によって、最も強い局所最大値が最終的なコーナーとして選択される。

密接に関連する**Shi-Tomasi**基準(「Good Features to Track」)は、各ピクセルを $\min(\lambda_1, \lambda_2)$ — パッチの最悪ケースの追跡可能性 — によって直接スコアリングし、これはOpenCVの `cv::goodFeaturesToTrack` が実装しているものである。

## ゼロからのスケッチ

数行のNumPy/OpenCVでハリス検出器を実装することは、初心者にとって最良の演習の一つである:

```python
import cv2, numpy as np

I  = cv2.imread("frame.png", cv2.IMREAD_GRAYSCALE).astype(np.float32)
Ix = cv2.Sobel(I, cv2.CV_32F, 1, 0)
Iy = cv2.Sobel(I, cv2.CV_32F, 0, 1)

# window-averaged structure tensor entries
Sxx = cv2.GaussianBlur(Ix * Ix, (5, 5), 1.0)
Syy = cv2.GaussianBlur(Iy * Iy, (5, 5), 1.0)
Sxy = cv2.GaussianBlur(Ix * Iy, (5, 5), 1.0)

k = 0.04
R = (Sxx * Syy - Sxy**2) - k * (Sxx + Syy)**2   # Harris response
corners = R > 0.01 * R.max()                    # threshold before NMS
```

## SLAMフロントエンドにおける実践上の注意点

- ORBの基盤である**FAST**は、構造テンソルを候補点周りの16ピクセルの円上での高速セグメントテストに置き換える — これはずっと計算コストが低く、数千個のキーポイントをリアルタイムで検出することを可能にしている。概念的には、依然として同じ「複数方向での輝度変化」という性質を対象としている。
- **空間的な分布が重要である**: 生の応答閾値は、テクスチャの多い領域にコーナーを集中させてしまう。そのためSLAMシステムは画像をグリッドに分割し、各セルごとに最良のコーナーを保持し、ポーズ推定がすべての画像領域で制約されるようにする。
- **サブピクセル精緻化**(応答の最大値周りに二次関数をフィッティングする、例えば `cv::cornerSubPix`)は、以降の幾何計算を著しく改善する。

## よくある落とし穴

- **ウィンドウ/ブラーサイズのトレードオフ**: ウィンドウが小さすぎるとテンソルが雑音を持ち、大きすぎると別々のコーナーがぼやけて混ざり、位置がずれる。
- **最大応答に対する割合としての閾値**はシーンによって適応が悪い。単一のグローバル閾値よりも、セルごとの選択の方が頑健である。
- **動く物体や鏡面反射上のコーナー**は幾何学的に無用である。検出品質は物語の半分に過ぎず、残りは以降の外れ値除去である。

## SLAMにおける意義

コーナーは特徴点ベースのSLAMフロントエンドの原材料である。それらは記述され、マッチングされ、三角測量されてマップ点となるキーポイントになる。構造テンソルはLucas-Kanadeオプティカルフローにほぼそのまま再登場する — コーナー(両方の固有値が大きい)はまさに確実に追跡できる種類の点であり、これが「good features to track」とハリスコーナーが密接に関連している理由である。リアルタイムSLAMで用いられる後発の検出器(FAST、ORBの向き付きFAST)は、同じアイデアの、より高速な後継である。

## 関連ノート

- [Edge detector](edge-detector.md)
- [Basic Linear Algebra](basic-linear-algebra.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
