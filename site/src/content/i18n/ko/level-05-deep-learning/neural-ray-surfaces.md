# Neural Ray Surfaces

> Vasiljevic 2020 · [논문](https://arxiv.org/abs/2008.06630)

**한 줄 요약** — 자기지도 depth-및-ego-motion 학습에서 고정된 pinhole 투영을 학습된 픽셀별 ray surface로 대체하여, 동일한 광도 학습 프레임워크가 캘리브레이션 없이 어안(fisheye), 반사굴절(catadioptric), 심지어 수중 카메라에서도 동작하도록 한다.

## 문제

자기지도 학습은 깊이와 ego-motion 추정을 위한 강력한 도구가 되었지만, 이 계열의 모든 방법은 하나의 중요한 숨은 한계를 공유한다: view-synthesis 단계가 *알려진 파라메트릭 카메라 모델* — 거의 항상 표준 pinhole 기하 — 을 가정한다는 것이다. 이 때문에 이 접근법은 그 가정에서 크게 벗어난 촬영 시스템(반사굴절 카메라, 수중 촬영, 곡면 앞유리 뒤의 카메라)에서는 완전히 실패한다. 파라메트릭 왜곡 모델은 근사적으로만 정확하고, 카메라 종류마다 새로운 미분 가능 투영이 필요하며, 일부 환경에서는 아예 존재하지도 않는다. pinhole 내부 파라미터를 학습하는 것(Gordon 2019)조차 이런 경우들을 다루지 못한다.

## 방법 및 아키텍처

표준 자기지도 설정(Zhou et al.)이 유지된다: depth 네트워크 $f_d$, 타깃 프레임과 컨텍스트 프레임 사이의 $\mathbf{X}_{t\to c}\in SE(3)$를 예측하는 pose 네트워크 $f_{\mathbf{x}}$, 그리고 광도 워프

$$\hat{\mathbf{p}}_{t}=\pi_{c}\big(\mathbf{R}_{t\rightarrow c}\,\phi_{t}(\mathbf{p}_{t},d_{t})+\mathbf{t}_{t\rightarrow c}\big),$$

는 $\mathcal{L}=\mathcal{L}_{p}+\lambda_{d}\mathcal{L}_{d}$(컨텍스트 프레임에 대한 픽셀별 최솟값과 auto-masking을 포함한 SSIM+L1 외관 손실, 그리고 경계 인지 평활화)로 학습된다. 여기서 바뀌는 것은 역투영 $\phi$와 투영 $\pi$이다. Grossberg와 Nayar의 일반 카메라 모델을 따라, 각 픽셀은 단위 시선 벡터(unit viewing ray)를 갖는다: depth 네트워크의 encoder를 공유하는 두 번째 decoder가 ray surface $\hat{\mathbf{Q}}=f_r(I)$를 예측한다.

**역투영(Unprojection)**은 closed-form이다 — 카메라 중심 $\mathbf{S}$로부터의 ray를 깊이로 스케일한다(중심 카메라의 경우 원점으로 설정):

$$\mathbf{P}(u,v)=\mathbf{S}(u,v)+\hat{D}(u,v)\,\hat{\mathbf{Q}}(u,v).$$

**투영(Projection)**에는 closed-form이 없다: 3D 점 $\mathbf{P}_j$는 방향 $\mathbf{r}_{c\to j}=\mathbf{P}_{j}-\mathbf{S}_{c}$와 가장 잘 정렬되는 ray를 가진 컨텍스트 픽셀에 매칭되어야 한다,

$$\mathbf{p}_{i}^{*}=\arg\max_{\mathbf{p}_{i}\in I_{c}}\langle\hat{\mathbf{Q}}_{c}(\mathbf{p}_{i})\,,\mathbf{r}_{c\to j}\rangle,$$

이는 $O((HW)^2)$이면서 미분 불가능하다. 세 가지 방법으로 이를 학습 가능하게 만든다: (1) **softmax 연관** — 유사도 텐서 $\mathbf{M}_{ij}$에 대한 argmax를 온도 $\tau$의 softmax $\tilde{\mathbf{M}}$으로 대체하고, $\tau$를 one-hot에 가깝도록 어닐링한 뒤 픽셀 인덱스를 읽어 spatial transformer network로 샘플링한다; (2) **잔차 ray-surface 템플릿** — 고정된 템플릿 $\mathbf{Q}_0$(캘리브레이션이 없는 경우 더미 내부 파라미터 $f_x=c_x=W/2$, $f_y=c_y=H/2$를 가진 pinhole surface) 주변에서 $\hat{\mathbf{Q}}=\mathbf{Q}_{0}+\lambda_{r}\hat{\mathbf{Q}}_{r}$을 학습하며, $\lambda_r$을 10 에포크에 걸쳐 0에서 1로 늘린다 — 이 pinhole 사전(prior)은 반사굴절 데이터에서도 학습을 안정화시킨다; (3) **패치 기반 연관** — 학습 중 절반 해상도에서 타깃 픽셀 주변 $41\times 41$ 그리드로 탐색 범위를 제한한다. 테스트 시에는 근사가 전혀 필요 없다; 전체 해상도의 ray surface가 네트워크로부터 바로 나온다.

## 실험 결과

- **KITTI**(거의 pinhole에 가까운 데이터에서의 정합성 검증, 최대 80m): 완전히 학습된 ray surface(RS-L)를 사용한 NRS-ResNet은 Abs Rel 0.134 / RMSE 5.263에 도달하며 — Gordon et al.의 학습된 pinhole(0.128 / 5.230)에 근접한다; NRS-PackNet은 Abs Rel 0.127 / Sq Rel 0.667 / RMSE 4.049로 향상된다. 학습된 surface는 프레임 간에 안정적이다(테스트 세트 전체에서 변동 계수 < 2.5%).
- **Multi-FOV(합성 어안)**: Abs Rel이 pinhole 모델의 0.441에서 NRS의 0.225로 감소한다 — 51% 감소($\delta_{1.25}$ 0.336 → 0.593).
- **OmniCam(반사굴절, 360° FOV)**: 반사굴절 비디오에서 odometry를 학습한 최초의 자기지도 단안 방법이다 — ATE 0.035, 동일 프레임워크에 pinhole 투영을 쓴 경우 0.408로 발산한다.
- **KITTI odometry**(시퀀스 09/10, 5-스니펫 ATE): $0.0150\pm 0.0301$ / $0.0103\pm 0.0073$로, 카메라에 대한 사전 지식이 전혀 없이도 캘리브레이션된 pinhole 모델과 비슷한 수준이다.
- 수중 동굴 시퀀스와 앞유리 뒤 어안 대시캠 시퀀스에서의 정성적 결과: 정류화된(rectified) pinhole 기준선은 여기서 의미 있는 예측을 전혀 만들어내지 못한다.

모든 실험은 동일한 아키텍처와 하이퍼파라미터를 사용한다 — 학습 비디오만 바뀐다.

## SLAM에서의 의미

로봇은 점점 더 pinhole 모델로는 잘 기술되지 않는 카메라(드론과 자동차의 어안, 반사굴절 리그)를 장착하고 있으며, 각 유닛을 캘리브레이션하는 것은 배포 비용이다. Neural Ray Surfaces는 카메라 모델 자체를 또 하나의 학습 가능한 구성 요소 — 미분 가능한 픽셀별 ray field — 로 다룰 수 있음을 보여, 자기지도 depth/ego-motion 도구를 임의의 광학계로 확장했다. 이는 주어진 센서가 무엇이든 적응하는 SLAM front-end로 가는 한 걸음이며, 다양한 광학계에 걸친 캘리브레이션 없는 기하 학습의 기준점이다.

## 관련 문서

- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — 이 연구가 학습으로 대체하는 고전적 모델들
- [SfM-Learner](sfm-learner.md) — 이 연구가 일반화하는 자기지도 depth+ego-motion 프레임워크
- [Depth from Videos in the Wild](depth-from-videos-in-the-wild.md) — 비디오로부터 내부 파라미터를 학습하는 밀접하게 관련된 아이디어
- [MonoDepth](monodepth.md) — 깊이를 위한 광도 자기지도의 기원
- [Camera calibration](../level-01-beginner/camera-calibration.md) — NRS가 우회하는 수동 캘리브레이션 과정
