# IMU 잡음 모델

원시 IMU 측정값은 구조화된 방식으로 오염된다. (Woodman의 입문서를 따르는) 전체 오차 모델은 센서별로 바이어스, 스케일 팩터 오차, 교차 축 오정렬, 백색 잡음을 포함한다:

$$
\tilde{\mathbf{a}} = \mathbf{a} + \mathbf{b}^a + \mathbf{S}^a\mathbf{a} + \mathbf{M}^a\mathbf{a} + \boldsymbol{\eta}^a, \qquad
\tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b}^g + \mathbf{S}^g\boldsymbol{\omega} + \mathbf{M}^g\boldsymbol{\omega} + \boldsymbol{\eta}^g
$$

여기서 $\mathbf{S}$는 (대각) 스케일 팩터 오차이고 $\mathbf{M}$은 교차 축 감도이다. VIO 추정기는 $\mathbf{S}$와 $\mathbf{M}$이 공장 또는 오프라인 캘리브레이션으로 처리된다고 가정하고 온라인 항 두 가지만 유지한다 — 부가적인 **백색 잡음**과 천천히 변화하는 **바이어스**:

$$
\tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b}^g + \boldsymbol{\eta}^g \qquad
\tilde{\mathbf{a}} = \mathbf{a} + \mathbf{b}^a + \boldsymbol{\eta}^a
$$

$\boldsymbol{\eta}$는 평균이 0인 백색 가우시안 잡음이며, 각 바이어스는 자체의 백색 구동 잡음을 갖는 **랜덤 워크**로 모델링된다: $\dot{\mathbf{b}} = \boldsymbol{\eta}^b$.

## 이 두 항이 왜 그렇게 중요한가

- **백색 잡음은 적분되어 랜덤 워크 드리프트가 된다.** 백색 자이로스코프 잡음을 적분하면 $\sigma\sqrt{t}$로 증가하는(*각도 랜덤 워크*) 방향 오차가 생기고; 가속도계 잡음을 이중 적분하면 $t^{3/2}$로 증가하는 위치 오차가 생긴다. 이것이 MEMS IMU를 사용한 순수 관성 추측 항법이 몇 초 안에 발산하는 이유이며 — 카메라가 필요한 이유다.
- **바이어스는 일정하지 않다.** 전원을 켤 때마다 턴온 바이어스가 달라지고, 실행 중 바이어스는 시간과 온도에 따라 천천히 변한다. 따라서 VIO 추정기는 $\mathbf{b}^g, \mathbf{b}^a$를 *상태 벡터 안에* 유지하며 지속적으로 추정한다; 랜덤 워크 모델은 추정기가 이들을 얼마나 빠르게 움직이도록 허용할지를 알려준다.

## 네 가지 파라미터와 그 단위

VIO 설정에는 네 개의 숫자(흔히 축별이지만 보통 공유됨)가 필요하다:

| 파라미터 | 기호 | 일반적인 연속시간 단위 |
|---|---|---|
| 자이로 잡음 밀도 (각도 랜덤 워크) | $\sigma_{\eta^g}$ | $\mathrm{rad/s/\sqrt{Hz}}$ |
| 가속도 잡음 밀도 (속도 랜덤 워크) | $\sigma_{\eta^a}$ | $\mathrm{m/s^2/\sqrt{Hz}}$ |
| 자이로 바이어스 랜덤 워크 | $\sigma_{b^g}$ | $\mathrm{rad/s^2/\sqrt{Hz}}$ |
| 가속도 바이어스 랜덤 워크 | $\sigma_{b^a}$ | $\mathrm{m/s^3/\sqrt{Hz}}$ |

이들은 *연속시간 밀도*다. 이산 샘플링 간격 $\Delta t$에서 사용하려면, 표준 변환은 측정 잡음에 대해 $\sigma_{\eta,d} = \sigma_\eta / \sqrt{\Delta t}$, 바이어스 증분에 대해 $\sigma_{b,d} = \sigma_b \sqrt{\Delta t}$이다 — 이는 구현 버그의 만성적인 원인이다(함정 참조). 이 네 숫자는 EKF의 공분산 전파나 사전 적분된 IMU 팩터의 공분산에 직접 들어간다. 즉, 추정기가 카메라에 비해 IMU를 얼마나 신뢰하는지를 결정한다.

## 앨런 분산: 파라미터 식별

**앨런 분산(Allan variance)**은 장시간(수 시간, 온도가 안정된) 정지 로그로부터 이 잡음 파라미터들을 식별하는 표준 도구다. 로그-로그 스케일에서 평균화 시간 $\tau$에 대해 앨런 편차 $\sigma(\tau)$를 플롯하면 기울기로 잡음 소스를 분리할 수 있다:

| 기울기 | 잡음 소스 | 파라미터 |
|---|---|---|
| $-1/2$ | 백색 잡음(각도/속도 랜덤 워크) | $\sigma_{\eta}$ (잡음 밀도, $\tau = 1\,\mathrm{s}$에서 읽음) |
| $0$ (평탄한 최소값) | 바이어스 불안정성 | — |
| $+1/2$ | 바이어스 랜덤 워크 | $\sigma_{b}$ (랜덤 워크 밀도) |

이 플롯에서 읽은 네 숫자는 정확히 VINS-Mono, OpenVINS, Kimera-VIO 및 그 외 모든 VIO 시스템의 설정 파일이 요구하는 파라미터로, 예를 들어 Kalibr 스타일의 `imu.yaml`에서:

```yaml
# continuous-time noise densities (example structure — measure your own values)
gyroscope_noise_density:     ...   # [rad/s/sqrt(Hz)]
gyroscope_random_walk:       ...   # [rad/s^2/sqrt(Hz)]
accelerometer_noise_density: ...   # [m/s^2/sqrt(Hz)]
accelerometer_random_walk:   ...   # [m/s^3/sqrt(Hz)]
update_rate: 200.0                 # [Hz]
```

`kalibr_allan`이나 `allan_variance_ros` 같은 도구가 이 로그-후-피팅 절차를 자동화한다. 실제로는 모델링되지 않은 효과(진동, 온도 램프, 스케일 팩터 잔차)를 흡수하기 위해 값을 앨런 분산으로 도출한 값보다 어느 정도(흔히 몇 배) 부풀려 사용하는 경우가 많다.

## 흔한 함정

- **단위 혼동.** 연속시간 밀도를 이산시간 표준편차(또는 자이로에 대한 데이터시트 단위 $^\circ/\sqrt{\mathrm{h}}$ 같은)와 섞으면 조용히 IMU의 가중치를 몇 자릿수나 잘못 설정하게 된다. 여러분의 추정기가 어떤 규약을 기대하는지 항상 확인하라.
- **데이터시트의 낙관성.** 제조사 수치는 진동이 차단된 벤치에서 측정된다; 쿼드로터의 IMU는 추가 잡음처럼 동작하는 모터 진동을 겪는다. 가능하면 실제 플랫폼에서 로그를 기록하라.
- **과신하는 파라미터**는 필터가 IMU를 지나치게 신뢰하게 만든다 — 진동이나 빠른 운동 하에서 발산한다. **과도하게 비관적인** 파라미터는 IMU의 운동 정보를 버려서 시각적 단절 시 강건성을 해친다. 두 실패 모드 모두 흔하므로 신중하게 튜닝하라.
- **너무 짧은 앨런 로그.** $+1/2$ 바이어스 랜덤 워크 영역은 큰 $\tau$에서만 나타난다; 10분짜리 로그로는 식별할 수 없다. 여러 시간의 정지 기록이 표준이다.

## SLAM에서의 의미
잡음 모델은 여러분의 하드웨어와 추정기 사이의 계약이다: 시각적 팩터에 대한 IMU 팩터의 가중치를 결정한다. 파라미터가 너무 낙관적이면 필터가 IMU를 과신하게 된다(진동 하에서 발산); 너무 비관적이면 IMU의 운동 정보를 버리게 된다. 앨런 분산 플롯을 실행하고 읽을 수 있는 능력은 실제 하드웨어에 VIO를 배포하는 사람이라면 누구나 갖춰야 할 기본적인 실무 역량이다.

## 관련 문서
- [Introduction to Inertial Navigation](introduction-to-inertial-navigation.md) — 오차 소스를 깊이 다루는 Woodman의 입문서.
- [IMU](../level-02-getting-familiar/imu.md) — 센서 자체.
- [IMU preintegration](imu-preintegration.md) — 이 잡음 항이 팩터 공분산으로 전파되는 곳.
- [OpenVINS](openvins.md) — 잡음 파라미터 워크플로를 명시적으로 설명하는 문서를 가진 시스템.
- [Multi-sensor calibration](../level-02-getting-familiar/multi-sensor-calibration.md) — 스케일/오정렬 항을 제거하는 오프라인 캘리브레이션.
