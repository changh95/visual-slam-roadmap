# Patch NetVLAD

> Hausler 2021 · [논문](https://arxiv.org/abs/2103.01486)

**한 줄 요약** — NetVLAD 잔차로부터 다중 스케일 패치 수준 VLAD descriptor를 추출하고 공간적 검증으로 검색 후보를 재순위화하여, visual place recognition을 시점 변화와 지각적 엘리어싱에 훨씬 더 강인하게 만든다.

## 문제

Visual place recognition은 끊임없이 변화하는 세계 속에서 *외관 변화*(계절, 구조, 조명)와 *시점 변화*라는 이중의 문제를 견뎌내야 한다. NetVLAD와 같은 전역 descriptor는 이미지 전체를 단일 벡터로 압축하여 공간적 배치 정보를 버린다 — 검색은 빠르지만 시점 변화, 부분 가림, 지각적 엘리어싱에 취약하다. 완전한 로컬 특징 매칭(예: SuperPoint + SuperGlue)은 배치 정보를 보존하지만 대규모 데이터베이스에 대해서는 너무 느리다. Patch-NetVLAD는 로컬과 전역 descriptor 방법 양쪽의 장점을 하나의 구성 가능한 파이프라인으로 결합한다.

## 방법 및 아키텍처

**2단계 검색.** 먼저 순수한 NetVLAD가 질의에 대해 상위 $k$개($k{=}100$) 데이터베이스 후보를 검색한다; 그다음 패치 수준 매칭이 공간적 일관성 점수로 그 후보 목록을 재순위화하므로, 교차 매칭 비용은 100개의 이미지에 대해서만 지불하고 전체 데이터베이스에 대해서는 지불하지 않는다.

**패치 수준 VLAD descriptor.** NetVLAD의 집약 레이어는 CNN 특징 $\mathbf{x}_i$와 $K$개의 학습된 클러스터 중심 $\mathbf{c}_k$ 사이의 소프트 할당 잔차를 합산한다:

$$ f_{\mathrm{VLAD}}(F)(j,k) = \sum_{i=1}^{N} \bar{a}_k(\mathbf{x}_i)\,\big(x_i(j) - c_k(j)\big) $$

전체 $H \times W \times D$ 특징 맵을 집약하는 대신($N = H \times W$, 이것이 전역 NetVLAD이다), Patch-NetVLAD는 동일한 집약 + 투영 $\mathbf{f}_i = f_{\mathrm{proj}}(f_{\mathrm{VLAD}}(P_i))$을 특징 공간 그리드 위에서 스트라이드 $s_p$로 조밀하게 배치된 $d_x \times d_y$ 크기의 패치 집합에 적용한다,

$$ n_p = \Big\lfloor \tfrac{H-d_y}{s_p} + 1 \Big\rfloor \cdot \Big\lfloor \tfrac{W-d_x}{s_p} + 1 \Big\rfloor $$

개의 이미지당 패치 — 공간적 위치에 결부된 "지역적-전역(locally-global)" descriptor이며, keypoint 검출이 필요 없다.

**상호 최근접 이웃 + 공간 점수 산정.** 질의/참조 패치 descriptor는 총망라(exhaustive) 방식으로 교차 매칭되며, 상호 최근접 이웃(mutual-NN) 쌍 집합 $\mathcal{P}$는 RANSAC(적합된 homography의 inlier 개수, inlier 허용치 $s_p$, $n_p$로 정규화) 또는 매칭된 패치들의 수평/수직 변위 $x_d, y_d$에 대한 *빠른 공간 점수 산정(rapid spatial scoring)*으로 점수화된다:

$$ s_{\mathrm{spatial}} = \frac{1}{n_p} \sum_{i \in \mathcal{P}} \Big( \big|\max_j x_{d,j}\big| - \big|x_{d,i} - \bar{x}_d\big| \Big)^2 + \Big( \big|\max_j y_{d,j}\big| - \big|y_{d,i} - \bar{y}_d\big| \Big)^2 $$

이는 오프셋이 평균 움직임에서 벗어난 매칭에 페널티를 준다 — 샘플링 없는 공간적 검증이다.

**IntegralVLAD를 통한 다중 스케일 융합.** $n_s$개의 패치 크기로부터 얻은 점수는 convex 결합 $s_{\mathrm{spatial}} = \sum_i w_i\, s_{i,\mathrm{spatial}}$로 융합된다(사용된 설정: 정사각형 패치 크기 2, 5, 8과 $w_i = 0.45, 0.15, 0.4$; 크기-5 패치는 640×480 이미지에서 228×228 픽셀을 커버한다). $1{\times}1$ 패치 VLAD들의 적분 특징 맵 $\mathcal{I}(i,j) = \sum_{i' < i, j' < j} \mathbf{f}^1_{i',j'}$은 네 번의 조회만으로 임의의 패치 크기를 복원할 수 있게 하며, 커널 $K = \begin{pmatrix} 1 & -1 \\ -1 & 1 \end{pmatrix}$을 사용한 dilated depth-wise convolution으로 구현된다. 패치 descriptor에 대한 PCA 차원 축소는 구성 가능한 속도/정확도 트레이드오프를 제공한다.

## 실험 결과

여섯 개 벤치마크(Nordland, Pittsburgh 30k, Tokyo 24/7, Mapillary MSLS, RobotCar Seasons v2, Extended CMU Seasons)에 걸쳐 약 30만 장의 이미지로 평가되며, 단일 구성을 RobotCar Seasons v2 학습 데이터에 한 번만 튜닝해 사용한다:

- 전역 descriptor 방법인 NetVLAD, DenseVLAD, AP-GEM을 평균 절대 R@1에서 각각 17.5%, 14.8%, 22.3% 능가한다; Nordland의 극단적인 계절 변화에서는 NetVLAD 대비 34.5%p의 차이를 보인다(R@1 44.9 vs 10.4).
- 낙관적인 NetVLAD→SuperPoint+SuperGlue 재순위화 기준선을 평균 절대 R@1에서 3.1%p(상대 6.0%) 능가하며, Nordland에서는 15.8%p(44.9 vs 29.1) 앞선다 — 다만 Tokyo 24/7과 Pittsburgh의 일부에서는 SuperGlue가 근소하게 앞선다.
- **ECCV 2020 Facebook Mapillary Visual Place Recognition Challenge에서 우승**: 비공개 테스트 세트에서 R@1 48.1%로, NetVLAD 기준선(35.1%)보다 절대 13.0%p 향상되었다.
- 다중 패치 크기에 대한 빠른 공간 점수 산정은 multi-RANSAC 점수 산정보다 3.1배 빠르며 R@1 저하는 1.1%에 불과하다; 속도 최적화 구성은 이전 최고 성능보다 한 자릿수 이상 빠르게 동작한다.

## SLAM에서의 의미

SLAM에서의 loop closure와 재위치추정은 정확히 place recognition 문제이다: 잘못된 매칭은 pose graph를 훼손하므로, 순수한 검색 속도보다 지각적 엘리어싱에 대한 강인성이 더 중요하다. Patch-NetVLAD의 전역 검색 후 공간적 재순위화라는 레시피는 SLAM loop-closure front-end에 실용적으로 바로 끼워 넣을 수 있다 — 논문은 "SLAM 시스템의 전체 성능"을 향상시키는 것을 명시적으로 목표로 한다고 밝히며, 장기 위치추정 시스템에서 사용되는 계층적 검색 설계에도 영향을 주었다.

## 관련 문서

- [NetVLAD](netvlad.md) — 이 방법이 기반으로 삼는 전역 descriptor
- [HF-Net](hf-net.md) — 계층적(조대-정밀) 위치 인식 파이프라인
- [hloc](hloc.md) — 이 레시피가 끼워 넣어지는 검색-후-매칭 위치추정 도구박스
- [SuperGlue](superglue.md) — 정확도가 속도보다 중요할 때 사용하는 완전한 로컬 특징 매칭
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — 이 논문이 목표로 하는 과제
