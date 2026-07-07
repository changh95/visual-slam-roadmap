# FlowNet3D

> Liu 2019 · [논문](https://arxiv.org/abs/1806.01411)

**한 줄 요약** — 포인트 클라우드 상에서 3D scene flow를 추정하는 최초의 종단간(end-to-end) 딥 네트워크로, PointNet++ 백본에 새로운 flow embedding 레이어와 set upconv 레이어를 결합하여 모든 포인트에 대한 3D 모션 벡터를 예측한다.

## 문제

로보틱스와 인간-컴퓨터 상호작용은 동적 환경에서 포인트들의 3D 운동 — *scene flow* — 을 이해할 필요가 있지만, 기존 방법 대부분은 스테레오나 RGB-D 영상으로부터 이를 추정했고 포인트 클라우드에서 직접 다루려는 시도는 드물었다. LiDAR 포인트 클라우드는 희소하고 순서가 없으며 격자 구조가 없어 표준 CNN(및 이미지 공간 optical flow 아키텍처)을 적용할 수 없다. 기존 포인트 클라우드 파이프라인은 강체성이나 대응점 가정을 전제로 한 수작업 특징을 사용했다. FlowNet3D는 원시 포인트 클라우드 쌍으로부터 포인트별 3D 운동을 종단간으로 학습하는 방법을 묻는다.

## 방법 및 아키텍처

클라우드 $\mathcal{P} = \{x_i\}_{i=1}^{n_1}$과 $\mathcal{Q} = \{y_j\}_{j=1}^{n_2}$ ($x_i, y_j \in \mathbb{R}^3$, 대응점 없음, 크기가 다를 수 있음)가 주어지면, 프레임 1의 모든 포인트에 대해 flow $d_i = x_i' - x_i$를 예측한다. 네트워크는 포인트 특징 학습, 포인트 혼합, flow 정제라는 세 모듈로 구성되며, 세 종류의 레이어로 만들어진다.

- **Set conv 레이어** (PointNet++의 set abstraction): $n'$개의 영역 중심 $x_j'$를 최원점 샘플링(farthest-point sampling)으로 뽑고, 대칭 함수로 반경 $r$ 이웃을 집계한다.

$$f_j' = \underset{\{i \,:\, \lVert x_i - x_j' \rVert \le r\}}{\mathrm{MAX}} \big\{ h(f_i,\ x_i - x_j') \big\}$$

  여기서 $h$는 MLP이고 MAX는 원소별 최댓값 풀링이다 — 이는 비정형 데이터에 대해 계층적이고 평행이동에 불변인 기하 특징을 만들어낸다.
- **Flow embedding 레이어** (새로운 레이어 ①): 프레임 1의 각 포인트 $p_i$에 대해 견고한(hard) 대응점은 거의 존재하지 않으므로, 이 레이어는 이웃한 프레임 2의 모든 포인트로부터 "flow 투표"를 집계한다.

$$e_i = \underset{\{j \,:\, \lVert y_j - x_i \rVert \le r\}}{\mathrm{MAX}} \big\{ h(f_i,\ g_j,\ y_j - x_i) \big\}$$

  고정된 특징 거리 대신 두 포인트의 특징을 모두 $h$에 입력함으로써, 네트워크는 후보 변위 $y_j - x_i$에 어떻게 가중치를 둘지 *학습*할 수 있다. 이렇게 얻은 임베딩은 이후 추가적인 set conv 레이어로 혼합되어 공간적 매끄러움을 얻는다 (넓은 수용 영역(receptive field)은 이동하는 테이블 위의 점들처럼 모호한 경우를 해소한다).
- **Set upconv 레이어** (새로운 레이어 ②): set conv와 동일한 식을 사용하지만, 샘플링된 중심이 아니라 지정된 목표 위치에서 평가되며, flow 임베딩을 원래의 $n_1$개 포인트 전체로 다시 전파하도록 학습한다 — 3D 보간의 역거리 가중치 대신 특징 관계로 이웃에 가중치를 준다.

최종 아키텍처는 4개의 set conv 레이어, 1개의 flow embedding 레이어, (스킵 연결이 있는) 4개의 set upconv 레이어, 그리고 $\mathbb{R}^3$ flow를 회귀하는 선형 레이어로 구성된다. 학습에는 smooth-$L_1$ flow 감독과, 워프된 클라우드로부터 예측한 역방향 flow $d_i'$에 대한 사이클 일관성(cycle-consistency) 항이 함께 사용된다.

$$L = \frac{1}{n_1} \sum_{i=1}^{n_1} \Big( \lVert d_i - d_i^* \rVert + \lambda \lVert d_i' + d_i \rVert \Big)$$

$\lambda = 0.3$이다. 추론 시에는 샘플링 잡음을 줄이기 위해 클라우드를 무작위로 재샘플링하여 여러 번(10회) 실행하고 예측된 flow를 평균한다.

## 실험 결과

- **FlyingThings3D** (2만 개 학습 / 2천 개 테스트 쌍, disparity+flow를 포인트 클라우드로 변환; 지표: 3D EPE 및 정확도): 깊이 맵에 대한 이미지 기반 FlowNet-C, 전역 ICP 기준선, 초기/후기/딥-믹스처 포인트 클라우드 기준선보다 훨씬 낮은 EPE와 유의하게 높은 정확도를 보인다. Ablation: 최댓값 풀링이 평균 풀링보다 명확히 우수; 학습된 두-특징 $h$가 코사인 거리 변형보다 우수(오차 11.6% 감소); set upconv가 3D 보간보다 우수(flow 오차 20% 감소); 재샘플링과 사이클 일관성이 추가적 개선을 준다.
- **KITTI scene flow** (LiDAR가 있는 150개 프레임, 모델은 합성 데이터로만 학습): RGB-D 기반 방법들 중 기존 최고 성능인 PRSM 대비 상대 3D EPE를 63% 감소시켰으며, 전역 ICP 및 세그멘테이션-ICP 기준선보다 낮은 오차를 보여 — 강력한 sim-to-real 일반화를 입증한다. 지면 포인트를 포함하면 FlowNet3D+ICP가 EPE에서 PRSM을 능가하며, 실제 스캔 100개로 미세조정하면 결과가 더 향상된다.
- **응용**: 조밀한 scene flow는 부분 스캔 정합(ICP가 지역 최솟값에 갇히는 것보다 강건함)과, 이동 중인 차량을 지면 및 정지 물체와 깔끔하게 분리하는 모션 세그멘테이션에 사용된다.

## SLAM에서의 의미

FlowNet3D는 포인트 클라우드 상에서의 딥 scene flow 추정을 창시했으며, 이는 LiDAR SLAM 시스템이 동적 물체를 탐지하고 처리하는 방식의 기초가 된다 — 매핑이 의존해야 하는 정적 구조로부터 이동하는 차량과 보행자를 분리하는 것이다. 순서 없는 포인트 집합을 위한 이 소프트 대응점 레이어는 이후의 여러 후속 연구(PointPWC-Net, FLOT, FastFlow3D)에 영향을 주었고, RGB-D 측면의 이미지 기반 scene flow인 RAFT-3D를 보완한다. 그 정합 및 모션 세그멘테이션 시연은 SLAM 시스템이 scene flow를 정확히 어떻게 활용하는지를 미리 보여준다.

## 관련 문서

- [FlowNet](flownet.md) — 이름을 물려받은 2D optical flow의 원조
- [RAFT-3D](raft-3d.md) — 강체 운동 구조를 가진 RGB-D 영상 기반 scene flow
- [RAFT](raft.md) — 현대적인 조밀한 2D 대응점 백본
- [LiDAR](../level-02-getting-familiar/lidar.md) — 이 네트워크가 다루는 포인트 클라우드를 생성하는 센서
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md) — 이 네트워크가 완화하여 학습하는 고전적 매칭 문제
