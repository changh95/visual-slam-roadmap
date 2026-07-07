# Extended Kalman Filter (EKF)

**확장 칼만 필터(Extended Kalman Filter)**는 비선형 모델을 가진 재귀적 상태 추정의 주력 도구다. 상태에 대한 가우시안 신뢰도 $\mathcal{N}(\hat{\mathbf{x}}, P)$를 유지하며 두 단계 — **예측**(운동 모델을 통해 신뢰도를 전파)과 **갱신**(측정값으로 보정) — 를 반복하는데, 이는 정확히 재귀적 베이즈 필터에서 모든 밀도를 가우시안으로 근사하고 모든 모델을 현재 추정치에서 선형화한 것이다.

## 설정

시스템은 비선형 운동 모델과 비선형 관측 모델로 기술된다.

$$
\mathbf{x}_k = f(\mathbf{x}_{k-1}, \mathbf{u}_k) + \mathbf{w}_k, \qquad \mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, Q_k)
$$

$$
\mathbf{z}_k = h(\mathbf{x}_k) + \mathbf{v}_k, \qquad \mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, R_k)
$$

여기서 $\mathbf{x}$는 상태(예: 카메라 자세, 속도, 랜드마크 위치), $\mathbf{u}$는 제어 또는 IMU 입력, $\mathbf{z}$는 측정값(예: 추적된 특징의 픽셀 좌표), $Q$, $R$은 과정 잡음과 측정 잡음의 공분산이다. EKF는 현재 추정치에서 평가된 야코비안으로 $f$와 $h$를 선형화한다.

$$
F_k = \left.\frac{\partial f}{\partial \mathbf{x}}\right|_{\hat{\mathbf{x}}_{k-1|k-1}}, \qquad
H_k = \left.\frac{\partial h}{\partial \mathbf{x}}\right|_{\hat{\mathbf{x}}_{k|k-1}}
$$

## 예측

$$
\hat{\mathbf{x}}_{k|k-1} = f(\hat{\mathbf{x}}_{k-1|k-1}, \mathbf{u}_k)
$$

$$
P_{k|k-1} = F_k P_{k-1|k-1} F_k^T + Q_k
$$

평균은 완전한 비선형 모델을 통해 전파되며, 오직 공분산만 선형화를 사용한다. 이 단계에서 불확실성이 커진다(데드 레커닝 드리프트).

## 갱신

$$
\mathbf{y}_k = \mathbf{z}_k - h(\hat{\mathbf{x}}_{k|k-1}) \qquad \text{(이노베이션)}
$$

$$
S_k = H_k P_{k|k-1} H_k^T + R_k \qquad \text{(이노베이션 공분산)}
$$

$$
K_k = P_{k|k-1} H_k^T S_k^{-1} \qquad \text{(칼만 이득)}
$$

$$
\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} + K_k \mathbf{y}_k, \qquad
P_{k|k} = (I - K_k H_k)\, P_{k|k-1}
$$

이득 $K_k$는 측정값을 예측값과 대비해 가중한다: 확신도가 높은 예측(작은 $P$)이나 잡음이 많은 센서(큰 $R$)는 작은 보정을 낳고, 반대의 경우도 마찬가지다. 이노베이션 공분산 $S_k$는 **게이팅(gating)**도 지원한다 — 마할라노비스 검정 $\mathbf{y}^T S^{-1} \mathbf{y} < \chi^2$ 임계값은 이상치 측정값이 상태를 오염시키기 전에 이를 거부한다.

## EKF-SLAM

EKF-SLAM(MonoSLAM의 근간이 되는 형태)에서는 상태가 카메라/로봇 자세와 모든 랜드마크 위치를 쌓아 구성된다.

$$
\mathbf{x} = \begin{bmatrix} \mathbf{x}_{\text{robot}}^T & \mathbf{m}_1^T & \cdots & \mathbf{m}_n^T \end{bmatrix}^T,
$$

그리고 $P$는 자세-랜드마크, 랜드마크-랜드마크 상관관계를 포함한 전체 결합 공분산을 저장한다. 이 상호 상관관계가 필터에서 루프 클로저를 작동시키는 요소다 — 자세를 보정하면 상관된 모든 랜드마크도 함께 끌려온다. 그 대가는 구조적이다.

- **제곱에 비례하는 스케일링**: $P$는 $O(n^2)$개의 항목을 가지고 매 갱신마다 그 전부를 다루어야 하므로, 실시간 EKF-SLAM은 작은 맵(수십에서 수백 개 랜드마크 수준)으로 제한된다.
- **선형화 오차**: 야코비안은 현재 추정치에서 한 번 평가되고, 오차는 $P$에 영구적으로 각인된다 — 최적화 방식과 달리 필터는 과거를 다시 선형화할 수 없다. 이는 EKF-SLAM의 잘 알려진 **비일관성(과신)** 문제를 일으킨다.
- **회전 처리**: 방향의 단순한 매개변수화는 잘못 동작한다. 실용적인 필터는 **오차 상태(간접) EKF**를 사용한다. 여기서 필터는 공칭 상태 주변의 작은 오차를 추정하며, 쿼터니언 운동학이 자세(attitude)를 다룬다.

이러한 한계 때문에 현대 시각적 SLAM은 키프레임 기반 비선형 최적화로 이동했다("왜 필터인가?" 논쟁, Strasdat 외), 반면 필터링은 그 상수 시간 재귀적 형태가 빛나는 곳에서 살아남는다: 시각-관성 오도메트리(MSCKF, ROVIO, 오차 상태 EKF)와 오도메트리를 GPS/RADAR/휠 인코더와 융합하는 경우.

## SLAM에서의 의미

EKF는 SLAM의 역사적 기반이며(EKF-SLAM은 10년 동안 *그* 해법이었다), 여전히 상용 VIO의 근간이다(MSCKF 파생물은 많은 AR 헤드셋과 드론에서 실행된다). 최적화 중심 파이프라인에서조차 EKF의 개념은 어디에나 있다: 예측/갱신 구조, 이상치 제거를 위한 이노베이션 게이팅, 불확실성 전파를 위한 공분산 전파, 그리고 마지널라이제이션(고정 지연 스무더의 마지널라이제이션 단계는 대수적으로 칼만 갱신이다). EKF의 단일 선형화 가정이 언제 무너지는지 이해하는 것이 왜 번들 조정이 정확도에서 우위를 가지는지, 그리고 왜 MSCKF 스타일 필터가 선형화를 지연시키는지를 이해하는 핵심이다.

## 관련 문서

- [MonoSLAM](../level-03-monocular-slam/monoslam.md)
- [MSCKF](../level-06-vio-vins/msckf.md)
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md)
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
- [Non-linear optimization](non-linear-optimization.md)
