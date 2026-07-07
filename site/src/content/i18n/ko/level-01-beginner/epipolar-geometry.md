# Epipolar geometry

동일한 장면이 두 개의 서로 다른 시점에서 관측될 때, **에피폴라 제약**은 한 이미지에서 3D 점의 투영이 다른 이미지의 어느 위치---**에피폴라 선**이라 불리는 선---에 나타날 수 있는지를 제한합니다. 이는 2뷰 재구성과 단안 SLAM 초기화의 기하학적 기반입니다.

## 기하학

두 카메라 중심과 3D 점은 **에피폴라 평면**을 형성합니다. 이 평면은 각 이미지를 에피폴라 선으로 자릅니다. 두 카메라 중심을 잇는 선(베이스라인)이 각 이미지를 관통하는 점이 **에피폴**입니다. 한 이미지 안의 모든 에피폴라 선은 그 이미지의 에피폴을 지나갑니다. 실용적인 결론: 이미지 1의 한 특징점이 주어지면, 이미지 2에서의 매칭점은 알려진 선 위에 있어야 합니다---2D 탐색이 1D로 축소됩니다.

## Essential 행렬

두 개의 *보정된* 카메라(내부 파라미터를 아는 카메라)에 대해, **Essential 행렬** $E$는 카메라 간의 상대 회전 $R$과 이동 $\mathbf{t}$를 인코딩합니다:

$$E = [\mathbf{t}]_\times R$$

여기서 $[\mathbf{t}]_\times$는 $\mathbf{t} = [t_1, t_2, t_3]^T$의 왜대칭 행렬입니다:

$$[\mathbf{t}]_\times = \begin{bmatrix} 0 & -t_3 & t_2 \\ t_3 & 0 & -t_1 \\ -t_2 & t_1 & 0 \end{bmatrix}$$

정규화된 카메라 좌표 $\mathbf{x}_1$(카메라 1)과 $\mathbf{x}_2$(카메라 2)에서 관측된 3D 점에 대한 **에피폴라 제약**:

$$\mathbf{x}_2^T E\, \mathbf{x}_1 = 0$$

**이 식이 어디서 나오는가.** 광선 방향 $\mathbf{x}_2$, $R\mathbf{x}_1$, 그리고 베이스라인 $\mathbf{t}$는 공평면이어야 합니다(모두 에피폴라 평면 안에 있음). 세 벡터의 공평면성은 스칼라 삼중곱이 0이 됨을 의미합니다: $\mathbf{x}_2 \cdot (\mathbf{t} \times R\mathbf{x}_1) = 0$이고, 외적을 $[\mathbf{t}]_\times$로 쓰면 정확히 $\mathbf{x}_2^T E\,\mathbf{x}_1 = 0$이 됩니다.

$E$는 **5 자유도**를 가집니다(회전에 3, 이동에 3, 스케일로 인해 1을 뺌). 이것이 최소 solver가 5개의 대응점을 필요로 하는 이유입니다. 그 SVD는 $\Sigma = \mathrm{diag}(\sigma, \sigma, 0)$이라는 특별한 형태를 가집니다---두 개의 같은 특이값과 하나의 0.

**$E$에서 포즈 복원.** $\Sigma = \mathrm{diag}(1,1,0)$인 $E = U\Sigma V^T$가 주어지면, 4개의 후보 포즈는 $[R_1|\pm\mathbf{t}]$와 $[R_2|\pm\mathbf{t}]$이며 다음과 같습니다:

$$R_1 = UWV^T, \quad R_2 = UW^TV^T, \quad \mathbf{t} = \mathbf{u}_3, \quad W = \begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}$$

참인 포즈는 **정합성 검사(cheirality check)**로 판별됩니다: 삼각측량된 점은 두 카메라 모두의 전방에 있어야 합니다. 이동은 스케일까지만 복원됩니다---단안 스케일 모호성의 근본 원인입니다.

## Fundamental 행렬

두 개의 *미보정* 카메라에 대해, **Fundamental 행렬** $F$는 원본 픽셀 좌표 $\mathbf{p}_1, \mathbf{p}_2$를 연결합니다:

$$F = \mathbf{K}_2^{-T} E\, \mathbf{K}_1^{-1}, \qquad \mathbf{p}_2^T F\, \mathbf{p}_1 = 0$$

$F$는 계수 2인 $3 \times 3$ 행렬로 7 자유도를 가집니다(스케일까지 정의되며 $\det(F) = 0$). 8점 알고리즘(Longuet-Higgins, 1981)을 통해 8개 이상의 점 대응에서 추정할 수 있습니다. 점 $\mathbf{p}_1$에 대한 이미지 2에서의 에피폴라 선은 단순히 $\boldsymbol{\ell}_2 = F\,\mathbf{p}_1$이며, 에피폴은 $F$와 $F^T$의 널 벡터입니다.

## 호모그래피

장면의 모든 점이 공평면에 있거나, 카메라가 순수 회전만 겪을 때, **호모그래피** $H$는 이미지 점들을 직접 사상합니다:

$$\lambda\mathbf{p}_2 = H\,\mathbf{p}_1, \qquad H \in \mathbb{R}^{3 \times 3}$$

호모그래피는 ORB-SLAM에서 지도 초기화에 사용됩니다: 경쟁하는 호모그래피와 Fundamental 모델이 특징점 매칭에 피팅되고, 더 좋은 점수를 가진 쪽이 선택됩니다---평면과 일반적인 장면 모두를 다루는 강건한 방법입니다.

## 주의해야 할 퇴화 사례

- **순수 회전**($\mathbf{t} = \mathbf{0}$): $E = [\mathbf{0}]_\times R = 0$---Essential 행렬이 정의되지 않으며 어떤 깊이도 복원할 수 없습니다. 대신 호모그래피가 이 움직임을 설명합니다.
- **평면 장면**: 단일 평면에서 나온 대응점들은 호모그래피를 만족하며, $F$/$E$ 추정이 모호해집니다. 이것이 정확히 ORB-SLAM이 두 모델 모두를 피팅하는 이유입니다.
- **매우 짧은 베이스라인**: $E$ 추정은 수치적으로 불안정해지고 삼각측량된 깊이는 무의미해집니다. 초기화는 충분한 시차가 생길 때까지 기다립니다.

## SLAM에서의 의미

에피폴라 기하학은 단안 SLAM 시스템이 스스로를 부트스트랩하는 방식입니다: 2D-2D 특징점 매칭만으로 상대 카메라 포즈를 복원하고 첫 지도점들을 삼각측량합니다. 또한 스테레오 매칭과 가이드 특징점 매칭을 위한 1D 탐색 제약으로 에피폴라 선을 제공하며, 에피폴라 제약은 잘못된 매칭을 걸러내기 위한 RANSAC 내부의 표준 기하학적 검증입니다.

## 실습

- [Epipolar geometry hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_02)
- [Homography hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_04)

## 관련 문서

- [Pinhole camera model](pinhole-camera-model.md)
- [Triangulation](triangulation.md)
- [Rigid body motion](rigid-body-motion.md)
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md)
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md)
