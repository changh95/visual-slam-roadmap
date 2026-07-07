# 오차 상태 칼만 필터를 위한 쿼터니언 운동학

> Solà 2017 · [논문](https://arxiv.org/abs/1711.02508)

**한 줄 요약** — 쿼터니언 대수와 운동학을 기본 원리로부터 유도하고 IMU 기반 상태 추정을 위한 오차 상태 칼만 필터(ESKF)를 구축하는 자기완결적 튜토리얼로, VIO 필터에서 회전을 *제대로* 다루기 위한 표준 참고 자료입니다.

## 문제

3D 회전은 어떤 추정 엔진에서도 가장 오류가 발생하기 쉬운 요소입니다: 쿼터니언은 벡터 공간을 이루지 않고, 서로 경쟁하는 부호 및 순서 규약(해밀턴 대 JPL)이 문헌을 오염시키며, 회전 *섭동, 도함수, 적분*에 대한 올바른 정의는 서로 일치하지 않는 여러 자료에 흩어져 있습니다. Solà의 문서는 "쿼터니언과 3차원 공간에서의 회전에 관한 개념 및 수식, 그리고 오차 상태 칼만 필터와 같은 추정 엔진에서의 올바른 사용법에 대한 철저한 재검토"이며, 회전 군과 그 리(Lie) 구조에 대한 심층 연구를 포함합니다 — IMU 신호를 적분하는 실제 응용을 위한 정확한 ESKF 공식화를 고안한다는 명시적 목표를 가지고 있습니다.

## 방법 및 아키텍처

- **엄밀한 쿼터니언 대수.** 해밀턴 규약($ij = k$, $i^2 = j^2 = k^2 = ijk = -1$, 스칼라 부분이 먼저)을 고정하고, 곱 $\otimes$, 컨쥬게이트, 그리고 회전 벡터를 단위 쿼터니언으로 연결하는 지수 사상을 유도합니다 (식 101):

  $$\mathbf{q} \triangleq \mathrm{Exp}(\phi\mathbf{u}) = e^{\phi\mathbf{u}/2} = \begin{bmatrix} \cos(\phi/2) \\ \mathbf{u}\sin(\phi/2) \end{bmatrix},$$

  반각(half-angle)을 설명하는 이중곱 $\mathbf{x}' = \mathbf{q} \otimes \mathbf{x} \otimes \mathbf{q}^{*}$, 그리고 $\mathbf{R} = e^{\phi[\mathbf{u}]_\times}$로부터의 행렬 측 로드리게스 공식도 함께 유도합니다. 전용 절에서는 네 가지 "쿼터니언 플레이버"를 정리하여, 어떤 코드베이스에서든 해밀턴 대 JPL 혼동을 진단할 수 있게 해줍니다.
- **참 상태, 명목 상태, 오차 상태.** 참 상태는 *명목 상태*(대신호, IMU 데이터로부터 비선형적으로 적분됨)와 *오차 상태* $\delta\mathbf{x} = (\delta\mathbf{p}, \delta\mathbf{v}, \delta\boldsymbol{\theta}, \delta\mathbf{a}_b, \delta\boldsymbol{\omega}_b, \delta\mathbf{g})$(소신호, 선형적으로 적분 가능하며 선형-가우시안 필터링에 적합)의 합성으로 이루어집니다. IMU 모델은 $\mathbf{a}_m = \mathbf{R}_t^{\top}(\mathbf{a}_t - \mathbf{g}_t) + \mathbf{a}_{bt} + \mathbf{a}_n$, $\boldsymbol{\omega}_m = \boldsymbol{\omega}_t + \boldsymbol{\omega}_{bt} + \boldsymbol{\omega}_n$이며, 참 쿼터니언 운동학은 $\dot{\mathbf{q}}_t = \tfrac{1}{2}\mathbf{q}_t \otimes \boldsymbol{\omega}_t$입니다.
- **명목 상태 전파(이산, 식 260).** $\mathbf{p} \leftarrow \mathbf{p} + \mathbf{v}\Delta t + \tfrac{1}{2}(\mathbf{R}(\mathbf{a}_m - \mathbf{a}_b) + \mathbf{g})\Delta t^2$, $\ \mathbf{v} \leftarrow \mathbf{v} + (\mathbf{R}(\mathbf{a}_m - \mathbf{a}_b) + \mathbf{g})\Delta t$, $\ \mathbf{q} \leftarrow \mathbf{q} \otimes \mathbf{q}\{(\boldsymbol{\omega}_m - \boldsymbol{\omega}_b)\Delta t\}$ — 잡음을 무시한 완전한 비선형 적분입니다.
- **오차 상태 동역학(식 238).** 오차에 대해 합성식을 풀고 2차 이상의 항을 버리면, 칼만 필터가 실제로 구동되는 선형 시변 시스템을 얻습니다:

  $$\dot{\delta\mathbf{v}} = -\mathbf{R}[\mathbf{a}_m - \mathbf{a}_b]_\times\,\delta\boldsymbol{\theta} - \mathbf{R}\,\delta\mathbf{a}_b + \delta\mathbf{g} - \mathbf{R}\mathbf{a}_n, \qquad \dot{\delta\boldsymbol{\theta}} = -[\boldsymbol{\omega}_m - \boldsymbol{\omega}_b]_\times\,\delta\boldsymbol{\theta} - \delta\boldsymbol{\omega}_b - \boldsymbol{\omega}_n,$$

  여기에 $\dot{\delta\mathbf{p}} = \delta\mathbf{v}$와 랜덤 워크 바이어스가 더해집니다. 방향 오차 $\delta\boldsymbol{\theta} \in \mathbb{R}^3$은 명목 쿼터니언에 대해 *국소적으로*(곱셈적으로) 정의됩니다; 전역적으로 정의된 각도 오차를 사용하는 변형은 별도 장에서 다룹니다.
- **ESKF 사이클.** 이산 오차 동역학으로 오차 공분산을 예측하고; IMU가 아닌 측정값(GPS, 비전)이 들어오면 명목 상태를 통해 연쇄된 야코비안으로 표준 KF 방정식을 통해 오차 상태를 업데이트하며; 평균을 명목 상태에 **주입**합니다, $\mathbf{q} \leftarrow \mathbf{q} \otimes \mathbf{q}\{\hat{\delta\boldsymbol{\theta}}\}$ (식 283, 벡터 상태는 합산); 그런 다음 $\hat{\delta\mathbf{x}} \leftarrow 0$으로 **리셋**하고 공분산을 $\mathbf{P} \leftarrow \mathbf{G}\mathbf{P}\mathbf{G}^{\top}$로 업데이트하여 새로운 명목 프레임에서 방향 오차를 다시 표현합니다.
- **오차 상태가 유리한 이유.** 오차는 항상 0에 가까우므로 선형화가 정확합니다; 방향 오차는 어떤 특이점에서도 멀리 떨어진 최소 3-파라미터 표현을 사용합니다; 그리고 크고 빠른 신호는 필터가 아니라 정확한 비선형 적분으로 처리됩니다. 부록에는 룽게-쿠타 및 폐형(closed-form) 적분 스킴, 절단된 급수 전이 행렬, 완전한 IMU 예제를 위한 잡음-임펄스 적분이 제공됩니다.

## 실험 결과

이 문서는 튜토리얼/참고 자료이지 벤치마크된 시스템이 아닙니다 — 어떤 실험도 보고하지 않으며, 그 "결과"는 코드로 그대로 옮길 준비가 된 완전하고 내적으로 일관된 수식 및 야코비안 목록(회전 사상, 섭동, ESKF 행렬)입니다. 그 영향력은 채택 정도로 측정됩니다: 필터 기반 VIO 및 IMU 융합 구현에서 표준적으로 인용되는 문헌 중 하나가 되었으며, 여기에 제시된 ESKF 레시피는 수많은 연구 및 프로덕션 IMU 통합 모듈의 배후에 있는 패턴입니다. 다양체 위 사전 적분(최적화 측의 대응 개념)과 함께, 현대 VIO 코드베이스가 전제로 하는 수학적 도구 세트를 형성합니다.

## SLAM에서의 의미

회전은 벡터 공간에 살지 않으므로, 쿼터니언에 대한 순진한 덧셈식 EKF 업데이트는 군 제약을 깨뜨립니다; 오차 상태 트릭은 진지한 필터 기반 VIO(MSCKF, ROVIO, OpenVINS, 그리고 상용 트래커)가 방향을 다루는 방식입니다. Solà의 노트는 구현자들이 IMU 전파나 ESKF 모듈을 작성할 때 가장 많이 펼쳐 놓는 문서이며, 최적화 기반 시스템이 사용하는 다양체 위 사전 적분 이론을 보완합니다.

## 관련 문서

- [IMU 잡음 모델](imu-noise-model.md)
- [다양체 위 IMU 사전 적분](imu-preintegration-on-manifold.md)
- [리 군](../level-02-getting-familiar/lie-groups.md)
- [MSCKF](msckf.md)
- [관성 항법 입문](introduction-to-inertial-navigation.md)
- [OpenVINS](openvins.md)
