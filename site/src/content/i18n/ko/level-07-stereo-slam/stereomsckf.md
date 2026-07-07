# StereoMSCKF

> Sun 2018 · [논문](https://arxiv.org/abs/1712.00036)

**한 줄 요약** — StereoMSCKF (S-MSCKF)는 필터 기반 MSCKF VIO 프레임워크를 스테레오 카메라에 적용하여, 단안 방식과 동등한 계산 비용을 유지하면서 훨씨 더 큰 견고성을 제공한다 — 임베디드 프로세서에서 고속 자율 MAV 비행을 가능하게 한다.

## 문제

시각 보조 관성 오도메트리는 성숙했지만, 계산 효율성과 견고성은 소형 항공기(MAV)의 자율 비행에 남은 과제였다. 크기와 무게 제약으로 인해 고품질 센서와 강력한 프로세서를 쓸 수 없는 MAV는 수색 구조 임무에서 급격한 조명 변화, 낮은 텍스처, 바람에 의한 갑작스러운 자세 변화에 직면한다 — VIO는 견고해야 하면서도 계획 및 제어와 온보드 컴퓨터를 공유하며 CPU 스파이크를 일으켜서는 안 된다. 이전의 스테레오 시각-관성 솔루션은 계산 비용이 크고 최적화 기반이었다. S-MSCKF는 스테레오가 단안보다 훨씨 비용이 많이 든다는 통념에 반하여, GPU 가속 없이 온보드에서 실행되는 최초의 오픈소스 필터 기반 스테레오 VIO를 제공한다.

## 방법 및 아키텍처

**프론트엔드(전체 계산의 약 80%).** FAST 코너가 KLT 광류로 시간적으로 추적되며 — 특이하게도 — 좌우 스테레오 매칭에도 디스크립터 대신 KLT가 사용된다. 저자들은 디스크립터가 작은 정확도 향상에 비해 훨씨 많은 CPU 비용을 든다는 것을 발견했다. 이상값은 시간적 트랙에 대한 2점 RANSAC과 이전/현재 스테레오 쌍에 걸친 순환 매칭으로 제거된다. 경험적으로, 1 m보다 먼 특징도 20 cm 기선으로 안정적으로 매칭된다.

**필터 상태.** EKF는 (카메라-IMU 외부 파라미터를 포함한) IMU 상태와 $N$개의 카메라 포즈로 이루어진 슬라이딩 윈도우를 추정한다:

$$\mathbf{x}_{I}=\left({}^{I}_{G}\mathbf{q}^{\top}\;\; \mathbf{b}_{g}^{\top}\;\; {}^{G}\mathbf{v}^{\top}_{I}\;\; \mathbf{b}_{a}^{\top}\;\; {}^{G}\mathbf{p}^{\top}_{I}\;\; {}^{I}_{C}\mathbf{q}^{\top}\;\; {}^{I}\mathbf{p}^{\top}_{C}\right)^{\top}$$

여기서 ${}^{I}_{G}\mathbf{q}$는 월드-IMU 회전, ${}^{G}\mathbf{v}_I,{}^{G}\mathbf{p}_I$는 속도/위치, $\mathbf{b}_g,\mathbf{b}_a$는 자이로/가속도계 편향이다. 오차 상태 공식화($\delta\mathbf{q}\approx(\tfrac12\,{}^{G}_{I}\tilde{\boldsymbol\theta}^\top\;\;1)^\top$)는 방향 불확실성을 3차원으로 유지한다. 전파는 IMU 동역학 $\dot{\tilde{\mathbf{x}}}_I=\mathbf{F}\tilde{\mathbf{x}}_I+\mathbf{G}\mathbf{n}_I$의 4차 룽게-쿠타 적분을 사용한다.

**스테레오 측정 모델.** 카메라 포즈 $i$에서 관측된 각 특징 $f_j$는 두 뷰를 쌓은 4차원 측정값을 제공한다,

$$\mathbf{z}_{i}^{j}=\left(u_{i,1}^{j}\;\; v_{i,1}^{j}\;\; u_{i,2}^{j}\;\; v_{i,2}^{j}\right)^{\top},$$

이는 좌측($C_{i,1}$)과 우측($C_{i,2}$) 카메라 프레임에서의 특징 위치의 투영이다. 이를 $\mathbb{R}^3$이 아닌 $\mathbb{R}^4$에 유지하면 스테레오 정류가 필요 없다. 트랙이 끝나면 특징 위치 ${}^{G}\mathbf{p}_j$가 최소자승법으로 삼각측량되고, 쌍을 이룬 잔차는 $\mathbf{r}^{j}=\mathbf{H}_{\mathbf{x}}^{j}\tilde{\mathbf{x}}+\mathbf{H}_{f}^{j}\,{}^{G}\tilde{\mathbf{p}}_{j}+\mathbf{n}^{j}$로 선형화되며, 특징은 $\mathbf{H}_f^j$의 영공간 $\mathbf{V}$를 통해 투영되어 제거된다:

$$\mathbf{r}^{j}_{o}=\mathbf{V}^{\top}\mathbf{r}^{j}=\mathbf{H}_{\mathbf{x},o}^{j}\tilde{\mathbf{x}}+\mathbf{n}^{j}_{o}$$

이렇게 랜드마크는 결코 상태에 들어가지 않는다 — 구조 없는(structureless) MSCKF 트릭이 이제 단일 프레임에서 미터 단위 깊이를 주는 스테레오 기하로 공급받는다.

**일관성과 주변화.** VIO는 네 개의 관측 불가능한 방향(전역 위치와 요)을 가지며, 소박한 EKF는 허위 요 정보를 얻게 된다. S-MSCKF는 초기화 정확도에 덜 의존한다는 이유로 FEJ 대신 관측성-제약 EKF(OC-EKF)를 적용한다. MSCKF가 한 번에 포즈의 3분의 1을 주변화하는(CPU 스파이크를 일으키는) 대신, S-MSCKF는 상대 운동에 기반한 양방향 키프레임형 전략으로 선택된 두 개의 카메라 상태를 매 두 번째 업데이트마다 제거한다.

## 실험 결과

- **EuRoC**(20 Hz 스테레오, 200 Hz IMU), OKVIS(스테레오 최적화), ROVIO(단안 필터), VINS-Mono(단안 최적화)와 비교, 각 5회 실행: 네 방법의 정확도는 ROVIO가 머신홀 장면에서 더 많이 표류하는 것을 제외하면 비슷하다. S-MSCKF는 스테레오 이미지 간의 지속적인 밝기 불일치가 KLT 스테레오 매칭을 깨뜨리는 `V2_03_difficult`에서만 실패한다. 필터 기반 방법이 CPU를 가장 적게 사용하며, S-MSCKF 필터 자체는 20 Hz에서 코어 하나의 약 10%를 사용하고, 전체 계산의 약 80%가 프론트엔드에서 소요된다.
- **Fast flight 데이터셋**(공개): 공항 활주로에서 최고 속도 5, 10, 15, 17.5 m/s의 4회 실행(40 Hz 960×800 스테레오, 200 Hz IMU). S-MSCKF는 OKVIS와 VINS-Mono와 비슷한 정확도(GPS 대비 x-y RMSE)를 유지하면서 가장 낮은 CPU 사용량을 달성한다. ROVIO는 상당한 스케일 드리프트로 제외되었다.
- **자율 비행**: 숲 지역, 창고 진입, 귀환을 거치는 완전한 온보드 추정 — 700 m 왕복 경로에서 최종 드리프트는 약 3 m로, 실내-실외 조명 전환에도 불구하고 이동 거리의 0.5% 미만이다.
- 오픈소스 공개: `KumarRobotics/msckf_vio`.

## SLAM에서의 의미

S-MSCKF는 표준적인 스테레오 필터 기반 VIO 레시피를 확립했다: 즉각적인 깊이를 위한 스테레오 KLT 프론트엔드, 효율을 위한 구조 없는 MSCKF 백엔드, 일관성을 위한 OC-EKF. 계산이 제한된 항공 로봇에서는 잘 설계된 EKF가 훨씬 낮은 비용으로 최적화 기반 시스템에 맞먹을 수 있음을 구체적으로 증명했으며, 이 트레이드오프는 이후 OpenVINS에 의해 체계화되었다. 플랫폼이 소형 드론이나 임베디드 보드라면, 이 계보 — MSCKF → S-MSCKF → OpenVINS — 가 보통 시작점이다.

## 관련 문서

- [MSCKF](../level-06-vio-vins/msckf.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [OKVIS](../level-06-vio-vins/okvis.md)
- [ROVIO](../level-06-vio-vins/rovio.md)
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md)
- [Scale observability](scale-observability.md)
