# COLMAP

> Schönberger 2016 · [논문](https://colmap.github.io/)

**한 줄 요약** — 사실상의 표준이 된 오픈소스 점진적(incremental) Structure-from-Motion 및 Multi-View Stereo 파이프라인("Structure-from-Motion Revisited", CVPR 2016)으로, 3D 비전 전반에서 오프라인 재구성 및 실측 포즈 생성의 주력 도구로 사용된다.

## 문제

점진적 SfM — 이미지를 한 번에 하나씩 등록하면서, 그때그때 구조를 삼각측량하고 번들 조정하는 방식 — 은 2016년 당시 순서 없는 사진 컬렉션에 대한 우세한 전략이었지만, "강건성, 정확도, 완전성, 그리고 확장성은 진정으로 범용적인 파이프라인을 구축하기 위한 핵심 과제로 남아 있다". 기존 시스템(Bundler, VisualSFM)은 등록 가능한 이미지 중 상당 부분을 등록하지 못하거나, 잘못된 등록과 드리프트로 인해 깨진 모델을 만들어내는 경우가 많았다. Schönberger와 Frahm은 점진적 파이프라인의 각 단계를 재검토하고 이를 견고하게 만들어, 그 결과물을 COLMAP으로 배포했다.

## 방법 및 아키텍처

이 파이프라인은 두 단계로 구성된다: **대응점 탐색**(특징 추출, 매칭, *장면 그래프(scene graph)*를 생성하는 기하학적 검증)과 **점진적 재구성**(초기화, PnP를 통한 이미지 등록, 삼각측량, 번들 조정, 이상값 필터링). 이 논문의 기여는 각 단계를 다음과 같이 견고하게 만든다:

- **장면 그래프 증강**: 다중 모델 기하학적 검증은 각 이미지 쌍에 대해 기초 행렬($N_F$개의 내점), 호모그래피($N_H$), 본질 행렬($N_E$)을 추정하며, $N_H/N_F$ 같은 내점 비율과 삼각측량 각도의 중앙값 $\alpha_m$을 통해 각 엣지를 *일반(general)*, *파노라마(panoramic, 순수 회전)*, 또는 *평면(planar)* 으로 분류한다; 워터마크/타임스탬프/프레임("WTF") 쌍은 테두리 영역 유사 변환(similarity transform)으로 탐지되어 제거된다. 재구성은 파노라마가 아니고 가능하면 캘리브레이션된 쌍에서만 시작되며, 파노라마 쌍은 절대로 삼각측량되지 않는다.
- **다음 최적 뷰 선택**: 후보 이미지는 다중 해상도 피라미드($L$개의 레벨, 한 변당 $K_l = 2^l$개의 셀, 가중치 $w_l = K_l^2$)로 점수가 매겨진다: 삼각측량된 점을 관측 가능하게 포함하는 각 셀은 레벨마다 한 번씩 점수에 기여하므로, 점수 $S$는 *많은* 2D-3D 대응점과 *균일하게 분포된* 2D-3D 대응점 모두를 보상한다 — 불확실성 기반 뷰 계획(view planning)의 효율적인 근사이다.
- **강건한 다중 뷰 삼각측량**: 특징 트랙(전이적으로 연결된 매칭들)은 이상값이 심하게 섞여 있을 수 있으므로, 삼각측량은 트랙 원소들에 대한 재귀적 RANSAC으로 정식화된다: 두 개의 측정값을 샘플링하고, $a \neq b$인 $X_{ab} \sim \tau(\bar{x}_a, \bar{x}_b, P_a, P_b)$를 (DLT로) 삼각측량하며, 모델이 잘 조건화되어 있을 때만 — 다음과 같은 충분한 삼각측량 각도 $\alpha$

$$\cos\alpha=\frac{t_{a}-X_{ab}}{\left\|t_{a}-X_{ab}\right\|_{2}}\cdot\frac{t_{b}-X_{ab}}{\left\|t_{b}-X_{ab}\right\|_{2}}$$

  및 양의 깊이(카이랄리티), 임계값 $t$ 이하의 재투영 오차가 있을 때만 — 이를 받아들인다. 남은 측정값들에 대한 재귀는, 하나의 트랙으로 잘못 병합된 여러 독립적인 점들을 복원해낸다.
- **반복적 BA, 재삼각측량, 필터링**: 번들 조정은 강건화된 재투영 오차

$$E=\sum_{j}\rho_{j}\left(\left\|\pi\left(P_{c},X_{k}\right)-x_{j}\right\|_{2}^{2}\right)$$

  를 포즈 $P_c \in \mathrm{SE}(3)$와 점 $X_k \in \mathbb{R}^3$에 대해 최소화한다(지역 BA에서는 Cauchy 손실 $\rho_j$; 희소 직접 솔버 또는 PCG를 사용하는 Ceres). 지역 BA는 각 등록 이후 실행되며, 전역 BA는 모델이 일정 비율만큼 성장했을 때만 실행된다. COLMAP은 VisualSFM의 BA 이전(pre-BA) 재삼각측량 위에 *BA 이후(post-BA)* 재삼각측량을 추가하며, 필터링된 관측치가 줄어들 때까지 BA → 재삼각측량 → 필터링을 반복하여 드리프트에 대응한다.
- **중복 뷰 마이닝**: 밀집한 컬렉션에 대해, 상호 중첩도 $V_{ab}=\left\|v_{a}\wedge v_{b}\right\| / \left\|v_{a}\vee v_{b}\right\|$(이진 점-가시성 벡터)가 높은 영향받지 않는 이미지들은 그룹 $G_r$로 클러스터링되어 BA에서 단일 카메라로 축소되며, 그룹화된 비용 $E_g$는 투영 $\pi_g(G_r, P_c, X_k)$와 $P_{cr}=P_{c}G_{r}$를 사용한다 — 이는 축소된 카메라 시스템을 줄여준다.

동반 PatchMatch 기반 MVS 단계("Pixelwise View Selection for Unstructured Multi-View Stereo", ECCV 2016)가 출력물을 조밀화하며, 전체 시스템은 GUI, CLI, `pycolmap` 바인딩을 갖춘 유지보수되는 C++/CUDA 코드베이스로 배포된다.

## 실험 결과

Bundler, VisualSFM, Theia, DISCO를 대상으로, 총 144,953장의 순서 없는 인터넷 사진으로 이루어진 17개 데이터셋에서 평가되었다:

- **완전성**: 거의 모든 데이터셋에서 가장 많은 이미지를 등록한다 — 예를 들어 Rome: 74,394장 중 20,918장을 등록(Bundler는 14,797장, Theia는 13,455장); Quad: 5,860장(각각 5,624장/5,028장과 대비).
- **정확도**: Quad의 실측 카메라 위치에서 최고의 포즈 정확도를 보인다 — 중앙값 오차 0.85 m로, VisualSFM 0.89 m, Bundler 1.01 m, DISCO 1.16 m와 대비된다; 평균 재투영 오차는 약 0.6-0.8 px로, Bundler/Theia의 약 1.5-3.2 px와 대비된다.
- **효율성**: Bundler보다 50배 이상 빠르다(VisualSFM보다는 약간 느리며, Theia가 가장 빠르다). RANSAC 삼각측량은 전수 샘플링보다 10-40배 빠르며 트랙 길이는 근소하게 더 짧다; Dubrovnik(4,700만 개의 검증된 매칭으로부터 얻은 290만 개의 트랙)에서 재귀적 RANSAC은 평균 트랙 길이 8.8인 906,501개의 점을 복원하며, 이는 Bundler의 평균 트랙 길이 7.8인 713,824개의 점과 대비된다.
- **중복 뷰 마이닝**: 중첩 임계값 $V$ = 0.6/0.3/0.1에 대해 전체 실행 시간이 5%/14%/32% 단축되며, 평균 재투영 오차는 0.26 px에서 0.27-0.29 px로만 저하된다; Colosseum에서 $V$ = 0.4는 동등한 재구성을 유지하면서 전체 파이프라인 실행 시간을 36% 단축한다.

## SLAM에서의 의미

COLMAP은 SLAM 시스템과 학습 기반 재구성 방법 모두를 비교하는 기준점이며, 이들을 학습하고 평가하는 데 사용되는 카메라 포즈를 생성하는 표준 도구이다 — 대부분의 NeRF 및 3D Gaussian Splatting 파이프라인은 COLMAP 포즈에서 시작한다. 그 점진적 설계를 이해하면 SLAM이 무엇을 다르게 하는지(순차적 입력, 실시간 예산, 루프 클로저)가 명확해지며, 이미지당 비용 증가는 정확히 전역 SfM(GLOMAP), GPU 병렬(InstantSfM), 피드포워드(DUSt3R, VGGT) 계승자들이 겨냐는 병목이다.

## 관련 문서

- [GLOMAP](glomap.md)
- [InstantSfM](instantsfm.md)
- [DUSt3R](../level-05-deep-learning/dust3r.md)
- [hloc](../level-05-deep-learning/hloc.md)
- [BARF](../level-05-deep-learning/barf.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
