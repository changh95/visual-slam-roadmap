# DIFIX3D+

> Wu 2025 · [논문](https://arxiv.org/abs/2503.01774)

**한 줄 요약** — 단일 스텝 이미지 diffusion 모델(Difix)을 사용하여 NeRF/3DGS 재구성을 괴롭히는 floater, 허구적인 기하, 블러를 제거한다 — 학습 중에는 정제된 pseudo-view를 3D 표현에 다시 distillation하고, 렌더링 시점에는 76ms짜리 신경망 향상기(enhancer)로 작동한다.

## 문제

Neural Radiance Field와 3D Gaussian Splatting은 3D 재구성과 novel-view synthesis에 혁신을 가져왔지만, *극단적인* novel viewpoint — 촬영된 궤적에서 멀리 떨어진 뷰 — 로부터의 사실적인 렌더링은 여전히 도전적이다: 3D 모델이 충분히 제약되지 않은 곳이라면 어디서든 두 표현 모두에서 아티팩트가 지속된다. 장면별 최적화는 한 번도 관측하지 못한 그럴듯한 콘텐츠를 환각(hallucinate)할 수 없으며, 매 학습 스텝마다 diffusion 모델을 조회하는 방법들은 큰 장면으로 확장하기 어렵다. 해법은 재구성 안팎에서 사용하기에 충분히 저렴한 학습된 이미지 사전 정보로부터 나와야 한다.

## 방법 및 아키텍처

**Difix, 단일 스텝 수정기.** SD-Turbo가 (동결된 VAE 인코더, LoRA로 미세 조정된 디코더, pix2pix-Turbo 스타일로) 미세 조정되어 손상된 렌더링 뷰 $\tilde{I}$와 깨끗한 참조 뷰 $I_{\text{ref}}$를 정제된 뷰 $\hat{I}$로 매핑하는 이미지-투-이미지 변환기가 된다. 핵심 통찰: 렌더링 아티팩트로 손상된 이미지는 diffusion 모델의 노이즈가 있는 학습 분포 중 *중간* 노이즈 레벨과 유사하므로, Difix는 $\tau = 1000$이 아니라 $\tau = 200$에서 단일 스텝 노이즈 제거를 수행한다 — 실험적으로 검증된 최적 설정이다.

**참조 혼합 레이어.** Novel view와 참조 view는 view 축을 따라 연결되어 latent $\mathbf{z} \in \mathbb{R}^{V \times C \times H \times W}$로 인코딩된다; self-attention 레이어는 flatten된 view+공간 차원 전체에 적용되어, 2D attention 가중치를 물려받으면서도 view 간 신호(물체, 색상, 텍스처)를 포착한다.

**손실.** $\mathcal{L} = \mathcal{L}_{\text{Recon}} + \mathcal{L}_{\text{LPIPS}} + 0.5\,\mathcal{L}_{\text{Gram}}$이며, 여기서 스타일 항은 선명한 디테일을 촉진하는 VGG-16 특징 $\phi_l$에 대한 Gram-행렬 손실이다:

$$\mathcal{L}_{\text{Gram}} = \frac{1}{L}\sum_{l=1}^{L} \beta_l \left\| G_l(\hat{I}) - G_l(I) \right\|_2, \qquad G_l(I) = \phi_l(I)^{\top}\phi_l(I) .$$

**데이터 큐레이션.** 아티팩트/깨끗한 쌍을 이루는 학습 데이터는 희소 재구성(n번째 프레임마다 학습), 순환 재구성(1~6m 이동된 궤적으로 학습된 NeRF로부터 원래 궤적을 다시 렌더링), 모델 언더피팅(학습 스케줄의 25~75%), 크로스 카메라 참조를 통해 만들어진다.

**Difix3D: 점진적인 3D 업데이트.** 참조 뷰로부터 시작하여, 1.5k 반복마다 학습 카메라 포즈가 목표 궤적을 향해 조금씩 이동되고, 그 결과로 만들어진 novel view가 렌더링되어 Difix로 정제되고, 학습 세트에 추가된다 — 극단적인 뷰를 향해 multi-view 일관성 있는 3D 신호를 점진적으로 키워간다. Distillation은 결과를 3D 일관성 있게 유지하며, 매 스텝마다 diffusion을 조회하지 않아도 되므로 score-distillation 스타일 접근법보다 10배 이상 빠르다.

**Difix3D+: 렌더링 시점의 다듬기.** Difix가 단일 스텝이기 때문에, 매 렌더링된 프레임에 대해 최종 후처리 단계로도 실행될 수 있다 — NVIDIA A100에서 76ms — distillation과 제한된 모델 용량이 남기고 간 잔여 아티팩트를 제거한다. 동일하게 학습된 모델이 NeRF와 3DGS backbone 모두에 사용된다.

## 실험 결과

- Nerfbusters 데이터셋: Difix3D+(Nerfacto)는 PSNR 18.32 / LPIPS 0.2789 / FID 49.44를 얻는다(Nerfacto baseline은 17.29 / 0.4021 / 134.65); Difix3D+(3DGS)는 18.51 / 0.2637 / 41.77(3DGS는 17.66 / 0.3265 / 113.84) — 대략 LPIPS 0.1 낮음, FID 약 3배 낮음, PSNR 약 1dB 높음이며, 모든 지표에서 Nerfbusters, GANeRF, NeRFLiX보다 우수하다.
- DL3DV 벤치마크: FID 112.30 → 41.77(Nerfacto), 107.23 → 40.86(3DGS).
- RDS 자율주행 데이터셋(중앙 카메라로 학습, 측면 카메라로 평가): PSNR 19.95 → 21.75, FID 91.38 → 73.08로, NeRFLiX를 능가한다.
- Ablation: 3D 업데이트 없이 매 프레임을 naive하게 수정하면 깜박임(flicker)이 생기고; 점진적 업데이트 대신 non-incremental distillation은 LPIPS/FID를 저하시키며; $\tau{=}1000$에서 $\tau{=}200$으로 노이즈를 낮추는 것만으로도 LPIPS와 FID가 뚜렷하게 개선된다. 전체적으로 이 논문은 3D 일관성을 유지하면서 baseline보다 평균 2배의 FID 개선을 보고한다.

## SLAM에서의 의미

radiance field나 3D Gaussian 위에 구축된 dense SLAM 시스템(SplaTAM, MonoGS 및 후속작들)은 카메라 궤적에서 멀어질수록 빠르게 품질이 떨어지는 novel view를 렌더링한다 — AR 프리뷰, 텔레프레즌스, 맵 검수에 있어 실질적인 문제다. DIFIX3D+는 저렴한 2D 생성 모델 사전 정보가 매핑 백엔드를 재설계하지 않고도 이런 렌더링을 정제할 수 있음을 보여주며, 일반적인 패턴을 시사한다: 기하학적 SLAM이 맵을 만들고, feed-forward 생성 모델이 그 출력을 다듬는다 — 렌더링 루프 안에 들어갈 만큼(단일 스텝) 빠르게.

## 관련 문서

- [NeRF](nerf.md) — 이 연구 계열이 다루는 아티팩트를 가진 신경 렌더링 표현
- [Marigold](marigold.md) — diffusion 사전 정보를 3D 인지에 재활용하는 또 다른 예
- [MonoGS](../level-03-monocular-slam/monogs.md) — 렌더링 가능한 맵을 만드는 Gaussian-splatting SLAM
- [NeRF-SLAM](../level-03-monocular-slam/nerf-slam.md) — 실시간 SLAM으로부터 구축된 radiance-field 맵
- [SplaTAM](../level-03-monocular-slam/splatam.md) — 이런 종류의 후처리로 이득을 보는 렌더링된 맵을 가진 3DGS SLAM
