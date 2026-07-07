# SplaTAM

> Keetha 2024 · [논문](https://arxiv.org/abs/2312.02126)

**한 줄 요약** — 3D Gaussian Splatting을 지도로 사용한 최초의 SLAM 시스템 중 하나(GS-SLAM, MonoGS와 동시대): 미분 가능한 래스터라이저를 통한 RGB-D splat-track-map 루프로, 렌더링된 실루엣이 포즈 최적화와 가우시안 밀도 증가를 함께 안내한다.

## 문제

밀집 SLAM 방법들은 "장면을 표현하는 비체적(non-volumetric) 또는 암시적인 방식에 자주 발이 묶여" 있었다: 수작업으로 만든 명시적 지도(포인트, 서펠, SDF)는 풍부한 3D 특징이 있을 때만 신뢰성 있게 추적되고 관측된 표면만을 설명하며, 암시적 방사장(radiance field) SLAM(NICE-SLAM, Point-SLAM)은 값비싼 광선별 체적 샘플링이 필요해 손실을 희소한 픽셀 집합에 대해서만 계산하도록 만든다. 3D Gaussian Splatting은 최대 400 FPS로 래스터화하지만 늘 알려진 포즈를 필요로 했다. SplaTAM(CVPR 2024, CMU/MIT)은 "3D 가우시안으로 장면을 표현하는 것이, 포즈가 없는 단일 단안 RGB-D 카메라만으로 밀집 SLAM을 처음으로 가능하게 함"을 보여준다.

## 방법 및 아키텍처

**단순화된 가우시안 지도.** 장면은 *등방성(isotropic)*이고 시점에 무관한 가우시안들의 집합이며 — 각각 8개의 매개변수(RGB 색상 $\mathbf{c}$, 중심 $\boldsymbol{\mu}\in\mathbb{R}^3$, 반지름 $r$, 불투명도 $o$)를 가진다 — 각각은 $f(\mathbf{x}) = o\exp\bigl(-\tfrac{\|\mathbf{x}-\boldsymbol{\mu}\|^{2}}{2r^{2}}\bigr)$로 공간에 영향을 준다. 색상, 깊이, 그리고 *실루엣*은 모두 가우시안을 앞에서 뒤로 정렬한 뒤 2D 스플랫을 알파 합성하여 렌더링된다:

$$C(\mathbf{p})=\sum_{i=1}^{n}\mathbf{c}_{i}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr), \quad D(\mathbf{p})=\sum_{i=1}^{n}d_{i}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr), \quad S(\mathbf{p})=\sum_{i=1}^{n}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr),$$

여기서 $f_i(\mathbf{p})$는 투영된 중심 $\boldsymbol{\mu}^{2D} = K\,E_{t}\boldsymbol{\mu}/d$와 반지름 $r^{2D} = fr/d$를 사용하며 $d=(E_{t}\boldsymbol{\mu})_{z}$이다. 실루엣 $S$는 각 픽셀이 얼마나 많은 지도 근거를 가지는지 — 즉 지도의 인식적 불확실성을 나타낸다.

각 프레임은 세 단계로 진행된다:

1. **카메라 추적.** 새로운 포즈는 등속도 전파 $E_{t+1}=E_{t}+(E_{t}-E_{t\text{-}1})$로 초기화된 뒤, 가우시안을 고정한 채 래스터라이저를 통한 경사 하강법으로 정제되며, 잘 매핑된 픽셀만 사용한다:
$$L_{t}=\sum_{\mathbf{p}}\Bigl(S(\mathbf{p})>0.99\Bigr)\Bigl(\mathrm{L}_{1}\bigl(D(\mathbf{p})\bigr)+0.5\,\mathrm{L}_{1}\bigl(C(\mathbf{p})\bigr)\Bigr).$$
2. **가우시안 밀도 증가.** 마스크가 지도가 아직 설명하지 못하는 픽셀을 고른다 — 실루엣이 낮은 곳, 또는 실제 기하가 렌더링된 기하보다 앞에 있는 곳이다:
$$M(\mathbf{p})=\Bigl(S(\mathbf{p})<0.5\Bigr)+\Bigl(D_{\mathrm{GT}}(\mathbf{p})<D(\mathbf{p})\Bigr)\Bigl(\mathrm{L}_{1}\bigl(D(\mathbf{p})\bigr)>50\,\mathrm{MDE}\Bigr),$$
   여기서 MDE는 중앙값 깊이 오차이다. 마스크된 각 픽셀은 해당 픽셀의 색상, 역투영된 깊이에 위치한 중심, 불투명도 0.5, 1픽셀 반지름 $r = D_{\mathrm{GT}}/f$를 갖는 가우시안을 하나씩 생성한다.
3. **지도 갱신.** 포즈를 고정한 채, 가우시안 매개변수는 $k$개의 키프레임(현재 프레임, 최신 키프레임, 그리고 현재 깊이 포인트 클라우드와의 프러스텀 겹침이 가장 큰 $k-2$개의 키프레임)에 대해 기존 지도로부터 웜스타트되어 최적화되며, 실루엣 마스크가 없는 색상+깊이 손실에 SSIM 항을 더해 사용한다; 거의 투명하거나 과도하게 큰 가우시안은 걸러진다.

## 실험 결과

- **Replica**(ATE RMSE 평균, 8개 장면): 0.36 cm — 이전 SOTA인 Point-SLAM(0.52)보다 30% 이상 낮고, ESLAM(0.63), NICE-SLAM(1.06), Vox-Fusion(3.09)보다도 훨씬 낮다.
- **TUM-RGBD**: 평균 5.48 cm로, Point-SLAM의 8.92를 거의 40% 절감한다(NICE-SLAM 15.87); 특징점 기반 ORB-SLAM2(1.98)는 희소 방법들 중에서는 여전히 우세하다. 품질이 비슷하게 낮은 원본 ScanNet에서는 11.88 cm로 Point-SLAM(12.19), NICE-SLAM(10.70)과 비슷하다.
- **ScanNet++**(고품질 촬영이지만 프레임 간 움직임이 매우 큼, 단계당 Replica의 약 30배): SplaTAM은 두 시퀀스 모두에서 평균 오차 1.2 cm로 추적하는 반면, Point-SLAM과 RGB-D ORB-SLAM3는 완전히 실패한다; 새로운 시점 합성은 24.41 dB PSNR(학습 뷰에서는 27.98)에 도달하며 새로운 시점의 깊이 L1 오차는 약 2 cm이다.
- **렌더링**: Replica 학습 뷰 PSNR 34.11 dB — NICE-SLAM(24.42)과 Vox-Fusion(24.41)보다 약 10 dB 높고, (샘플 배치에 정답 깊이를 사용하는) Point-SLAM(35.17)과 비슷한 수준이다; 지도는 876x584에서 400 FPS로 렌더링된다.
- **런타임**(RTX 3080 Ti, Replica R0): 추적 25 ms, 매핑 반복당 24 ms이며 매 반복마다 약 120만 픽셀의 전체 이미지를 렌더링한다 — 반면 베이스라인들은 200–1000개의 샘플링된 픽셀만 최적화한다; SplaTAM-S(반복 수를 줄인 버전)는 5배 빠르게 동작하며(프레임당 0.19 s + 0.33 s) ATE 0.39 cm를 기록한다.
- **어블레이션**(Room 0): 실루엣 마스크를 제거하면 추적이 붕괴한다(ATE 115.8 cm); 임계값을 0.5 대신 0.99로 하면 오차가 5배 낮아진다(1.30 대비 0.27); 속도 전파가 없으면 10배 이상 나빠진다; 깊이 전용 손실은 완전히 실패한다(86.03 cm). 명시된 한계: 모션 블러, 큰 깊이 노이즈, 격렬한 회전에 대한 민감성.

## SLAM에서의 의미

SplaTAM은 명시적이고 미분 가능하며 체적적인 지도가 추적, 매핑, 뷰 합성 모두에서 인터랙티브한 속도로 NeRF 방식 SLAM을 능가할 수 있음을 보여주며, 3DGS 기반 SLAM 연구 흐름을 촉발시켰다 — 그리고 렌더링이 광선 행진(ray marching)이 아니라 래스터화가 되면 픽셀별 밀집 손실이 충분히 저렴해진다는 점도 보여주었다. 그 실루엣 마스크는 밀도 증가와 불확실성 게이팅의 표준 도구가 되었고, 미분 가능한 래스터라이저를 통한 추적-후-매핑 교대 루프는 Photo-SLAM, RTG-SLAM, GS-ICP SLAM을 비롯한 많은 후속 연구가 따르는 템플릿이다.

## 관련 문서

- [MonoGS](monogs.md)
- [NICE-SLAM](nice-slam.md)
- [Point-SLAM](point-slam.md)
- [Photo-SLAM](photo-slam.md)
- [RTG-SLAM](rtg-slam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
