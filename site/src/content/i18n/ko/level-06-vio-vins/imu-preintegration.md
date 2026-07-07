# IMU 사전 적분

IMU는 100–1000 Hz로 측정값을 생성하는 반면, 카메라는 10–30 Hz로 키프레임을 전달한다. 단순한 VIO 정식화라면 모든 IMU 판독값을 추정기에 삽입하여 상태 변수의 수가 폭증할 것이다. 더 나쁜 것은, 단순 적분은 세계 프레임에서 이루어진다는 점이다: 적분된 결과는 구간 시작 시점의 절대 자세에 의존하므로, 최적화기가 그 자세를 조정할 때마다 모든 원시 IMU 데이터를 재적분해야 할 것이다.

**사전 적분**(Lupton과 Sukkarieh가 2012년에 도입)은 두 문제를 모두 해결한다. 두 키프레임 시각 $i$와 $j$ 사이의 IMU 측정값은 *키프레임 $i$의 로컬 프레임에서* 적분되어, 다음과 같은 간결한 상대 운동 요약을 만든다:

$$\left(\Delta\mathbf{R}_{ij},\; \Delta\mathbf{v}_{ij},\; \Delta\mathbf{p}_{ij}\right)$$

— 상대 회전, 속도 변화, 위치 변화. 결정적으로, 이 양들은 IMU 측정값과 바이어스 추정값에만 의존하며 **절대 자세에는 의존하지 않는다**. 이들은 한 번 계산되고 저장되어, 팩터 그래프에서 $i$와 $j$의 상태를 연결하는 단일 "IMU 팩터"로 동작한다. 최적화기가 자세를 옮겨도 아무것도 재적분할 필요가 없다.

## 수식

측정 모델 $\tilde{\boldsymbol{\omega}}_t = \boldsymbol{\omega}_t + \mathbf{b}^g + \boldsymbol{\eta}^g$, $\;\tilde{\mathbf{a}}_t = \mathbf{R}_t^\top(\mathbf{a}_t - \mathbf{g}) + \mathbf{b}^a + \boldsymbol{\eta}^a$에서 출발하여, 사전 적분된 항들은 $[i, j)$ 구간의 IMU 샘플에 걸쳐 누적된다:

$$\Delta\mathbf{R}_{ij} = \prod_{t=i}^{j-1} \mathrm{Exp}\!\big((\tilde{\boldsymbol{\omega}}_t - \mathbf{b}^g_i)\,\delta t\big)$$

$$\Delta\mathbf{v}_{ij} = \sum_{t=i}^{j-1} \Delta\mathbf{R}_{it}\,(\tilde{\mathbf{a}}_t - \mathbf{b}^a_i)\,\delta t, \qquad
\Delta\mathbf{p}_{ij} = \sum_{t=i}^{j-1}\Big[\Delta\mathbf{v}_{it}\,\delta t + \tfrac{1}{2}\Delta\mathbf{R}_{it}\,(\tilde{\mathbf{a}}_t - \mathbf{b}^a_i)\,\delta t^2\Big]$$

여기서 중력은 등장하지 **않는다** — 이는 절대 방향을 알 수 있는 아래의 잔차에서만 다시 나타난다. 의사 코드로 표현하면, 이 누적은 키프레임 구간마다 한 번 실행되는 단순한 루프이다:

```text
ΔR, Δv, Δp ← I, 0, 0
for each IMU sample (ω̃, ã, δt) in [i, j):
    Δp ← Δp + Δv·δt + ½·ΔR·(ã − bᵃ)·δt²
    Δv ← Δv + ΔR·(ã − bᵃ)·δt
    ΔR ← ΔR · Exp((ω̃ − bᵍ)·δt)
    (propagate covariance and bias Jacobians alongside)
```

## IMU 잔차

이렇게 만들어진 팩터는 (현재의 자세/속도/바이어스 추정값과 중력으로부터) 예측된 상대 운동을 저장된 사전 적분 측정값과 비교하며, 이는 재투영 잔차가 예측된 픽셀과 관측된 픽셀을 비교하는 방식과 정확히 대응된다:

$$\mathbf{r}_{\Delta R} = \mathrm{Log}\big(\Delta\mathbf{R}_{ij}^\top\,\mathbf{R}_i^\top\mathbf{R}_j\big), \qquad
\mathbf{r}_{\Delta v} = \mathbf{R}_i^\top\big(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\,\Delta t_{ij}\big) - \Delta\mathbf{v}_{ij}$$

$$\mathbf{r}_{\Delta p} = \mathbf{R}_i^\top\big(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\,\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\,\Delta t_{ij}^2\big) - \Delta\mathbf{p}_{ij}$$

이는 누적 루프 도중 전파된 공분산으로 가중치가 부여되며(여기서 [IMU noise model](imu-noise-model.md) 파라미터가 들어온다).

## 실용적으로 만드는 두 가지 개선

- **야코비안을 통한 바이어스 보정.** 사전 적분된 항들은 특정 바이어스 추정값 $\mathbf{b}_i$로 계산되었다. 최적화기가 바이어스를 $\delta\mathbf{b}$만큼 업데이트하면, 저장된 야코비안을 사용한 1차 보정이 원시 데이터를 건드리지 않고 팩터를 갱신한다:
  $$\Delta\tilde{\mathbf{R}}_{ij}(\mathbf{b} + \delta\mathbf{b}) \approx \Delta\mathbf{R}_{ij}\cdot\mathrm{Exp}\!\Big(\tfrac{\partial \Delta\mathbf{R}}{\partial \mathbf{b}^g}\,\delta\mathbf{b}^g\Big),$$
  $\Delta\mathbf{v}_{ij}, \Delta\mathbf{p}_{ij}$에도 $\partial/\partial\mathbf{b}^g$와 $\partial/\partial\mathbf{b}^a$ 항으로 유사하게 적용된다. 바이어스가 선형화 지점에서 크게 벗어난 경우에만 구간을 재적분해야 한다.
- **다양체 위 정식화(Forster et al., 2015).** 회전은 벡터 공간이 아니라 리 군 $SO(3)$ 위에 존재한다. Forster의 정식화는 다양체 위에서 적분과 그 잡음 전파를 올바르게 수행하여 정확한 공분산과 해석적 야코비안을 산출한다. 이는 GTSAM, VINS-Mono, ORB-SLAM3, Kimera-VIO, OKVIS2에 구현된 버전이다.

## 흔한 함정

- **바이어스 선형화 한계를 잊는 것.** 1차 바이어스 보정은 저장된 선형화 지점 근처에서만 유효하다; (예: 초기화 중) 큰 바이어스 업데이트 후에는 사전 적분된 항을 재계산해야 한다.
- **중력 부호/프레임 규약.** $\mathbf{g}$가 위를 향하는지 아래를 향하는지, 가속도계 모델이 이를 빼는지 더하는지는 논문과 코드베이스마다 다르다 — 이 불일치는 즉시 발산하는 추정기를 만든다.
- **타임스탬프 지터와 샘플 누락.** 이 누적은 정확한 샘플별 $\delta t$를 가정한다; 측정된 타임스탬프 대신 명목상의 레이트를 그대로 사용하면 모델링되지 않은 오차가 주입된다.
- **공분산 전파를 무시하는 것.** 사전 적분된 측정값은 그 가중치만큼만 유용하다; 적절한 잡음 전파를 생략하거나(또는 임시적인 상수 공분산을 사용하면) IMU와 시각 항 사이의 균형이 잘못된다.

## SLAM에서의 의미
사전 적분은 최적화 기반 VIO를 실시간으로 만든 단일 아이디어다: 수백 개의 고속 측정값을 키프레임 쌍당 하나의 팩터로 압축하면서도 정확히 재선형화 가능하게 유지한다. 모든 현대 긴밀 결합 VIO 시스템이 이를 기반으로 하며, $\Delta\mathbf{R}_{ij}$가 어떻게 형성되고 바이어스에 대해 보정되는지를 이해하는 것이 어떤 VIO 코드베이스든 이해하는 가장 빠른 길이다.

## 관련 문서
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — Forster 2015 논문 노트.
- [IMU noise model](imu-noise-model.md) — 적분에 들어가는 바이어스와 잡음 항.
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — 다양체 위 정식화 뒤에 있는 수학.
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — 사전 적분된 IMU 팩터가 존재하는 곳.
- [VINS-Mono](vins-mono.md) — 사전 적분된 IMU 팩터를 중심으로 구축된 완전한 시스템.
