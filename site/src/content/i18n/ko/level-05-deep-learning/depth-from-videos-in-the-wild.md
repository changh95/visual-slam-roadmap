# Depth from Videos in the Wild

> Gordon 2019 · [논문](https://arxiv.org/abs/1904.04998)

**한 줄 요약** — 이 연구(ICCV 2019)는 카메라 내부 파라미터(렌즈 왜곡 포함)를 깊이, ego-motion, 물체 모션과 함께 학습함으로써 자기지도 깊이 학습을 진정으로 제약 없는 비디오까지 확장했다 — 이를 통해 카메라 정보를 알 수 없는 임의의 비디오로도 학습이 가능해졌다.

## 문제

SfM-Learner 계열의 자기지도 깊이 방법은 한 프레임을 다른 프레임으로 워프하고 광도(photometric) 오차에 페널티를 주는 방식으로 원본 비디오에서 학습한다 — 하지만 이들은 카메라 내부 파라미터가 알려져 있다고 가정하기 때문에 학습을 KITTI 같은 캘리브레이션된 데이터셋으로 제한하며, 장면에 독립적으로 움직이는 물체나 occlusion이 있으면 성능이 저하된다. 목표가 세상의 비디오(임의의 카메라, 임의의 콘텐츠)로부터 기하학을 학습하는 것이라면, 캘리브레이션 가정과 정적 장면 가정 모두를 버려야 한다.

## 방법 및 아키텍처

두 개의 CNN이 오직 프레임 간 일관성만을 supervision으로 하여 함께 학습된다: **깊이 네트워크**(ResNet-18 기반의 UNet, logit을 깊이로 변환하는 softplus 활성화 $z=\log(1+\mathrm{e}^{\ell})$)는 단일 이미지로부터 깊이를 예측하고, **모션 네트워크**(FlowNet에서 영감을 받은 UNet)는 두 프레임으로부터 카메라 회전 $r_0$, 전역 이동 $t_0$, 픽셀별 residual 이동 필드, 그리고 카메라 내부 파라미터를 예측한다 — 각 내부 파라미터는 bottleneck으로부터 자신만의 1x1 convolution을 통해 출력된다. 인접 프레임 사이의 backbone 워프는

$$z^{\prime}p^{\prime}=KRK^{-1}zp+Kt,$$

여기서 $K$는 내부 파라미터 행렬, $p,p^{\prime}$는 homogeneous 픽셀 좌표, $z,z^{\prime}$는 깊이, $R,t$는 모션이다.

**내부 파라미터가 학습 가능한 이유.** 손실은 오직 $Kt$와 $KRK^{-1}$를 통해서만 $K$에 의존한다; 이동은 아무런 신호를 주지 않지만(잘못된 $\tilde{K}$에 $\tilde{t}=\tilde{K}^{-1}Kt$이면 손실이 그대로다), 회전은 신호를 준다 — 어떤 $\tilde{K},\tilde{R}$도 $KRK^{-1}$을 재현할 수 없기 때문이다. 이 논문은 프레임 간 회전으로부터 초점 거리의 허용 오차를 유도한다:

$$\delta f_{x}<\frac{2f_{x}^{2}}{w^{2}r_{y}};\quad\delta f_{y}<\frac{2f_{y}^{2}}{h^{2}r_{x}},$$

여기서 $r_x,r_y$는 회전 각도(라디안), $w,h$는 이미지 크기다 — 회전이 클수록 초점 거리가 더 단단히 고정된다.

**물체 모션.** $R$은 이미지 전체에서 고정된 상수로 유지되고; $t$는 대략적인 "이동 가능성 있음" 마스크 $m$ 안에서만 상수에서 벗어날 수 있다(검출 바운딩 박스들의 합집합이면 충분하며 — 인스턴스 세그멘테이션이나 추적은 필요 없다):

$$t(x,y)=t_{0}+m(x,y)\,\delta t(x,y).$$

**Occlusion을 고려한 손실.** 각 소스 픽셀은 예측된 깊이로 언프로젝션되고, 모션 필드에 의해 이동되고, 재투영된다; 한 픽셀은 변환된 깊이가 $z^{\prime}_{i^{\prime},j^{\prime}}\leq z^{t}_{i^{\prime},j^{\prime}}$를 만족할 때에만 (L1 photometric + 깊이 + 모션 cycle-consistency) 손실에 들어간다 — 즉 목표 깊이 맵보다 *앞에* 놓일 때에만 — 이는 양방향에 대해 대칭적으로 적용된다. SSIM은 깊이 불일치가 클 때 가중치가 낮아진다. **랜덤화된 layer normalization** — 평균과 분산에 곱셈적 Gaussian 노이즈를 더한 layer norm — 은 (배치 크기가 커질수록 정확도가 떨어지는) 비정상적인 거동을 보였던 batch norm을 대체한다.

## 실험 결과

- **KITTI**(Eigen split, 80m 컷오프): *학습된* 내부 파라미터로 Abs Rel 0.128, 주어진 내부 파라미터로는 0.129 — 둘 다 Struct2Depth(0.141), Godard(0.133), GeoNet(0.155)을 능가한다.
- **Cityscapes**: Abs Rel 0.127(학습된 내부 파라미터) 대 Struct2Depth 0.145.
- **Cityscapes + KITTI 풀링**(내부 파라미터 학습)은 둘 다 향상시킨다: CS에서 Abs Rel 0.121, KITTI에서 0.124. 풀링된 데이터셋에서의 ablation: 물체 모션 없으면 0.172/0.130, occlusion-aware 손실 없으면 0.127/0.126, 랜덤화된 layer norm 없으면 0.124/0.127; 세그멘테이션 마스크 대신 바운딩 박스를 써도 동등하다(0.120/0.125).
- **내부 파라미터 정확도(EuRoC)**: 학습된 $f_x = 253.7\pm 1.1$ 대 ground truth 250.2, $f_y = 265.4\pm 1.3$ 대 261.3, 2차 방사 왜곡(quadratic radial distortion) $-0.267\pm 0.003$ 대 $-0.283$ — 모두 몇 픽셀 이내다. EuRoC out-of-sample 깊이(machine-room에서 학습, Vicon Room 2 01에서 테스트): Abs Rel 0.332이며, 이 데이터셋에는 이전 연구가 존재하지 않는다.
- **Odometry(KITTI 09/10)**: 학습되고 보정된 내부 파라미터로 이동 드리프트 $t_{rel}$이 2.7% / 6.8% (Struct2Depth는 10.2% / 28.9%); ATE 0.010 / 0.007.
- YouTube8M 쿼드콥터 비디오로부터 학습된 정성적 깊이 — 서로 다른 시야각과 왜곡을 가진 다수의 미지의 카메라들.

## SLAM에서의 의미

이 논문은 무제한적인 비디오로부터 기하학을 학습하는 데 남아 있던 마지막 실질적 장벽인 캘리브레이션을 제거했다. 카메라 파라미터를 그저 또 하나의 학습 가능한 출력으로 취급하는 아이디어는 학습된 카메라 모델(Neural Ray Surfaces)에서 다시 나타나며, 오늘날의 캘리브레이션 없는 feed-forward 재구성(주어진 내부 파라미터 없이 기하학을 예측하는 DUSt3R 계열 모델들)과도 공명한다. SLAM 실무자에게 이 논문은 또한 photometric 자기지도 안에서 동적 물체와 occlusion을 다루는 방법에 대한 참조점이기도 하다 — direct method의 지속적인 실패 모드다.

## 관련 문서

- [SfM-Learner](sfm-learner.md)
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md)
- [Neural Ray Surfaces](neural-ray-surfaces.md)
- [MonoDepth](monodepth.md)
- [DUSt3R](../level-03-monocular-slam/dust3r.md)
