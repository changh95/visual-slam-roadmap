# BAD SLAM

> Schöps 2019 · [논문](https://openaccess.thecvf.com/content_CVPR_2019/html/Schops_BAD_SLAM_Bundle_Adjusted_Direct_RGB-D_SLAM_CVPR_2019_paper.html)

**한 줄 요약** — 키프레임 포즈와 밀집 서펠 지도를 GPU에서 실시간으로 결합 최적화하는 직접 번들 조정 RGB-D SLAM으로, 고정밀 ETH3D SLAM 벤치마크와 함께 발표되었습니다.

## 문제

모든 카메라 및 구조 파라미터를 결합 최적화하는 번들 조정은 SLAM의 표준 백엔드이지만, 밀집 RGB-D 데이터의 경우 변수의 수가 너무 많다고 여겨졌습니다: 이전 시스템들은 포즈 그래프 최적화, 지도 변형(Kintinuous, ElasticFusion), 프래그먼트 정렬, 또는 희소 특징 BA(BundleFusion, ORB-SLAM2)로 이를 근사했습니다. 두 번째 문제는 평가였습니다: 직접(direct) RGB-D 시스템은 롤링 셔터, 비동기화된 RGB/깊이 스트림, 깊이 캘리브레이션 오차에 매우 민감한데, 소비자용 카메라로 녹화된 기존 벤치마크는 이러한 하드웨어 결함을 알고리즘 정확도와 뒤섞습니다.

## 방법 및 아키텍처

프론트엔드는 각 프레임을 마지막 키프레임에 대해 $SE(3)$에서 표준적인 직접 광도+기하 정렬로 추적하고(매 10번째 프레임이 키프레임이 됩니다), 이진 특징 bag-of-words에 이어 직접 정렬과 포즈 그래프 초기화로 루프를 감지합니다. 백엔드 — 이 논문의 기여 — 는 모든 키프레임 $K$와 서펠 $S$에 대해 진정한 직접 BA를 수행합니다. 서펠 $s$는 중심 $\mathbf{p}_s$, 법선 $\mathbf{n}_s$, 반지름 $r_s$, 스칼라 디스크립터 $d_s$를 가진 방향성 있는 원판이며; 지도 어디에도 희소 특징점은 존재하지 않습니다. 비용 함수는 각 서펠을 대응 관계가 있는 모든 키프레임 $k$에 투영합니다:

$$C(K,S)=\sum_{k\in K}\sum_{s\in S_k}\Big[\rho_{\text{Tukey}}\big(\sigma_D^{-1}\,r_{\text{geom}}(s,k)\big)+w_{\text{photo}}\,\rho_{\text{Huber}}\big(\sigma_p^{-1}\,r_{\text{photo}}(s,k)\big)\Big]$$

$w_{\text{photo}}=10^{-2}$이고(깊이를 더 신뢰함), 강건 손실 파라미터는 10입니다. 기하 항은 서펠 법선을 따르는 점-대-평면 잔차입니다,

$$r_{\text{geom}}(s,k)=\big(\mathbf{T}_{kG}\,\mathbf{n}_s\big)^{T}\Big(\pi_{D,k}^{-1}\big(\hat{\pi}_{D,k}(\mathbf{T}_{kG}\,\mathbf{p}_s)\big)-\mathbf{T}_{kG}\,\mathbf{p}_s\Big)$$

여기서 $\mathbf{T}_{kG}$는 전역 좌표를 키프레임 좌표로 매핑하고, $\hat{\pi}_{D,k}$는 가장 가까운 깊이 픽셀로 투영하며 $\pi_{D,k}^{-1}$은 그 측정된 깊이로 역투영합니다. 이는 스테레오 깊이 잡음 모델 $\sigma_{d_m}=\delta\,d_m^2\,(bf)^{-1}$로 정규화됩니다($b$는 기저선, $f$는 초점 거리, $\delta=0.1$ px 매칭 오차). 광도 항은 서펠 중심과 원판 경계 위의 두 점 $\mathbf{s}_1,\mathbf{s}_2$에서 샘플링된 기하학적으로 일관된 강도 기울기 크기를, 저장된 디스크립터와 비교합니다:

$$r_{\text{photo}}(s,k)=\left\lVert\begin{pmatrix}I(\pi_{I,k}(\mathbf{s}_1))-I(\pi_{I,k}(\mathbf{p}_s))\\ I(\pi_{I,k}(\mathbf{s}_2))-I(\pi_{I,k}(\mathbf{p}_s))\end{pmatrix}\right\rVert_2-\,d_s$$

최적화는 하나의 거대한 시스템을 푸는 대신 번갈아 진행됩니다: 매 반복마다, (1) 대응하는 관측 법선을 평균하여 서펠 법선을 갱신; (2) Gauss-Newton으로 각 서펠의 위치와 디스크립터를 결합 최적화 — 위치는 법선을 따라서만 이동하므로($\mathbf{p}_s+t\,\mathbf{n}_s$), 각 서펠은 독립적인 2×2 계산이 되며, 이는 무질감 영역에서의 조건 불량 드리프트도 피하게 해줍니다; (3) 유사한 서펠 병합; (4) $\mathfrak{se}(3)$ 지역 업데이트 $\mathbf{T}_{kG}\exp(\hat{\epsilon})$로 모든 키프레임 포즈 최적화; (5) 선택적으로 내부 파라미터와 픽셀별 깊이 변형 이미지 최적화(Schur complement로 저렴하게 풀림). 개별 서펠 생성(덮이지 않은 4×4 픽셀 셀당 하나), 이상값 삭제, 반지름 업데이트가 번갈아 이루어집니다. 모든 것은 CUDA로 구현되어 있으며; 번갈아 진행하는 BA는 전체 Gauss-Newton 시스템에 대한 PCG solver보다 약간 더 낫고 빠른 것으로 나타났습니다.

## 실험 결과

TUM RGB-D(ATE RMSE)에서 BAD SLAM은 fr1-desk / fr2-xyz / fr3-office에서 1.7 / 1.1 / 1.7 cm에 도달합니다 — BundleFusion과 동률로 평균 순위 2위(2.7)이며, ORB-SLAM2(순위 1.0)에 뒤집니다; 내부 파라미터/깊이 변형 최적화를 끄면 3.6 / 1.2 / 2.5 cm로 저하되어, 소비자용 카메라의 캘리브레이션 오류가 얼마나 중요한지를 보여줍니다. TUM 장면의 합성 재렌더링에서는 BAD SLAM이 완전히 우세합니다(평균 ATE, 클린 조건에서 0.15 cm 대 ORB-SLAM2의 0.47, BundleFusion의 0.34), 그리고 롤링 셔터와 비동기 RGB-D를 추가하면 모든 방법이 몇 배씩 저하됩니다 — 이것이 새로운 벤치마크를 만든 동기입니다. ETH3D SLAM 벤치마크(학습용 61개 + 테스트용 35개 시퀀스, 동기화된 글로벌 셔터 능동 스테레오 카메라, 모션 캡처 정답, 테스트 정답을 비공개로 유지한 온라인 리더보드)는 TUM의 순위를 뒤집습니다: BAD SLAM은 학습 및 테스트 세트 모두에서 ORB-SLAM2, BundleFusion, DVO SLAM, ElasticFusion을 크게 앞서지만, "어려운" 시퀀스(무질감 장면, 빠른 모션, 동적 요소)는 평가된 모든 방법을 패배시킵니다. 시스템은 i7-6700K + GTX 1080에서 실시간으로 동작합니다(키프레임당 약 370 ms의 BA 예산, 약 27 Hz 입력, 10프레임당 하나의 키프레임; 그림 1의 장면은 약 335,000개의 서펠을 유지합니다).

## SLAM에서의 의미

BAD SLAM은 희소 SLAM에 대해서는 Strasdat의 "Why filter?" 분석으로 이미 정리된 번들 조정의 정확도 논증이, 완전히 밀집한 RGB-D SLAM에도 확장된다는 것을 보였습니다: 포즈와 구조의 결합 최적화는 추적-후-융합이 분리된 파이프라인의 체계적인 편향을 제거합니다. 그만큼 지속적인 것은 평가에 대한 교훈입니다: 캘리브레이션이 부실하고 롤링 셔터가 있는 벤치마크에서의 결과는 방법들의 진짜 순위를 뒤집을 수 있으며, 이 논문의 ETH3D 벤치마크는 RGB-D SLAM의 표준 평가 도구가 되었습니다. 센서 잡음이 아니라 추적과 매핑 간의 불일치가 정확도의 병목일 때 이 논문의 아이디어를 참고할 만합니다.

## 관련 문서

- [ElasticFusion](elasticfusion.md) — 분리된 프레임-대-모델 추적과 지도 변형을 사용하는 서펠 매핑
- [BundleFusion](bundlefusion.md) — 희소 특징 BA와 TSDF 재통합을 통한 전역 일관성
- [DVO](dvo.md) — 강건한 직접 RGB-D 정렬, 밀집 직접 방법의 선구자
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) — 이 시스템 배후의 표현 방식 선택
- [DSO](../level-03-monocular-slam/dso.md) — 단안 SLAM에서의 희소 직접 BA 대응 사례
