# DVSO

> Yang 2018 · [논문](https://arxiv.org/abs/1807.02570)

**한 줄 요약** — Deep Virtual Stereo Odometry는 CNN 시차(disparity) 예측을 DSO에 "가상 스테레오" 측정값으로 공급하여, 단일 카메라만으로 스테레오 수준의 정확도와 미터 단위 스케일을 달성합니다.

## 문제

순수하게 기하학적 단서에만 의존하는 단안(monocular) VO는 "스케일 드리프트에 취약하며, 모션 추정과 3D 재구성을 위해 연속된 프레임 사이에 충분한 모션 시차(motion parallax)를 필요로 합니다." 스테레오 리그는 이 두 문제를 모두 해결하지만, 하드웨어, 보정(calibration), 베이스라인 제약이라는 비용을 수반합니다. DVSO("Deep Virtual Stereo Odometry: Leveraging Deep Depth Prediction for Monocular Direct Sparse Odometry")는 깊이 예측 네트워크가 두 번째 카메라를 대신할 수 있는지를 묻습니다: DSO의 윈도우 기반 광도(photometric) 번들 조정은 그대로 유지하면서, 스테레오 카메라가 제공했을 제약 조건들을 추가하는 방식입니다.

## 방법 및 아키텍처

**StackNet** — 스택형 시차 네트워크입니다: *SimpleNet*(DispNet에서 가져온 ResNet-50 인코더-디코더, skip connection, resize-convolution 업샘플링)은 왼쪽 이미지만으로부터 4개 스케일에서 좌우 시차 맵을 예측합니다. *ResidualNet*(12개의 residual block)은 SimpleNet의 출력과 워핑된 재구성, 그리고 $\ell_1$ 재구성 오차 $e_l$을 입력으로 받아 덧셈적 잔차를 학습합니다: $\mathit{disp}_s=\mathit{disp}_{\mathit{simple},s}\oplus\mathit{disp}_{\mathit{res},s}$. 학습은 스테레오 이미지 쌍에 대해 **준지도(semi-supervised)** 방식으로 수행되며, 스케일별 손실은 자기지도(self-supervised) 광도 항, Stereo DSO의 희소 재구성 결과에 대한 지도(supervised) 항(LiDAR 불필요), 좌우 일관성, 2차 평활성(smoothness), 가림(occlusion) 정규화를 결합합니다. 자기지도 항은 다음과 같습니다.

$$\mathcal{L}_{U}^{\mathit{left}}=\frac{1}{N}\sum_{x,y}\alpha\,\frac{1-\mathrm{SSIM}\big(I^{\mathit{left}},I^{\mathit{left}}_{\mathit{recons}}\big)}{2}+(1-\alpha)\big\lVert I^{\mathit{left}}-I^{\mathit{left}}_{\mathit{recons}}\big\rVert_1,\qquad \alpha=0.84$$

그리고 지도 항은 희소 픽셀 집합 $\Omega_{\mathit{DSO}}$ 위에서 $\mathit{disp}^{\mathit{left}}-\mathit{disp}^{\mathit{left}}_{\mathit{DSO}}$에 대한 역 Huber(berHu) 노름 $\beta_{\epsilon}$을 사용합니다 — 고전적인 스테레오 기하학을 단안 네트워크로 증류(distill)한 것입니다.

**오도메트리** — DVSO는 단안 DSO의 윈도우 기반 직접 번들 조정($N=7$ 키프레임, Schur complement를 통한 마지널라이제이션)을 기반으로 하며, 예측 결과를 두 가지 방식으로 활용합니다. (1) *초기화*: 새로운 각 포인트의 역깊이(inverse depth)는 왼쪽 시차로부터 $d_{\mathbf{p}}=D^{L}(\mathbf{p})/(f_x b)$로 설정되어 안정적이고 미터 단위인 초기화를 제공합니다. 좌우 일관성 검사 $e_{lr}=|D^{L}(\mathbf{p})-D^{R}(\mathbf{p}')|>1$을 통과하지 못한 포인트는 가림일 가능성이 높다고 판단하여 제외됩니다. (2) *가상 스테레오 항*: DSO의 시간적 광도 에너지

$$E_{ij}^{\mathbf{p}}=\omega_{\mathbf{p}}\left\lVert (I_j[\tilde{\mathbf{p}}]-b_j)-\frac{e^{a_j}}{e^{a_i}}(I_i[\mathbf{p}]-b_i)\right\rVert_{\gamma}$$

(어파인 밝기 파라미터 $a,b$, 그래디언트 의존 가중치 $\omega_{\mathbf{p}}$, Huber 노름 $\lVert\cdot\rVert_{\gamma}$를 사용) 옆에, 각 포인트는 예측된 오른쪽 시차 $D^R$로부터 합성된 *가상* 오른쪽 이미지에 대한 잔차도 갖습니다:

$$E_i^{\dagger\mathbf{p}}=\omega_{\mathbf{p}}\left\lVert I_i^{\dagger}[\mathbf{p}^{\dagger}]-I_i[\mathbf{p}]\right\rVert_{\gamma},\qquad I_i^{\dagger}[\mathbf{p}^{\dagger}]=I_i\big[\mathbf{p}^{\dagger}-(D^{R}(\mathbf{p}^{\dagger}),0)^{\top}\big]$$

여기서 $\mathbf{p}^{\dagger}=\Pi_c(\Pi_c^{-1}(\mathbf{p},d_{\mathbf{p}})+\mathbf{t}_b)$는 알려진 가상 베이스라인 $\mathbf{t}_b$를 통해 투영됩니다. 전체 에너지 $E_{photo}=\sum_{i\in\mathcal{F}}\sum_{\mathbf{p}\in\mathcal{P}_i}\big(\lambda E_i^{\dagger\mathbf{p}}+\sum_{j\in\mathrm{obs}(\mathbf{p})}E_{ij}^{\mathbf{p}}\big)$는 Gauss-Newton으로 최소화되며, 이에 따라 삼각측량된 깊이와 예측된 깊이가 최적화 내부에서 강건한(robust) 노름을 통해 서로 절충됩니다 — 실행 시(runtime)에는 오른쪽 이미지 자체가 전혀 사용되지 않습니다.

## 실험 결과

**깊이 추정(KITTI, Eigen split)**: StackNet은 RMSE **4.442 m**(0–80 m 범위)를 달성하여, 대부분의 지표에서 자기지도 최신 기법인 Godard 등(4.935)과 LiDAR 준지도 기법인 Kuznietsov 등(4.621)을 능가합니다. 1–50 m 구간에서는 3.390을 기록하며, 이는 3.518/3.729와 비교됩니다. 추론에는 512×256 해상도에서 40 ms 미만이 소요됩니다. **오도메트리(KITTI)**: 단안 DSO는 시퀀스 00–10에서 평균 65.6%의 병진 드리프트($t_{rel}$)를 보입니다. 베이스라인 튜닝이 없는 DVSO는 1.06%에 도달하며, 전체 시스템($in{,}vs{,}lr{,}tb$)은 **0.77% / 0.20°**를 기록하여 Stereo DSO(0.84/0.20), 루프 클로저가 없는 스테레오 ORB-SLAM2(0.81/0.26), Stereo LSD-VO(1.14/0.40)보다 우수합니다 — 이 모두를 카메라 한 대로 달성합니다. 또한 사용 가능한 모든 시퀀스에서 종단간(end-to-end) 방법(DeepVO, UnDeepVO, SfMLearner)을 능가하며, StackNet을 Godard의 깊이 추정으로 교체하면 평균이 1.51%로 저하되어 깊이 네트워크의 중요성이 확인됩니다.

## SLAM에서의 의미

DVSO는 학습된 깊이가 단안과 스테레오 시각 오도메트리 사이의 정확도 격차를 좁힐 수 있음을 보였으며, "가상 스테레오 카메라로서의 CNN"이라는 발상 — 깊이 사전 정보를 기하학적 항과 동일한 단위를 갖는 광도 잔차로 표현하는 방식 — 은 신경망을 직접(direct) 파이프라인에 통합하는 데 영향력 있는 패턴이 되었습니다. 이는 CNN-SLAM → DVSO → D3VO로 이어지는 계보의 중간 단계이며, D3VO는 학습된 깊이 위에 학습된 포즈와 불확실성을 추가하여 이를 완성했습니다. 또한 기하학이 네트워크를 가르치는 순환 구조(Stereo DSO가 단안 DSO를 업그레이드하는 네트워크를 지도하는 방식)는 이후의 자기 개선(self-improving) 시스템들을 예고하기도 했습니다.

## 관련 문서

- [DSO](dso.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [D3VO](d3vo.md)
- [CNN-SLAM](cnn-slam.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Scale ambiguity](scale-ambiguity.md)
