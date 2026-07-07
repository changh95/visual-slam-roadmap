# Co-SLAM

> Wang 2023 · [논문](https://arxiv.org/abs/2304.14377)

**한 줄 요약** — Instant-NGP 스타일의 다중 해상도 해시 그리드와 매끄러운 원-블롭(one-blob) 좌표 인코딩을 신경 SLAM에 결합하여, NICE-SLAM보다 훨씬 빠른 10-17 Hz로 동작하면서도 일관된 표면을 유지한다.

## 문제

좌표 인코딩 MLP는 일관성(coherence)과 매끄러움(smoothness) 사전 정보를 지녀 충실도 높고 구멍을 채우는(hole-filling) 재구성을 제공하지만, 순차적으로 최적화될 때 "수렴이 느리고 파괴적 망각(catastrophic forgetting)을 겪는다"; 파라메트릭 인코딩(특징 그리드)은 빠르지만 "구멍 채우기와 매끄러움에서 부족하다". NICE-SLAM은 확장 가능했지만 실시간과는 거리가 멀었고, 그 지역(local) 그리드는 미관측 영역을 완성할 수 없다. Co-SLAM("Joint Coordinate and Sparse Parametric Encodings for Neural Real-Time SLAM")은 하나의 실시간 RGB-D SLAM 시스템 안에서 두 특성을 동시에 얻고자 한다.

## 방법 및 아키텍처

알려진 내부 파라미터를 가진 RGB-D 스트림이 주어지면, Co-SLAM은 카메라 포즈 $\{\xi_t\}$와, 세계 좌표를 색상 및 절단된 부호 거리(truncated signed distance, TSDF)로 매핑하는 신경 필드 $f_\theta(\mathbf{x})\mapsto(\mathbf{c},s)$를 공동으로 최적화한다. **결합 인코딩**은 매끄러운 원-블롭 좌표 인코딩 $\gamma(\mathbf{x})$를 Instant-NGP 다중 해상도 해시 그리드 $\mathcal{V}_\alpha$(레벨은 $R_{min}$부터 $R_{max}$까지 걸쳐 있고, 삼선형 보간됨)로부터의 특징과 연결한다. 두 개의 작은 MLP가 디코딩한다:

$$f_\tau(\gamma(\mathbf{x}),\mathcal{V}_\alpha(\mathbf{x}))\mapsto(\mathbf{h},s),\qquad f_\phi(\gamma(\mathbf{x}),\mathbf{h})\mapsto\mathbf{c},$$

학습 가능한 파라미터는 $\theta=\{\alpha,\phi,\tau\}$이다 — "온라인 SLAM에 필요한 빠른 수렴, 효율적인 메모리 사용, 구멍 채우기"를 제공한다. 색상과 깊이는 광선 $\mathbf{x}_i=\mathbf{o}+d_i\mathbf{r}$을 따라 정규화된 가중 합 $\hat{\mathbf{c}}=\tfrac{1}{\sum_i w_i}\sum_i w_i\mathbf{c}_i$, $\hat{d}=\tfrac{1}{\sum_i w_i}\sum_i w_i d_i$로 렌더링되며, 단순한 종 모양(bell-shaped)의 SDF-가중치 변환을 사용한다

$$w_i=\sigma\!\left(\frac{s_i}{tr}\right)\sigma\!\left(-\frac{s_i}{tr}\right),$$

여기서 $tr$은 절단 거리(10 cm), $\sigma$는 시그모이드다. 샘플링은 깊이 안내(depth-guided) 방식이다: $M_c$개의 균일 샘플과, 측정된 깊이 주변의 $M_f$개의 표면 근접 샘플을 더한다.

**손실 함수**: $\ell_2$ 색상/깊이 렌더링 손실; 절단 영역 내부의 근사 SDF 손실 $\mathcal{L}_{sdf}$는 예측값을 $D[u,v]-d$ 쪽으로 끌어당긴다; 자유 공간 손실은 표면에서 먼 곳에서 $s_p=tr$을 강제한다; 그리고 인접한 해시 그리드 정점들의 특징-메트릭 차이에 대한 매끄러움 정규화항 $\mathcal{L}_{smooth}=\tfrac{1}{|\mathcal{G}|}\sum_{\mathbf{x}\in\mathcal{G}}\Delta_x^2+\Delta_y^2+\Delta_z^2$는, 미관측 공간에서의 해시 충돌 노이즈를 억제하기 위해 작은 무작위 영역에서 계산된다.

**추적**은 등속 운동 모델 $\mathbf{T}_t=\mathbf{T}_{t-1}\mathbf{T}_{t-2}^{-1}\mathbf{T}_{t-1}$로 각 프레임을 초기화한 다음, $N_t$개의 샘플링된 픽셀에 대해 $\xi_t$를 최적화한다. **전역 번들 조정**이 두 번째 핵심 아이디어다: 전체 키프레임 이미지를 저장하고 그중 약 10개를 선택하는(iMAP/NICE-SLAM) 방식 대신, Co-SLAM은 키프레임당 픽셀의 약 5%만 저장하고, 키프레임을 자주(매 5번째 프레임마다) 삽입하며, *전체* 키프레임 데이터베이스에서 $N_g$개의 광선을 샘플링하여 지도와 모든 포즈를 공동으로 최적화하고, 누적된 기울기로부터의 포즈 업데이트와 $k_m$번의 지도 갱신 스텝을 교대로 수행한다.

## 실험 결과

- **Replica**: 깊이 L1 1.51 cm, 정확도 2.10 cm, 완전성 2.08 cm, 완전성 비율 93.44%를 0.26M 파라미터로 **17.4 FPS**에서 달성 — 이는 NICE-SLAM의 1.90 / 2.37 / 2.64 / 91.13%(0.91 FPS, 17.4M 파라미터), iMAP의 4.64 / 3.62 / 4.93 / 80.51%와 대비된다.
- **NeuralRGBD 합성 데이터** (노이즈가 있는 깊이, 얇은 구조물): 깊이 L1 3.02 cm로, NICE-SLAM의 6.32와 iMAP*의 43.91과 대비되며, 15.6 FPS로 동작한다.
- **ScanNet 추적**: 평균 ATE RMSE 9.37 cm(추적 반복 횟수를 두 배로 하면 8.75 cm)로, NICE-SLAM의 9.63과 대비되며, 6.4-12.8 FPS로 동작(NICE-SLAM은 0.68 FPS).
- **TUM RGB-D**: fr1/desk, fr2/xyz, fr3/office에서 2.7 / 1.9 / 2.6 cm(반복 횟수를 늘리면 2.4 / 1.7 / 2.4) — 신경 기반 시스템 중 최고 성능이지만, 여전히 ORB-SLAM2(1.6 / 0.4 / 1.0)에는 못 미친다.
- **어블레이션**: 원-블롭 인코딩을 제거하면 완전성이 저하되고(2.13→2.08 cm 전체 모델, 비율 93.17→93.44%), 해시 그리드를 제거하면 정확도가 저하된다(3.69 cm); 전역 BA는 동일한 총 광선 예산에서 ATE 8.75±0.33을 달성하며, 이는 NICE-SLAM 스타일의 지역 BA의 9.69, BA 없음의 16.81과 대비된다.

## SLAM에서의 의미

Co-SLAM은 신경 암시적 SLAM을 실시간 속도로 끌어올려, NeRF-SLAM 계열을 대화형 사용에 실용적으로 만들었으며, 구멍 채우기를 복원하는 매끄러운 좌표 인코딩과 결합할 경우 Instant-NGP의 해시 그리드가 온라인 매핑에 사용 가능함을 보여주었다. 그 결합형 파라메트릭 + 좌표 인코딩과 희소 픽셀 전역 번들 조정은, ESLAM의 삼중 평면(tri-plane)과 Point-SLAM의 신경 포인트 클라우드와 더불어 NICE-SLAM 계열에서 영향력 있는 설계 패턴이 되었다.

## 관련 문서

- [NICE-SLAM](nice-slam.md)
- [iMAP](imap.md)
- [ESLAM](eslam.md)
- [Point-SLAM](point-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)
