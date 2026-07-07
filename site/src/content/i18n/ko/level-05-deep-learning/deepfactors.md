# DeepFactors

> Czarnowski 2020 · [논문](https://arxiv.org/abs/2001.05049)

**한 줄 요약** — DeepFactors(RA-L 2020)는 CodeSLAM이 학습한 컴팩트한 깊이 코드를, 광도(photometric), 재투영, 희소 기하학적 오차를 표준 팩터 그래프 소프트웨어 안에서 동시에 팩터로 사용하는 최초의 실시간 확률적 밀집 단안 SLAM 시스템으로 발전시킨다.

## 문제

단안 SLAM은 세 축을 따라 파편화되어 있었다: 장면 기하학 표현(희소 랜드마크 대 밀집 맵), 다중 뷰 문제를 최적화하는 데 쓰이는 일관성 척도(광도 대 재투영 대 기하학적), 그리고 학습된 사전 분포를 사용하는지 여부. 희소 방법은 실시간 결합 확률적 추론을 허용하지만 상호작용에는 쓸모없는 맵을 만든다. 밀집 방법은 상호 상관관계를 버리고 추적/매핑을 교대로 수행한다. CodeSLAM은 컴팩트 코드 아이디어를 입증했지만 "완전한 SLAM의 기능이 결여되어 있었고, 실시간 성능이 불가능했으며, 실제 손에 든 카메라 장면으로 일반화되지 않았다". DeepFactors는 이러한 패러다임들을 "실시간 성능을 유지하면서도 확률적 프레임워크 안에서" 통합한다.

## 방법 및 아키텍처

각 키프레임은 포즈 변수 $p_i$와 코드 변수 $\mathbf{c}_i$를 갖는다. 깊이는 코드로부터 *선형적으로* 디코딩되므로 팩터는 값비싼 재선형화가 결코 필요하지 않다:

$$D_i = f(\mathbf{c}_i, I_i) = D_i^0 + J(I_i)\,\mathbf{c}_i ,$$

여기서 $D_i^0$은 제로-코드 깊이이고 $J(I_i) = \partial D_i / \partial \mathbf{c}_i$는 이미지 조건부 야코비안이다. 네트워크(U-Net 특징 추출기 + 선형 디코더 VAE, 그리고 초기화를 위한 명시적 코드 예측 인코더와 픽셀별 불확실성 $b$)는 256×192 해상도, 코드 크기 32로 약 140만 장의 ScanNet 이미지에서 학습된다.

세 가지 쌍별 일관성 오차가 팩터가 되며, 모두 $T_{ji} \in SE(3)$를 사용하는 워프 $\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) = \pi(T_{ji}\,\pi^{-1}(\mathbf{x}, D_i(\mathbf{x})))$ 위에 세워진다:

$$e_{pho}^{ij} = \sum_{\mathbf{x}\in\Omega_i} \| I_i(\mathbf{x}) - I_j(\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i)) \|^2 \qquad \text{(밀집, 직접)}$$

$$e_{rep}^{ij} = \sum_{(\mathbf{x},\mathbf{y})\in M_{ij}} \| \omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) - \mathbf{y} \|^2 \qquad \text{(BRISK 매칭, Cauchy robust cost)}$$

$$e_{geo}^{ij} = \sum_{\mathbf{x}\in\Omega_i} \| \left[ T_{ji}\,\pi^{-1}(\mathbf{x}, D_i(\mathbf{x})) \right]_z - D_j(\hat{\mathbf{x}}) \|^2 \qquad \text{(깊이 일관성, Huber, 희소 픽셀 샘플)}$$

제로-코드 사전 팩터는 코드를 VAE의 가우시안 잠재 영역 안에 유지시킨다. 시스템의 흐름: 들어오는 프레임은 GPGPU SE(3) Lucas–Kanade 정렬기(~250 Hz)를 이용해 가장 가까운 키프레임에 대해 추적된다; 새로운 키프레임은 코드 예측 네트워크로부터 초기화되고 마지막 N개의 키프레임과 쌍별 팩터로 연결된다; *전체* 맵은 iSAM2의 증분 베이즈 트리 갱신(GTSAM)으로 배치 MAP 문제로 최적화된다. 자체 깊이가 없는 경량 "일방향(one-way)" 프레임은 추가적인 광도 증거를 가장 최근 키프레임에 공급한 뒤 소거(marginalize)된다. 지역 루프(최근 10개 키프레임 내의 포즈 기준)와 전역 루프(bag-of-words + 추적 검증, 재투영 팩터만 사용)는 온라인으로 닫힌다.

## 실험 결과

- ScanNet 검증 장면에 대한 팩터 ablation(Table I): 모든 팩터가 도움이 되며, 재투영은 주로 궤적에, 기하학적 팩터는 주로 재구성에 도움을 준다; scene0084_00에서 ATE-RMSE는 (광도 전용) 0.131 m에서 결합 시 0.061 m로 떨어지고 pc110은 69.14%에서 73.66%로 상승한다.
- 재구성(ICL-NUIM + TUM, ground truth의 10% 이내인 깊이의 비율, 전체 추정 궤적): 평균 27.10, CNN-SLAM 19.77, Laina 14.62, LSD-BS 3.44 대비(Table II).
- 궤적(TUM fr1, ATE m): fr1/360 0.142 대 CNN-SLAM 0.500; fr1/rpy 0.047 대 0.261; 모든 시퀀스에서 CodeSLAM을 능가하며(fr1/desk 0.119 대 0.654), 실시간이 아닌 DeepTAM(fr1/desk 0.078)과 비교해도 실시간으로 동작하면서 비슷한 수준이다(Table III).
- 단일 GTX 1080에서의 시간: 추적 ~250 Hz; 키프레임당 네트워크 패스 ~340 ms(이 중 순전파는 16 ms에 불과하며 나머지는 tf.gradients를 통한 코드 야코비안 계산); 오픈소스로 공개됨.

## SLAM에서의 의미

DeepFactors는 잠재 코드 매핑 계열(CodeSLAM)과 주류 팩터 그래프 SLAM 엔지니어링 사이의 다리다: 학습된 밀집 기하학이 별도의 최적화기가 아니라 고전적 제약 조건과 동일한 확률적 백엔드 안에 존재할 수 있음을 보여주었다. 실용적으로는, 직접, 특징 기반, 학습된 사전 정보의 신호를 결합하는 것이 밀집 단안 SLAM을 더 강건하면서 불확실성을 인식하게 만든다는 것을 입증했다 — 그리고 표준 팩터 그래프를 사용한 설계 덕분에 다른 센서 모달리티를 추가하는 것이 간단해지며, 이는 이후의 하이브리드 시스템들이 공유하는 설계 철학이다.

## 관련 문서

- [CodeSLAM](codeslam.md)
- [SceneCode](scenecode.md)
- [CodeMapping](codemapping.md)
- [CNN-SLAM](../level-03-monocular-slam/cnn-slam.md) — 비교 대상이 되는 실시간 학습 사전 분포 기준선
- [DeepTAM](deeptam.md) — 학습된 밀집 추적/매핑 기준선
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
