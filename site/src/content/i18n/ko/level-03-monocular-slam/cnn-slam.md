# CNN-SLAM

> Tateno 2017 · [논문](https://arxiv.org/abs/1704.03489)

**한 줄 요약** — CNN이 예측한 밀집(dense) 깊이 지도와 LSD-SLAM 스타일의 반밀집(semi-dense) 광도 기반 깊이 정제를 융합하여, 단일 카메라로부터 절대 스케일, 밀집 재구성, 그리고 융합된 의미론적 레이블을 복원한다.

## 문제

직접(direct) 단안 SLAM(LSD-SLAM)은 반밀집 깊이 지도를 생성하지만, 질감이 적은(low-texture) 영역에서 실패하고, 순수 회전 하에서는 (스테레오 기저선이 없어) 깨지며, 절대 스케일을 복원할 수 없다. CNN 단일 이미지 깊이 예측은 어디서나 밀집하고 미터 단위의 깊이를 제공하지만, 깊이 경계가 국부적으로 뭉개지고 다중 뷰 일관성이 없다. CNN-SLAM("CNN-SLAM: Real-time dense monocular SLAM with learned depth prediction", Tateno, Tombari, Laina, Navab)은 이 상보적인 두 소스를 어떻게 융합해야 "저질감 영역과 같이 단안 SLAM 접근법이 실패하는 경향이 있는 이미지 위치에서는 깊이 예측이 우선시되고, 그 반대의 경우도 그렇게 되는지"를 묻는다.

## 방법 및 아키텍처

LSD-SLAM 위에 구축된 키프레임 기반 직접 SLAM이다. 각 키프레임 $k_i$는 포즈 $\mathbf{T}_{k_i}$, *밀집* 깊이 지도 $\mathcal{D}_{k_i}$, 불확실성 지도 $\mathcal{U}_{k_i}$를 보유한다. 두 개의 CNN(Laina 등의 ResNet-50 완전 합성곱 아키텍처, ImageNet으로 초기화; 하나는 berHu 손실로 깊이를 회귀하고, 다른 하나는 소프트맥스/교차 엔트로피로 의미론적 레이블을 예측)이 **키프레임마다 한 번씩만** GPU에서 실행되며, 추적과 정제는 CPU(두 스레드)에서 프레임마다 실행되어 시스템을 실시간으로 유지한다.

**추적** — 매 프레임 $t$는 고기울기 픽셀 $\tilde{\mathbf{u}}$로 제한된 광도 잔차에 대한 가우스-뉴턴을 통해 가장 가까운 키프레임에 정렬된다:

$$E(\mathbf{T}^{k_i}_t)=\sum_{\tilde{\mathbf{u}}\in\Omega}\rho\left(\frac{r(\tilde{\mathbf{u}},\mathbf{T}^{k_i}_t)}{\sigma(r(\tilde{\mathbf{u}},\mathbf{T}^{k_i}_t))}\right),\qquad r(\tilde{\mathbf{u}},\mathbf{T})=\mathcal{I}_{k_i}(\tilde{\mathbf{u}})-\mathcal{I}_t\big(\pi(\mathbf{K}\,\mathbf{T}\,\mathcal{V}_{k_i}(\tilde{\mathbf{u}}))\big)$$

여기서 $\rho$는 Huber 노름, $\sigma$는 잔차-불확실성 함수, $\pi$는 투영(perspective projection), $\mathcal{V}_{k_i}(\mathbf{u})=\mathbf{K}^{-1}\dot{\mathbf{u}}\,\mathcal{D}_{k_i}(\mathbf{u})$는 키프레임 정점(vertex) 지도이다.

**키프레임 초기화** — 회귀된 깊이 $\tilde{\mathcal{D}}_{k_i}$는 현재 카메라의 초점 거리 $f_{cur}$와 학습 센서의 초점 거리 $f_{tr}$ 간 불일치를 보정하도록 조정되는데, 이것이 절대 스케일 오차의 대부분을 해결한다:

$$\mathcal{D}_{k_i}(\mathbf{u})=\frac{f_{cur}}{f_{tr}}\,\tilde{\mathcal{D}}_{k_i}(\mathbf{u})$$

LSD-SLAM의 크고 일정한 초기 불확실성과 달리, $\mathcal{U}_{k_i}$는 키프레임의 CNN 깊이와 가장 가까운 키프레임의 워핑된 깊이 간의 차이의 제곱으로 초기화된다 — 즉 각 예측 깊이 값에 대한 프레임 간 신뢰도이다.

**프레임별 깊이 정제** — 매 프레임은 소기저선(small-baseline) 5픽셀 에피폴라 스테레오 매칭(Engel et al. 2013)을 통해 깊이/불확실성 추정치 $(\mathcal{D}_t,\mathcal{U}_t)$를 생성하며, 이는 불확실성 가중을 통해 키프레임에 융합된다:

$$\mathcal{D}_{k_i}(\mathbf{u})=\frac{\mathcal{U}_t(\mathbf{u})\,\mathcal{D}_{k_i}(\mathbf{u})+\mathcal{U}_{k_i}(\mathbf{u})\,\mathcal{D}_t(\mathbf{u})}{\mathcal{U}_{k_i}(\mathbf{u})+\mathcal{U}_t(\mathbf{u})},\qquad \mathcal{U}_{k_i}(\mathbf{u})=\frac{\mathcal{U}_t(\mathbf{u})\,\mathcal{U}_{k_i}(\mathbf{u})}{\mathcal{U}_{k_i}(\mathbf{u})+\mathcal{U}_t(\mathbf{u})}$$

고기울기 픽셀(낮은 스테레오 불확실성)은 정제된 다중 뷰 깊이로 수렴한다 — 정확히 CNN 경계가 뭉개지는 곳이다 — 반면 저질감 픽셀은 CNN 사전 정보를 유지한다. 키프레임 포즈는 포즈 그래프 최적화(g2o)로 전역적으로 정제되며, 전역 분할 모델(Global Segmentation Model)이 키프레임별 의미론적 지도를 3D 재구성에 점진적으로 융합한다.

## 실험 결과

ICL-NUIM(합성)과 TUM RGB-D에서 평가되었으며, CNN은 (센서와 환경이 다른) NYU Depth v2에서만 학습하여 일반화 성능을 검증했다; Xeon 2.4 GHz + Quadro K5200에서 실행, 네트워크는 304×228, SLAM은 320×240 해상도. 9개 시퀀스에 대한 평균 절대 궤적 오차는 **0.246 m**로, *실측 스케일 부트스트래핑을 사용한* LSD-SLAM의 0.562 m, LSD-SLAM의 0.772 m, ORB-SLAM의 0.643 m, 그리고 Laina의 CNN 깊이를 포인트 기반 융합에 입력한 경우의 0.512 m와 대비된다. 정확하게 추정된 깊이(실측값의 10% 이내)의 평균 비율은 **22.5%**로, 원시 CNN + 융합의 18.5%, REMODE의 7.6%, 부트스트래핑된 LSD-SLAM의 3.0%, LSD-SLAM의 0.2%와 대비된다. 대부분 회전으로만 이루어진 TUM fr1/rpy 시퀀스에서도 CNN-SLAM은, LSD-SLAM이 심하게 노이즈가 있고 ORB-SLAM이 초기화에 실패하는 상황에서 여전히 장면을 재구성한다. 이 논문은 또한 단안 카메라로부터의 최초의 결합 3D + 의미론적 재구성(NYU의 4개 상위 클래스)을 보여준다.

## SLAM에서의 의미

CNN-SLAM은 딥러닝 깊이 예측을 고전적 SLAM 파이프라인과 결합한 최초의 시스템 중 하나로, DVSO, D3VO 및 이후의 많은 시스템이 따른 "고전적 + 학습" 패러다임을 개척했다. 학습된 깊이를 불확실성이 있는 픽셀별 측정값으로 취급하고 역분산 가중으로 다중 뷰 깊이와 융합하는 그 핵심 방식은, 학습된 깊이가 미터 단위 스케일을 복원하고 순수 회전에서도 생존할 수 있으며, 기하학과 의미론이 하나의 단안 시스템 안에서 공동으로 재구성될 수 있음을 보여주었다.

## 관련 문서

- [LSD-SLAM](lsd-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [DeepFusion](deepfusion.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Self-supervised depth](self-supervised-depth.md)
