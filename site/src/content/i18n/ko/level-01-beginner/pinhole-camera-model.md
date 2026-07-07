# Pinhole camera model

핀홀 카메라는 SLAM에서 사용되는 대부분의 카메라에 대한 표준 모델입니다. 3D 점에서 나온 빛이 작은 구멍(광학 중심)을 통과하여 이미지 평면에 투영됩니다. 이 모델은 **이미지 투영**, 즉 3D 세계의 한 점이 어떻게 2D 픽셀로 대응되는지를 기술합니다.

## 좌표계

네 개의 좌표계가 관여합니다.

1. **월드 프레임** $\mathbf{X}_w = [X_w, Y_w, Z_w]^T$: 고정된 기준 프레임.
2. **카메라 프레임** $\mathbf{X}_c = [X_c, Y_c, Z_c]^T$: $Z_c$가 광학 축(전방을 향함).
3. **이미지 평면** $\mathbf{x}' = [x', y']^T$: 이미지 평면상의 미터 단위 좌표.
4. **픽셀 프레임** $\mathbf{u} = [u, v]^T$: 이산 픽셀 좌표.

일반적인 관례는 $X_c$가 오른쪽, $Y_c$가 아래쪽, $Z_c$가 전방을 향하며, 이는 이미지 왼쪽 상단 모서리를 원점으로 하는 픽셀 좌표 $u$(오른쪽), $v$(아래쪽)와 대응합니다.

## 투영 파이프라인

**1단계: 월드에서 카메라로.** 강체 변환(외부 파라미터)이 월드 점을 카메라 프레임으로 변환합니다.

$$\mathbf{X}_c = R\mathbf{X}_w + \mathbf{t}$$

**2단계: 카메라에서 이미지 평면으로 (원근 분할).**

$$x' = \frac{X_c}{Z_c}, \qquad y' = \frac{Y_c}{Z_c}$$

깊이로 나누는 이 연산이 원근 효과의 원천이며, 비전 기하학을 흥미롭게 만드는 비선형성의 근원이기도 합니다. 좌표 $(x', y')$는 **정규화 좌표(normalized coordinates)**라 불립니다: 내부 파라미터를 제거하고 남은 것이 바로 이것이며, 대부분의 기하학적 유도(Essential 행렬, 삼각측량)는 이 프레임에서 가장 깔끔하게 이루어집니다.

**3단계: 이미지 평면에서 픽셀로 (내부 파라미터).**

$$u = f_x \cdot x' + c_x, \qquad v = f_y \cdot y' + c_y$$

여기서 $f_x, f_y$는 픽셀 단위의 초점 거리이고 $(c_x, c_y)$는 주점(principal point)입니다. 픽셀 단위 초점 거리는 물리적 초점 거리 $f$(mm 단위)와 픽셀 크기를 연결합니다: $f_x = f / (\text{픽셀 너비})$이며, 이 때문에 픽셀이 정사각형이 아니면 $f_x \neq f_y$가 됩니다.

## 행렬 형태

동차 좌표를 이용해 모든 단계를 결합하면 다음과 같습니다.

$$Z_c \begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = \underbrace{\begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix}}_{\mathbf{K}} \begin{bmatrix} R & \mathbf{t} \end{bmatrix} \begin{bmatrix} X_w \\ Y_w \\ Z_w \\ 1 \end{bmatrix}$$

행렬 $\mathbf{K}$는 **카메라 내부 파라미터 행렬**이며, $P = \mathbf{K}[R|\mathbf{t}]$는 $3 \times 4$ **카메라 투영 행렬**입니다. 일반적인 경우 $\mathbf{K}$는 스큐(skew) 파라미터를 포함하지만(보통 현대 카메라에서는 0), 이는 예외적입니다.

이 파이프라인을 NumPy로 그대로 옮긴 코드는 다음과 같습니다.

```python
import numpy as np

def project(K, R, t, X_w):
    X_c = R @ X_w + t          # world -> camera
    x_n = X_c[:2] / X_c[2]     # perspective division (normalized coords)
    u   = K[0, 0] * x_n[0] + K[0, 2]
    v   = K[1, 1] * x_n[1] + K[1, 2]
    return np.array([u, v])
```

## 역투영: 역과정은 하나의 광선

투영은 하나의 차원을 파괴합니다: 픽셀은 3D 점을 결정하지 못하고, 오직 **광선(ray)**만을 결정합니다. 픽셀 $\mathbf{u}$가 주어지면, 카메라 프레임에서 가능한 3D 점들의 광선은 다음과 같습니다.

$$\mathbf{X}_c(\lambda) = \lambda\,\mathbf{K}^{-1}\begin{bmatrix}u\\v\\1\end{bmatrix}, \qquad \lambda > 0$$

누락된 깊이 $\lambda$를 복원하는 것이 바로 삼각측량(다중 뷰), 스테레오(두 번째 보정 카메라), 또는 깊이 센서가 제공하는 역할입니다. 화각도 동일한 기하학에서 얻어집니다: 이미지 너비 $W$에 대해 $\mathrm{FoV}_x = 2\arctan\!\big(\tfrac{W}{2f_x}\big)$입니다.

## 흔한 함정

- **축 관례**: 컴퓨터 비전은 $Z$가 전방, $Y$가 아래쪽인 관례를 사용하지만, 로보틱스(ROS)의 바디 프레임은 $X$가 전방, $Z$가 위쪽인 관례를 사용합니다. 이를 혼동하는 것은 카메라를 로봇에 연결할 때 흔히 발생하는 첫 번째 버그입니다.
- **주점은 이미지 중심이 아니다**: $(c_x, c_y)$는 $(W/2, H/2)$에 근접하지만 가정하지 말고 반드시 보정해야 합니다.
- **원근 분할을 잊는 것**: 투영을 직접 구현할 때 $P\mathbf{X}$의 동차 결과를 세 번째 성분으로 나누어야 합니다.
- **왜곡된 픽셀에 모델을 그대로 적용하는 것**: 실제 이미지는 먼저 왜곡을 제거해야 합니다(또는 왜곡 모델을 $\pi$에 포함시켜야 합니다). 순수한 핀홀 방정식은 이상적인 좌표에서만 성립합니다.

## SLAM에서의 의미

이 모델이 정의하는 투영 함수 $\pi(\cdot)$는 모든 visual SLAM 시스템의 핵심입니다: 번들 조정(bundle adjustment)에서 최소화되는 재투영 오차 $\mathbf{e} = \mathbf{z} - \pi(T\mathbf{X})$는 결국 "지도 점을 핀홀 모델로 투영하고, 측정된 픽셀과 비교한다"는 것에 다름 아닙니다. 삼각측량, PnP, 에피폴라 기하학 모두 동일한 방정식에서 유도되므로, 이 파이프라인을 처음부터 유도해 보는 것이 이 단계에서 가장 값진 연습입니다.

## 관련 문서

- [Camera calibration](camera-calibration.md)
- [Camera models beyond pinhole](camera-models-beyond-pinhole.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Triangulation](triangulation.md)
- [Rigid body motion](rigid-body-motion.md)
- [Camera device](../level-02-getting-familiar/camera-device.md)
