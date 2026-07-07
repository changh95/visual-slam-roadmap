# SceneCode

> Zhi 2019 · [논문](https://arxiv.org/abs/1903.06482)

**한 줄 요약** — CodeSLAM을 확장하여 깊이 *그리고* 시맨틱 세그먼테이션을 컴팩트한 이미지 조건형 latent code로 인코딩함으로써, 시맨틱 레이블 융합을 다중 뷰 code 최적화로 만들고 geometry, 포즈, 시맨틱을 하나의 통합된 최적화에서 추정합니다.

## 문제

증분적 시맨틱 매핑 시스템은 geometry와 시맨틱 둘 다를 저장하고 업데이트해야 하지만, geometry 추정은 잘 발전된 확률적 공식을 갖고 있는 반면, 최신 시스템들은 표면 요소(깊이 픽셀, 서펠, 또는 복셀)마다 *독립적인* 레이블 추정치를 저장했습니다. 공간적 상관관계가 버려지므로 융합된 레이블 맵은 비일관되고 잡음이 많아지며, 시맨틱 증거가 모션이나 geometry 추정에 정보를 줄 수 없습니다. 객체 그래프 접근법(SLAM++ 스타일)은 원하는 토큰과 같은 특성을 갖지만 알려진 개별 객체만을 다룹니다. SceneCode는 CodeSLAM의 깊이 code처럼, 시맨틱이 학습된 컴팩트한 code 안에 존재할 수 있는지를 물으며, 레이블을 최적화 가능하고 공간적으로 일관된 맵 변수로 만듭니다.

## 방법 및 아키텍처

**멀티태스크 CVAE.** 공유 ResNet-50 인코더와 두 개의 RefineNet 디코더를 가진 U자형 네트워크가 컬러 이미지를 처리합니다; VGG 스타일의 variational 인코더 두 개가 깊이와 원-핫 시맨틱 레이블을 두 개의 저차원 code($\boldsymbol{c}_d$, $\boldsymbol{c}_s$)로 압축합니다. 각 디코더는 code에 대해서는 의도적으로 **선형**이며, 이미지에 대해서는 비선형적으로 조건화됩니다:

$$D\left(\boldsymbol{c}_{d},I\right)=D_{0}\left(I\right)+J_{d}\left(I\right)\boldsymbol{c}_{d}, \qquad S\left(\boldsymbol{c}_{s},I\right)=S_{0}\left(I\right)+J_{s}\left(I\right)\boldsymbol{c}_{s}$$

여기서 $D_0(I), S_0(I)$는 zero-code(가장 가능성 높은 단일 뷰) 예측이고 $J_{d/s}$는 학습된 선형 영향(influence)입니다 — 선형성 덕분에 code 야코비안을 키프레임당 한 번만 미리 계산할 수 있습니다. 학습은 예측된 픽셀별 불확실성 $b_i$를 가진 $L_1$ 근접도 손실 $\sum_{i=1}^{N}\big[\tfrac{|\widetilde{p}_{i}-p_{i}|}{b_{i}}+\log(b_{i})\big]$(근접도 $p=a/(a+d)$, $a=2$m), 시맨틱을 위한 다중 클래스 교차 엔트로피, KL-어닐링된 variational 손실, 적응적 태스크 가중치를 결합합니다.

**다중 뷰 code 최적화를 통한 융합.** 상대 포즈 $\boldsymbol{T}_{BA}$가 있으면, 밀집 대응 $w\left(\boldsymbol{u}_{A},\boldsymbol{c}_{d}^{A},\boldsymbol{T}_{BA}\right)=\pi\left(\boldsymbol{T}_{BA}\,\pi^{-1}\left(\boldsymbol{u}_{A},D_{A}\left[\boldsymbol{u}_{A}\right]\right)\right)$가 겹치는 뷰들을 연결합니다. 세 개의 잔차가 최소화됩니다: 광도 잔차 $r_{i}=I_{A}\left[\boldsymbol{u}_{A}\right]-I_{B}\left[w\left(\boldsymbol{u}_{A},\boldsymbol{c}_{d}^{A},\boldsymbol{T}_{BA}\right)\right]$, geometric 잔차 $r_z$(워프된 점들의 깊이 일관성), 그리고 새로운 **시맨틱 일관성 잔차**

$$r_{s}=DS\left(S_{A}\left[\mathbf{u}_{A}\right],S_{B}\left[w\left(\mathbf{u_{A}},\boldsymbol{c}_{d}^{A},\boldsymbol{T}_{BA}\right)\right]\right)$$

여기서 $DS$는 softmax 확률 간의 유클리드 거리입니다 — 대응하는 픽셀은 시점에 관계없이 비슷한 카테고리 분포를 가져야 합니다. $r_s$가 시맨틱 code *뿐만 아니라* 포즈 *그리고* 깊이에 대해서도 미분 가능하므로, 시맨틱이 모션과 구조에 영향을 줄 수 있습니다(벽은 벽과 정렬되고, 의자는 의자와 정렬됩니다). zero-code 사전 분포가 약하게 고정된 시맨틱 항을 정규화합니다.

**SLAM 시스템.** 키프레임 기반 단안 파이프라인: 각 키프레임은 $I$, $\boldsymbol{c}_d$, $\boldsymbol{c}_s$를 저장합니다; tracking은 광도 잔차만 사용합니다; mapping은 N-프레임 문제에 대해 감쇠된 Gauss-Newton을 실행하며, 먼저 geometry+포즈를 최적화하고, 그다음 시맨틱을, 그다음 전부를 함께 최적화합니다.

## 실험 결과

- **데이터셋**: NYUv2(795/654 train/test, 13개 클래스), Stanford 2D-3D-Semantic(66,792/3,704), 합성 SceneNet RGB-D(110,000/3,000 부분집합); 256×192 이미지. 재구성은 code 크기 32를 넘으면 포화되며, 이 값이 전체적으로 사용됩니다; zero-code 예측은 시맨틱에서는 판별적(discriminative) RefineNet과 비슷하고 깊이에서는 더 좋습니다.
- **레이블 융합(SceneNet RGB-D 2,000장 이미지, 완벽한 데이터 연관)**: code 기반 융합이 원소별 융합을 능가하며, mIoU에서 가장 명확합니다 — 단일 뷰 41.71; 2개 뷰: 우리 방법 43.84 대 곱셈 42.33, 평균 42.22; 3개 뷰 44.23; 4개 뷰 44.26. 전체 픽셀 정확도는 75.17 → 75.73(2개 뷰)으로 상승합니다.
- **Zero-code 사전 분포 ablation**: 사전 분포 없이는 2-뷰 융합이 39.60 mIoU로 떨어져 — 단일 뷰 *보다도 낮아져* — 학습된 사전 분포가 필수적임을 보여줍니다.
- **시스템 데모**: NYUv2, SceneNet RGB-D, Stanford에서의 two-view 밀집 시맨틱 SfM; geometry 사전 분포가 초기화를 견고하게 만들어 순수 회전 모션까지도 처리합니다.

## SLAM에서의 의미

SceneCode는 SLAM을 위한 최초의 결합 geometric-시맨틱 latent 표현으로, 시맨틱이 geometry 위에 사후적으로 레이블을 덧칠하는 것이 아니라 최적화 가능한 맵 변수가 될 수 있음을 보여주었습니다 — 픽셀이 더 이상 독립적으로 취급되지 않으므로 융합된 레이블은 매끄럽고 공간적으로 일관되게 유지됩니다. 이는 Imperial College의 latent-map 계보(CodeSLAM → SceneCode → DeepFactors/NodeSLAM)에 속하며, 단일 암묵적 표현이 geometry와 시맨틱 모두를 디코딩하는 시맨틱 신경 필드 SLAM을 개념적으로 예견합니다.

## 관련 문서

- [CodeSLAM](codeslam.md) — 깊이 전용 latent code 전작
- [DeepFactors](deepfactors.md) — code에 대한 확률적 팩터 그래프 SLAM
- [NodeSLAM](nodeslam.md) — 객체 수준 latent code
- [CodeMapping](codemapping.md) — sparse SLAM과 함께하는 밀집 매핑을 위한 code
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md) — 이전의 서펠별 시맨틱 융합
