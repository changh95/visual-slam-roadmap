# RoMa v2

> Edstedt 2025 · [논문](https://arxiv.org/abs/2511.15706)

**한 줄 요약** — 밀집 특징 매칭을 "더 어렵게, 더 좋게, 더 빠르게, 더 밀집하게" 밀어붙이는 RoMa의 후속작: 커스텀 CUDA correlation 커널을 갖춘 DINOv3 다중 뷰 Transformer 매처와 분리된 정제기를 결합해, RoMa의 강인성과 UFM급 속도를 함께 갖추면서 픽셀별 오차 공분산까지 추가했다.

## 문제

밀집 특징 매칭 — 두 이미지 간 모든 픽셀에 대해 워프 $\mathbf{W}^{A\mapsto B}\in\mathbb{R}^{H^A\times W^A\times 2}$와 확신도 $\mathbf{p}^{A\mapsto B}$를 추정하는 것 — 은 양안 대응 관계의 표준으로 자리 잡았지만, 기존 매처들은 여전히 많은 어려운 실세계 시나리오에서 실패하며(RUBIK은 극단적인 시점 변화에서 RoMa의 약점을 드러낸다) 고정밀 모델들은 속도가 느리다. UFM은 밀집 매칭이 훨씬 더 빨라질 수 있음을 보였지만 백본을 파인튜닝함으로써(WxBS에서의 극단적 외관 강인성을 해치고) 서브픽셀 정밀도를 잃는다. RoMa v2는 두 강점을 모두 결합하는 것을 목표로 한다.

## 방법 및 아키텍처

**분리된 2단계 파이프라인.** 매칭과 정제는 (RoMa 방식의 detached gradient를 통한 결합 학습이 아니라) UFM 방식으로 두 개의 별도 단계에서 학습되어 빠른 실험을 가능하게 한다: 조대 매처는 배치 128(~3800만 쌍)에서 30만 스텝을 학습한 후 동결되고, 세 개의 정제기가 배치 64(~1900만 쌍)에서 30만 스텝을 학습한다.

**조대 매처(stride 4).** 동결된 DINOv3 ViT-L이 DINOv2를 대체한다(linear-probe EPE 19.0 대 27.1, 강인성 86.4% 대 77.0%). 두 이미지의 특징은 프레임 단위 어텐션과 전역 어텐션을 교차하는 ViT-B 다중 뷰 Transformer를 통과한다(VGGT 방식, 정규화된 그리드 RoPE). RoMa의 Gaussian Process 매칭 인코더는 유사도 행렬 $\mathcal{S}_{mn}=\exp(\tfrac{1}{\tau}\,\text{cossim}(\mathbf{z}^A_m,\mathbf{z}^B_n))$에 대한 단일 헤드 어텐션으로 대체되며, 최적 매칭 패치에 대한 보조 밀집 NLL 목표가 함께 사용된다:

$$\mathcal{L}_{\text{NLL}}=\sum_{m=1}^{M}-\log(\operatorname{Softmax}(\mathcal{S}_m)_{n^*}),$$

여기서 $n^*$는 정답 워프에 가장 가까운 패치다. DPT 헤드가 매칭 임베딩 + DINOv3 특징을 1/4 해상도의 워프와 확신도로 디코딩한다. 전체 매처 손실: $\mathcal{L}_{\text{matcher}}=\mathcal{L}_{\text{NLL}}+\mathcal{L}_{\text{warp}}+10^{-2}\mathcal{L}_{\text{overlap}}$.

**커스텀 CUDA 커널을 갖춘 정제기(stride 4, 2, 1).** RoMa류의 ConvNet 정제기이지만, 메모리를 많이 소모하는 지역 correlation 연산은 커스텀 CUDA/PyTorch-확장 커널로 재작성되고 채널 차원은 2의 거듭제곱으로 맞춰진다. 워프 지도는 generalized Charbonnier 손실 $\mathcal{L}_{\text{warp}}=(ic)^{\alpha}\left(\lVert\mathbf{r}\rVert^{2}/(ic)^{2}+1\right)^{\alpha/2}$($\alpha=0.5$, $c=10^{-3}$, stride $i\in\{4,2,1\}$)를 사용하며, overlap은 픽셀별 BCE를 사용한다. 가중치의 EMA(decay 0.999)는 학습 중 관찰된 무작위 ±0.1px 서브픽셀 예측 편향을 제거한다.

**예측적 공분산.** RoMa/UFM과 달리, 정제기들은 Cholesky 인자($\Sigma^{-1}=LL^{\top}$, Softplus로 제약된 대각 성분)를 통해 잔차 $\mathbf{r}_\theta=\mathbf{W}^{A\mapsto B}_\theta-\mathbf{W}^{A\mapsto B}_{\text{GT}}$의 픽셀별 $2\times 2$ 정밀도 행렬을 예측하며, $\lVert\mathbf{r}\rVert<8$px인 공가시(covisible) 픽셀에 대해 Gaussian NLL $\mathcal{L}_{\text{precision}}=\frac{1}{2}\mathbf{r}^{\top}\Sigma^{-1}\mathbf{r}-\frac{1}{2}\log\det(\Sigma^{-1})+\log(2\pi)$로 학습되며, 여러 stride에 걸쳐 계층적으로 누적된다.

**정선된 데이터 혼합.** RoMa의 MegaDepth 단독 대신 10개의 데이터셋을 사용한다: 넓은 기선(MegaDepth, AerialMD, BlendedMVS, Hypersim, TartanAir v2, Map-Free, ScanNet++ v2) 및 좁은 기선(FlyingThings3D, VKITTI2, UnrealStereo4k), 총 5069개 장면 — 항공 데이터는 큰 회전과 공중-지상 시점에 대한 강인성을 제공하고, 좁은 기선 데이터는 세밀한 디테일과 텍스처 없는 표면에 대한 예측력을 제공한다.

## 실험 결과

- **MegaDepth-1500 포즈**: AUC@5°/10°/20°에서 62.8 / 77.0 / 86.6 대 RoMa 62.6/76.7/86.3, UFM 41.5, MASt3R 42.4 — 모든 매처와 피드포워드 3D 모델 중 최고.
- **ScanNet-1500 포즈**: 33.6 / 56.2 / 73.8 대 RoMa 31.8/53.4/70.9 — VGGT(33.9) 및 MASt3R와 동등.
- **밀집 매칭(640×640, EPE 낮을수록 좋음)**: MegaDepth 1.47 대 RoMa 2.34; TartanAir-WB 13.82 대 UFM 15.85 및 RoMa 60.61; AerialMegaDepth 4.12 대 RoMa 25.05(84% 낮음); FlyingThings3D 0.93; ScanNet++ v2 4.00; MapFree 2.03 — 6개 데이터셋 전체에서 최고.
- **런타임(배치 8, H200)**: 4.8GB에서 초당 30.9쌍 — RoMa(초당 18.5쌍)보다 1.7배 빠르면서 비슷한 메모리를 사용한다. UFM은 더 빠르지만(초당 43.0) 16.2GB가 필요하다.
- **WxBS**: mAA@10px 55.4 — RoMa(60.8, 격차는 IR-to-RGB 서브셋에서 발생)보다 낮지만 UFM(42.3)보다는 훨씬 높다. 새로운 SatAst 우주비행사-위성 벤치마크: AUC@10px 37.0 대 RoMa 23.5, UFM 1.8.
- **공분산의 효과(Hypersim)**: 공분산 가중 정제는 포즈 AUC@1°를 54.9에서 76.4로(~20포인트) 끌어올린다.

## SLAM에서의 의미

극단적인 외관 변화 하에서의 relocalization, loop closure, 오프라인 매핑을 위한 프론트엔드로 밀집하고 확신도를 인식하는 매칭이 자리 잡고 있으며, RoMa 계열은 그 표준 구현이다. 속도는 RoMa급 매처를 SLAM에서 온라인으로 사용하는 데 있어 주된 장애물이었으며, RoMa v2의 1.7배 속도 향상과 메모리 효율적인 정제는 이 격차를 좁힌다. 픽셀별 오차 공분산은 SLAM 백엔드에서 직접 소비될 수 있다 — 추정 파이프라인이 기대하는 그대로 RANSAC과 포즈 정제에서 잔차를 가중할 수 있으며 — 이 모델은 MASt3R류의 양안 3D 복원을 위한 자연스러운 특징 백본이기도 하다.

## 관련 문서

- [RoMa](roma.md) — 전작이자 핵심 아키텍처
- [LoFTR](loftr.md) — 앞선 검출기 없는 매칭 계보
- [Foundation models](foundation-models.md) — 강인한 조대 특징의 원천
- [MASt3R](mast3r.md) — 밀집 매칭과 3D 복원의 융합
- [DeDoDe](dedode.md) — 같은 그룹의 분리된 sparse 검출기/descriptor
