# Lietorch

> Teed 2021 · [논문](https://github.com/princeton-vl/lietorch)

**한 줄 요약** — SO(3), RxSO3, SE(3), Sim(3) 등 3D 변환 그룹을 미분 가능한 1급 텐서 타입으로 구현한 PyTorch 라이브러리로, 각 그룹 원소의 탄젠트 공간에서 역전파를 수행한다(논문: "Tangent Space Backpropagation for 3D Transformation Groups", Teed & Deng, CVPR 2021, [arXiv:2103.12032](https://arxiv.org/abs/2103.12032)).

## 문제

카메라 pose를 추정하거나 정제하는 심층 신경망은 회전과 rigid-body 변환을 미분해야 하지만, 이들은 평평한 파라미터 공간이 아니라 휘어진 매니폴드 위에 존재한다. 표준적인 "embedding space" 자동미분(행렬 원소나 quaternion 성분을 직접 미분)은 논문이 분석하는 두 가지 실패 모드를 갖는다: $\psi / \sin\psi$와 같이 수치적으로 불안정한 항 — 이 항의 Taylor 근사 기울기는 연산마다 수작업으로 조정해야 한다 — 그리고 완전히 특이한(singular) 기울기 — 예를 들어 SO(3) 로그의 $\cos^{-1}\big((\mathrm{tr}(X)-1)/2\big)$는 identity에서 미분이 정의되지 않아, PyTorch3D의 행렬 로그는 그 지점에서 NaN 기울기를 반환한다. Lietorch 이전에는 모든 딥 SLAM 프로젝트가 이 매니폴드 연산 기계를 각자 손으로 재구현해야 했다.

## 방법 및 아키텍처

- **텐서 타입으로서의 Lie 그룹.** `lietorch.SE3`는 SE(3)에 대해 `torch.Tensor`가 스칼라에 대해 하는 것과 같은 역할을 한다: 인덱싱, reshape, 브로드캐스팅, 임의의 배치 shape을 지원하는 그룹 원소들의 다차원 배열이다. 회전은 unit quaternion으로 저장되며, 모든 그룹 연산(Exp, Log, Inv, Mul, Adj, AdjT, 점에 대한 Act)은 CUDA와 C++ 커널을 모두 갖추고 커스텀 기울기를 지닌다.
- **탄젠트 공간 미분.** 매니폴드는 덧셈에 대해 닫혀 있지 않으므로, 일반적인 미분은 retraction $\xi \oplus X = \operatorname{Exp}(\xi) \circ X$와 그 역 $X \ominus Y = \operatorname{Log}(X \circ Y^{-1})$를 이용해 일반화된다:

$$Df(X)[\mathbf{v}] = \lim_{t\to 0} \frac{f(t\mathbf{v} \oplus X) \ominus f(X)}{t},$$

  이는 $X$의 탄젠트 공간에서의 섭동을 $f(X)$의 탄젠트 공간에서의 섭동과 연관짓는다. 역모드 자동미분은 chain rule $\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial Y} \mathbf{J}$에 따라 행벡터 기울기를 전파하는데, 여기서 $\mathbf{J}$는 탄젠트 공간 Jacobian이다 — SO(3)의 경우 autograd의 9차원 embedding 기울기 대신 3차원 기울기가 된다.
- **연산별 해석적 Jacobian.** 그룹 곱 $Z = X \circ Y$의 경우 backward pass는 단순히 $\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial Z}$이고 $\frac{\partial\mathcal{L}}{\partial Y} = \frac{\partial\mathcal{L}}{\partial Z}\,\mathbf{Adj}_X$이다 (SO(3)의 $R$에 대해 $\mathbf{Adj}_R = R$). 로그 사상 $\phi = \operatorname{Log}(X)$의 경우, BCH 공식에 의해 $\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial\phi}\,\mathbf{J}_l^{-1}(\phi)$이며, 역 left Jacobian $\mathbf{J}_l^{-1}$은 SO(3)/SE(3)에 대해서는 닫힌 형태로 존재한다. 해석적 left Jacobian이 없는 Sim(3)의 경우, 급수 $\mathbf{J}_l^{-1}(\phi) = \sum_n (-1)^n \frac{B_n}{n!} (\phi^{\curlywedge})^n$ ($B_n$은 Bernoulli 수)를 원하는 정밀도까지 절단한다. 따라서 backward pass는 forward pass만큼 잘 작동한다 — 특이 기울기도 없고, 조정된 Taylor 임계값도 필요 없다.
- **딥 SLAM에 바로 적용.** 목표로 하는 계산 그래프는 정확히 학습된 SLAM의 "반복적 갱신" 패턴이다 — 네트워크가 증분 $\delta_k$를 예측하여 $e^{\delta_1}e^{\delta_2}e^{\delta_3}\mathbf{G}_1$로 적용되며, geodesic 손실로 학습된다:

$$\mathcal{L}(\mathbf{T}_1,\ldots,\mathbf{T}_K) = \sum_k \|\operatorname{Log}(\mathbf{T}_k^{-1} \cdot \mathbf{T}^{*})\|,$$

  여기서 $\mathbf{T}^{*}$는 ground-truth pose다 — 저자들은 이 손실이 표준 역전파로는 구현하기 어렵다고 지적한다.

## 실험 결과

- **역기구학(inverse kinematics)** (1000회 실행, $10^{-4}$ tolerance로 1000 iteration 이내 수렴): naive PyTorch+Autograd는 문제의 0%에서 수렴; 수작업 조정된 Autograd는 99.8%(SO(3))/100%에 도달; Lietorch는 별도 조정 없이 100%에서 수렴한다.
- **Pose graph 최적화** (Carlone et al. benchmark; Riemannian gradient-descent 초기화 + 7회 Gauss–Newton step): parking-garage, sphere, torus, cube에서 chordal relaxation의 전역 최적 cost와 일치하는 반면, g2o와 GTSAM 단독으로는 나쁜 local minima에 빠진다 (예: Sphere-A: $1.49\times 10^{6}$ vs g2o의 $5.32\times 10^{10}$); 가장 큰 문제(cube, $n{=}8000$, $m{=}22236$)에서 초기화는 1.21초 걸리는 반면 chordal+gtsam은 17.9초, gradient+gtsam은 26.4초, Autograd는 18.3초 걸린다 — 더 단순한 GPU backward pass 덕분에 embedding-space Autograd 대비 일관되게 10–15배 빨라진다.
- **RGB-D Sim(3) registration** (TartanAir, RAFT 스타일 네트워크 + iteration당 3회의 미분 가능한 Gauss–Newton 갱신): 조정하지 않은 Autograd는 NaN을 산출(성공률 0%); Lietorch는 약 79%의 이동 / 91%의 회전 / 98%의 scale 성공률에 도달한다 — similarity 변환을 통한 역전파의 첫 실증이며, 1차/2차/3차 left-Jacobian 근사가 거의 동일한 성능을 보인다.
- **RGB-D SLAM** (geodesic pose 손실로 재구현된 DeepV2D, NYU+ScanNet으로 학습): TUM RGB-D benchmark에서 평균 ATE RMSE가 0.105 m로 개선되며, 이는 원래 DeepV2D의 0.113 m, DeepTAM의 0.116 m보다 낫다.

## SLAM에서의 의미

pose 최적화를 통해 학습하는 모든 딥 SLAM 또는 딥 VO 시스템은 SE(3) 원소에 대한 미분이 필요하며, 이를 손으로 정확히 구현하는 것은 오류가 발생하기 쉽다(특이점에서의 NaN, 매니폴드 이탈 drift). Lietorch는 매니폴드에 부합하는 미분을 재사용 가능하고 검증된 라이브러리로 만들었으며, DROID-SLAM과 DPVO를 비롯한 여러 시스템의 pose 레이어를 제공한다. Theseus(미분 가능한 비선형 최소자승법)와 함께, PyTorch에서 미분 가능한 기하학적 최적화를 위한 표준 도구 상자를 이룬다.

## 관련 문서

- [Theseus](theseus.md) — 동일한 요구에서 만들어진 미분 가능한 비선형 최소자승법
- [DROID-SLAM](droid-slam.md) — Lietorch 기반의 대표적 시스템
- [DPVO](dpvo.md) — 희소 patch 기반 후속 시스템으로, 역시 Lietorch 기반
- [DeepV2D](deepv2d.md) — Lietorch의 geodesic 손실로 재학습된 딥 RGB-D SLAM 시스템
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — 기저가 되는 수학
- [Differentiability](differentiability.md) — 딥 SLAM에서 기하학을 통한 기울기가 중요한 이유
