# MLE와 MAP

최대 우도 추정 (MLE)과 최대 사후 확률 (MAP) 추정은 "SLAM"을 모호한 목표에서 구체적인 최적화 문제로 바꾸는 두 가지 통계적 원리입니다. 거의 모든 SLAM 백엔드 — 필터든 스무더든 — 는 이 두 추정값 중 하나를 계산하고 있는 것입니다.

## 베이즈 정리가 무대를 마련한다

$\mathbf{x}$를 상태(로봇 자세와 맵), $\mathbf{z}$를 측정값(특징 관측값, IMU 판독값)이라 합시다. 베이즈 정리는 우리가 원하는 것(사후 확률)을 센서 모델과 운동 모델이 제공하는 것과 연결합니다:

$$
p(\mathbf{x} \mid \mathbf{z}) = \frac{p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})}{p(\mathbf{z})} \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})
$$

- $p(\mathbf{z} \mid \mathbf{x})$ — **우도**: 상태가 $\mathbf{x}$라면 그 측정값이 얼마나 그럴듯한지(관측 모델로부터).
- $p(\mathbf{x})$ — **사전 분포**: $\mathbf{z}$를 보기 전에 우리가 믿는 것(운동 모델, 또는 이전 추정값으로부터).
- $p(\mathbf{z})$ — 정규화 상수로, 최적화에는 무관합니다.

## 두 가지 추정기

**MAP**는 사후 확률을 최대화하는 상태를 선택합니다:

$$
\mathbf{x}^*_{\text{MAP}} = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})
$$

**MLE**는 사전 분포를 버리고(동등하게, 균등 사전 분포를 가정하고) 우도만을 최대화합니다:

$$
\mathbf{x}^*_{\text{MLE}} = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})
$$

MAP = MLE + 사전 분포. SLAM 관점에서 말하면: 이미지 관측에 대한 순수한 [번들 조정](bundle-adjustment.md)은 MLE입니다; 운동 모델 팩터, IMU 팩터, 또는 첫 자세에 대한 사전 분포를 추가하면 MAP를 하고 있는 것입니다.

## 확률에서 최소제곱으로

SLAM 백엔드가 범용 확률적 추론 엔진이 아니라 *최소제곱 솔버*인 이유는 가우시안 잡음 가정에 있습니다. 측정 모델 $\mathbf{z} = h(\mathbf{x}) + \mathbf{v}$, $\mathbf{v} \sim \mathcal{N}(\mathbf{0}, \Sigma)$를 예로 들면:

$$
p(\mathbf{z} \mid \mathbf{x}) \propto \exp\!\left(-\tfrac{1}{2}\,\|\mathbf{z} - h(\mathbf{x})\|^2_{\Sigma^{-1}}\right)
$$

여기서 $\|\mathbf{e}\|^2_{\Sigma^{-1}} = \mathbf{e}^T \Sigma^{-1} \mathbf{e}$는 제곱 **마할라노비스 거리**입니다. 음의 로그를 취하면 — 최대화를 최소화로, 독립 측정값의 곱을 합으로 바꾸어 주는데 — MAP 문제는 다음과 같이 됩니다:

$$
\mathbf{x}^* = \arg\min_{\mathbf{x}} \left[ \sum_t \|h(\mathbf{x}_t) - \mathbf{z}_t\|^2_{R_t^{-1}} + \sum_t \|f(\mathbf{x}_{t-1}, \mathbf{u}_t) - \mathbf{x}_t\|^2_{Q_t^{-1}} \right]
$$

첫 번째 합은 관측 비용(측정 공분산 $R_t$를 가진 [재투영 오차](reprojection-error.md) 등)이고, 두 번째 합은 운동 모델 비용(오도메트리/IMU, 프로세스 공분산 $Q_t$)입니다. 반드시 새겨 두어야 할 세 가지 결론:

- **제곱 오차는 임의로 고른 것이 아닙니다** — 이는 가우시안의 음의 로그입니다. 잡음이 가우시안이 아니라면(이상치!) 제곱 손실은 잘못된 우도이며, 이것이 바로 [M-estimator](m-estimator.md)가 존재하는 이유입니다.
- **공분산은 가중값이 됩니다**: 확신도가 높은 센서(작은 $\Sigma$)는 강하게 가중된 잔차를 기여합니다. g2o/GTSAM의 정보 행렬 $\Omega = \Sigma^{-1}$은 정확히 이 가중값입니다.
- **독립성은 희소성이 됩니다**: 각 측정값은 몇 개의 상태 변수에만 의존하므로, 로그 사후 확률은 작은 지역 항들의 합입니다 — [팩터 그래프](factor-graph.md)이며, 솔버는 그 구조를 활용합니다.

## 필터 대 스무더

확장 칼만 필터는 한 시간 단계씩 사후 확률의 재귀적 가우시안 근사를 계산합니다(예측 단계는 $p(\mathbf{x})$, 업데이트 단계는 $p(\mathbf{z} \mid \mathbf{x})$를 사용), 반면 현대적인 스무딩 백엔드는 전체 궤적에 대해 [비선형 최적화](non-linear-optimization.md)로 완전한 MAP 문제를 풉니다. 둘 다 동일한 사후 확률을 좇고 있습니다; 다른 점은 무엇을 근사하는지, 언제 선형화하는지입니다.

## SLAM에서의 의미

MLE/MAP는 SLAM의 확률적 *형식화*와 이를 풀어내는 최적화 *기법*을 잇는 다리입니다. 이후의 모든 설계 결정 — 왜 잔차가 역공분산으로 가중되는지, 왜 번들 조정이 제곱 재투영 오차를 최소화하는지, 왜 사전 팩터가 게이지 자유도를 고정하는지, 왜 이상치가 강건 커널을 필요로 하는지 — 는 "가우시안 잡음 하의 MAP는 가중 비선형 최소제곱과 같다"는 이 한 줄의 직접적인 결론입니다. 이 한 줄을 스스로 다시 유도할 수 있다면, 대부분의 백엔드 논문은 쉽게 읽힙니다.

## 관련 문서

- [기초 확률과 통계](../level-01-beginner/basic-probability-and-statistics.md)
- [희소 비선형 최소제곱으로서의 MAP 추정](map-inference-as-sparse-nonlinear-least-squares.md)
- [팩터 그래프](factor-graph.md)
- [비선형 최적화](non-linear-optimization.md)
- [확장 칼만 필터](extended-kalman-filter.md)
