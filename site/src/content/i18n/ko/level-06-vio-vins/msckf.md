# MSCKF
> Mourikis 2007 · [논문](https://ieeexplore.ieee.org/document/4209642)

**한 줄 요약** — Multi-State Constraint Kalman Filter는 EKF 상태에 (랜드마크가 아닌) 카메라 *자세*의 슬라이딩 윈도우를 유지하고 특징 측정값을 랜드마크 야코비안의 왼쪽 영공간에 투영함으로써 효율적인 단안 VIO를 달성하며, 이를 통해 복잡도가 특징 수에 대해 선형으로 유지됩니다.

## 문제
고전적인 EKF-SLAM은 모든 3D 랜드마크 위치를 상태 벡터에 넣으므로, 공분산 업데이트가 지도 크기에 대해 이차적으로 확장됩니다—이는 특징 추출기가 이미지당 수백 개의 점을 정기적으로 추적하는 시각 보조 관성 항법에서는 감당할 수 없습니다. 쌍별 대안들(에피폴라 제약, 이미지 쌍 사이의 상대 자세 측정)은 정보를 버리고 통계적으로 상관된 제약 조건에서 동일한 픽셀을 재사용합니다. MSCKF가 답한 질문은 이렇습니다: 여러 카메라 자세에서 관측된 특징 트랙이, 그 특징이 결코 상태 변수가 되지 않고도, 궤적을 최적으로 제약할 수 있는가?

## 방법 및 아키텍처
필터는 세 단계 루프를 따릅니다(논문의 Algorithm 1): 매 IMU 샘플마다 **전파(propagate)**, 매 이미지마다 **증강(augment)**, 특징 트랙이 완료될 때 **업데이트(update)**.

- **상태.** 진화하는 IMU 상태는
  $$\mathbf{X}_{\mathrm{IMU}} = \begin{bmatrix} {}^I_G\bar{q}^{\,T} & \mathbf{b}_g^T & {}^G\mathbf{v}_I^T & \mathbf{b}_a^T & {}^G\mathbf{p}_I^T \end{bmatrix}^T,$$
  단위 쿼터니언 ${}^I_G\bar{q}$(전역-IMU 회전), 랜덤 워크로 모델링된 자이로/가속도 바이어스, 전역 프레임에서의 속도/위치로 구성됩니다; 자세 오차는 오차 쿼터니언 $\delta\bar q$의 최소 3-DoF 표현 $\delta\boldsymbol{\theta}$를 사용합니다. 전체 상태는 최대 $N_{\max}$개의 과거 카메라 자세 $({}^{C_i}_G\bar q,\, {}^G\mathbf{p}_{C_i})$를 추가합니다.
- **전파.** IMU 추정값은 5차 룽게-쿠타로 적분됩니다; 공분산은 수치적으로 적분된 상태 전이 행렬 $\boldsymbol{\Phi}$를 가진 리아푸노프 방정식 $\dot{\mathbf{P}}_{II} = \mathbf{F}\mathbf{P}_{II} + \mathbf{P}_{II}\mathbf{F}^T + \mathbf{G}\mathbf{Q}_{\mathrm{IMU}}\mathbf{G}^T$를 따릅니다.
- **상태 증강.** 매 새로운 이미지마다 카메라 자세 ${}^{C}_G\hat{\bar q} = {}^{C}_I\bar q \otimes {}^{I}_G\hat{\bar q}$, ${}^G\hat{\mathbf{p}}_C = {}^G\hat{\mathbf{p}}_I + \mathbf{C}_{\hat q}^T\,{}^I\mathbf{p}_C$가 추가되고 공분산이 해당 야코비안을 통해 확장됩니다.
- **구조 없는(structureless) 측정 모델(핵심 기여).** $M_j$개의 자세에서 추적된 특징 $f_j$가 소실될 때, 그 위치 ${}^G\hat{\mathbf{p}}_{f_j}$는 역깊이 파라미터화를 사용한 가우스-뉴턴 최소제곱으로 삼각측량됩니다. 그 모든 관측값의 선형화된 재투영 잔차를 쌓으면
  $$\mathbf{r}^{(j)} \simeq \mathbf{H}^{(j)}_{\mathbf{X}}\widetilde{\mathbf{X}} + \mathbf{H}^{(j)}_{f}\,{}^G\widetilde{\mathbf{p}}_{f_j} + \mathbf{n}^{(j)}.$$
  삼각측량이 상태 추정값을 사용했으므로, $\mathbf{r}^{(j)}$는 $\widetilde{\mathbf{X}}$와 상관되어 있습니다; $\mathbf{H}^{(j)}_f$의 왼쪽 영공간(기저 $\mathbf{A}$)에 투영하면 특징 오차가 정확히 제거됩니다:
  $$\mathbf{r}^{(j)}_o = \mathbf{A}^T(\mathbf{z}^{(j)} - \hat{\mathbf{z}}^{(j)}) \simeq \mathbf{A}^T\mathbf{H}^{(j)}_{\mathbf{X}}\widetilde{\mathbf{X}} + \mathbf{A}^T\mathbf{n}^{(j)},$$
  이는 그 특징을 본 *모든* 자세를 결합하는 $(2M_j-3)$차원 제약 조건이며—선형화까지는 최적이며, Givens 회전을 이용해 $O(M_j^2)$로 암묵적으로 계산됩니다.
- **업데이트.** 완료된 $L$개 특징 모두의 잔차를 쌓은 다음, QR 분해 $\mathbf{H}_X = \begin{bmatrix}\mathbf{Q}_1 & \mathbf{Q}_2\end{bmatrix}\begin{bmatrix}\mathbf{T}_H \\ \mathbf{0}\end{bmatrix}$가 이를 $\mathbf{r}_n = \mathbf{Q}_1^T\mathbf{r}_o = \mathbf{T}_H\widetilde{\mathbf{X}} + \mathbf{n}_n$으로 압축한 다음, 표준 EKF 업데이트를 이득 $\mathbf{K} = \mathbf{P}\mathbf{T}_H^T\big(\mathbf{T}_H\mathbf{P}\mathbf{T}_H^T + \mathbf{R}_n\big)^{-1}$로 수행합니다. 이동하는 물체로 인한 이상치는 마할라노비스 검정으로 제거됩니다. 윈도우가 가득 차면, $N_{\max}/3$개의 균등하게 분포된 자세가 제거됩니다(가장 오래된 자세는 유지—더 긴 베이스라인이 더 많은 정보를 담고 있습니다).

총 비용: 특징 수에 대해 선형이며, (제한된) 윈도우 자세 수에 대해서는 최대 3차입니다.

## 실험 결과
미니애폴리스에서의 실제 도심 주행으로 평가: 자동차에 장착된 Pointgrey FireFly 카메라(640×480 @ 3\,Hz)와 ISIS IMU(100\,Hz), 약 9분 동안 1598장의 이미지, SIFT 특징, 상태에 최대 30개의 카메라 자세. 3.2\,km 궤적을 따라, 142,903개의 특징 트랙이 EKF 업데이트에 사용되었으며, 2\,GHz Intel T7200의 단일 코어에서 14\,Hz로 처리되었습니다—3\,Hz 센서 속도보다 빠릅니다. 최종 위치 오차는 약 10\,m, 즉 **이동 거리의 0.31\%**였으며, 루프 클로저와 모션 사전 정보가 전혀 없었습니다; 추정된 3σ 정확도는 자세에서 1° 이하, 속도에서 0.35\,m/s 이하였습니다.

## SLAM에서의 의미
MSCKF는 VIO의 필터 기반 분야를 창시했으며, 그 구조 없는(structureless) 측정 모델은 필터링을 훨씬 넘어서는 표준이 되었습니다(예: GTSAM/Kimera의 smart factor). 이는 S-MSCKF(스테레오), ROVIO 시대의 EKF 설계, OpenVINS의 직접적인 조상이며, 그 선형화 특성에 대한 후속 문헌은 모든 현대 필터 기반 VIO가 의존하는 관측 가능성/일관성 분석(First-Estimate Jacobians)을 낳았습니다. 이러한 효율성 특성 때문에 MSCKF 스타일 추정기는 배포된 AR/VR 추적 스택과 널리 연관됩니다. CPU 사이클당 정확도가 절대적인 정확도보다 중요할 때, MSCKF는 여전히 참고할 만한 설계입니다.

## 관련 문서
- [OpenVINS](openvins.md) — FEJ와 온라인 캘리브레이션을 갖춘 현대적인 오픈소스 MSCKF.
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md) — 스테레오 확장(S-MSCKF).
- [ROVIO](rovio.md) — 직접 광도 업데이트를 사용하는 또 다른 대표적인 필터 기반 VIO.
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md) — 설계 공간에서 MSCKF가 위치하는 지점.
- [Observability](observability.md) — MSCKF가 촉발한 분석 전통.
- [Deployed VIO](deployed-vio.md) — MSCKF급 효율성이 가장 중요한 곳.
