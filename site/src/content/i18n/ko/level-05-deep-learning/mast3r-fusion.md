# MASt3R-Fusion

> Zhou 2025 · [논문](https://arxiv.org/abs/2509.20757)

**한 줄 요약** — 순전파 방식의 MASt3R 비전 모델을 IMU 및 GNSS 측정치와 계층적 인수 그래프에서 긴밀하게 융합하여, 파운데이션 모델 기반 밀도 SLAM에 메트릭 스케일과 전역 지리 참조 기능을 부여한다.

## 문제

고전적 시각 SLAM은 "저텍스처 환경, 스케일 모호성, 까다로운 시각 조건에서의 성능 저하로 자주 어려움을 겪는다"; 순전파 방식의 포인트맵 회귀(MASt3R)는 이미지에서 직접 고품질 기하를 복원함으로써 이러한 문제의 대부분을 해결한다. 그러나 이런 새로운 파이프라인들은 "잘 검증된 확률론적 다중 센서 정보 융합의 장점"을 버린다: IMU로부터의 메트릭 스케일도 없고, GNSS로부터의 절대 지리 참조도 없으며, 원리적인 불확실성 관리도 없다. MASt3R-Fusion은 사후 결합이 아니라, 순전파 방식의 시각 모델을 관성 및 GNSS 센싱과 *긴밀하게* 결합하는 방법을 묻는다.

## 방법 및 아키텍처

두 단계로 구성된다: **실시간 SLAM**(순전파 프론트엔드를 갖춘 슬라이딩 윈도우 VIO)과 **전역 최적화**(전체 궤적에 대한 루프 클로저 + GNSS)이다.

**순전파 시각 측정.** MASt3R-SLAM을 따라, 각 이미지는 토큰 $\mathbf{F}_i=\mathcal{F}_{\mathrm{enc}}(\mathbf{I}_i)$으로 인코딩되고, 이미지 쌍은 포인트맵과 디스크립터 맵으로 함께 디코딩된다.

$$\mathbf{X}^{ij}_{i},\,\mathbf{X}^{ij}_{j},\,\mathbf{D}^{ij}_{i},\,\mathbf{D}^{ij}_{j}=\mathcal{F}_{\mathrm{dec}}\left(\mathbf{F}_{i},\mathbf{F}_{j}\right)$$

여기서 $\mathbf{X}^{ij}_i,\mathbf{X}^{ij}_j$는 $i$의 기준 좌표계에서 2D-3D 포인트맵이다. 밀집 매칭은 포인트맵에 대한 레이 근접 최적화로 수행된 후, 디스크립터 내적과 4배 이중선형 업샘플링된 디스크립터 맵으로 서브픽셀 정밀도로 정제된다; 깊이 잔차가 큰 대응점은 마스킹되어 걸러지며, 이는 동적 객체도 함께 제거한다.

**Sim(3) 포인트맵 정렬 제약.** 각 키프레임은 포인트맵 $\mathbf{X}_i$와 카메라-월드 유사 변환 $\mathbf{S}_i\in\mathrm{Sim}(3)$(스케일 $s$, 회전 $\mathbf{R}$, 이동 $\mathbf{t}$)을 가진다. 매칭된 쌍에 대해, 잔차는 알려진 깊이를 이용한 재투영과 순수 회전 상황을 위한 깊이 항을 결합한다.

$$\mathbf{r}_{ij}\left(\mathbf{S}^{i}_{j}\right)=\begin{bmatrix}\mathbf{u}^{i}_{j}-\pi\left(\mathbf{S}^{i}_{j}\circ\mathbf{X}_{j}\right)\\ \left(\mathbf{X}_{i}\left[\mathbf{u}^{i}_{j}\right]\right)_{z}-\left(\mathbf{S}^{i}_{j}\circ\mathbf{X}_{j}\right)_{z}\end{bmatrix}$$

여기서 $\mathbf{S}^i_j=\mathbf{S}_i^{-1}\circ\mathbf{S}_j$는 상대 Sim(3) 변환이다. 번들 조정과 달리 포인트별 깊이는 최적화되지 않는다 — 네트워크의 3D 구조는 스케일까지는 신뢰되므로, 시각 제약은 간결한 쌍별 팩터가 된다. 각 밀집 제약은 GPU에서 헤시안 형태로 압축된다: $\mathbf{H}_{ij}=(\mathbf{J}^{r}_{ij})^{\top}\mathbf{J}^{r}_{ij}$, $\mathbf{v}_{ij}=(\mathbf{J}^{r}_{ij})^{\top}\mathbf{r}_{ij}$ — CPU 솔버에는 쌍당 $7\times 7$ 블록 하나만 전달된다.

**동형 그룹 변환.** 메트릭 스케일 센서와의 융합을 위해 Sim(3)은 $\mathrm{SE}(3)\times\mathbb{R}$로 분해되고, 리 대수 섭동들은 다음과 같이 선형적으로 관련된다.

$$\begin{bmatrix}\boldsymbol{\omega}\\ \boldsymbol{\nu}\\ \sigma\end{bmatrix}=\underbrace{\begin{bmatrix}1&&\\ &s\mathbf{I}&\\ &&s\end{bmatrix}}_{\boldsymbol{\Lambda}}\begin{bmatrix}\boldsymbol{\theta}\\ \boldsymbol{\tau}\\ \delta s\end{bmatrix}$$

따라서 Sim(3) 시각 헤시안은 SE(3) 포즈와 키프레임별 스케일 $s_i$에 직접 부착된다.

**슬라이딩 윈도우 인수 그래프.** 윈도우 상태는 $\mathcal{X}_i=(\mathbf{T}_i,s_i,\mathbf{v}_i,\mathbf{b}_i)$ — SE(3) 포즈, 스케일, 속도, IMU 바이어스 — 로 float64로 표현된다(밀집 GPU 연산은 float32로 지역적으로 유지된다). 표준 IMU 프리인티그레이션 팩터 $\mathbf{r}_b$가 연속된 키프레임을 연결하고, 오래된 상태는 Schur 보완을 통해 사전 항 $(\mathbf{H}_m,\mathbf{v}_m)$으로 주변화된다. 실시간 비용은 다음과 같다.

$$\sum_{i\in\mathcal{W}}\left\|\mathbf{r}_{\mathrm{b}}(\mathcal{X}_{i},\mathcal{X}_{i+1})\right\|^{2}+\sum_{(i,j)\in\mathcal{E}}\mathbf{E}_{\mathrm{v}}(\mathcal{X}_{i},\mathcal{X}_{j})+\mathbf{E}_{m}(\mathcal{X})$$

**전역 SLAM.** 루프 후보는 순전파 인코더 토큰 검색에서 나오며, 비용이 큰 밀집 검증 전에 효율적인 VIO 불확실성 검사(진행 방향/횡방향 오차 전파에서 얻은 거리 불확실성 $\sigma_{p,q}$)로 필터링된다. GNSS 위치는 시간 오프셋을 처리하기 위한 임시 IMU 프리인티그레이션 노드를 통해 키프레임에 연결된 팩터 $\mathbf{r}_g$로 들어온다. 2단계 전역 최적화는 먼저 Cauchy로 강건화된 상대 포즈 루프 제약을 사용한 뒤, 인라이어 루프를 완전한 헤시안 형태의 시각 팩터로 교체한다 — 포즈 그래프로 축소하는 대신 모든 시각-관성 정보를 유지한다.

## 실험 결과

- **KITTI-360 (단안 VIO)**: 평균 상대 이동 오차가 DM-VIO보다 43.0% 낮고 DBA-Fusion보다 17.7% 낮다(예: 고속도로 시퀀스 0003: $t_{rel}$ 0.406% 대 1.146%/1.041%); 시각 전용 MASt3R-SLAM은 이 규모에서 거의 실패한다(RTE 21–55%).
- **KITTI-360 (루프 클로저를 포함한 전역 SLAM)**: 정규화된 ATE가 궤적 길이의 0.05%로, ORB-SLAM3의 0.63%, VGGT-Long의 2.91%보다 우수하다 — 예를 들어 8.4km 시퀀스 0000에서 ATE 2.13m 대 26.03m(ORB-SLAM3), 103.64m(VGGT-Long).
- **SubT-MRS (동굴, 실내외 혼합)**: VIO ATE가 길이의 0.23%로, DBA-Fusion/ORB-SLAM3/DM-VIO의 0.41–1.74%보다 우수하다; 루프 클로저 포함 시 0.13% 대 ORB-SLAM3의 0.37%이며, 시각 전용 VGGT-Long은 세 시퀀스 모두에서 실패한다.
- **우한(Wuhan) 도심 데이터셋 (V-I-GNSS)**: 실제 GNSS RTK를 사용할 때 두 시퀀스에서 수평 RMSE 0.21m / 0.09m로, VINS-Fusion의 느슨한 전역 융합(2.54/0.62m)보다 우수하다; 100초 시뮬레이션 GNSS 단절 상황에서도 0.37/0.46m RMSE를 유지한다.
- 노트북 RTX 4080 Mobile GPU에서 실시간으로 동작하며, GPU 메모리 8GB로 임의 길이의 시퀀스를 처리한다. 코드: [GREAT-WHU/MASt3R-Fusion](https://github.com/GREAT-WHU/MASt3R-Fusion).

## SLAM에서의 의미

MASt3R-Fusion은 3D 파운데이션 모델 프론트엔드가 프로덕션 시스템이 의존하는 고전적 다중 센서 인수 그래프 기법과 양립 가능함을 보여준다 — 학습된 밀도 기하와 원리적인 센서 융합 사이에서 하나를 선택할 필요가 없다. $\boldsymbol{\Lambda}$ 동형 사상을 통해 Sim(3) 제약을 SE(3) 그래프에 결합시키는 방법이 기억해야 할 핵심 패턴이다: 이것이 스케일이 모호한 학습된 기하를 메트릭 센서로 접지시키는 방식이다. 이는 배치되는 SLAM이 나아갈 방향을 시사한다: 인식에는 순전파 모델을, 추정에는 인수 그래프를, 접지에는 절대 센서를 사용하는 방향이다.

## 관련 문서

- [MASt3R-SLAM](mast3r-slam.md)
- [MASt3R](mast3r.md)
- [VINS-Fusion](../level-06-vio-vins/vins-fusion.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Tightly-coupled vs Loosely-coupled](../level-06-vio-vins/tightly-coupled-vs-loosely-coupled.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
