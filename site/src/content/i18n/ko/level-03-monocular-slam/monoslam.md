# MonoSLAM

> Davison 2007 · [논문](https://ieeexplore.ieee.org/document/4160954)

**한 줄 요약** — 최초의 실시간 단안 SLAM 시스템: 손에 든 단일 카메라와 확장 칼만 필터가 카메라 모션과 희소 3D 랜드마크 맵을 30Hz로 동시에 추정한다.

## 문제

MonoSLAM 이전에는 실시간 SLAM 시스템에 스테레오 리그, 레이저 스캐너, 또는 휠 오도메트리가 필요했다; 단일 카메라는 하나의 시점이 방향은 제공하지만 깊이를 제공하지 못하고, 카메라 단독으로는 모션 측정 자체가 없기 때문에 충분하지 않다고 여겨졌다. Davison, Reid, Molton, Stasse (IEEE TPAMI 2007)는 추정 프레임워크가 단안 특징점 초기화의 깊이 불확실성을 명시적으로 다루고 오도메트리 대신 모션 사전 정보를 제공한다면, 손에 든 단일 카메라로도 실시간 SLAM이 충분함을 보였다.

## 방법 및 아키텍처

**카메라와 맵에 대한 하나의 EKF.** 상태는 완전한 결합 공분산을 가진 하나의 스택 벡터이다.

$$
\hat{\mathbf{x}} = \begin{pmatrix} \hat{\mathbf{x}}_v \\ \hat{\mathbf{y}}_1 \\ \hat{\mathbf{y}}_2 \\ \vdots \end{pmatrix}, \qquad
\mathbf{P} = \begin{pmatrix} P_{xx} & P_{xy_1} & P_{xy_2} & \cdots \\ P_{y_1x} & P_{y_1y_1} & P_{y_1y_2} & \cdots \\ P_{y_2x} & P_{y_2y_1} & P_{y_2y_2} & \cdots \\ \vdots & \vdots & \vdots & \end{pmatrix},
$$

여기서 각 랜드마크 $\mathbf{y}_i$는 3D 점이고, 13개 파라미터로 구성된 카메라 상태는 위치, 방향 쿼터니언, 선형/각속도를 포함한다: $\mathbf{x}_v = (\mathbf{r}^W, \mathbf{q}^{WR}, \mathbf{v}^W, \boldsymbol{\omega}^R)$. 비대각 블록이 핵심이다: 하나의 특징을 관측하면 카메라 *및* 상관된 모든 특징의 추정치가 함께 개선된다. 저장 및 갱신 비용은 맵 크기에 대해 $O(N^2)$이며, 이는 30Hz에서 맵을 대략 100개 특징으로 제한한다.

**등속도 모션 모델(예측).** 오도메트리가 없으므로, 매끄러움 사전 정보가 제어 입력을 대신한다: 매 타임스텝마다 평균이 0인 가우시안 가속도가 속도 임펄스 $\mathbf{n} = (\mathbf{V}^W, \boldsymbol{\Omega}^R) = (\mathbf{a}^W \Delta t, \boldsymbol{\alpha}^R \Delta t)$를 가하여, 다음과 같은 상태 갱신을 준다.

$$
\mathbf{f}_v = \begin{pmatrix} \mathbf{r}^W + (\mathbf{v}^W + \mathbf{V}^W)\Delta t \\ \mathbf{q}^{WR} \times \mathbf{q}\big((\boldsymbol{\omega}^R + \boldsymbol{\Omega}^R)\Delta t\big) \\ \mathbf{v}^W + \mathbf{V}^W \\ \boldsymbol{\omega}^R + \boldsymbol{\Omega}^R \end{pmatrix},
\qquad
\mathbf{Q}_v = \frac{\partial \mathbf{f}_v}{\partial \mathbf{n}} P_n \frac{\partial \mathbf{f}_v}{\partial \mathbf{n}}^{\top}.
$$

작은 $P_n$은 매끄러운 모션을 가정하고, 큰 $P_n$은 거친 모션을 허용하지만 프레임당 더 많은 측정치를 요구한다.

**능동 탐색(측정).** 랜드마크의 예측된 카메라 좌표계 위치는 $\mathbf{h}_L^R = \mathbf{R}^{RW}(\mathbf{y}_i^W - \mathbf{r}^W)$이며, 반경 왜곡을 포함한 보정된 광각(약 100° FOV) 카메라 모델을 통해 투영된다. 상태 불확실성을 투영 야코비안을 통해 전파하면 $2\times 2$ 이노베이션 공분산을 얻는다.

$$
\mathbf{S}_i = \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v} P_{xx} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v} P_{x y_i} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i} P_{y_i x} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i} P_{y_i y_i} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i}^{\top} + \mathbf{R},
$$

이는 그 안에서 정규화된 상호 상관 템플릿 매칭이 실행되는 타원형 게이트(표준편차 3배)를 정의한다. $\mathbf{S}_i$는 정보량 척도로도 쓰인다: 프레임당 가장 정보량이 큰 10–12개 특징이 선택되어, 그 가장 긴 축을 따라 불확실성을 좁힌다.

**확률적 특징 초기화.** 새로운 특출한 패치(Shi–Tomasi)는 오직 하나의 레이만을 정의한다; 깊이는 그 레이를 따라 0.5–5.0m 구간에 균일하게 퍼진 100개의 파티클로 표현된다. 매 프레임마다 각 깊이 가설이 자신만의 탐색 타원으로 투영되고, 매칭 가능도가 베이즈 규칙을 통해 파티클을 재가중하며, 깊이 비율 $\sigma_d / d < 0.3$이 되면 분포는 가우시안으로 붕괴하여 그 특징이 EKF 상태에 합류한다 — 보통 2–4프레임 후에 일어난다. 맵 관리는 어떤 포즈에서도 목표 개수의 특징이 보이도록 특징을 추가/삭제한다.

## 실험 결과

- **실시간 예산**: 1.6GHz 펜티엄 M에서 30Hz(33ms 가용)로, 일반적인 프레임은 19ms가 소요된다 — 이미지 로딩 2ms, 상관 탐색 3ms, 칼만 필터 갱신 5ms, 특징 초기화 탐색 4ms, 그래픽 렌더링 5ms.
- **정답 정확도**: 손에 든 카메라가 (약 1cm까지 알려진) 네 개의 측량된 way-point를 재방문했을 때 1–2cm의 지터로 몇 센티미터 수준으로 위치추정되었다 — 예를 들어 way-point (1.00, 0.00, 0.62)m가 (0.93±0.03, 0.06±0.02, 0.63±0.02)m로 추정되었다; SLAM이 맵을 일관성 있게 끌어당기면서 잔차 편향이 루프당 약 1cm씩 줄어들었다.
- **응용**: 0.75m 반경의 원을 걷는 HRP-2 휴머노이드의 실시간 위치추정(200Hz 가슴 자이로를 추가 EKF 측정치로 융합), 손에 든 카메라를 이용한 실시간 증강현실. 코드는 오픈소스 SceneLib 라이브러리로 공개되었다.

## SLAM에서의 의미

MonoSLAM은 값싼 단일 카메라만으로도 실시간 SLAM이 가능함을 증명하여, 사실상 시각 SLAM이라는 분야를 창시했다(그리고 수십 년 후 같은 연구실에서 나온 iMAP, MonoGS, MASt3R-SLAM으로 이어지는 Davison 연구실의 계보를 시작했다). 이는 또한 필터 기반 SLAM의 가장 명료한 교육적 사례이기도 하다: 하나의 EKF, 하나의 결합 상태, 예측된 불확실성으로부터의 능동 탐색 — 이후의 모든 키프레임 최적화 시스템이 비교의 대상으로 삼은 기준선이다. 논문 자체가 후속 연구를 예고한다: 깊이 파티클 초기화는 역깊이 파라미터화에 직접 영감을 주었고, $O(N^2)$의 한계는 PTAM과 "Visual SLAM: Why Filter?"가 답한 의제를 설정했다.

## 관련 문서

- [PTAM](ptam.md)
- [Visual-SLAM why filter?](visual-slam-why-filter.md)
- [Visual Odometry](visual-odometry.md)
- [ORB-SLAM](orb-slam.md)
- [Scale ambiguity](scale-ambiguity.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — MonoSLAM이 의존하는 광각 모델
