# ConceptGraphs

> Gu 2023 · [논문](https://arxiv.org/abs/2309.16650)

**한 줄 요약** — ConceptGraphs는 2D 파운데이션 모델의 출력(SAM 세그먼트, CLIP 임베딩)을 3D 객체 노드로 융합하고 LLM을 이용해 객체 간 관계를 추론함으로써 개방형 어휘 3D scene graph를 구축하며, 계획 수립에 활용 가능한 언어 질의형 맵을 만들어낸다.

## 문제

로봇에게는 시맨틱하게 풍부하면서도 태스크 중심 인지와 계획에 적합할 만큼 컴팩트하고 효율적인 3D 세계 표현이 필요하다. 비전-언어 특징을 3D 맵에 주입하려는 최근 시도들은 점 단위 특징 벡터를 만들어내는데, 이는 "더 큰 환경으로는 잘 확장되지 않으며, 개체 간의 시맨틱한 공간적 관계도 포함하지 않는다" — 반면 전통적인 닫힌 집합(closed-set) scene graph는 미리 정의된 라벨 집합에 고정되어 있다. ConceptGraphs는 3D 학습 데이터를 수집하거나 어떤 모델도 미세 조정하지 않고 구축 가능하며, 객체 중심적이고 그래프로 구조화된 개방형 어휘 표현을 목표로 한다.

## 방법 및 아키텍처

포즈가 주어진 RGB-D 프레임 $I_t = \langle I_t^{\text{rgb}}, I_t^{\text{depth}}, \theta_t \rangle$이 주어지면, ConceptGraphs는 각 노드 $\mathbf{o}_j$가 3D 포인트 클라우드 $\mathbf{p}_{o_j}$와 융합된 시맨틱 특징 $\mathbf{f}_{o_j}$를 갖는 scene graph $\mathcal{M}_t = \langle \mathbf{O}_t, \mathbf{E}_t \rangle$를 증분적으로 구축한다:

- **클래스 무관 세그멘테이션 + 임베딩.** SAM이 프레임마다 마스크 $\mathbf{m}_{t,i}$를 생성한다. 각 마스크된 crop은 CLIP 이미지 인코더로 임베딩되어 단위 특징 $\mathbf{f}_{t,i}$를 얻는다. 각 마스크는 3D로 역투영되어 DBSCAN으로 노이즈가 제거된 뒤 맵 프레임으로 변환된다.
- **다중 뷰 객체 연관.** 새로운 검출 결과는 기하학적 + 시맨틱 유사도를 결합해 겹치는 맵 객체들과 비교된다.

  $$\phi(i,j) = \phi_{\text{sem}}(i,j) + \phi_{\text{geo}}(i,j), \qquad \phi_{\text{sem}}(i,j) = \tfrac{1}{2}\mathbf{f}_{t,i}^{\top}\mathbf{f}_{o_j} + \tfrac{1}{2},$$

  여기서 $\phi_{\text{geo}}(i,j) = \mathrm{nnratio}(\mathbf{p}_{t,i}, \mathbf{p}_{o_j})$는 검출 점들 중 $\delta_{\text{nn}}$ 이내에 맵 객체의 최근접 이웃이 존재하는 점의 비율이다. Greedy 할당이 각 검출을 가장 높은 점수의 객체에 매칭한다. 어떤 점수도 $\delta_{\text{sim}}$을 넘지 못하면 새로운 객체가 생성된다.
- **객체 융합.** 매칭이 발생하면 노드 특징은 이동 평균 $\mathbf{f}_{o_j} = (n_{o_j} \mathbf{f}_{o_j} + \mathbf{f}_{t,i}) / (n_{o_j} + 1)$으로 갱신되고 ($n_{o_j}$는 연관 횟수), 포인트 클라우드는 병합 및 다운샘플링된다.
- **노드 캡셔닝.** 각 객체의 가장 좋은 10개 뷰에서 얻은 crop은 "이미지 속 중심 객체를 설명하라"는 프롬프트를 받은 LVLM(LLaVA)에 전달된다. LLM(GPT-4)이 이 10개의 대략적인 캡션을 노드당 하나의 일관된 캡션으로 요약한다.
- **엣지 추론.** 모든 노드 쌍 간의 3D bounding box IoU가 밀집 유사도 그래프를 만들고, 이는 최소 신장 트리로 가지치기된다. 각 MST 엣지에 대해 LLM은 두 캡션과 3D 위치를 받아 관계 라벨(예: "a on b")을 추론과 함께 출력한다 — 학습된 관계 모델로는 얻을 수 없는 개방형 어휘 엣지를 만들어낸다.
- **계획 인터페이스.** 각 노드는 JSON(캡션 + 3D bounding box)으로 직렬화된다. 언어 질의가 주어지면 LLM이 가장 관련성 높은 객체를 선택하고 그 포즈를 하위 그래스핑/내비게이션 파이프라인에 전달한다. 구현: 복셀 크기와 $\delta_{\text{nn}}$은 2.5 cm, $\delta_{\text{sim}} = 1.1$; 검출기 변형(CG-D)은 SAM 단독 제안 대신 RAM 태그 + Grounding DINO box를 사용한다.

## 실험 결과

- **Scene graph 품질(Replica, AMT 인간 평가):** 노드 캡션은 약 70%의 경우 정확한 것으로 평가되었으며(대부분의 오류는 LVLM에서 비롯됨), 엣지 관계 라벨은 평균적으로 약 90%의 정확도를 달성한다. 장면당 중복 객체 검출은 0~5건에 불과하다.
- **개방형 어휘 3D 시맨틱 세그멘테이션(Replica, ConceptFusion 프로토콜):** ConceptGraphs는 40.63 mAcc / 35.95 F-mIoU, CG-D는 38.72 / 35.82를 기록했다. ConceptFusion 24.16 / 31.31, ConceptFusion+SAM 31.53 / 38.70과 비교해 훨씬 작은 메모리 사용량으로 비슷하거나 더 나은 성능을 보인다(특권적인 미세 조정 기준선: 예를 들어 OpenSeg 41.19 / 53.74).
- **텍스트 질의 검색(R@1):** Replica에서 LLM 기반 검색은 부정(negation) 질의에서 CLIP을 0.80 대 0.26으로 앞선다. 실제 실험실 스캔에서는 LLM이 서술형, 어포던스, 부정 질의 전체에서 1.00을 달성하는 반면 CLIP은 부정 질의에서 0.00을 기록한다.
- **로봇 데모:** Clearpath Jackal(VLP-16 + RealSense D435i)에서의 언어 기반 내비게이션, Boston Dynamics Spot에서의 개방형 어휘 pick-and-place("cuddly quacker" → 오리 인형), 어수선한 환경을 밀고 지나가기 위한 LLM 추론 주행 가능성(traversability), AI2Thor에서의 파티클 필터 위치추정 + 맵 갱신.

## SLAM에서의 의미

ConceptGraphs는 2D 파운데이션 모델이 새로운 3D 네트워크 없이도 일반적인 다중 뷰 연관을 통해 3D로 끌어올려질 수 있음을 보여주었다 — SLAM 시스템의 포즈가 주어진 RGB-D 스트림을 언어 질의형 객체 맵으로 전환한 것이다. 이는 개방형 어휘 로봇 매핑을 위한 이제는 표준이 된 SAM + CLIP + LLM 방식을 확립했으며, 점 단위 접근법들(ConceptFusion, LERF, OpenScene)과 함께 개방형 어휘 3D 맵의 설계 공간 — 밀집 특징 대 객체 중심 그래프 — 을 규정했다. SLAM의 출력이 점점 더 언어 기반 플래너로 흘러들어가는 상황에서, 이와 같은 그래프 구조의 개방형 집합 맵은 현대 Spatial AI에서 "시맨틱 맵"이 의미하는 바를 정의한다.

## 관련 문서

- [SAM](sam.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [ConceptFusion](conceptfusion.md)
- [Hydra](hydra.md)
- [Clio](clio.md)
- [OpenScene](openscene.md)
- [Grounding DINO](grounding-dino.md)
