# BARF

> Lin 2021 · [논문](https://arxiv.org/abs/2104.06405)

**한 줄 요약** — Bundle-Adjusting NeRF: 거친-세밀(coarse-to-fine) 위치 인코딩 스케줄을 사용하여, 불완전하거나 알 수 없는 초기화로부터 NeRF 장면 표현과 카메라 포즈를 공동으로 최적화한다 — NeRF 기반 SLAM을 가능하게 하는 핵심 통찰이다.

## 문제

NeRF는 사실적인 새로운 뷰를 합성하지만, 학습 이미지마다 정확한 카메라 포즈(대개 SfM 패키지로 사전 계산됨)를 필수 전제조건으로 요구한다. 포즈가 노이즈가 있거나 알 수 없을 때, NeRF에서의 단순한 포즈 최적화는 "초기화에 민감하며" "3D 장면 표현의 준최적 해로 이어질 수 있다". 재구성과 등록(registration)은 닭과 달걀 문제를 이룬다: 3D 구조를 복원하려면 알려진 포즈가 필요하고, 위치 추정을 하려면 재구성으로부터 얻은 신뢰할 수 있는 대응점이 필요하다. BARF는 불완전한(혹은 심지어 알 수 없는) 카메라 포즈로부터 NeRF를 학습하는 문제 — 즉 신경 3D 표현 학습과 카메라 프레임 등록의 결합 문제 — 를 뷰 합성을 대리 목적함수로 삼는 일종의 광도 번들 조정으로 다룬다.

## 방법 및 아키텍처

BARF는 먼저 2D 이미지 정렬을 분석한다: $\min_{\mathbf{p}}\sum_{\mathbf{x}}\|\mathcal{I}_1(\mathcal{W}(\mathbf{x};\mathbf{p}))-\mathcal{I}_2(\mathbf{x})\|_2^2$에 대한 경사 하강으로 이미지를 등록하는 것은, "최급강하 이미지"(warp를 통해 이미지 기울기를 연쇄한 야코비안)가 픽셀별로 *일관된(coherent)* 업데이트를 줄 때만 작동한다 — 이것이 고전적인 Lucas-Kanade 정렬이 수렴 영역(basin of attraction)을 넓히기 위해 이미지를 거친 단계부터 세밀한 단계로 블러링하는 이유다. 동일한 구조가 NeRF를 이용한 3D에서도 나타난다. 픽셀의 색상은 MLP $f$를 통해 체적 렌더링된다:

$$\hat{\mathcal{I}}(\mathbf{u})=\int_{z_{\text{near}}}^{z_{\text{far}}}T(\mathbf{u},z)\,\sigma(z\bar{\mathbf{u}})\,\mathbf{c}(z\bar{\mathbf{u}})\,\mathrm{d}z\;,\qquad T(\mathbf{u},z)=\exp\Big(-\int_{z_{\text{near}}}^{z}\sigma(z'\bar{\mathbf{u}})\,\mathrm{d}z'\Big)$$

그리고 BARF는 $M$개의 카메라 포즈 $\mathbf{p}_i\in\mathbb{R}^6$(리 대수 $\mathfrak{se}(3)$로 파라미터화됨)와 NeRF 가중치 $\boldsymbol{\Theta}$를, 합성 기반의 목적함수

$$\min_{\mathbf{p}_1,\dots,\mathbf{p}_M,\boldsymbol{\Theta}}\;\sum_{i=1}^{M}\sum_{\mathbf{u}}\big\|\hat{\mathcal{I}}(\mathbf{u};\mathbf{p}_i,\boldsymbol{\Theta})-\mathcal{I}_i(\mathbf{u})\big\|_2^2\;.$$

에 대해 공동으로 최적화한다. 장애물은 위치 인코딩이다. NeRF는 $\gamma_k(\mathbf{x})=\big[\cos(2^k\pi\mathbf{x}),\sin(2^k\pi\mathbf{x})\big]$로 입력을 리프팅하는데, 그 야코비안

$$\frac{\partial\gamma_k(\mathbf{x})}{\partial\mathbf{x}}=2^k\pi\cdot\big[-\sin(2^k\pi\mathbf{x}),\cos(2^k\pi\mathbf{x})\big]$$

은 기울기를 $2^k\pi$만큼 증폭시키면서 동시에 같은 주파수로 방향을 뒤집기 때문에, 샘플링된 3D 점으로부터의 포즈 기울기는 "서로 비일관적이며 … 손쉽게 서로 상쇄될 수 있다". BARF의 해결책은 동적 저역 통과 필터다: $k$번째 대역을 $\gamma_k(\mathbf{x};\alpha)=w_k(\alpha)\cdot\big[\cos(2^k\pi\mathbf{x}),\sin(2^k\pi\mathbf{x})\big]$로 가중하며,

$$w_k(\alpha)=\begin{cases}0 & \text{if } \alpha<k\\[2pt] \dfrac{1-\cos((\alpha-k)\pi)}{2} & \text{if } 0\leq\alpha-k<1\\[2pt] 1 & \text{if } \alpha-k\geq 1\end{cases}$$

여기서 $\alpha\in[0,L]$는 최적화 진행에 따라 점진적으로 증가한다: 원시 3D 입력($\alpha=0$, 매끄러운 손실 지형, 포즈가 자유롭게 이동)에서 완전 인코딩($\alpha=L$, 장면이 완전한 디테일까지 선명해짐)까지. NeRF 실험에서 $\alpha$는 전체 200K 반복 중 20K부터 100K까지 선형적으로 증가하며, $L=10$개의 주파수 대역, 포즈와 네트워크 양쪽 모두에 대해 Adam을 사용한다. BARF는 배치 방식의 공동 최적화이며 — 실시간이나 순차적이지 않고, 내부 파라미터는 알려져 있다고 가정한다 — 그러나 이것이 정확히 NeRF 기반 SLAM 시스템이 필요로 하는 추적(tracking) 메커니즘이다.

## 실험 결과

- **2D 평면 정렬** ($\mathfrak{sl}(3)$에서의 호모그래피 워프): BARF는 워프 오차 0.0096, 패치 PSNR 35.30을 달성하며, 이는 전체 위치 인코딩 사용 시 0.2949 / 23.41, 인코딩 없이 사용 시 0.0641 / 24.72와 대비된다.
- **합성 NeRF 장면** (8개 장면, 포즈는 $\delta\mathbf{p}\sim\mathcal{N}(\mathbf{0},0.15\mathbf{I})$로 교란됨 ≈ 회전 14.9°, 병진 0.26): BARF는 거의 완벽한 등록을 달성한다 — 예를 들어 Chair 장면에서 회전 오차 0.096° / 병진 오차 0.428에 PSNR 31.16을 기록하며, 이는 실측 포즈로 학습된 참조 NeRF의 PSNR 31.91에 가깝다; 단순한 전체 인코딩은 7.19°, PSNR 19.02에 그친다.
- **LLFF 실세계 정면 촬영 장면, 모든 포즈를 항등원으로 초기화**: 평균 회전 오차 0.573°, 병진 오차 0.331 — 단순 위치 인코딩의 84.509° / 31.598과 대비된다; 평균 PSNR은 23.97로, 단순 방식의 11.03 및 SfM 포즈로 학습된 참조 NeRF의 22.56과 대비된다.

결론에서는 그 함의를 명시적으로 짚는다: BARF는 "뷰 합성을 대리 목적함수로 사용하는 SfM/SLAM 시스템 및 자기지도 밀집 3D 재구성 프레임워크를 위한 시각적 위치 추정을 재고할 흥미로운 길을 열어준다."

## SLAM에서의 의미

원래 NeRF는 (COLMAP으로부터) 카메라 포즈를 *소비*하는 쪽이었다; BARF는 복사장(radiance field) 자체를 통해 포즈를 *추정*할 수 있음을 보였고, 이는 신경 장면 표현을 이용한 위치 추정으로 향하는 길을 열었다 — 저자들이 SLAM을 위해 명시적으로 지적한 방향이다. 렌더링 손실을 최소화하여 추적하는 모든 신경 암시적(neural-implicit) SLAM 시스템은 BARF의 통찰을 온라인 루프 안에서 실행하고 있는 것이다; 원시 위치 인코딩이 왜 포즈 등록을 망가뜨리는지(그리고 거친-세밀 방식이 어떻게 이를 해결하는지) 이해하면 그 분야의 많은 설계 선택을 설명할 수 있다.

## 관련 문서

- [NeRF](nerf.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [GO-SLAM](go-slam.md)
