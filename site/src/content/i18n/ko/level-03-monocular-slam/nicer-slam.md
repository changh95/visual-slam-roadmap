# NICER-SLAM

> Zhu 2024 · [논문](https://arxiv.org/abs/2302.03594)

**한 줄 요약** — 카메라 포즈와 계층적 SDF 지도를 함께 최적화하는 RGB 전용 신경 암시적 SLAM 시스템으로, 결여된 깊이 센서를 단안 깊이/노멀 사전 정보, 광학 플로우, 워핑 손실로 대체하여 RGB-D 시스템과 경쟁력 있는 재구성을 달성합니다.

## 문제

신경 암시적 SLAM 시스템은 "RGB-D 센서에 의존하거나, 카메라 추적을 위해 별도의 단안 SLAM 방법이 필요하며 고품질의 밀집 3D 장면 재구성을 만들지 못한다" (초록). RGB 전용 SLAM은 논문이 명시하는 세 가지 이유로 더 어렵습니다: 깊이 모호성 (특히 질감이 없는 경우 많은 대응점이 색상만으로 매칭됨), 덜 지역화된 표면 추정, 그리고 제약이 약하고 수렴이 느린 최적화입니다. 논문이 제기하는 질문: 단일한 통합 밀집 SLAM 시스템이 단안 RGB 비디오로부터 추적과 매핑 모두에 하나의 신경 암시적 표현을 사용할 수 있을까?

## 방법 및 아키텍처

**계층적 SDF + 색상 표현.** 거친 밀집 복셀 그리드 ($32^3$, 32차원 특징)와 작은 MLP $f^{\text{coarse}}$가 기본 SDF를 제공합니다. $R_{\min}=32$에서 $R_{\max}=128$까지 기하급수적으로 배치된 다중 해상도 세밀 그리드 ($L=8$개 레벨, 해상도 $R_l = \lfloor R_{\min} b^{l} \rfloor$)와 $f^{\text{fine}}$이 잔차를 예측하여, 최종 SDF는

$$\hat{s} = s^{\text{coarse}} + \Delta s.$$

색상은 자체 다중 해상도 그리드 ($L=16$, $R_{\max}=2048$까지)와 디코더 $\hat{\mathbf{c}} = f^{\text{color}}\bigl(\mathbf{x}, \hat{\mathbf{n}}, \gamma(\mathbf{v}), \mathbf{z}^{\text{coarse}}, \mathbf{z}^{\text{fine}}, \{\Phi^{\text{color}}_l(\mathbf{x})\}\bigr)$를 사용하며, SDF에서 유도된 노멀 $\hat{\mathbf{n}}$과 뷰 방향 $\mathbf{v}$에 조건화됩니다.

**지역적으로 적응적인 SDF-밀도 변환을 이용한 체적 렌더링.** SDF 샘플은 VolSDF 변환 $\sigma_\beta(s)$ ($s\le 0$일 때 스케일된 지수 함수, $s>0$일 때 $\frac{1}{\beta}\bigl(1-\frac{1}{2}\exp(-\frac{s}{\beta})\bigr)$)를 통해 밀도가 되고, 그다음 색상/깊이/노멀이 알파 합성됩니다: $\hat{C} = \sum_{i=1}^{N} T_i \alpha_i \hat{\mathbf{c}}_i$, $\alpha_i = 1-\exp(-\sigma_i\delta_i)$, $T_i = \prod_{j=1}^{i-1}(1-\alpha_j)$. VolSDF의 단일 전역 $\beta$ 대신, (복셀당 $64^3$) 지역 샘플 카운터 $T_p$가 지역적으로 선명도를 설정합니다:

$$\beta = c_0 \cdot \exp(-c_1 \cdot T_p) + c_2,$$

이를 통해 잘 관측된 영역은 선명한 표면을 렌더링하고, 거의 관측되지 않은 영역은 부드럽게 유지됩니다.

**손실이 깊이 센서를 대체합니다.** 매핑은 다음을 최소화합니다

$$\mathcal{L} = \mathcal{L}_{\text{rgb}} + 0.5\,\mathcal{L}_{\text{warp}} + 0.001\,\mathcal{L}_{\text{flow}} + 0.1\,\mathcal{L}_{\text{depth}} + 0.05\,\mathcal{L}_{\text{normal}} + 0.1\,\mathcal{L}_{\text{eikonal}},$$

여기서 $\mathcal{L}_{\text{warp}}$는 각 픽셀의 색상을 렌더링된 깊이를 통해 인근 키프레임으로 재투영한 결과와 비교합니다. $\mathcal{L}_{\text{flow}}$는 유도된 대응점을 GMFlow 광학 플로우와 일치시킵니다. 단안 깊이 손실은 스케일/이동에 불변하며, $\mathcal{L}_{\text{depth}} = \sum_{\mathbf{r}} \lVert (w\hat{D}(\mathbf{r})+q) - \bar{D}(\mathbf{r})\rVert^2$이고 $w,q$는 이미지별로 닫힌 형태로 풀립니다. $\mathcal{L}_{\text{normal}}$은 예측된 단안 노멀에 대해 L1 + 각도 일관성을 부과하며, Eikonal 항 $\sum_{\mathbf{x}}(\lVert\nabla\hat{s}(\mathbf{x})\rVert_2 - 1)^2$은 SDF를 정규화합니다.

**시스템.** 매핑은 5프레임마다 세 단계로 실행됩니다 (거친 단계만; 25% 반복 이후 세밀 그리드 추가; 75% 이후 지역 BA가 $K=16$개 선택된 프레임 중 절반의 포즈를 함께 최적화), $M=8096$개의 광선을 샘플링합니다. 추적은 매 프레임 병렬로 실행되며, $M_t=1024$개의 픽셀에 대한 RGB 손실로 현재 포즈만 100회 반복 최적화합니다. 반복당 비용: A100에서 매핑 496 ms, 추적 147 ms. 메시는 $512^3$에서의 마칭 큐브 (marching cubes)로 생성됩니다.

## 실험 결과

- **Replica 재구성**: 평균 정확도 3.65 cm, 완성도 4.16 cm, 완성 비율 79.37%, 노멀 일관성 90.27% — RGB 기준선인 DROID-SLAM (5.50 / 12.29 cm, 63.62%)과 COLMAP (8.69 / 12.12 cm, 67.62%)을 크게 앞서며, RGB-D 방식인 NICE-SLAM (3.87 / 3.87 cm, 82.41%)과 대등한 수준입니다.
- **Replica 추적 (ATE RMSE)**: 평균 1.88 cm — 어떤 깊이 입력도 없이 RGB-D NICE-SLAM (1.95 cm)과 대등합니다. 다만 DROID-SLAM은 여전히 훨씬 더 정확합니다 (0.33 cm; 최종 전역 BA/루프 클로저 없이는 0.70 cm).
- **새로운 뷰 합성 (Replica)**: 외삽된 뷰에서 23.93 dB PSNR / 0.857 SSIM / 0.201 LPIPS로, RGB-D 시스템인 NICE-SLAM (23.26 dB)과 Vox-Fusion (21.98 dB)조차 능가합니다. 보간된 뷰는 25.41 dB입니다.
- **7-Scenes** (저해상도, 모션 블러가 있는 실제 데이터): 추적 평균 8.55 cm 대 DROID-SLAM의 5.66 cm이지만, COLMAP (11.14)와 전역 BA가 없는 DROID-SLAM (10.87)보다 강건하며, 재구성이 눈에 띄게 더 선명합니다. 단안 사전 정보가 해당 기준선들이 실패하는 질감 없는/반사되는 호박 장면을 통과하도록 이끌어줍니다.
- 어블레이션: 단안 깊이 손실이나 노멀 손실을 제거하면 매핑과 추적 모두 크게 저하됩니다 — RGB 손실이 아니라 이 사전 정보들이 최적화를 명확하게 만드는 요소입니다.

## SLAM에서의 의미

NICER-SLAM은 통합된 신경 암시적 SLAM이 깊이 센서에 근본적으로 의존하지 않음을 보였습니다: 단안 깊이/노멀 네트워크의 사전 정보와 플로우 및 워핑 일관성이 직접적인 깊이 감독을 대체할 수 있으며, 그 대가는 전용 오도메트리에 비해 낮은 추적 정확도입니다. 이는 밀집 신경 SLAM을 일반 단안 카메라로 확장했으며, 이 레시피 — 단안 기하학적 단서, 플로우 일관성, 지역적으로 적응적인 SDF 렌더링 — 는 MonoGS와 같은 이후의 RGB 전용 신경 및 가우시안 SLAM 시스템 전반에서 다시 등장합니다.

## 관련 문서

- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [MonoGS](monogs.md)
- [DPT](../level-05-deep-learning/dpt.md)
- [MiDaS](../level-05-deep-learning/midas.md)
- [RAFT](../level-05-deep-learning/raft.md)
