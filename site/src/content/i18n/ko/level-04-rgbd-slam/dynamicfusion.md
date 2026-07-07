# DynamicFusion

> Newcombe 2015 · [논문](https://ieeexplore.ieee.org/document/7298631)

**한 줄 요약** — 비강체(non-rigid)로 변형하는 장면을 위한 최초의 실시간 밀도 SLAM 시스템으로, 고정된 정규(canonical) TSDF 모델을 각 라이브 프레임으로 변환하는 밀도 체적 6D 워프 필드를 추정하여, 모든 것이 움직이는 동안에도 KinectFusion 스타일의 융합이 동작하도록 함.

## 문제

KinectFusion 및 모든 전통적인 밀도 SLAM의 가장 기본적인 가정은 관측된 장면이 대체로 *정적*이라는 것입니다 — 변형하는 대상(사람, 손, 옷, 애완동물)은 추적을 깨뜨리고 모델을 손상시킵니다. 기존의 비강체 캡처는 획득 중 정적으로 유지되는 사전 스캔된 템플릿을 필요로 했거나, 실시간보다 3~4자리 수만큼 느린 오프라인으로 실행되었습니다. 이 논문의 핵심 질문: 단일 깊이 카메라로부터 템플릿 없이 실시간으로 동적 장면을 재건하고 추적하도록 KinectFusion을 일반화할 수 있는가?

## 방법 및 아키텍처

DynamicFusion은 장면을 강체 정규 공간 $\mathsf{S}\subseteq\mathbb{R}^3$(TSDF $\mathcal{V}$)에서 재건되는 잠재적 기하 표면과, 이를 라이브 프레임으로 변환하는 프레임별 체적 워프 필드로 분해합니다. 각 새 깊이 맵은 세 단계를 촉발합니다: (1) 워프 필드 상태 추정, (2) 워프를 통해 라이브 깊이를 정규 TSDF에 융합, (3) 새로 관측된 기하를 포괄하도록 워프 필드 구조를 확장.

- **희소 노드 + 듀얼 쿼터니언 블렌딩을 통한 밀도 6D 워프 필드**: 점당 밀도 변환 $\mathcal{W}: \mathsf{S} \mapsto \mathbf{SE}(3)$(밀도 $256^3$ 필드라면 프레임당 약 1억 개의 파라미터가 필요)는 $n$개의 변형 노드 $\mathcal{N}^t_{\mathrm{warp}} = \{\mathbf{dg}_v, \mathbf{dg}_w, \mathbf{dg}_{se3}\}_t$ — 위치, 반지름 방향 가중치, 6-DoF 변환 — 로부터 보간됩니다. 정규 공간의 점 $x_c$는 그 k-최근접 노드들의 듀얼 쿼터니언 블렌딩으로 워프됩니다.

$$\mathcal{W}_t(x_c) = \mathbf{T}_{lw}\, SE3\big(\mathbf{DQB}(x_c)\big), \qquad \mathbf{DQB}(x_c) = \frac{\sum_{k\in N(x_c)} \mathbf{w}_k(x_c)\,\hat{\mathbf{q}}_{kc}}{\big\lVert \sum_{k\in N(x_c)} \mathbf{w}_k(x_c)\,\hat{\mathbf{q}}_{kc} \big\rVert},$$

  여기서 단위 듀얼 쿼터니언 $\hat{\mathbf{q}}_{kc}\in\mathbb{R}^8$, 가우시안 영향 가중치 $\mathbf{w}_i(x_c) = \exp\big(-\lVert \mathbf{dg}^i_v - x_c \rVert^2 / (2 (\mathbf{dg}^i_w)^2)\big)$, 그리고 공통된 강체(카메라) 운동은 $\mathbf{T}_{lw}$로 분리됩니다. DQB는 블렌딩된 변환이 유효한 강체 운동으로 유지되도록 보장합니다.
- **비강체 투영적 TSDF 융합**: 각 복셀 중심 $x_c$는 라이브 프레임으로 워프되며, 그 지점에서 투영적 부호 거리가 계산됩니다: $\mathbf{psdf}(x_c) = \big[\mathbf{K}^{-1} D_t(u_c) [u_c^\top, 1]^\top\big]_z - [x_t]_z$, 이후 표준적인 절단(truncated) 가중 평균 TSDF 업데이트가 이어집니다. 융합 가중치는 복셀이 k-최근접 노드까지 갖는 평균 거리에 따라 낮아지며, 워프의 불확실성을 인코딩합니다. 업데이트가 카메라 프레임에서 시선 방향(line of sight)을 따라 계산되기 때문에, 강체 TSDF 융합의 최적성 특성이 비강체 경우로도 이어집니다.
- **워프 필드 추정**: 깊이 $D_t$와 현재 재건 $\mathcal{V}$가 주어졌을 때, 노드 변환은 다음을 최소화합니다.

$$E(\mathcal{W}_t, \mathcal{V}, D_t, \mathcal{E}) = \mathbf{Data}(\mathcal{W}_t, \mathcal{V}, D_t) + \lambda\,\mathbf{Reg}(\mathcal{W}_t, \mathcal{E}).$$

  데이터 항은 데이터 연관을 위해 워프된 영 레벨셋(zero-level-set) 메시를 라이브 프레임으로 렌더링하고, 예측된 픽셀들에 대해 강건한 Tukey 페널티가 적용된 점-대-평면 오차의 합을 구합니다: $\mathbf{Data} \equiv \sum_{u\in\Omega} \psi_{\mathrm{data}}\big( \hat{\mathbf{n}}_u^\top (\hat{\mathbf{v}}_u - \mathbf{vl}_{\tilde{u}}) \big)$. 정규화 항은 변형 그래프의 엣지 $\mathcal{E}$에 대해 불연속성을 보존하는 Huber 페널티를 갖는 as-rigid-as-possible(가능한 한 강체에 가깝게) 항입니다.

$$\mathbf{Reg}(\mathcal{W}, \mathcal{E}) \equiv \sum_{i=0}^{n} \sum_{j \in \mathcal{E}(i)} \alpha_{ij}\, \psi_{\mathrm{reg}}\big( \mathbf{T}_{ic}\,\mathbf{dg}^j_v - \mathbf{T}_{jc}\,\mathbf{dg}^j_v \big), \qquad \alpha_{ij} = \max(\mathbf{dg}^i_w, \mathbf{dg}^j_w),$$

  이는 *계층적* 변형 트리 위에 구축되어 관측되지 않은 영역이 조각별로 부드럽게 변형됩니다. 최적화는 노드별 트위스트 $\xi_i \in se(3)$를 갖는 Gauss-Newton으로, 먼저 밀도 강체 ICP가 $\mathbf{T}_{lw}$를 풀고, 이후 2~3회의 비강체 반복이 사전 계산된 k-최근접 노드 볼륨을 사용해 GPU에서 전적으로 화살촉(arrow-head) 헤시안의 희소 블록 Cholesky로 선형화된 시스템을 풉니다.
- **워프 필드 확장**: 융합 후, 현재 노드들로 지지되지 않는 표면 정점들($\min_k \lVert \mathbf{dg}^k_v - v_c \rVert / \mathbf{dg}^k_w \ge 1$)은 현재 워프로부터 DQB로 초기화되어 최소 $\epsilon$만큼 떨어진 새 노드를 생성합니다(기본 decimation 밀도 $\epsilon = 25$\,mm). 이후 $L{=}4$ 레벨의 정규화 계층(레벨당 반지름이 $\beta{=}4$배씩 증가)이 다시 구축됩니다. 실사용 파라미터: $\lambda = 200$, Tukey 폭 0.01, Huber 폭 0.0001.

## 실험 결과

평가는 정성적입니다(벤치마크 표 없음): 결과는 일반 하드웨어에서 단일 깊이 카메라로 실시간 시스템에서 라이브로 촬영되었습니다 — 이동하는 카메라로 촬영된 이동하는 사람, 60초에 걸친 "컵으로 마시기"(첫 프레임에서 보이지 않던 표면을 포함해 완전한 팔+컵 모델이 나타남), 그리고 손을 맞잡는 동안에도 모델이 일관되게 유지되는 "손가락 교차" 전신 시퀀스가 있습니다. 처음에는 노이즈가 많고 불완전한 모델이 대상과 카메라가 모두 움직이는 동안 점진적으로 노이즈가 제거되고 완성되며, 촬영 중 루프 클로저가 발생합니다. 밝혀진 한계: 닫힌 위상에서 열린 위상으로 빠르게 변하는 장면(닫힌 손으로 시작한 재건은 그 손을 펼 수 없음), 큰 프레임 간 움직임, 그리고 장면 복잡도가 증가함에 따라 커지는 가려진 영역. CVPR 2015에 게재되었으며 최우수 논문상(Best Paper)을 수상했습니다.

## SLAM에서의 의미

DynamicFusion은 실시간 3D 재건과 SLAM 전반에 퍼져 있던 정적 장면 가정을 제거했으며, 체적 TSDF 융합을 비강체 경우로 일반화하고 밀도 6D 워프 필드가 프레임 속도로 추정될 수 있음을 보였습니다. 정규 볼륨 + 임베디드 변형 그래프라는 조합은 비강체 융합(VolumeDeform, KillingFusion, SurfelWarp)의 표준 틀이 되었으며, 현대의 동적 장면 SLAM 시스템이 카메라 움직임과 장면 움직임을 어떻게 분리하는지에 대한 영향을 주었습니다.

## 관련 문서

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [MaskFusion](../level-03-monocular-slam/maskfusion.md)
- [MID-Fusion](../level-03-monocular-slam/mid-fusion.md)
