# Rigid body motion

**剛体運動（rigid body motion、剛体変換）**は、すべての点間の距離を保存する。3次元では回転と並進から構成され、それを表す数学的構造 ── $SO(3)$ と $SE(3)$ ── はSLAMの中心的な概念である：カメラの姿勢とは、まさに $SE(3)$ の要素である。

## 回転の表現

**オイラー角。** 回転は、固定軸または物体座標軸周りの連続した回転を表す3つの角度 $(\phi, \theta, \psi)$ でパラメータ化できる。12通りの慣例（ZYX、XYZなど）はそれぞれ異なる角度の系列を与える。**ジンバルロック（gimbal lock）**問題は、2つの回転軸が一致してしまい、有効な自由度が2に減少する現象である。オイラー角は表示には直感的だが数値的には問題があるため、反復最適化には使うべきではない。

**回転行列。** 回転行列は $R^TR = I$ かつ $\det(R) = +1$ を満たす。このような行列の全体は**特殊直交群（Special Orthogonal Group）**を成す：

$$SO(3) = \{R \in \mathbb{R}^{3\times3} \mid R^TR = I,\ \det(R) = +1\}$$

回転行列は計算のための表現として好まれる：行列の積が合成則であり、逆はただの転置である。

**四元数（Quaternions）。** $w^2+x^2+y^2+z^2 = 1$ を満たす単位四元数 $q = w + xi + yj + zk$ は、軸 $[x,y,z]^T/\sin(\theta/2)$ 周りの角度 $\theta = 2\arccos(w)$ の回転を表す。四元数はコンパクト（9個ではなく4個の数値）であり、ジンバルロックがなく、Hamilton積によって合成される。二重被覆（double cover）に注意：$q$ と $-q$ は同じ回転を表す。

四元数から回転行列への変換：

$$R = \begin{bmatrix}
1 - 2(y^2+z^2) & 2(xy - wz) & 2(xz + wy) \\
2(xy + wz) & 1 - 2(x^2+z^2) & 2(yz - wx) \\
2(xz - wy) & 2(yz + wx) & 1 - 2(x^2+y^2)
\end{bmatrix}$$

行列が有効な回転であるかを簡単に確認するNumPyのコード：

```python
import numpy as np
# R is a rotation iff R^T R = I and det(R) = +1
print(np.allclose(R.T @ R, np.eye(3)), np.isclose(np.linalg.det(R), 1.0))
```

## 斉次変換：$T \in SE(3)$

剛体運動は、回転 $R$ と並進 $\mathbf{t}$ を、斉次座標に作用する1つの $4\times4$ 行列に結合する：

$$T = \begin{bmatrix} R & \mathbf{t} \\ \mathbf{0}^T & 1 \end{bmatrix} \in SE(3), \qquad
T\begin{bmatrix}\mathbf{X}\\1\end{bmatrix} = \begin{bmatrix} R\mathbf{X} + \mathbf{t} \\ 1 \end{bmatrix}$$

合成は行列の積であり、回転と並進が入り交じる：

$$T_1 T_2 = \begin{bmatrix} R_1R_2 & R_1\mathbf{t}_2 + \mathbf{t}_1 \\ \mathbf{0}^T & 1 \end{bmatrix}$$

── $\mathbf{t}_2$ が $R_1$ によって回転させられる点に注意。これが、連結された変換の並進が単純に加算*されない*理由である。逆行列は次の閉形式を持つ：

$$T^{-1} = \begin{bmatrix} R^T & -R^T\mathbf{t} \\ \mathbf{0}^T & 1 \end{bmatrix}$$

斉次座標は**射影空間（projective space）**から来ている：1（点）または0（方向）を末尾に付加することで、1つの行列で回転と並進を同時に表現できる。射影幾何学では、平行な3次元直線は画像上の**消失点（vanishing point）**で交わる ── これは人工的な環境での回転推定に有用な手掛かりであり、画像形成が射影的であってユークリッド的ではないことを思い出させるものでもある。

## 座標系を混乱させないためのコツ

最も効果的な習慣は、合成が自己チェック可能になる下付き添字の慣例である：$T_{AB}$ を、座標を*座標系 $B$ から座標系 $A$ へ*写す変換とする。すると

$$T_{AC} = T_{AB}\,T_{BC}, \qquad \mathbf{X}_A = T_{AB}\,\mathbf{X}_B$$

であり、隣接する下付き添字が単位のように「打ち消し合う」必要がある。そうでなければ、その式は誤りである ── これにより、姿勢の演算に関するバグのかなりの部分をひと目で見つけることができる。格納された「カメラの姿勢」が $T_{world,cam}$（カメラからワールドへ、すなわちワールド座標系内でのカメラの位置）を意味するのか、その逆 $T_{cam,world}$（投影で使われる外部パラメータ）を意味するのかを明確にすること。両方の慣例がコードベース間で共通して見られる。

## よくある落とし穴

- **Hamilton形式とJPL形式の四元数の慣例**：文献には四元数乗算の互換性のない2つの定義が共存している（EigenとROSはHamilton形式を使う）。これらを混在させると、回転が知らぬ間に共役されてしまう。
- **四元数の格納順序**：`(w, x, y, z)` と `(x, y, z, w)` はライブラリ間で異なる（例：Eigenのコンストラクタとその内部レイアウト、ROSメッセージ）。既知の回転で必ずテストすること。
- **多様体からのドリフト**：回転行列を繰り返し掛け合わせたり四元数を積分すると数値誤差が蓄積する。行列は定期的に再直交化（例えばSVD経由）するか、四元数は再正規化する必要がある。
- **二重被覆下での符号の反転**：$q$ とその近傍にある $-q'$ の間で補間すると、遠回りの経路を取ってしまう。内積が負であれば、まず符号を反転させること。

## SLAMにおける意義

すべてのSLAMシステムは、根本的には $SE(3)$ の要素の軌跡を推定している。相対運動の連結（$T_{world,cam} = T_{world,kf}\,T_{kf,cam}$）、変換の逆算、そして四元数（コンパクトな格納、ROSメッセージ）と回転行列（計算）間の変換は日常的な操作である。座標系の慣例 ── ある変換がどの座標系*から*どの座標系*へ*写すか ── を正しく理解することは、初心者にとって最もよくあるバグの原因であるため、次に進む前にこれを確実に押さえておくこと。

## 関連ノート

- [Logarithm & Exponential](logarithm-and-exponential.md)
- [Pinhole camera model](pinhole-camera-model.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
