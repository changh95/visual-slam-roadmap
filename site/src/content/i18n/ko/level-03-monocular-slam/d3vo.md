# D3VO

> Yang 2020 · [논문](https://arxiv.org/abs/2003.01060)

**한 줄 요약** — 깊이, 포즈, 광도 불확실성이라는 세 가지 딥러닝 예측을 DSO 스타일의 직접 VO 프레임워크에 통합하여, 프론트엔드 추적과 백엔드 광도 번들 조정 양쪽 모두에서 학습된 사전 정보를 활용한다.

## 문제

2020년경에는 하나의 학습된 값(CNN-SLAM과 DVSO에서처럼 깊이)만으로도 고전적인 단안 VO를 강화할 수 있다는 것이 명백해졌지만, 순수하게 기하학적인 단안 시스템은 여전히 정확도와 강건성에서 스테레오 및 시각-관성 파이프라인에 뒤처져 있었다. D3VO("Deep Depth, Deep Pose and Deep Uncertainty for Monocular Visual Odometry")는, 희소 직접 오도메트리 프레임워크의 추적 프론트엔드와 윈도우 방식 비선형 최적화 백엔드 양쪽에 딥 네트워크를 *세 가지* 수준에서 동시에 긴밀하게 통합함으로써 이 격차를 얼마나 좁힐 수 있는지를 묻는다.

## 방법 및 아키텍처

**자기지도 네트워크** — DepthNet은 단일 좌측 이미지로부터 깊이 지도 $D_t, D_{t^s}$와 불확실성 $\Sigma_t$를 예측하고; PoseNet은 연결된 이미지 쌍으로부터 상대 포즈 $\mathbf{T}_t^{t'}$와 아핀 밝기 파라미터 $a,b$를 예측한다(둘 다 UNet과 유사한 구조). 학습은 시간적 워프와 정적 스테레오 워프 $I_{t'}\in\{I_{t-1},I_{t+1},I_{t^s}\}$에 걸친 픽셀별 최소 광도 재투영 오차를 최소화하며, 여기에 두 가지가 추가된다. 첫째, 예측된 **밝기 변환**이 즉석에서 조명을 맞춘다, $I_t^{a_{t'},b_{t'}}=a_{t\rightarrow t'}I_t+b_{t\rightarrow t'}$ — 이는 DSO의 아핀 밝기 모델을 학습 시점에 대응시킨 것이다. 둘째, **이질적(heteroscedastic) 무질서적 불확실성(aleatoric uncertainty)**: 손실은 예측된 분산 지도로 감쇠된다,

$$L_{self}=\frac{1}{|V|}\sum_{\mathbf{p}\in V}\frac{\min_{t'}\,r\big(I_t^{a_{t'},b_{t'}},\,I_{t'\rightarrow t}\big)}{\Sigma_t}+\log\Sigma_t$$

따라서 밝기 불변성을 위반하는 픽셀(비-람버시안 표면, 움직이는 물체, 고주파 영역)은 높은 $\Sigma_t$를 얻으며, $r$은 통상적인 SSIM + $\ell_1$ 광도 오차이다.

**오도메트리** — DSO와 같이 키프레임 $\mathcal{F}$와 점 $\mathcal{P}_i$에 대해 $E_{photo}$를 최소화하는 윈도우 방식 희소 광도 번들 조정으로, 표준적인 아핀 밝기 Huber 잔차 $E_{\mathbf{p}j}$를 사용한다. D3VO는 세 가지 수준에서 네트워크를 주입한다:

- *딥 깊이*: 점 깊이는 $d_{\mathbf{p}}=\widetilde{D}_i[\mathbf{p}]$로 미터 단위로 초기화되며, DVSO의 가상 스테레오 항 $E_{\mathbf{p}}^{\dagger}=w_{\mathbf{p}}\lVert I_i^{\dagger}[\mathbf{p}^{\dagger}]-I_i[\mathbf{p}]\rVert_{\gamma}$은 최적화된 깊이를 예측값과 일치하도록 유지한다: $E_{photo}=\sum_{i\in\mathcal{F}}\sum_{\mathbf{p}\in\mathcal{P}_i}\big(\lambda E_{\mathbf{p}}^{\dagger}+\sum_{j\in\mathrm{obs}(\mathbf{p})}E_{\mathbf{p}j}\big)$.
- *딥 불확실성*: DSO의 경험적 기울기 기반 잔차 가중치는 학습된 지도로 대체된다,

$$w_{\mathbf{p}}=\frac{\alpha^2}{\alpha^2+\lVert\widetilde{\Sigma}(\mathbf{p})\rVert_2^2}$$

  이는 반사, 움직이는 물체, 깊이 불연속 경계의 가중치를 낮춘다.
- *딥 포즈*: PoseNet의 예측이 등속 운동 모델을 대체하여 프론트엔드 직접 이미지 정렬을 초기화하며(현재 프레임과 이전 프레임에 대한 작은 팩터 그래프를 통해), 연속된 키프레임 간의 상대 포즈 사전 정보로서 백엔드에 진입한다,

$$E_{pose}=\sum_{i\in\mathcal{F}}\mathrm{Log}\big(\widetilde{\mathbf{T}}_{i-1}^{i}\,\mathbf{T}_{i}^{i-1}\big)^{\top}\,\Sigma_{\tilde{\xi}}^{-1}\,\mathrm{Log}\big(\widetilde{\mathbf{T}}_{i-1}^{i}\,\mathbf{T}_{i}^{i-1}\big),\qquad E_{total}=E_{photo}+w\,E_{pose}$$

이는 IMU 프리인티그레이션(pre-integration) 사전 정보와 유사하지만 — 카메라 하나만으로 이루어진다. $E_{total}$은 가우스-뉴턴으로 최소화된다.

## 실험 결과

**깊이**: KITTI Eigen split에서 전체 네트워크는 동일한 스테레오+단안 자기지도 하에서 RMSE **4.485**를 달성하며, 이는 Monodepth2의 4.750과 대비되고, 희소 깊이 감독이 필요한 DVSO(4.442)에 근접한다; EuRoC V2_01에서는 RMSE 0.337을 기록하며 Monodepth2의 0.370과 대비되고, 밝기 변환이 이 이득의 대부분을 제공한다. **오도메트리(KITTI)**: 테스트 분할(01, 02, 06, 08, 09, 10)에서 평균 $t_{rel}$은 **0.82%**로, Stereo DSO 0.89, 스테레오 ORB-SLAM2 0.91, 단안 DSO 65.8과 대비된다; Seq. 09/10에서 D3VO는 0.78/0.62를 기록하며, DVSO의 0.83/0.74보다 낫고 모든 종단간(end-to-end) 방법을 크게 앞선다. **EuRoC MAV**: 5개의 테스트 시퀀스에 대한 평균 RMSE ATE **0.10 m** — IMU를 전혀 사용하지 않으면서도 VI-DSO(0.11), VINS-Mono(0.18), OKVIS(0.28), ROVIO(0.24), MSCKF(0.25)보다 우수하며, 스테레오-관성 Basalt(4개 시퀀스 부분집합에서 0.08)와 대등하다. 어블레이션 결과는 딥 포즈가 격렬한 운동 시퀀스인 V1_03과 V2_03을 구해내는 요소임을 보여준다(Dd+Dp로 각각 0.63→0.13, 0.52→0.19).

## SLAM에서의 의미

D3VO는 CNN-SLAM → DVSO → D3VO로 이어지는 "직접 VO 백엔드 내부의 딥 사전 정보"라는 계보의 정점이다: 각 단계는 고전적 파이프라인에 더 많은 학습된 값을 통합했다. 단일 패시브 카메라로 스테레오 및 시각-관성 시스템과 대등한 성능을 낸 것은, 학습된 사전 정보가 추가 센서를 대체할 수 있다는 지금까지 가장 강력한 증거였으며, 그 학습된 불확실성 가중 잔차와 네트워크-포즈-를-IMU-사전-정보로 사용하는 설계는 이후 하이브리드 시스템에서 영향력 있는 패턴이 되었다.

## 관련 문서

- [DSO](dso.md)
- [DVSO](dvso.md)
- [CNN-SLAM](cnn-slam.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Self-supervised depth](self-supervised-depth.md)
