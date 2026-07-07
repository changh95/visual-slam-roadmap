# Pinhole camera model

ピンホールカメラは、SLAMで使われるほとんどのカメラの標準モデルである。3次元点からの光は小さな穴（光学中心）を通過し、画像平面に投影される。このモデルは**画像投影（image projection）**、すなわち3次元世界の点が2次元ピクセルにどのように対応付けられるかを記述する。

## 座標系

以下の4つの座標系が関わる：

1. **ワールド座標系** $\mathbf{X}_w = [X_w, Y_w, Z_w]^T$：固定された基準座標系。
2. **カメラ座標系** $\mathbf{X}_c = [X_c, Y_c, Z_c]^T$：$Z_c$ は光学軸（前方を向く）。
3. **画像平面** $\mathbf{x}' = [x', y']^T$：画像平面上のメトリック座標。
4. **ピクセル座標系** $\mathbf{u} = [u, v]^T$：離散的なピクセル座標。

一般的な慣例は $X_c$ が右向き、$Y_c$ が下向き、$Z_c$ が前向きであり、これはピクセル座標 $u$（右）と $v$（下）に対応し、原点は画像の左上隅にある。

## 投影パイプライン

**ステップ1：ワールド座標からカメラ座標へ。** 剛体変換（外部パラメータ）がワールド座標点をカメラ座標系に変換する：

$$\mathbf{X}_c = R\mathbf{X}_w + \mathbf{t}$$

**ステップ2：カメラ座標から画像平面へ（透視除算）。**

$$x' = \frac{X_c}{Z_c}, \qquad y' = \frac{Y_c}{Z_c}$$

この深度による除算が透視効果の源であり ── そしてビジョン幾何学を興味深くしている非線形性の源でもある。座標 $(x', y')$ は**正規化座標（normalized coordinates）**と呼ばれる：これは内部パラメータを取り除いた後に残るものであり、多くの幾何学的な導出（基本行列、三角測量）はこの座標系で最もシンプルになる。

**ステップ3：画像平面からピクセルへ（内部パラメータ）。**

$$u = f_x \cdot x' + c_x, \qquad v = f_y \cdot y' + c_y$$

ここで $f_x, f_y$ はピクセル単位の焦点距離、$(c_x, c_y)$ は主点である。ピクセル焦点距離は物理的な焦点距離 $f$（mm単位）とピクセルサイズを関連付ける：$f_x = f / (\text{ピクセル幅})$ であり、これがピクセルが正方形でない場合に $f_x \neq f_y$ となる理由である。

## 行列形式

すべてのステップを斉次座標でまとめると：

$$Z_c \begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = \underbrace{\begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix}}_{\mathbf{K}} \begin{bmatrix} R & \mathbf{t} \end{bmatrix} \begin{bmatrix} X_w \\ Y_w \\ Z_w \\ 1 \end{bmatrix}$$

行列 $\mathbf{K}$ は**カメラ内部パラメータ行列（camera intrinsic matrix）**であり、$P = \mathbf{K}[R|\mathbf{t}]$ は $3 \times 4$ の**カメラ投影行列（camera projection matrix）**である。一般的な場合、$\mathbf{K}$ にはスキュー（skew）パラメータが含まれる（現代のカメラでは通常ゼロ）。

このパイプラインをそのままNumPyに翻訳したもの：

```python
import numpy as np

def project(K, R, t, X_w):
    X_c = R @ X_w + t          # world -> camera
    x_n = X_c[:2] / X_c[2]     # perspective division (normalized coords)
    u   = K[0, 0] * x_n[0] + K[0, 2]
    v   = K[1, 1] * x_n[1] + K[1, 2]
    return np.array([u, v])
```

## 逆投影：逆写像はレイになる

投影は1次元の情報を失う：1つのピクセルは3次元点を一意に決定せず、1本の**レイ（ray）**のみを決定する。ピクセル $\mathbf{u}$ が与えられると、カメラ座標系における可能な3次元点のレイは

$$\mathbf{X}_c(\lambda) = \lambda\,\mathbf{K}^{-1}\begin{bmatrix}u\\v\\1\end{bmatrix}, \qquad \lambda > 0$$

失われた深度 $\lambda$ を復元することこそが、三角測量（複数視点）、ステレオ（もう1台のキャリブレーション済みカメラ）、あるいは深度センサーが提供するものである。視野角も同じ幾何学から導かれる：画像幅 $W$ に対して $\mathrm{FoV}_x = 2\arctan\!\big(\tfrac{W}{2f_x}\big)$ となる。

## よくある落とし穴

- **軸の慣例**：コンピュータビジョンでは $Z$ が前方 / $Y$ が下方だが、ロボティクス（ROS）のボディ座標系では $X$ が前方 / $Z$ が上方である。これを混同することは、カメラをロボットに組み込む際の典型的な最初のバグである。
- **主点は画像中心ではない**：$(c_x, c_y)$ は $(W/2, H/2)$ に近いが、キャリブレーションによって求める必要があり、仮定してはならない。
- **手動で投影を実装する際に透視除算を忘れる** ── $P\mathbf{X}$ の斉次出力は、その第3成分で除算しなければならない。
- **歪んだピクセルにモデルを適用する**：実際の画像はまず歪み補正を行う必要がある（あるいは歪みモデルを $\pi$ に含める）。純粋なピンホールの方程式は理想的な座標にのみ成り立つ。

## SLAMにおける意義

このモデルで定義される投影関数 $\pi(\cdot)$ は、すべてのvisual SLAMシステムの核心にある：バンドル調整で最小化される再投影誤差 $\mathbf{e} = \mathbf{z} - \pi(T\mathbf{X})$ は、「ピンホールモデルでマップ点を投影し、測定されたピクセルと比較する」ということに他ならない。三角測量、PnP、エピポーラ幾何はすべて同じ方程式から導出されるため、このパイプラインをゼロから導出することは、このレベルで最も価値のある演習である。

## 関連ノート

- [Camera calibration](camera-calibration.md)
- [Camera models beyond pinhole](camera-models-beyond-pinhole.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Triangulation](triangulation.md)
- [Rigid body motion](rigid-body-motion.md)
- [Camera device](../level-02-getting-familiar/camera-device.md)
