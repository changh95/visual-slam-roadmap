# Online 3DGS Modeling

> Lee 2025 · [논문](https://arxiv.org/abs/2508.14014)

**한 줄 요약** — DROID-SLAM + 다중 뷰 스테레오 프론트엔드와 가우시안 백엔드를 결합한 온라인 단안 3DGS 매핑으로, 비키프레임에 대한 불확실성 기반 *새로운 뷰 선택 (novel view selection)*을 추가하여 모델이 불완전한 영역을 고쳐줄 바로 그 추가 프레임들에 대해서만 학습하도록 합니다.

## 문제

밀집 SLAM에 기반한 온라인 3DGS 파이프라인은 "키프레임에만 전적으로 의존하는 한계가 있어, 전체 장면을 포착하기에 불충분하며 결과적으로 불완전한 재구성을 초래한다". 키프레임은 평균 광학 플로우를 임계값으로 하여 선택되는데 — 이는 *추적* 기준이므로 — 짧게만 관측되거나 비키프레임 시점에서만 보이는 영역은 재구성이 부실하게 남습니다. 그럼에도 온라인 예산은 모든 프레임에 대한 학습을 허용하지 않습니다. 고정된 예산이 주어졌을 때, *어떤* 추가 프레임에 학습할 가치가 있을까요? 두 번째 문제는: 많은 시스템이 희소하거나 단일 이미지에서 예측된 깊이를 사용하는데, 이는 스케일이 모호하고 야외에서 실패합니다.

## 방법 및 아키텍처

프론트엔드와 백엔드가 병렬로 독립적으로 실행되는 MVS-GS 프레임워크에 기반합니다:

- **프론트엔드 (추적 + 깊이)**: DROID-SLAM은 키프레임 $I_k$가 노드이고 공시야성 (co-visibility) 링크가 엣지인 프레임 그래프 $G$에 대해 포즈를 추적합니다. 밀집 광학 플로우가 거친 disparity map을 만들어내며, 이는 거친-세밀 다중 뷰 스테레오 네트워크인 MVSFormer의 첫 레이어를 *초기화*하여 키프레임별로 정확한 미터 단위 일관성을 가진 깊이 지도 $\bar{D}_k$를 출력합니다. 전역 번들 조정 (GBA)은 (기본 DROID-SLAM에서처럼 끝에서만이 아니라) 30개 키프레임마다 온라인으로 실행되며, disparity/이동은 수치적 안정성을 위해 평균 disparity $\bar{d}$로 정규화됩니다.
- **백엔드 (매핑)**: 키프레임 깊이는 포인트로 역투영된 후 MVS 기하학적/광도적 일관성으로 필터링되고, 공분산 $\Sigma_i$, 평균 $\mu_i$, 불투명도 $o_i$, 색상 $c_i$, 학습 가능한 형태 $\beta_i$를 가진 일반화된 지수 스플래팅 (generalized-exponential-splatting, GES) 프리미티브로 변환됩니다. 새 가우시안은 렌더링과 실제 이미지 간 PSNR이 임계값보다 낮은, 미탐색 영역에만 생성됩니다. 렌더링은 앞에서 뒤로의 알파 블렌딩을 사용합니다:

$$\hat{c}(p)=\sum_{i\in N} c_i\,\alpha_i \prod_{j=1}^{i-1}(1-\alpha_j), \qquad \alpha_i = o_i\, g_i(x)$$

깊이 $\hat{D}(p)$도 가우시안별 깊이 $z_i$를 사용해 동일한 방식으로 렌더링됩니다.
- **GBA 이후의 지도 변형**: GBA가 포즈를 $T_k \to T_k'$로 갱신할 때, 지도는 $T_k^{rel}=T_k' T_k^{-1}$에 의해 *강체적으로* 변형됩니다: 평균 $\mu_i' = T_k^{rel}\mu_i$, 공분산 $\Sigma_i' = R_k^{rel}\,\Sigma_i\,(R_k^{rel})^{\top}$ — MVS 깊이가 충분히 정확하기 때문에 (Splat-SLAM에서처럼) 비강체 변형이 필요하지 않습니다.
- **새로운 뷰 선택 (NVS)**: 가우시안별 불확실성은 형태와 최적화 상태를 결합합니다. 가장 큰 공분산 고유값 $\lambda_{n,i}=\max(s_{n,i}^{2})$ (스케일 $s_{n,i}$로부터)는 과대 가우시안에 의한 과잉 재구성을 표시하며, 위치 그래디언트 크기 $A_{n,i}=\lVert d\mu_{n,i}\rVert$는 여전히 수렴 중인 영역을 표시합니다:

$$U_{n,i}=\alpha_1 \lambda_{n,i}+\alpha_2 A_{n,i}, \qquad \alpha_1=0.7,\ \alpha_2=0.3$$

비키프레임 $I_n$의 정보 이득은 역제곱 깊이 가중치를 적용한 보이는 가우시안 불확실성의 합입니다, $U_n=\sum_i U_{n,i}/z_{n,i}^{2}$. (최근 30개 키프레임 범위 내의 비키프레임과 이전에서 넘어온 20개 고이득 프레임을 합친) 후보들은 $U_n$으로 정렬되고, 비최대 억제 (non-maximum suppression)로 거의 중복되는 시점을 제거한 후, 상위 k개가 가장 최근 30개 키프레임과 함께 학습 세트에 합류합니다. FisherRF나 GS-Planner와 달리, 이는 비용이 큰 렌더링 이미지 비교가 필요 없습니다.
- **학습 손실**: 키프레임은 $L_{\mathrm{KF}}=\lambda_{L1}L_1+\lambda_{\mathrm{SSIM}}L_{\mathrm{SSIM}}+\lambda_{\mathrm{depth}}L_{\mathrm{depth}}+\lambda_{\mathrm{smooth}}L_{\mathrm{smooth}}$ (가중치 0.95/0.2/0.2/0.1)를 사용하며 $L_{\mathrm{depth}}$는 MVS 깊이에 대한 것입니다. 비키프레임은 깊이가 없으므로 $L_{\mathrm{NKF}}=\lambda_{L1}L_1+\lambda_{\mathrm{SSIM}}L_{\mathrm{SSIM}}+\lambda_{\mathrm{smooth}}L_{\mathrm{smooth}}$입니다.

## 실험 결과

모든 실험은 RTX 4090에서 진행 (Replica에서 평균 약 9.18 FPS, GPU 약 17.2 GiB):

- **Replica** (8개 장면, 키프레임 평가): 평균 PSNR **39.28** / SSIM 0.98 / LPIPS 0.03, 대 Splat-SLAM 36.45/0.97/0.06, MVS-GS 35.58/0.96/0.08, Photo-SLAM 33.29, MonoGS 25.88.
- **TUM-RGBD**: 평균 PSNR **27.72** / SSIM 0.90 / LPIPS 0.10로 Splat-SLAM (27.06/0.86/0.15)을 근소하게 앞섬. MonoGS 18.82.
- **ScanNet**: 평균 PSNR **29.79** 대 Splat-SLAM 29.48, GLORIE-SLAM 22.45.
- **야외** (Aerial, Tanks&Temples): 깊이 예측 기반 방법인 Splat-SLAM과 GLORIE-SLAM은 *3DGS 모델 생성에 실패*했습니다. Tanks&Temples에서는 Photo-SLAM과 MonoGS까지도 실패한 반면, 제안된 방법은 거의 사진 같은 결과를 렌더링했습니다.
- **어블레이션** (Replica Office0): 기준선 MVS-GS 40.92 PSNR → +온라인 GBA 42.37 → +disparity 초기화 42.71 → +매끄러움 손실 42.73 (깊이 L1 0.044→0.038) → **+NVS 43.93** PSNR, 깊이 L1 0.034, 가우시안 수는 *더 적음* (1078K 대 1377K, 지도가 약 60 MB 더 작음).

## SLAM에서의 의미

3DGS 기반 SLAM 프레임워크에 비키프레임 선택을 도입한 최초의 연구입니다: 수동적인 카메라 스트림에서도 재구성 완성도를 *능동적 선택* 문제로 취급하여, 다음-최선-뷰 (next-best-view) 사고를 온라인 매핑에 도입합니다. 또한 (단안 깊이 예측이 아니라) 다중 뷰 스테레오 깊이가 렌더링 기반 SLAM이 야외 장면 — 키프레임 전용 파이프라인이 가장 크게 성능 저하를 겪는 환경 — 에서 살아남게 하는 요소라는 주장을 강화합니다.

## 관련 문서

- [DROID-SLAM](droid-slam.md)
- [MonoGS](monogs.md)
- [Photo-SLAM](photo-slam.md)
- [SplaTAM](splatam.md)
- [ActiveSplat](activesplat.md)
