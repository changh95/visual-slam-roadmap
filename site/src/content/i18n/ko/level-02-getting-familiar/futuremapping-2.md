# FutureMapping 2

> Davison 2019 · [논문](https://arxiv.org/abs/1910.14139)

**한 줄 요약** — FutureMapping의 튜토리얼 성격의 후속 논문으로, 팩터 그래프 위의 가우시안 신뢰 전파(Gaussian Belief Propagation)를 Spatial AI를 위한 핵심 분산 알고리즘으로 전개하며, 정보 형태의 완전한 메시지 전달 방정식을 유도하고 코드와 함께 표면 재구성 및 증분 SLAM 시뮬레이션으로 이를 시연한다.

## 문제

FutureMapping 1이 비전을 논증했다면, 이 논문은 알고리즘적 실체를 제공한다. 표준 SLAM 백엔드(g2o, GTSAM, Ceres)는 중앙집중식 전역 풀이를 통해 팩터 그래프 추론을 수행하는데, 이는 스마트 로봇과 실제 제품 제약 하에서 동작하는 장치가 필요로 할 분산적이고 증분적이며 항시 가동되는 추정과 잘 맞지 않는다 — 저장소와 연산이 수천 개의 코어에 걸쳐 분산된, 부상하는 그래프 프로세서들과도 마찬가지다. 이 논문은 GBP가 이 미래에 "적합한 성격"을 가진다고 주장한다: 완전히 지역적인 연산과 저장, 임의의 메시지 스케줄, 그래프의 동적 수정 용이성이다.

## 방법 및 아키텍처

GBP는 모든 메시지와 신뢰가 가우시안인 loopy belief propagation이며, **정보 형태(information form)** $\eta = \Lambda\mu$(정보 벡터와 정밀도 행렬)로 유지된다 — 이는 랭크 결핍인 무제약 변수를 다룰 수 있게 하고, 가우시안들의 곱을 단순한 파라미터 합으로 만든다. 측정값 $\mathbf{z}_s$를 모델 $\mathbf{h}_s$와 측정 정밀도 $\Lambda_s$로 인코딩하는 팩터는

$$f_s(\mathbf{x}_s) = K \exp\left( -\tfrac{1}{2} (\mathbf{z}_s - \mathbf{h}_s(\mathbf{x}_s))^{\top} \Lambda_s (\mathbf{z}_s - \mathbf{h}_s(\mathbf{x}_s)) \right).$$

**선형화.** 비선형 팩터는 야코비안 $\mathrm{J}_s$를 이용해 앵커 $\mathbf{x}_0$ 주변에서 지역 가우시안으로 변환된다:

$$\eta_s = \mathrm{J}_s^{\top}\Lambda_s\left( \mathrm{J}_s\mathbf{x}_0 + \mathbf{z}_s - \mathbf{h}_s(\mathbf{x}_0) \right), \qquad \Lambda_s' = \mathrm{J}_s^{\top}\Lambda_s\mathrm{J}_s,$$

정확히 가우스-뉴턴 스텝의 재료들이지만, 팩터에 지역적으로 유지되며 원하는 만큼(자주 또는 드물게) 재선형화될 수 있다.

**변수-팩터 메시지**는 단순히 다른 모든 수신 메시지의 합이다: $\mathbf{x}_m$의 이웃 중 목표 팩터 $f_s$를 제외한 것들에 대해 $\eta_{ms} = \sum_{l} \eta_{ml}$이고 $\Lambda_{ms} = \sum_{l} \Lambda_{ml}$이다. **팩터-변수 메시지**는 수신 메시지를 분할된 팩터 파라미터에 더하고(조건화), 출력 변수가 먼저 오도록 재정렬한 뒤, 표준 정보 형태 슈어 보수(Schur complement)로 나머지를 주변화한다:

$$\eta_{M\alpha} = \eta_\alpha - \Lambda_{\alpha\beta}\Lambda_{\beta\beta}^{-1}\eta_\beta, \qquad \Lambda_{M\alpha} = \Lambda_{\alpha\alpha} - \Lambda_{\alpha\beta}\Lambda_{\beta\beta}^{-1}\Lambda_{\beta\alpha}.$$

가장 비용이 큰 지역 연산은 작은 행렬 역산 $\Lambda_{\beta\beta}^{-1}$이다 — 단항/이항 팩터의 경우 그 차원은 최대 한 변수의 차원이다. 트리(체인) 그래프에서는 GBP가 양방향 한 번의 스윕으로 정확하지만, SLAM의 loopy 그래프에서는 반복을 통해 좋은 근사에 도달한다. 저자들은 수렴이 메시지 스케줄에 "놀라울 정도로 무관"함을 발견했다 — 이 특성 덕분에 각 노드가 자신의 코어나 장치에서 독립적으로 살 수 있다.

**강건 팩터.** M-추정기는 순수하게 지역적인 연산으로 통합된다: 팩터의 마할라노비스 거리 $M_s$를 평가하고, 이것이 임계값 $N_\sigma$(Huber의 이차-선형 전환점)를 넘으면 이번 메시지 전달에서 그 팩터의 $\eta_s$와 $\Lambda_s'$를 다음으로 재조정한다.

$$k_R = \frac{2N_\sigma}{M_s} - \frac{N_\sigma^2}{M_s^2},$$

이렇게 하면 메시지가 동일한 에너지를 가진 가우시안의 정밀도를 나르게 된다(임계값 이후 상수인 커널은 $k_R = N_\sigma^2/M_s^2$를 쓴다). 이는 "지연 데이터 연관(lazy data association)"을 낳는다: 팩터의 인라이어/이상치 상태는 증거가 쌓이면서 계속 바뀔 수 있다.

**코드가 있는 예제**: 보간된 높이 측정과 페어와이즈 매끄러움 팩터를 가진 1D 표면 재구성(루프 없는 체인이므로 정확히 풀림); 2D 제약 그래프; 오도메트리와 랜드마크 팩터를 가진 대화형 증분 2D SLAM 시뮬레이션(`bpslam.py`)으로, 로봇이 변수와 팩터를 추가함에 따라 메시지 전달이 그저 계속된다 — 루프 클로저에서조차 배치 재풀이가 없다. 사전 정보, 약한 앵커, 동적으로 편집된 팩터 강도는 그래프를 통해 자동으로 전파된다.

## 실험 결과

이 논문은 튜토리얼이며 그 평가는 시뮬레이션으로 정성적으로 제시된다: 증분 SLAM 시뮬레이션에서 GBP 추정은 배치 해와 일치하며, 루프 클로저를 포함한 동적으로 변화하는 그래프에도 여유롭게 대응한다. 측정값의 1/50이 큰 오차로 오염되고 모든 측정에 Huber 팩터를 적용한 경우, GBP는 이상치를 지역적이고 지연된 방식으로 탐지한다 — 잘못된 측정은 더 나은 가설을 지지하는 증거가 충분히 쌓인 후 훨씬 늦게 식별되는 경우가 많다. 수렴 후 팩터 정밀도를 바꾸면 전역적인 조정 없이도 빠르게 전파된다. 전체 유도와 시뮬레이션 그림은 논문을 참고하라.

## SLAM에서의 의미

이 논문은 SLAM 연구자들을 위한 표준적이고 접근하기 쉬운 GBP 입문서이며, 실제 속도 향상(Graphcore IPU 상의 번들 조정)과 분산 다중 로봇 추론(DANCeRS)을 보여준 후속 연구를 촉발했다. "중앙집중식 솔버 없는 팩터 그래프 SLAM"이라는 핵심 약속은 다중 로봇 시스템과, 향후 AR 장치 안에 들어갈 대규모 병렬 하드웨어가 무엇이 되든 그것과 직접적으로 관련이 있다.

## 관련 문서

- [FutureMapping 1](futuremapping-1.md) — 이 논문이 구체화하는 비전 논문
- [BA on Graph Processor](ba-on-graph-processor.md) — GBP 번들 조정의 첫 구체적인 IPU 시연
- [DANCeRS](dancers.md) — GBP를 통한 다중 로봇 분산 합의
- [Factor graph](factor-graph.md) — GBP가 동작하는 표현
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md) — GBP가 대체하는 중앙집중식 형식화
