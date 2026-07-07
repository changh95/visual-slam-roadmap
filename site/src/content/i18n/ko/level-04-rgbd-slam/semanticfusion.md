# SemanticFusion

> McCormac 2016 · [논문](https://arxiv.org/abs/1609.05130)

**한 줄 요약** — 최초의 실시간 밀집 의미론적 SLAM 시스템으로, 프레임별 CNN 분할 예측을 재귀적 베이지안 업데이트를 통해 ElasticFusion 서펠 맵에 융합하여 일관된 3D 의미론적 맵을 만든다.

## 문제

밀집 기하 SLAM은 정확한 3D 재건을 만들어내지만, 맵은 어떤 것이 *무엇인지* 알지 못한다 — 다음 단계의 로봇 지능과 직관적인 사용자 상호작용을 위해서는 맵이 기하와 외관을 넘어 의미론을 담아야 한다. 한편 단일 프레임 CNN 의미론적 분할은 잡음이 많고 시점에 의존적이다: 동일한 표면이라도 시점에 따라 다르게 레이블링될 수 있다. 빠져 있던 조각은 다수의 프레임별 2D 예측을 하나의 지속적이고 일관된 3D 레이블링으로 누적하는 메커니즘이었다.

## 방법 및 아키텍처

파이프라인은 함께 동작하는 세 가지 단위와 선택적 정규화기로 구성된다.

- **SLAM 백본(ElasticFusion)**: 각 프레임 $k$에 대해 ElasticFusion은 ICP와 RGB 정합을 결합해 카메라를 추적하여 포즈 $T_{WC}$를 얻고, 깊이를 서펠 맵으로 융합한다. 그 변형 그래프는 확률 분포가 작고 큰 루프 클로저를 거치는 동안에도 서펠과 함께 "실려서" 옮겨지게 하여, 서펠이 실제 세계의 개체와 지속적으로 연관되도록 유지한다 — 이는 정확히 의미론적 융합이 필요로 하는 장기 대응 관계다. (기본 파라미터를 사용하되, 깊이 컷오프는 3 m에서 8 m로 확장.)
- **CNN 프론트엔드**: 역합성곱 의미론적 분할 네트워크(Noh 등, VGG-16 기반, Caffe로 구현)가 10프레임마다 실행되어, 13개의 NYUv2 클래스에 대한 픽셀별 클래스 확률 $P(O_{u} = l_i \mid I_k)$를 반환한다. 사전학습된 RGB 필터의 평균 강도로부터 깊이 필터를 초기화하고 0–255 색상 범위에서 0–8 m 깊이 범위로 재조정(약 32배)함으로써 네 번째 *깊이* 채널이 추가된다. 입력은 224×224로 재조정되고, 출력은 640×480으로 업샘플링된다.
- **베이지안 레이블 융합**: 각 서펠 $s$는 균등 분포로 초기화된 레이블에 대한 이산 분포 $P(L_s = l_i)$를 저장한다. 추적된 포즈를 이용해, $x(s)$에 위치한 각 가시 서펠은 픽셀 $u(s,k) = \pi\big(T_{CW}(k)\, x(s)\big)$와 연관되어 재귀적으로 업데이트된다:

$$P(l_i \mid I_{1,\dots,k}) = \frac{1}{Z}\, P(l_i \mid I_{1,\dots,k-1})\; P\big(O_{u(s,k)} = l_i \mid I_k\big)$$

  여기서 $Z$는 정규화 상수다. SLAM의 대응 관계야말로 여러 시점에서 얻은 레이블 가설들을 베이지안 방식으로 결합할 수 있게 해주는 요소다.
- **선택적 CRF 정규화**: 가우시안 엣지 포텐셜을 갖는 완전 연결 CRF가 각 서펠을 노드로 취급하고, $E(\mathbf{x}) = \sum_s \psi_u(x_s) + \sum_{s<s'} \psi_p(x_s, x_{s'})$를 근사적으로 최소화하여 분포를 점진적으로 업데이트한다. 단항항은 $\psi_u(x_s) = -\log P(L_s = x_s \mid I_{1,\dots,k})$이고, 쌍별 커널은 Potts 가중치를 가지며 — 서펠 위치 $\mathbf{p}$와 색상 $\mathbf{c}$에 대한 양방향(bilateral) 외관 커널과 법선 $\mathbf{n}$에 대한 평활성 커널로 구성된다:

$$k^1 = \exp\Big(-\frac{|\mathbf{p}_s-\mathbf{p}_{s'}|^2}{2\theta_\alpha^2} - \frac{|\mathbf{c}_s-\mathbf{c}_{s'}|^2}{2\theta_\beta^2}\Big), \qquad k^2 = \exp\Big(-\frac{|\mathbf{p}_s-\mathbf{p}_{s'}|^2}{2\theta_\alpha^2} - \frac{|\mathbf{n}_s-\mathbf{n}_{s'}|^2}{2\theta_\gamma^2}\Big)$$

  여기서 $\theta_\alpha = 0.05$ m, $\theta_\beta = 20$, $\theta_\gamma = 0.1$ rad이며, 500프레임마다 적용된다.

프레임당 비용(i7-5820K + Titan Black): SLAM 29.3 ms, 확률 테이블 관리 1.0 ms; CNN 순전파 51.2 ms와 베이지안 업데이트 41.1 ms는 10프레임마다 — 평균 프레임 속도 25.3 Hz.

## 실험 결과

자체 제작한 사무실 재건 데이터셋(루프가 있는 궤적, 주석이 달린 49개 테스트 프레임, 13개 NYUv2 클래스)에서, 융합은 RGBD-CNN을 클래스 평균 정확도 43.6%에서 48.3%로, 최신 Eigen 등의 CNN을 57.1%에서 60.0%로 끌어올렸다. NYUv2 테스트 세트(140개의 사용 가능한 시퀀스, 360개의 레이블된 이미지)에서 SemanticFusion은 RGBD-CNN을 클래스 평균 55.6%에서 58.9%로(픽셀 평균 62.0%에서 67.5%로), Eigen 등을 59.9%에서 63.2%로(+3.3%) 개선했다; CRF를 추가하면 소폭의 추가 향상(63.6%)이 있었다. 개선 정도는 대체로 회전 위주 궤적이 많은 NYUv2보다 사무실 데이터셋에서 약 두 배 크게 나타났다 — 다중 뷰 융합은 시점이 다양할 때 가장 큰 가치를 발휘한다. 모든 프레임에서 예측하면 8.2 Hz에서 52.5%의 정확도를, 10프레임마다 예측하면 25.3 Hz에서 49–51%를 얻는다.

## SLAM에서의 의미

SemanticFusion은 "심층 의미론적 SLAM"을 개척했다: CNN 인지와 밀집 SLAM이 상호 보완적이며, SLAM이 프레임별 2D 예측을 지속적이고 일관된 3D 의미론적 맵으로 바꿔주는 대응 관계를 제공하고, 이 융합이 2D 레이블링 자체까지도 개선한다는 것을 보였다. 이는 Fusion++, PanopticFusion, Kimera, 그리고 오늘날의 3D 장면 그래프 시스템으로 이어지는 의미론적 매핑 계열에 직접적인 영감을 주었다.

## 관련 문서

- [ElasticFusion](elasticfusion.md)
- [Fusion++](fusionpp.md)
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md)
- [MaskFusion](../level-03-monocular-slam/maskfusion.md)
- [ConceptFusion](../level-05-deep-learning/conceptfusion.md)
