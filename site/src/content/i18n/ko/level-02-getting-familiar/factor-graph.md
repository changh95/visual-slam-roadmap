# Factor graph

**팩터 그래프(factor graph)**는 SLAM 문제를 기술하는 현대 표준 방식이다. 이는 두 종류의 노드를 가진 이분 그래프 $\mathcal{G} = (\mathcal{V}, \mathcal{F}, \mathcal{E})$이다.

- **변수 노드** $\mathcal{V}$: 추정해야 할 미지수 — 로봇 자세 $T_i$, 맵 점(랜드마크) $\mathbf{X}_j$, IMU 바이어스 $\mathbf{b}$, 외부 파라미터(extrinsics), 시간 오프셋.
- **팩터 노드** $\mathcal{F}$: 변수 부분집합에 대한 확률적 제약 조건 — 사전 팩터, 오도메트리 팩터, 랜드마크 관측(재투영) 팩터, IMU 사전 적분 팩터, 루프 클로저 팩터.
- **에지** $\mathcal{E}$: 각 팩터를 그것이 관련된 변수들에 정확히 연결한다.

이 그래프는 모든 변수의 결합 확률이 지역 팩터들의 곱으로 어떻게 분해되는지를 인코딩한다.

$$
p(\mathcal{V}) \propto \prod_{f \in \mathcal{F}} f(\mathcal{V}_f)
$$

여기서 $\mathcal{V}_f$는 팩터 $f$에 결부된 변수들이다. 가우시안 잡음 하에서 각 팩터는 어떤 잔차 함수 $\mathbf{r}_f$에 대해 $f(\mathcal{V}_f) \propto \exp\left(-\tfrac{1}{2}\|\mathbf{r}_f(\mathcal{V}_f)\|^2_{\Sigma_f}\right)$ 형태를 가지므로, 곱의 음의 로그를 취하면 MAP 추정은 정확히 이 레벨의 다른 곳에서 다룬 희소 비선형 최소제곱 문제가 된다 — 각 팩터는 하나의 제곱된, 공분산으로 가중된 잔차 항이 된다.

## 예시 SLAM 팩터 그래프

세 자세, 두 랜드마크:

```
 prior
   |
  x0 ---odom--- x1 ---odom--- x2
   \           /  \           /
    \         /    \         /
    proj   proj    proj   proj
      \     /        \     /
       [l0]           [l1]
```

팩터 목록: $x_0$에 대한 사전 팩터 하나(게이지를 고정), 연속된 자세 사이의 오도메트리 팩터 둘, 그리고 각각 하나의 자세를 하나의 랜드마크에 묶는 투영 팩터 넷. 희소성을 읽어내는 것은 즉각적이다: $x_0$은 $x_2$와 직접 상호작용하지 않으며, $l_0$은 $l_1$과 상호작용하지 않는다 — 헤시안에는 그 자리에 0 블록이 있다. 이제 로봇이 이후 어떤 자세에서 $x_0$ 근처로 돌아온다고 상상해 보라: 그 자세와 $x_0$ 사이의 **루프 클로저 팩터**는 에지 하나만 추가되는 것이고, 추정 기계는 변하지 않는다.

## 흔한 팩터 유형

| 팩터 | 연결 대상 | 잔차의 의미 |
|---|---|---|
| 사전(Prior) | 변수 하나 | 고정된 사전값으로부터의 편차 |
| 상대(Between) / 오도메트리 | 자세 둘 | 상대 자세 측정값의 오차 |
| 투영(재투영) | 자세 + 랜드마크 | 픽셀 오차 $\mathbf{z} - \pi(T\mathbf{X})$ |
| IMU 사전 적분 | 자세 + 속도 + 바이어스 | 사전 적분된 상대 운동의 오차 |
| 루프 클로저 | 비연속 자세 둘 | 인식된 상대 자세의 오차 |
| GPS / 절대 위치 | 자세 하나 | 측정된 위치로부터의 편차 |

이 표현의 위력은 **그래프 구조 = 희소성 구조**라는 점이다. 각 관측은 하나의 자세와 하나의 랜드마크만 포함하고, 오도메트리는 연속된 자세만 연결한다. 그래프는 이 지역성을 명시적으로 드러내며, 그 결과로 나온 야코비안/헤시안 희소성이 솔버가 수천 개의 자세와 수십만 개의 랜드마크를 가진 문제를 다룰 수 있게 하는 요소다. 이는 또한 놀랍도록 조합적이다: 센서를 추가한다는 것은 추정기를 재설계하는 것이 아니라 새로운 팩터 유형을 추가하는 것이다. 포즈 그래프는 모든 변수가 자세이고 모든 팩터가 상대 자세 제약인 특수한 경우일 뿐이다.

## 코드로

지배적인 라이브러리들은 이 언어를 직접 사용한다.

- **GTSAM** (Georgia Tech Smoothing and Mapping) — 팩터 그래프를 일급 API로 사용하며, iSAM2 증분 솔버를 갖추고 있다. VIO에 탁월하다.
- **g2o** — 같은 아이디어를 정점/에지 형식으로 표현한다. ORB-SLAM과 LSD-SLAM에서 사용된다.
- **Ceres Solver** — 범용 비선형 최소제곱 라이브러리. "그래프"는 잔차 블록들의 집합으로 암묵적으로 구성한다.

위의 예시 그래프를 GTSAM의 Python API로 표현하면:

```python
import gtsam

graph = gtsam.NonlinearFactorGraph()
graph.add(gtsam.PriorFactorPose2(0, gtsam.Pose2(0, 0, 0), prior_noise))
graph.add(gtsam.BetweenFactorPose2(0, 1, gtsam.Pose2(1, 0, 0), odom_noise))
graph.add(gtsam.BetweenFactorPose2(1, 2, gtsam.Pose2(1, 0, 0), odom_noise))
# ... 랜드마크에 대한 투영 / 방향-거리 팩터 ...
result = gtsam.LevenbergMarquardtOptimizer(graph, initial_values).optimize()
```

코드가 곧 그래프다: `add`를 호출할 때마다 팩터 노드가 생기고, 정수 키 하나가 변수 노드가 된다.

## SLAM에서의 의미

팩터 그래프는 과거 별개였던 문제 표현들 — 필터링, 포즈 그래프 최적화, 번들 조정, 센서 융합 — 을 하나의 그림으로 통합했다: 변수를 정의하고, 팩터를 붙이고, 풀어라. 여러분이 만나게 될 모든 현대적 백엔드(ORB-SLAM의 BA, VINS-Mono의 슬라이딩 윈도우, Kimera의 iSAM2 스무더, LIO-SAM의 LiDAR-관성 그래프)는 변수, 팩터, 풀이 일정에 대한 특정한 선택을 가진 팩터 그래프다. 어떤 시스템의 팩터 그래프를 *그려보는* 법을 익히는 것이 그 SLAM 논문의 백엔드를 이해하는 가장 빠른 방법이다.

## 실습

- [g2o 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_13)
- [GTSAM 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_14)

## 관련 문서

- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Pose graph optimization](pose-graph-optimization.md)
- [Incremental smoothing (iSAM/iSAM2)](incremental-smoothing.md)
- [Marginalization](marginalization.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [Robust pose-graph optimization](robust-pose-graph-optimization.md)
