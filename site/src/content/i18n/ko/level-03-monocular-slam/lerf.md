# LERF

> Kerr 2023 · [논문](https://arxiv.org/abs/2303.09553)

**한 줄 요약** — Language Embedded Radiance Fields는 볼륨 렌더링을 통해 CLIP 특징을 NeRF 안에 그라운딩하여, 개방형 자연어 프롬프트로부터 픽셀 정렬된 제로샷 3D 질의를 가능하게 합니다.

## 문제

인간은 "시각적 외관, 의미론, 추상적 연관, 또는 실행 가능한 어포던스 등 광범위한 속성"을 포괄하는 언어로 3D 위치를 지칭합니다 — "그 노란 머그컵", "글씨를 쓸 무언가". CLIP은 그런 프롬프트를 *이미지*에 대해 점수화할 수 있지만, CLIP은 "본질적으로 전역 이미지 임베딩이며 픽셀 정렬 특징 추출에 적합하지 않습니다": 크롭당 하나의 임베딩, 3D 구조는 없습니다. 이전의 개방형 어휘 3D 연구는 영역 제안, 마스크, 또는 미세 조정된 검출기(LSeg, OWL-ViT)에 의존하여, 질의를 그 검출기들이 학습된 카테고리로 제한했습니다. LERF는 *가공하지 않은(raw)* CLIP 임베딩을 NeRF 안에서 체적적으로 그라운딩하여 임의의 언어가 3D 위치로 귀결되도록 하는 방법을 묻습니다.

## 방법 및 아키텍처

- **점이 아닌 볼륨에 대한 필드.** 단일 3D 점에서 CLIP을 질의하는 것은 모호하므로, LERF는 *볼륨*에 대한 필드 $F_{\mathrm{lang}}(\vec{x}, s) \in \mathbb{R}^{d}$를 학습합니다: 위치 $\vec{x}$와 물리적 스케일 $s$($\vec{x}$를 중심으로 한 정육면체의 한 변 길이). 출력은 그 볼륨을 포함하는 이미지 크롭들의, 학습 뷰 전체에 걸친 CLIP 임베딩의 평균으로 정의됩니다. 이 필드는 뷰에 독립적이므로 여러 뷰가 동일한 임베딩으로 평균화됩니다.
- **언어의 볼륨 렌더링.** 광선 $\vec{r}(t) = \vec{o} + t\vec{d}$를 따라 스케일은 거리에 따라 커집니다, $s(t) = s_{\mathrm{img}} \cdot f_{xy} / t$(절두체 형태). 임베딩은 $T(t) = \int_t \exp(-\sigma(s)\,ds)$, $w(t) = \int_t T(t)\,\sigma(t)\,dt$로부터 얻어지는 표준 NeRF 가중치 $w(t)$로 합성됩니다:

$$\hat{\phi}_{\mathrm{lang}} = \int_t w(t)\, F_{\mathrm{lang}}\big(r(t), s(t)\big)\, dt, \qquad \phi_{\mathrm{lang}} = \hat{\phi}_{\mathrm{lang}} \big/ \lVert \hat{\phi}_{\mathrm{lang}} \rVert .$$

- **다중 스케일 CLIP 지도.** 크롭에 대한 CLIP 임베딩의 미리 계산된 이미지 피라미드(스케일 $s_{\min}=0.05$부터 $s_{\max}=0.5$까지 7단계, 50% 겹침)가 각 렌더링된 절두체를 지도합니다; 그라운드 트루스 $\phi_{\mathrm{lang}}^{\mathrm{gt}}$는 두 인접 스케일에서 가장 가까운 4개의 크롭으로부터 삼중선형 보간됩니다. 손실은 코사인 유사도를 최대화합니다:

$$L_{\mathrm{lang}} = -\lambda_{\mathrm{lang}}\, \phi_{\mathrm{lang}} \cdot \phi_{\mathrm{lang}}^{\mathrm{gt}}, \qquad \lambda_{\mathrm{lang}} = 0.01 .$$

- **DINO 정규화.** 두 번째 헤드 $F_{\mathrm{dino}}(\vec{x})$가 픽셀 정렬 DINO 특징을 예측합니다(MSE 손실, 스케일 입력 없음). DINO는 추론에서 전혀 사용되지 않습니다; CLIP 헤드와 백본을 공유하는 것이 언어 필드를 정규화하여, 희소하게 관측된 영역에서 관련성 맵이 얼룩덜룩하고 이상치에 취약해지는 문제를 고칩니다.
- **분리된 두 개의 해시그리드.** 언어 최적화는 "밀도의 분포에 영향을 주어서는 안 됩니다": 하나의 다중 해상도 해시그리드(Instant-NGP 스타일, 32 레벨, 테이블 크기 $2^{21}$)가 CLIP/DINO MLP에 공급되고, 별도의 Nerfacto 필드가 색상/밀도를 담당합니다. $L_{\mathrm{lang}}$과 $L_{\mathrm{dino}}$의 그래디언트는 NeRF 출력에 결코 닿지 않습니다.
- **질의.** 텍스트 프롬프트 $\phi_{\mathrm{quer}}$는 표준 문구("object", "things", "stuff", "texture")에 대해 쌍별 소프트맥스 관련성 점수로 채점됩니다

$$\min_i \; \frac{\exp(\phi_{\mathrm{lang}} \cdot \phi_{\mathrm{quer}})}{\exp(\phi_{\mathrm{lang}} \cdot \phi_{\mathrm{canon}}^{i}) + \exp(\phi_{\mathrm{lang}} \cdot \phi_{\mathrm{quer}})},$$

  스케일 $s$는 0~2 m를 30단계로 스윕하여 가장 높은 점수를 낸 값으로 자동 선택됩니다. 5개 미만의 학습 뷰에서 관측된 샘플은 버려집니다.

## 실험 결과

- **설정**: Polycam으로 iPhone에서 994×738로 캡처된 13개의 실제 환경 핸드헬드 장면(식료품점, 주방, 서점, 티타임, 인형 등); OpenCLIP ViT-B/16(LAION-2B); 30k 스텝 ≈ A100 한 대에서 45분(~20 GB), 6k 스텝(8분)이면 쓸만한 결과; 질의는 Nerfstudio 뷰어에서 대화형/실시간입니다.
- **위치 추정**(5개 장면에 걸친 라벨링된 72개 물체; 최고 관련성 픽셀이 그라운드 트루스 박스 안에 있으면 성공): LERF 전체 **80.3%** 대 OWL-ViT 54.8%, 3D로 증류된 LSeg(DFF) 18.0%. 장면별: waldo_kitchen 81.5/42.6/13.0, bouquet 91.7/66.7/50.0, teatime 93.8/75.0/28.1, figurines 79.5/38.5/8.9(LERF/OWL-ViT/LSeg); OWL-ViT는 ramen에서만 우세합니다(92.5 대 62.5).
- **존재 판단**(5개 장면에 걸친 롱테일 질의 81개): precision–recall 곡선은 LSeg가 분포 내 COCO 라벨에서만 LERF와 대등하고 롱테일 질의에서는 무너짐을 보여줍니다.
- **Ablation**: DINO를 제거하면 관련성 맵의 매끄러움과 경계가 나빠집니다; 단일 스케일 학습(고정 15% 크롭)은 큰 맥락("에스프레소 머신")과 작은 맥락("크리머 포드") 질의 모두에서 실패합니다.
- **한계**: CLIP의 bag-of-words 방식 동작("not red" ≈ "red"), 시각적으로 유사한 물체에서의 거짓 양성(애호박 대 다른 녹색 채소), 보정된 NeRF 품질의 다중 뷰 캡처가 필요함.

## SLAM에서의 의미

LERF는 비전-언어 특징을 3D 장면 표현 안에 직접 임베딩하는 패러다임을 확립했습니다 — Spatial AI의 의미론적 층: 말을 걸 수 있는 지도입니다. 이는 언어 임베딩 가우시안 스플래팅(LEGS, LangSplat)에 직접 영향을 미쳤고 ConceptFusion 같은 융합 방식 접근법을 보완합니다; 다중 스케일 CLIP + DINO 방식은 2D 비전-언어 특징을 3D 필드로 증류하는 기본값이 되었습니다. 로보틱스에서 "글씨를 쓸 무언가를 찾아라"가 3D 위치로 귀결되는 것은 SLAM 지도를 실행 가능한 세계 모델로 바꾸는 바로 그것입니다.

## 관련 문서

- [LEGS](legs.md)
- [ConceptFusion](conceptfusion.md)
- [OpenScene](openscene.md)
- [NeRF](../level-05-deep-learning/nerf.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
