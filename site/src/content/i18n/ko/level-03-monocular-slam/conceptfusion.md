# ConceptFusion

> Jatavallabhula (MIT) 2023 · [논문](https://arxiv.org/abs/2302.07241)

**한 줄 요약** — 파운데이션 모델(CLIP, AudioCLIP)의 픽셀 정렬(pixel-aligned) 특징을, 깊이와 색상에 사용되는 것과 동일한 가중 평균 방식으로 밀집 SLAM 포인트 지도에 융합하여, 어떤 학습이나 미세 조정도 없이 3D 지도에 대한 제로샷 오픈 어휘 및 다중 모달(텍스트/이미지/클릭/오디오) 쿼리를 가능하게 한다.

## 문제

3D 지도에 의미론을 부여하는 대부분의 접근법은 닫힌 집합(closed-set) 방식이다: 학습 시점에 고정된 유한한 레이블 집합에 대해서만 추론하며, 지도는 클래스 레이블 또는 최선의 경우 텍스트로만 쿼리할 수 있다. 파운데이션 모델은 여러 모달리티에 걸쳐 오픈셋 개념을 이해하지만, 이미지 전체를 입력받아 픽셀 정렬 없이 *단일* 이미지 수준 벡터를 출력한다 — 반면 픽셀 정렬을 위해 미세 조정된 모델(LSeg, OpenSeg)은 미세 조정 과정에서 롱테일 개념을 *잊어버린다*: 백본 CLIP은 "다이어트 콜라"와 "라이솔"을 알지만, 미세 조정된 버전은 더 이상 이를 검색해내지 못한다. ConceptFusion은 픽셀 정렬되면서도 잊어버리지 않는 오픈셋 특징을 3D 지도에, 제로샷으로 어떻게 넣을 것인가를 묻는다.

## 방법 및 아키텍처

- **지도 표현**: 순서 없는 점 집합; 점 $k$는 위치 $\overline{v}_k\in\mathbb{R}^3$, 법선 $\overline{n}_k$, 신뢰도 카운트 $\bar{c}_k$, 선택적 색상, 그리고 개념 벡터 $f^{P}_k$를 저장한다. 시스템은 PointFusion 밀집 SLAM의 gradSLAM 구현 위에 구축되며, 오도메트리와 매핑은 프레임 속도(15 Hz)로 실행되고 특징 추출은 오프라인으로 (RTX 3090에서 이미지당 10-15초) 실행된다.
- **픽셀 정렬 특징(핵심 기여)**: 이미지 $X$에 대해, 클래스에 무관한 인스턴스 분할기(Mask2Former 또는 SAM)가 $R$개의 영역을 제안한다. 전역 임베딩은 $f^{G}=\mathcal{F}(X)$이고, 각 영역의 경계 상자는 지역 임베딩 $f^{L}_i=\mathcal{F}(\mathrm{bbox}(r_i))$를 준다. 각 영역의 특징은 전역 맥락과 지역 디테일을 혼합하며, 그 영역이 얼마나 전형적인지에 따라 가중된다: 전역 특징과의 코사인 유사도 $\phi_i=\langle f^{L}_i, f^{G}\rangle$와 다른 영역들과의 평균 유사도 $\bar{\varphi}_i=\frac{1}{R}\sum_{j\neq i}\varphi_{ij}$가 소프트맥스로 결합된다

$$w_i=\frac{\exp\big((\phi_i+\bar{\varphi}_i)/\tau\big)}{\sum_{i=1}^{R}\exp\big((\phi_i+\bar{\varphi}_i)/\tau\big)}, \qquad f^{P}_i = w_i f^{G} + (1-w_i) f^{L}_i$$

여기서 $\tau=1$이다; $f^{P}_i$는 정규화되어 $r_i$의 픽셀들에 할당된다. 미세 조정이 없으므로 잊어버림도 없다 — 수정되지 않은 CLIP 특징 공간이 보존된다.
- **3D로의 다중 뷰 융합**: 깊이/색상에 사용되는 것과 정확히 동일한 로직이다. 대응하는 지도점이 있는 각 픽셀에 대해:

$$f^{P}_{k,t} \leftarrow \frac{\bar{c}_k f^{P}_{k,t-1} + \alpha f^{P}_{u,v,t}}{\bar{c}_k + \alpha}, \qquad \bar{c}_k \leftarrow \bar{c}_k + \alpha$$

여기서 $\alpha=e^{-\gamma^{2}/2\sigma^{2}}$는 카메라 중심으로부터의 정규화된 반경 거리 $\gamma$로 가중한다($\sigma=0.6$).
- **쿼리**: 점당 점수 $s_k=\langle f_k, q_{\text{mode}}\rangle$(코사인 유사도)이며, $q_{\text{mode}}$는 매칭되는 인코더에서 나온다 — CLIP 텍스트 인코더, 이미지 수준 CLIP 임베딩, 소리를 위한 AudioCLIP, 또는 단순히 클릭된 점의 융합된 특징이다. 임계값 처리/NMS/클러스터링을 통해 3D 관심 영역을 얻는다.
- **3D 공간 비교자**: 쿼리 결과에 대해 조합 가능한 모듈(HowFar, IsToTheLeft/Right, OnTopOf, Under); LLM은 선택적으로 "냉장고가 텔레비전에서 얼마나 먼가"를 두 쿼리 항에 대한 howFar로 파싱할 수 있다.

## 실험 결과

- **UnCoCo** (새 데이터셋: 78개의 탁상 물체, 20개의 RGB-D 시퀀스, 12,075개의 프레임, 50만 개 이상의 다중 모달 쿼리). 구조화된 텍스트 쿼리: 3D mIoU **0.446**으로, OpenSeg-3D 0.289, LSeg-3D 0.128, MaskCLIP-3D 0.091과 대비된다(acc@IoU0.25: 69.44% 대 36.11%). 비구조화 텍스트: 0.378 대 0.153. 이미지 쿼리: 0.331 대 0.134(LSeg-3D). 오디오 쿼리: 정확도 64.29% / 66.67%(소스 모호/생태적)로, 특권을 가진(privileged) AudioCLIP 베이스라인의 23.81% / 22.22%와 대비된다.
- **오픈셋 의미론적 분할**: ScanNet mAcc 0.63 / f-mIoU 0.58 — 제로샷 MaskCLIP(0.24/0.28)을 크게 상회하며, 특권을 가진 미세 조정 LSeg(0.70/0.63)와 경쟁적이다; SemanticKITTI 0.79/0.78. 초록의 핵심 주장: 감독 학습 방식 대비 롱테일 개념을 "3D IoU에서 40% 이상의 마진으로" 유지한다.
- **어블레이션** (ScanNet): 전역-CLIP만 사용 0.35/0.48, 지역만 사용 0.43/0.33, 고유성(uniqueness) 항 없이 0.55/0.46, 전체 모델 0.63/0.58; Mask2Former를 SAM으로 교체하면 Replica 점수가 24.16/31.31에서 31.53/38.70으로 상승한다.
- **3D 공간 추론** (100개의 ScanRefer 쿼리): 거리 84%, 상대 위치 76%, 지지(support) 96%, 포함(containment) 72% — 2.5D 단일 이미지 베이스라인은 참조된 물체가 함께 관측된 적이 없기 때문에 거리(32%)와 상대 위치(28%)에서 붕괴한다.
- **실제 로봇**: UR5e를 이용한 제로샷 탁상 재배열("베이맥스를 오른쪽으로 밀어"), 그리고 4,000 m² 규모의 도시 지도(LeGO-LOAM 위치 추정, "축구장" 같은 오픈셋 텍스트 목표)에서의 텍스트 기반 자율 주행 드라이브-바이-와이어 차량.
- 명시된 한계: 메모리(수백만 개의 점마다 고차원 임베딩), 조합성/부정(negation)이 결여된 전경 중심 특징, 그리고 파운데이션 모델로부터 물려받은 편향.

## SLAM에서의 의미

ConceptFusion은 오픈셋 다중 모달 3D 매핑을 개척했으며, 이제는 표준이 된 패러다임을 확립했다: 2D 파운데이션 모델 특징 + 고전적 다중 뷰 융합, 3D 학습은 전혀 없음. 이는 고전적 SLAM과 Spatial AI 사이의 핵심 다리이다 — 로봇을 위치 추정하는 지도가 그대로 "이 병을 열 때 쓸 수 있는 물건이 어디 있지?"에 답한다. 점당 전체 임베딩이라는 메모리 비용은 이후 시스템들이 정확히 공략하는 문제다: 암시적 특징 필드를 쓰는 LERF/LEGS, 이산 레이블을 쓰는 OpenGS-SLAM, 객체 수준 노드를 쓰는 ConceptGraphs.

## 실습

- [ConceptFusion 실행하기](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/concept_fusion)

## 관련 문서

- [LERF](lerf.md)
- [OpenScene](openscene.md)
- [LEGS](legs.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)
