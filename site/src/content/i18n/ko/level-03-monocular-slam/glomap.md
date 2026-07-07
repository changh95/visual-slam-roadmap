# GLOMAP

> Pan 2024 · [논문](https://arxiv.org/abs/2407.20219)

**한 줄 요약** — 전역(global) Structure-from-Motion을 재조명하여, 개별적인 병진 평균화(translation averaging) 단계를 카메라와 점을 함께 추정하는 전역 위치 결정 단계로 대체함으로써 증분(incremental) SfM(COLMAP)의 정확도에 필적하면서도 훨씬 더 빠르다는 것을 보였습니다.

## 문제

SfM 솔루션은 두 가지 패러다임으로 나뉩니다. *증분* SfM(COLMAP)은 이미지를 한 장씩 등록하며 번들 조정을 반복적으로 수행합니다: 정확하고 강건하지만, "비용이 많이 드는 반복적인 번들 조정"이 확장성을 제한합니다. *전역* SfM은 모든 카메라를 한 번에 복원하여 "몇 배 더 빠르지만", 증분 방식의 정확도에는 결코 미치지 못했습니다 — 그 격차는 "전역 병진 평균화 단계에 있으며", 이는 두 뷰 병진의 스케일 모호성(왜곡된 삼중항이 노이즈를 증폭시킴), 두 뷰 기하를 분해하기 위한 정확한 내부 파라미터에 대한 의존성, 그리고 시퀀셜 데이터에서 흔한 거의 직선적인(전방) 모션 하에서의 퇴화(degeneracy) 문제에서 비롯됩니다. GLOMAP은 이 격차를 좁히는 것을 목표로 합니다.

## 방법 및 아키텍처

두 가지 구성 요소로 이루어집니다: **대응관계 탐색**(특징점, 매칭, 두 뷰 기하 $\mathbf{F}/\mathbf{E}/\mathbf{H}$, 뷰 그래프 보정, 상대 포즈 추정)과 **전역 추정**입니다.

- **특징 트랙 구성**: 최적으로 적합된 두 뷰 모델의 인라이어 대응관계만 유지하며, 그 뒤 카이랄리티(cheirality) 검사를 수행합니다. 에피폴 근처의 매칭이나 삼각측량 각도가 작은 매칭은 트랙으로 이어 붙이기 전에 제거됩니다.
- **먼저 수행되는 회전 평균화**: 절대 방향은 고전적인 강건 목적함수를 풉니다.

$$\operatorname*{arg\,min}_{\mathbf{R}}\sum_{i,j}\rho\left(d(\mathbf{R}_{j}^{\top}\mathbf{R}_{ij}\mathbf{R}_{i},\mathbf{I})^{p}\right)$$

  Chatterjee 등의 방법을 저자들이 직접 구현하여 사용합니다. 결과와 일치하지 않는 상대 포즈($\mathbf{R}_{ij}$와 $\mathbf{R}_{j}\mathbf{R}_{i}^{\top}$ 사이의 각도 거리 기준)는 걸러집니다.
- **병진 평균화를 대체하는 전역 위치 결정** — 이것이 핵심 기여입니다. 카메라 위치 $\mathbf{c}_i$와 3D 점 $\mathbf{X}_k$는 전역적으로 회전된 카메라 레이 $\mathbf{v}_{ik}$로부터 *함께* 추정되며, 상대 병진 제약은 완전히 버려집니다:

$$\operatorname*{arg\,min}_{\mathbf{X},\mathbf{c},d}\sum_{i,k}\rho\left(\|\mathbf{v}_{ik}-d_{ik}(\mathbf{X}_{k}-\mathbf{c}_{i})\|_{2}\right),\quad\text{s.t.}\quad d_{ik}\geq 0$$

  Huber 손실 $\rho$와 Levenberg–Marquardt(Ceres)를 사용하며, 모든 변수는 $[-1,1]$에서 *균일하게 무작위로* 초기화되고 $d_{ik}=1$로 설정됩니다. 최적의 $d_{ik}$에 대해 각 항의 오차는 각도 $\theta<\pi/2$에서 $\sin\theta$와 같아지고 그 이후로는 1로 포화됩니다 — 이는 이 쌍선형(bilinear) 형태 때문에 무작위 초기화로부터도 안정적으로 수렴하는, 유계이며 이상값에 강건한 오차입니다. 오차가 상대 병진이 아니라 카메라 레이 위에서 정의되기 때문에, 잘못된 내부 파라미터는 해당 카메라 개별에만 편향을 일으키며, 전방/측방 모션도 더 이상 퇴화하지 않습니다.
- **전역 번들 조정**: Huber 손실을 사용한 LM을 여러 라운드 수행합니다. 각 라운드 안에서 회전을 먼저 고정한 뒤 내부 파라미터와 점들과 함께 최적화합니다(시퀀셜 데이터에서 중요합니다). 트랙은 먼저 각도 오차로, 그 다음 재투영 오차로 사전 필터링됩니다. 필터링되는 트랙이 0.1% 미만이 되면 반복이 멈춥니다. 선택적인 구조 정제(재삼각측량 + 추가 BA)로 정확도를 더 높일 수 있습니다.
- **카메라 클러스터링**: 공시야성(covisibility) 그래프에 대한 후처리로 강하게 연결된 컴포넌트를 찾아 조심스럽게 병합하며, 잘못 매칭되어 겹치지 않는 인터넷 이미지 컬렉션을 별도의 일관된 재구성으로 분리합니다.
- **COLMAP과 호환 가능한 설계**: 동일한 데이터베이스를 사용하고 동일한 출력 형식을 생성하므로, 기존 NeRF/3DGS 데이터 준비 워크플로에 그대로 적용할 수 있습니다.

## 실험 결과

- **ETH3D SLAM**(시퀀셜, 밀리미터급 실측): COLMAP 대비 재현율(recall)이 약 8% 높고 0.1 m/0.5 m에서 AUC가 각각 +9/+8 포인트 높으며, COLMAP은 "한 자릿수 배 더 느립니다". 전역 SfM 베이스라인들과 비교하면 재현율이 18%/4% 높고 AUC@0.1m이 약 11포인트 높습니다.
- **ETH3D MVS 리그**: 모든 장면을 재구성합니다(COLMAP은 한 장면에서 실패하고, OpenMVG는 거의 모든 장면에서 크게 실패합니다). 성공한 곳에서는 COLMAP과 비슷하거나 더 높은 정확도를 보이며, 약 3.5배 더 빠릅니다.
- **LaMAR**(장면당 수만 장의 AR 기기 이미지): HGE와 LIN에서 COLMAP을 포함한 모든 베이스라인보다 훨씬 정확하면서도 몇 배 더 빠릅니다. 모든 방법이 CAB(전방 모션, 낮-밤 변화, 대칭성)에서는 어려움을 겪습니다.
- **IMC 2023**(보정되지 않은 인터넷 이미지): 3°/5°/10°에서의 AUC가 다른 전역 SfM 베이스라인보다 몇 배 높고 COLMAP보다 약 4포인트 높으며, 실행 속도는 약 8배 빠릅니다. MIP360에서는 재실행한 COLMAP과 동등한 성능을 보이면서도 1.5배 이상 빠릅니다.
- 알려진 실패 모드: 회전 대칭이 있는 장면(예: `exhibition_hall`)에서는 회전 평균화가 붕괴할 수 있습니다.
- [github.com/colmap/glomap](https://github.com/colmap/glomap)에서 오픈소스로 공개되어 있으며 — COLMAP 조직 안에 호스팅되어 있어 기본 "고속 매퍼"로서의 채택이 가속화되었습니다.

## SLAM에서의 의미

COLMAP과 같은 SfM 도구는 실측 궤적, 오프라인 지도, 그리고 NeRF/3DGS 및 학습 기반 SLAM을 위한 학습 데이터를 생성하는 표준적인 방법입니다. GLOMAP은 이 오프라인 매핑 단계를 대규모에서 훨씬 더 저렴하게 만들었고, 증분 파이프라인만이 유일하게 강건한 선택이라고 여겨졌던 10년의 시간 이후 전역 SfM을 진지한 범용 패러다임으로 되살렸습니다 — 이 흐름은 InstantSfM과 같은 GPU 네이티브 시스템으로 이어집니다. 개념적으로, "모든 것을 한 번에 해결한다"는 GLOMAP의 입장은 SLAM 백엔드의 전역 번들 조정을 반영하며, 레이 기반의 전역 위치 결정 방식은 취약한 추정 단계(병진 평균화)를 더 열심히 최적화하는 것보다 재구성(reformulation)하는 것이 더 중요할 수 있음을 보여줍니다.

## 관련 문서

- [COLMAP](colmap.md)
- [InstantSfM](instantsfm.md)
- [VGGT](../level-05-deep-learning/vggt.md)
- [MASt3R](../level-05-deep-learning/mast3r.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md)
