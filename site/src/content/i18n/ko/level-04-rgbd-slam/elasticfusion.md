# ElasticFusion

> Whelan 2015 · [논문](https://ieeexplore.ieee.org/document/7274882)

**한 줄 요약** — 루프 클로저 시점에 비강체 탄성 변형을 지도에 직접 적용함으로써 포즈 그래프 없이 전역적으로 일관된 재건을 달성하는 서펠(surfel) 기반 밀도 RGB-D SLAM 시스템.

## 문제

밀도 SLAM 시스템은 길게 이어지면서도 루피(loopy)한 움직임 — 핸드헬드 깊이 카메라로 방을 "칠하듯" 스캔하는 상황 — 에서 어려움을 겪었습니다. KinectFusion의 고정 볼륨은 장면 크기를 제한합니다. Whelan의 이전 연구인 Kintinuous는 포즈 그래프 변형을 통해 복도 규모로 확장되지만, 지역적으로 루피한 궤적에서는 성능이 나쁘고 재방문한 지도 영역을 재사용할 수 없습니다. DVO-SLAM은 키프레임 포즈를 최적화하지만 명시적인 연속 표면을 구축하지 않습니다. ElasticFusion은 이 우선순위를 뒤집습니다: 카메라 궤적(포즈 그래프)을 최적화하고 지도를 재구축하는 대신, *지도 자체*를 최적화합니다 — 표면 루프 클로저를 일찍부터 자주 적용하여, 시스템이 항상 지도 분포의 모드(mode) 근처에 머물도록 합니다.

## 방법 및 아키텍처

프레임별 루프: RGB-D 입력 → 스플랫된(splatted) 서펠 예측 → 프레임-대-모델 ICP+RGB 추적 → 서펠 융합 → 지역(모델-대-모델) 루프 검사 → 전역(펀, fern) 루프 검사 → 비강체 변형. CUDA가 추적 리덕션과 지도 관리를 수행하고, OpenGL이 뷰 예측을 담당합니다.

- **융합된 서펠 맵**: 위치 $\mathbf{p}\in\mathbb{R}^3$, 법선 $\mathbf{n}$, 색상 $\mathbf{c}$, 가중치 $w$, 반지름 $r$, 초기화 타임스탬프 $t_0$, 최종 갱신 타임스탬프 $t$를 가진 서펠들의 순서 없는 목록 $\mathcal{M}$. 시간 윈도우 $\delta_t$는 $\mathcal{M}$을 **활성(active)** 서펠 $\Theta$(최근에 관측되어 추적과 융합에 사용됨)와 **비활성(inactive)** 서펠 $\Psi$(루프가 재활성화할 때까지 사용되지 않음)로 분할합니다.
- **결합된 프레임-대-모델 추적**: 각 프레임은 활성 모델의 스플랫 렌더링에 대해 정합됩니다 — 깊이와 전체 색상 모두 사용. 기하 항은 라이브 깊이 맵과 예측된 깊이 사이의 점-대-평면 ICP입니다.

$$E_{\mathrm{icp}} = \sum_{k} \Big( \big(\mathbf{v}^k - \exp(\hat{\boldsymbol{\xi}})\,\mathbf{T}\,\mathbf{v}_t^k\big)\cdot\mathbf{n}^k \Big)^2 ,$$

  광도 항 $E_{\mathrm{rgb}}$는 라이브 색상 이미지와 예측된 활성 모델 색상 사이의 강도 차이에 페널티를 부과합니다. 결합 비용 $E_{\mathrm{track}} = E_{\mathrm{icp}} + w_{\mathrm{rgb}} E_{\mathrm{rgb}}$ ($w_{\mathrm{rgb}} = 0.1$)는 3단계 거칠기-에서-세밀도 피라미드에서 Gauss-Newton으로 최소화됩니다(GPU 트리 리덕션이 6×6 시스템을 구성하고, CPU Cholesky가 이를 풉니다).
- **시간에 따라 샘플링되고 연결되는 변형 그래프**: 매 프레임마다 노드(위치 $\mathcal{G}^n_{\mathbf{g}}$, 변환 $\mathcal{G}^n_{\mathbf{R}}, \mathcal{G}^n_{\mathbf{t}}$, 타임스탬프)로 구성된 새로운 그래프 $\mathcal{G}$가 서펠로부터 샘플링됩니다. 연결성은 초기화 시점 순서를 따르며(k = 4개의 인접), 이는 같은 표면에 대해 시간적으로 상관되지 않은 통과들이 서로 영향을 주지 않도록 방지합니다. 서펠은 그것에 영향을 미치는 노드들에 의해 변형됩니다.

$$\hat{\mathcal{M}}^s_{\mathbf{p}} = \sum_{n\in I} w^n \big[ \mathcal{G}^n_{\mathbf{R}} (\mathcal{M}^s_{\mathbf{p}} - \mathcal{G}^n_{\mathbf{g}}) + \mathcal{G}^n_{\mathbf{g}} + \mathcal{G}^n_{\mathbf{t}} \big], \qquad w^n = \big(1 - \lVert \mathcal{M}^s_{\mathbf{p}} - \mathcal{G}^n_{\mathbf{g}} \rVert_2 / d_{\max} \big)^2 .$$

- **변형 최적화**: 표면 대응 $\mathcal{Q}$(소스 점, 목표 점, 타임스탬프)가 주어지면, 그래프 파라미터는 $w_{\mathrm{rot}}{=}1, w_{\mathrm{reg}}{=}10, w_{\mathrm{con}}{=}100$을 갖는 $E_{\mathrm{def}} = w_{\mathrm{rot}} E_{\mathrm{rot}} + w_{\mathrm{reg}} E_{\mathrm{reg}} + w_{\mathrm{con}} E_{\mathrm{con}} + w_{\mathrm{con}} E_{\mathrm{pin}}$을 최소화합니다: 강직성 항 $E_{\mathrm{rot}} = \sum_l \lVert \mathcal{G}^{l\top}_{\mathbf{R}}\mathcal{G}^{l}_{\mathbf{R}} - \mathbf{I} \rVert_F^2$, 그래프 엣지에 대한 임베디드 변형 평활성 항 $E_{\mathrm{reg}}$, 제약 항 $E_{\mathrm{con}} = \sum_p \lVert \phi(\mathcal{Q}^p_{\mathbf{s}}) - \mathcal{Q}^p_{\mathbf{d}} \rVert_2^2$, 그리고 비활성 영역을 고정시켜 활성 모델이 비활성 좌표 프레임 *안으로* 변형되도록 하는 핀(pin) 항입니다. CPU에서 Gauss-Newton과 희소 Cholesky로 풀린 후, GPU에서 모든 서펠에 적용됩니다.
- **지역 루프 클로저**: (전역 루프가 발생하지 않은) 매 프레임마다, 현재 포즈에서 활성 및 비활성 모델의 예측 렌더링이 동일한 ICP+RGB 방법으로 정합됩니다. 이 정합은 잔차가 작고, 인라이어가 충분하며, 헤시안에서 유도된 공분산의 고유값이 임계값 이하로 유지될 때만 수용됩니다. 수용된 제약은 지도를 변형하고 매칭된 비활성 서펠을 재활성화합니다 — 많은 작은 루프들이 지속적으로 닫힙니다.
- **전역 루프 클로저**: 무작위 펀(fern) 인코딩 데이터베이스(원본 프레임이 아닌 80×60으로 다운샘플링된 *예측된* 뷰에 대해)가 임의의 드리프트 후 재방문을 탐지합니다. 매칭된 뷰는 정합되고(최적화 후 $E_{\mathrm{con}}$에서도) 검증된 후, 포즈 그래프도 궤적 관리도 없이 전체 지도 변형으로 적용됩니다.

## 실험 결과

- **궤적 (TUM RGB-D, ATE RMSE)**: fr1/desk 0.020\,m, fr2/xyz 0.011\,m, fr3/office 0.017\,m, fr3/nst 0.016\,m — DVO SLAM(0.021/0.018/0.035/0.018), RGB-D SLAM(0.023/0.008/0.032/0.017), MRSMap(0.043/0.020/0.042/2.018), Kintinuous(0.037/0.029/0.030/0.031)와 동등하거나 더 나음.
- **표면 재건 (ICL-NUIM 합성 living room)**: kt0-kt3에서 실측 모델까지의 평균 거리 0.007 / 0.007 / 0.008 / 0.028\,m — 비교된 모든 시스템보다 우수(예: Kintinuous 0.011/0.008/0.009/0.150\,m); 궤적 ATE 0.009/0.009/0.014/0.106\,m. kt3에서의 제거 실험: 지역 루프만 사용 시 표면 오차 0.099\,m, 전역 루프만 사용 시 0.103\,m — 둘 다 필요합니다.
- **규모와 속도**: 450만 개 이상의 서펠로 구성된 종합적인 방 스캔이 실시간으로 촬영됩니다. Hotel 시퀀스는 7725개의 프레임을 처리해 410만 개의 서펠, 328개의 그래프 노드, 11회의 지역 루프 클로저와 1회의 전역 루프 클로저를 만듭니다. Intel Core i7-4930K와 NVIDIA GTX 780 Ti에서 평균 프레임 시간 31\,ms, 최대 45\,ms(최악의 경우 약 22\,Hz)입니다.

## SLAM에서의 의미

ElasticFusion은 "지도가 곧 상태다"라는 설계를 실용적으로 만들었습니다: 카메라 궤적을 보정하고 측정값을 다시 통합하는 대신, 밀도 표면 자체를 자주 작게 변형함으로써 지도 분포의 모드에 가깝게 유지하며 표면 자체를 직접 보정합니다. 이는 표준적인 서펠 기반 밀도 SLAM 백본이 되었습니다 — SemanticFusion은 그 서펠에 CNN 의미(semantics)를 직접 추가합니다 — 그리고 그 활성/비활성 모델 분할, 모델-대-모델 지역 루프, 펀 재위치추정(fern relocalisation)은 이후의 밀도 시스템들에서 반복적으로 등장합니다. 온라인 루프 클로저를 갖춘 방 규모의 고품질 밀도 재건을 공부하기에 좋은 연구입니다.

## 관련 문서

- [KinectFusion](kinectfusion.md)
- [Kintinuous](kintinuous.md)
- [SemanticFusion](semanticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [BundleFusion](bundlefusion.md)
