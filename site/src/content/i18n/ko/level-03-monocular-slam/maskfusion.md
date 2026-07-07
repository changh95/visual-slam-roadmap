# MaskFusion

> Rünz 2018 · [논문](https://arxiv.org/abs/1804.09194)

**한 줄 요약** — 세계를 하나의 강체 장면으로 취급하는 대신, 여러 개의 *움직이는* 객체를 개별적인 의미론적 서펠 모델로 인식·분할·추적·재구성하는 실시간 RGB-D SLAM 시스템.

## 문제

전통적인 SLAM 시스템은 "정적 장면의 순수한 기하 지도만을 출력한다": 움직이는 모든 것은 무시해야 할 이상값으로 취급되며, 맵은 그 안에 어떤 객체가 있는지에 대해 아무것도 말해주지 않는다. 초기의 인식 기반 SLAM(예: SLAM++)은 객체를 추적할 수 있었지만 사전 스캔된 3D 모델이 있는 객체에 한정되었고, 의미론적 기능이 있는 밀도 SLAM(SemanticFusion)은 맵 포인트에 고정된 카테고리 레이블을 부여했을 뿐 인스턴스를 구분하지 못했다. MaskFusion은 이 조합을 목표로 한다: 객체 인식적이고, 의미론적이며, *동시에* 동적인 SLAM — 알려진 모델 없이 여러 개의 독립적으로 움직이는 객체를 실시간으로 인식, 분할, 재구성하는 것이다.

## 방법 및 아키텍처

MaskFusion은 다중 모델 SLAM 시스템이다: 배경 모델 하나와, 인식된 각 객체마다 서펠 모델 $\mathcal{M}_m$, $m \in \{0..N\}$을 유지한다(ElasticFusion의 표현 방식 — 각 서펠은 위치, 법선, 색상, 가중치, 반지름, 타임스탬프를 저장한다). 각 모델은 강체 포즈 $\mathbf{R}_{tm}, \mathbf{t}_{tm}$와 정적/동적 플래그를 가지며, 정적이 아닌 객체만 별도로 추적된다(운동 불일치가 감지되거나 사람이 물체를 만졌을 때 객체는 동적으로 선언된다). 프레임마다 세 단계가 실행된다.

**추적.** 각 추적 모델의 포즈 증분 $\xi_m \in \mathfrak{se}(3)$은 이전 포즈에서 렌더링된 모델에 대한 결합 기하-광도 에너지를 최소화한다.

$$E_m = \min_{\xi_m}\,(E^{icp}_m + \lambda E^{rgb}_m)$$

여기에는 투영적 점-대-평면 ICP 항과 밝기 불변성 항이 포함된다.

$$E^{icp}_m = \sum_i \left((\mathbf{v}^i - \exp(\xi_m)\,\mathbf{v}^i_t)\cdot\mathbf{n}^i\right)^2, \qquad E^{rgb}_m = \sum_{\mathbf{u}\in\Omega}\left(\mathcal{I}_t(\mathbf{u}) - \mathcal{I}^a_{t-1}\big(\pi(\exp(\xi_m)\,\pi^{-1}(\mathbf{u},\mathcal{D}_t))\big)\right)^2,$$

여기서 $\mathbf{v}^i,\mathbf{n}^i$는 렌더링된 모델의 정점/법선, $\mathbf{v}^i_t$는 역투영된 현재 정점, $\mathcal{D}_t,\mathcal{I}_t$는 현재 깊이/명도 맵, $\pi$는 투영 사상이다. 4단계 거친-세밀 피라미드(CUDA)에서 Gauss–Newton으로 해를 구한다.

**분할.** Mask R-CNN은 인스턴스 마스크와 클래스 레이블(COCO 80개 클래스)을 제공하지만 ~5Hz로만 동작하며 경계가 배경으로 새어나가므로, 프레임 큐(길이 12, 약 400ms 지연)에서 비동기적으로 실행되고, 프레임별 *기하학적* 분할이 선명한 실시간 경계를 제공한다: 픽셀은 $\phi_d + \hat{\lambda}\phi_c > \tau$일 때 에지로 판정되며, 깊이 불연속 항 $\phi_d = \max_{i\in\mathcal{N}} |(\mathbf{v}_i - \mathbf{v})\cdot\mathbf{n}|$과 지역 근방 $\mathcal{N}$에 대한 유사한 오목도 항 $\phi_c$를 사용한다. 에지 맵의 연결 요소는 의미론적 마스크에 매핑되고(65% 이상 겹침), 마스크는 기존 모델에 매핑되며(투영된 모델 레이블, 클래스 ID 매칭), 남은 요소는 직접 모델에 매핑된다; *사람*과 같은 클래스는 융합에서 완전히 제외될 수 있다.

**융합.** 서펠은 ElasticFusion과 동일한 투영적 데이터 연관에 의해 갱신되며, 최종 분할로 스텐실 처리되어 각 새 서펠이 정확히 하나의 모델에 속하도록 하고, 불완전한 마스크를 흡수하기 위해 스텐실 밖의 서펠에는 신뢰도 페널티가 부여된다.

## 실험 결과

- TUM RGB-D 동적 시퀀스, AT-RMSE (cm): 매우 동적인 *f3w_xyz* / *f3w_halfsphere*에서 MaskFusion(사람 검출을 활용해 사람을 무시)은 **10.4 / 10.6**을 기록한 반면 Co-Fusion 69.6 / 80.3, ElasticFusion 21.6 / 20.9, VO-SF 87.4 / 73.9, StaticFusion 12.7 / 39.1이다. 약하게 동적인 장면에서는 순수 ElasticFusion이 여전히 최고이다(f3s_static에서 0.9 대 MaskFusion의 2.1) — 지나치게 적극적인 이상값 제거가 추적에 여전히 유용한 포인트를 버리기 때문이다.
- 객체 추적: f3_long_office의 테디베어는 2.2cm AT-RMSE로 추적되는 반면 카메라는 8.9cm에 이른다(곰이 배경에 융합되었다면 7.2cm).
- 재구성: YCB 블리치 병(높이 250mm)은 평균 서펠 오차 7.0mm(표준편차 5.8mm)로 재구성된다.
- 600프레임 주석 시퀀스에 대한 분할 IoU: 투영된 융합 모델 마스크가 Mask R-CNN + 기하학적 정제를 능가하며, 이는 다시 Mask R-CNN 단독보다 우수하다.
- 런타임: SLAM 파이프라인은 모델 1개일 때 >30Hz, 비정적 모델 3개일 때 ~20Hz; Mask R-CNN은 전용 2번째 GPU에서 5Hz로 동작한다(GTX Titan X 2장, i7 3.5GHz). AR 데모(칼로리 추정, 움직이는 스케이트보드를 타는 캐릭터)와 파지(grasping) 시퀀스가 인스턴스 인식 동적 맵을 활용한다.

## SLAM에서의 의미

MaskFusion은 "정적 세계에서의 SLAM"에서 동적이고 객체 인식적인 SLAM으로의 전환을 상징하는 랜드마크이다: 알려진 객체 모델 없이도 객체별 밀도 모델과 의미론적 레이블을 실시간으로 유지할 수 있음을 보였다. 이 연구 흐름은 로봇 조작과 AR 시나리오의 기반이 되는데, 이런 시나리오에서 장면의 흥미로운 부분은 정확히 움직이는 것들이다 — 움직이는 객체를 지워버리는 맵은 그것을 잡아야 하는 로봇에게 무용지물이다. MID-Fusion과 함께 MaskFusion은 이후 VDO-SLAM과 DynaSLAM II가 최적화 백엔드에서 정식화한 객체 수준 동적 SLAM의 틀을 확립했다.

## 관련 문서

- [MID-Fusion](mid-fusion.md)
- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md)
- [SLAM++](../level-04-rgbd-slam/slampp.md)
