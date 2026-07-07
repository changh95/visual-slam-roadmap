# SEA-RAFT

> Wang 2024 · [논문](https://arxiv.org/abs/2405.14793)

**한 줄 요약** — Simple, Efficient, Accurate RAFT: Laplace 혼합 손실, 초기 flow의 직접 회귀, TartanAir에서의 강체 flow 사전 학습, 그리고 아키텍처적 단순화를 통해 RAFT에 최고의 정확도-효율성 파레토 프론티어를 제공하며 — Spring에서 최고 성능을 달성하면서도 비슷한 방법들보다 최소 2.3배 빠르게 실행됩니다.

## 문제

RAFT 이후의 발전은 대부분 더 무거운 아키텍처 — Transformer cost-volume 인코더, 더 큰 backbone — 에서 나왔으며, flow를 실시간 시스템에서 사용 가능하게 만드는 속도를 대가로 치렀습니다. 한편 RAFT 자체의 방법론에도 약점이 있습니다: 표준 $L_1$ endpoint 손실은 심한 가림 아래의 모호하고 예측 불가능한 픽셀에 지배됩니다; 0으로 초기화된 flow는 많은 정제 반복(학습 시 12회, 추론 시 최대 32회)을 강제합니다; 그리고 합성 FlyingChairs/Things 데이터는 사실성과 일반화를 제한합니다. SEA-RAFT는 손실, 초기화, 데이터의 변화가 원래 아키텍처를 얼마나 밀어붙일 수 있는지를 묻습니다.

## 방법 및 아키텍처

SEA-RAFT는 RAFT의 골격을 유지합니다. 특징 인코더 $F$와 컨텍스트 인코더 $C$(RAFT의 커스텀 인코더를 대체하는, 잘라낸(truncated) ImageNet 사전 학습 ResNet)가 $I_1, I_2 \in \mathbb{R}^{H\times W\times 3}$를 $1/8$ 해상도 특징으로 매핑합니다; 다중 스케일 4D correlation volume이 다음과 같이 구축됩니다.

$$V_k = F(I_1) \circ \texttt{AvgPool}(F(I_2), 2^k)^{\top} \in \mathbb{R}^{h\times w\times\frac{h}{2^k}\times\frac{w}{2^k}}, \qquad k=4,\ (h,w)=\tfrac{1}{8}(H,W)$$

각 반복은 반경 $r{=}4$로 현재 flow $\mu$ 주변의 모션 특징을 조회합니다: $M = \texttt{MotionEncoder}(\texttt{LookUp}(\{V_k\},\mu,r))$, 그리고 순환 유닛(RAFT의 ConvGRU를 대체하는 두 개의 ConvNeXt 블록)이 은닉 상태를 업데이트하고 잔차를 회귀합니다: $h' = \texttt{RNN}(h, M, C(I_1))$, $\Delta\mu = \texttt{FlowHead}(h')$. 세 가지 주요 변경 사항:

- **Laplace 혼합(Mixture-of-Laplace, MoL) 손실**: $L_1$ 대신, 네트워크는 2성분 Laplace 혼합 분포의 픽셀별 파라미터를 예측합니다 — 하나는 일반 픽셀을 위한 성분, 다른 하나는 모호한(가려진) 픽셀을 위한 성분입니다:

$$MixLap(x;\alpha,\beta_1,\beta_2,\mu) = \alpha\cdot\frac{e^{-\frac{|x-\mu|}{e^{\beta_1}}}}{2e^{\beta_1}} + (1-\alpha)\cdot\frac{e^{-\frac{|x-\mu|}{e^{\beta_2}}}}{2e^{\beta_2}}$$

  $\beta_1{=}0$을 고정하여 첫 번째 성분이 $L_1$/endpoint 오차 지표와 일치하도록 하고, 스케일은 안정성을 위해 로그 공간에서 회귀되며($\beta_2 \in [0,10]$), 손실 $\mathcal{L}_{MoL}$은 픽셀과 두 flow 축 모두에 대해 평균낸 실측값의 negative log-likelihood이며, 통상적인 지수 가중치를 사용해 반복마다 적용됩니다: $\mathcal{L}_{all}=\sum_{i=1}^{N}\gamma^{N-i}\mathcal{L}_{MoL}^{i}$. 혼합 가중치 $\alpha$는 불확실성 출력의 역할도 겸합니다.
- **초기 flow의 직접 회귀**: 컨텍스트 인코더는 두 스택된 프레임을 입력받아, 0에서 시작하는 대신 초기 flow(그리고 그것의 MoL 파라미터)를 예측합니다 — 반복 횟수를 학습 시 $N{=}4$로, 추론 시 최대 12회로 줄입니다.
- **강체 flow 사전 학습**: TartanAir에서 300k 스텝 — 이 데이터셋의 flow는 순전히 정적인 장면에서의 카메라 모션에서 나오며, 모션 다양성은 제한적이지만 사실성은 높아 일반화를 뚜렷하게 향상시킵니다.

변형들: SEA-RAFT(S)는 ResNet-18의 처음 6개 레이어를 사용하고, (M)은 ResNet-34의 처음 13개를 사용합니다; (L)은 (M)을 추론 반복 12회로 실행한 것입니다.

## 실험 결과

- **Spring test(파인튜닝됨)**: SEA-RAFT(M)은 1px-outlier율 3.686과 EPE 0.363에 도달합니다 — 1위를 차지하며, 이전 방법들보다 EPE를 최소 22.9%, 1px 오차를 17.8% 줄입니다; SEA-RAFT(S)조차 다른 모든 방법을 능가합니다(20.0% / 12.8% 감소). Spring train에서 zero-shot으로는, 추가 데이터 없는 방법들 중 최고이며 MS-RAFT+에 근접하면서도 11배 더 작고 24배 더 빠릅니다.
- **효율성**: 비슷한 정확도의 방법들보다 최소 2.3배 빠릅니다; 가장 작은 모델은 RTX 3090에서 1080p를 21fps로 실행합니다(원본 RAFT보다 3배 빠름); SEA-RAFT(M)은 540x960에서 70.96ms / 486.9 GMAC이 걸리는 반면 RAFT는 140.7ms / 938.2 GMAC입니다.
- **KITTI train에서의 zero-shot C+T**: 발표된 것 중 최고의 일반화 성능 — Fl-epe 4.09에서 3.62로, Fl-all 13.7에서 12.9로. Sintel train에서는 clean에서 경쟁력이 있지만 final에서는 더 약합니다(4.11); 실제 데이터 쌍 약 1.2k개(KITTI+HD1K)만 추가해도 그 격차가 줄어듭니다(2.79).
- **Sintel/KITTI test**: SEA-RAFT(L)은 clean 1.31 / final 2.60, Fl-all 4.30을 얻습니다 — RAFT 대비 19.9% / 4.2% / 15.7% 개선이며, 비슷한 정확도의 방법들보다 최소 1.8배(Sintel), 4.6배(KITTI) 느립니다.

## SLAM에서의 의미

SEA-RAFT는 SLAM 프론트엔드가 실시간 속도로 밀집 flow를 필요로 할 때의 실용적인 선택입니다: Transformer급 지연 없이 RAFT급 기계 장치를 제공합니다. 두 가지 요소가 SLAM의 요구와 직접 맞아떨어집니다 — 강체 모션 사전 학습은 SLAM이 가정하는 대부분 강체인 세계와 일치하고, Laplace 혼합 파라미터는 확률적 추정에서 측정 공분산에 자연스럽게 대응되는 픽셀별 불확실성을 제공합니다. 또한 손실, 초기화, 데이터 설계가 아키텍처 성장을 능가할 수 있다는 사례 연구이기도 하며, 이는 어떤 학습 기반 SLAM 구성 요소에도 적용되는 교훈입니다.

## 관련 문서

- [RAFT](raft.md) — 기반 아키텍처 및 학습 목표
- [FlowFormer](flowformer.md) — 더 무거운 Transformer 대안
- [TartanVO](tartanvo.md) — TartanAir의 강체 장면 데이터로 구축된 학습 기반 VO
- [DPVO](dpvo.md) — RAFT 스타일 업데이트를 사용하는 sparse 학습 기반 odometry
- [DROID-SLAM](droid-slam.md) — 완전한 SLAM 시스템 안의 RAFT 기계 장치
