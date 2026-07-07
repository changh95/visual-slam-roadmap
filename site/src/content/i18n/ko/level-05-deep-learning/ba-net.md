# BA-Net

> Tang 2019 · [논문](https://arxiv.org/abs/1806.04807)

**한 줄 요약** — BA-Net (ICLR 2019)은 bundle adjustment를 미분 가능한 네트워크 레이어로 만들어, 학습된 feature pyramid와 컴팩트한 기저 깊이 맵(basis-depth-map) 파라미터화를 통해 feature-metric BA로 dense SfM을 풀며, 종단간으로 학습됩니다.

## 문제

전통적인 SfM 파이프라인은 모듈형입니다 — 특징 추출, 매칭, bundle adjustment가 각각 독립적으로 설계되고 최적화되므로, 특징이 자신이 봉사하는 기하학적 추정을 위해 최적화되는 일이 결코 없습니다. Geometric BA는 코너/블롭만 사용하여 매칭 이상치(outlier)에 취약하고, photometric (direct) BA는 모든 픽셀을 사용하지만 목적함수가 매우 비선형(non-convex)이어서 초기화, 노출 변화, 움직이는 물체에 민감합니다. 학습과 BA를 통합하는 데 걸림돌은 BA가 두 가지 미분 불가능한 if-else 결정을 포함하는 반복적 Levenberg–Marquardt (LM) 절차라는 점입니다: 수렴 임계값에 의한 종료, 그리고 감쇠 계수 $\lambda$의 증가/감소 업데이트입니다. BA-Net은 다음을 묻습니다: 미분 가능한 BA 레이어를 *통과하여* dense SfM을 풀 수 있을까요, 그래서 복원 손실로부터의 그래디언트가 특징 자체를 학습시킬 수 있을까요?

## 방법 및 아키텍처

네트워크는 여러 이미지를 입력받아 카메라 포즈 $\mathbb{T}$와 dense depth map $\mathbb{D}$를 출력합니다. 공유된 DRN-54 backbone이 두 개의 헤드에 특징을 공급하며, 이들의 출력은 BA-Layer에서 만납니다.

- **Feature pyramid (BA가 정렬하는 대상).** 측방 연결(lateral connection)을 갖는 FPN 스타일의 top-down 경로가 backbone 맵 $C^{k+1}$을 2배로 업샘플링하고 $C^k$와 concatenate한 후 $3\times 3$ conv로 128채널로 축소하여, 이미지별로 pyramid $F_i = [F^1_i, F^2_i, F^3_i]$를 생성합니다. BA는 밝기값이나 재투영 오차 대신 **feature-metric error**를 최소화합니다:

$$e^{f}_{i,j}(\mathcal{X}) = F_i\big(\pi(\mathbf{T}_i,\, d_j \cdot \mathbf{q}_j)\big) - F_1(\mathbf{q}_j),$$

  여기서 $\pi$는 3D 점을 이미지에 투영하고, $\mathbf{q}_j$는 이미지 $I_1$에서 깊이 $d_j$를 가진 정규화된 픽셀이며, $\mathbf{T}_i$는 이미지 $I_i$의 포즈입니다. BA를 통해 학습된 특징은 (RGB 거리나 사전 학습된 분류용 특징과 달리) 매끄러운 골짜기를 가진 명확한 전역 최솟값을 형성하여, 수렴 반경을 넓힙니다.
- **기저 깊이 맵 (BA가 최적화하는 대상).** 픽셀별 깊이 ($320\times 240$ 해상도에서 76.8k개의 미지수)는 마지막 특징 맵이 128개의 기저 깊이 맵 $\mathbf{B}$ ($128 \times h\cdot w$ 행렬)로 사용되는 학습된 단안 encoder-decoder로 대체됩니다:

$$\mathbb{D} = \mathrm{ReLU}(\mathbf{w}^{\top}\mathbf{B}),$$

  따라서 BA는 (학습된 초기값 $\mathbf{w}_0$을 가진) 결합 가중치 $\mathbf{w}$만 최적화하며, ReLU가 깊이를 비음수로 유지하면서도 dense한 픽셀별 깊이는 여전히 복원됩니다.
- **BA-Layer (미분 가능 LM).** 각 반복에서 잔차 $E(\mathcal{X})$, 야코비안 $J(\mathcal{X})$, Gauss–Newton 헤시안 $J^{\top}J$와 그 대각 성분 $D(\mathcal{X})$를 계산한 후, 표준 LM 스텝을 취합니다.

$$\Delta\mathcal{X} = \big(J(\mathcal{X})^{\top}J(\mathcal{X}) + \lambda D(\mathcal{X})\big)^{-1} J(\mathcal{X})^{\top} E(\mathcal{X}).$$

  두 가지 미분 불가능한 결정은 (i) 반복 횟수를 고정함으로써 ("불완전 최적화": pyramid 레벨당 5회 LM 반복, 3개 레벨에 대한 coarse-to-fine으로 총 15회, 매 반복마다 특징 워핑 수행), (ii) $\lambda$를 MLP로 *예측*함으로써 제거됩니다: 픽셀 전체에 대한 $|E(\mathcal{X})|$의 global average pooling이 128차원 벡터를 만들고 이를 ReLU를 가진 4개의 FC 레이어에 입력합니다. 각 스텝은 미분 가능 함수 $\Delta\mathcal{X} = g(\mathcal{X}; \mathbb{F})$가 되고, 해의 업데이트 $\mathcal{X}_k = g(\mathcal{X}_{k-1};\mathbb{F}) \circ \mathcal{X}_{k-1}$ (깊이 가중치는 덧셈, 포즈는 SE(3) 지수 사상)은 포즈/깊이로부터 feature pyramid로 역전파됩니다. 포즈는 항등 회전과 zero translation으로 초기화됩니다.
- **학습.** 지도학습: quaternion 회전 손실 $\|\mathbf{q}-\mathbf{q}^{*}\|$, translation 손실 $\|\mathbf{t}-\mathbf{t}^{*}\|$, berHu 깊이 손실을 사용; 초기 학습률 0.001의 ADAM, backbone은 DRN-54로 초기화.

## 실험 결과

- **ScanNet** (학습 1,413개 / 테스트 100개 시퀀스; 학습 547,991개, 테스트 2,000개 쌍): BA-Net은 DeMoN의 3.791° / 15.5cm, photometric BA의 4.409° / 21.40cm, geometric BA의 8.56° / 36.995cm에 비해 **1.018° 회전 / 3.39cm translation 오차**를 달성; depth abs-rel **0.161**, RMSE (linear) **0.346** (DeMoN 0.231 / 0.761 대비). ScanNet에서 학습하든 DeMoN 자체 학습 데이터로 학습하든 DeMoN을 능가합니다.
- **KITTI** (Eigen split; odometry 시퀀스 09/10에서 5프레임 스니펫): depth abs-rel **0.083**, sqr-rel 0.025, RMSE 3.640, RMSE-log 0.134 — 지도학습 방법 (Eigen 0.203 abs-rel)과 비지도학습 방법 (Zhou 0.208, Wang 0.151, Godard 0.148)보다 우수; ATE **0.019** (Wang 2018의 0.045, Zhou 2017의 0.063 대비).
- 부록의 ablation은 학습된 특징 대 사전 학습된 특징, BA 대 직접 SE(3) 포즈 회귀, 미분 가능 LM 대 Gauss–Newton, 예측된 $\lambda$ 대 상수 $\lambda$를 비교합니다 — 각 구성 요소가 도움이 되며, 부록은 최대 5개 뷰의 multi-view SfM과 CodeSLAM과의 비교도 보고합니다.

## SLAM에서의 의미

BA-Net은 "미분 가능 bundle adjustment"의 창시 논문입니다: SfM/SLAM의 핵심인 고전적 기하 최적화가 네트워크 내부에 존재하며 이를 통해 학습될 수 있음을 입증했고, multi-view geometry는 구조로서 하드코딩하면서 기하학이 제공할 수 없는 것 (특징과 깊이 기저)만 학습했습니다. 이 레시피는 DROID-SLAM과 DPVO (미분 가능 dense BA 레이어), 그리고 Theseus와 같은 범용 미분 가능 최적화 라이브러리의 근간이 되었으며, 저차원의 최적화 가능한 깊이라는 아이디어는 CodeSLAM 스타일의 latent 깊이 코드와 밀접하게 관련되어 있습니다. 현대의 학습 기반 SLAM 백엔드를 이해하고 싶다면 여기서 시작하십시오.

## 관련 문서

- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)
- [Theseus](theseus.md)
- [DeMoN](demon.md)
- [CodeSLAM](codeslam.md)
- [DeepV2D](deepv2d.md)
- [Differentiability](differentiability.md)
