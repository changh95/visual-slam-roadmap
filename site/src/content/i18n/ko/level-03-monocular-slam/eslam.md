# ESLAM

> Johari 2023 · [논문](https://arxiv.org/abs/2211.11704)

**한 줄 요약** — NICE-SLAM의 3D 특징 복셀 그리드를 삼중 평면(tri-plane) 표현으로 대체하여, 신경 SLAM의 메모리 증가를 $O(L^3)$에서 $O(L^2)$로 줄이면서도 깨끗한 표면을 위해 signed distance field를 디코딩합니다.

## 문제

그리드 기반 신경 SLAM은 복셀당 특징 벡터를 저장하므로 모델이 장면 한 변의 길이에 대해 세제곱으로 커집니다 — NICE-SLAM의 계층적 그리드는 방 규모에서도 상당한 GPU 메모리를 소비하여 해상도와 장면 크기를 제한합니다. ESLAM("Efficient Dense SLAM System Based on Hybrid Representation of Signed Distance Fields")은 포즈를 알 수 없는 순차적인 RGB-D 프레임을 입력받으며, 볼류메트릭 특징 필드를 재구성 품질을 잃지 않으면서 근본적으로 더 저렴한 형태로 분해할 수 있는지, 그리고 디코딩되는 값으로 TSDF가 점유(occupancy)보다 더 나은지를 묻습니다.

## 방법 및 아키텍처

**삼중 평면 표현**: 특징들은 축 정렬된 서로 수직인 2D 평면들에 두 가지 스케일(조밀/정밀)로 위치하며, 기하와 색상(appearance)에 대해 *별도의* 평면 집합을 사용합니다 — 둘을 분리하면 "색상이 더 빈번하게 변동하기 때문에 기하 재구성에 대한 망각(forgetting) 문제를 완화합니다". 쿼리 점 $p$는 각 평면에 투영되어 양선형 보간되며, 스케일별 특징은 합산되고 스케일들은 이어붙여집니다.

$$f^{c}_{g}(p)=F^{c}_{xy}(p)+F^{c}_{xz}(p)+F^{c}_{yz}(p),\qquad \boldsymbol{f_g}(p)=[f^{c}_{g}(p);\,f^{f}_{g}(p)],$$

(색상 평면으로부터의 $\boldsymbol{f_a}(p)$도 마찬가지 방식입니다). 얕은 2계층 MLP가 $\boldsymbol{\phi_g}(p)=h_g(\boldsymbol{f_g}(p))$를 정규화된 TSDF(표면에서 0, 절단 거리 $T$에서 절대값 1)로, $\boldsymbol{\phi_a}(p)=h_a(\boldsymbol{f_a}(p))$를 원시 색상으로 디코딩합니다. 모델 크기는 장면 부피가 아니라 장면 면적에 따라 커집니다.

**SDF 기반 렌더링**: 레이당 $N=N_{strat}+N_{imp}$개의 샘플(층화 샘플 + 표면 근처/중요도 샘플)에 대해, TSDF는 학습 가능한 선명도 파라미터 $\beta$를 사용해 부피 밀도로 변환됩니다.

$$\boldsymbol{\sigma}(p_n)=\beta\cdot\mathrm{Sigmoid}\big(-\beta\cdot\boldsymbol{\phi_g}(p_n)\big),$$

이후 표준 가중치 $w_n=\exp\big(-\sum_{k=1}^{n-1}\boldsymbol{\sigma}(p_k)\big)\big(1-\exp(-\boldsymbol{\sigma}(p_n))\big)$가 색상 $\boldsymbol{\hat{c}}=\sum_n w_n\boldsymbol{\phi_a}(p_n)$과 깊이 $\boldsymbol{\hat{d}}=\sum_n w_n z_n$을 렌더링합니다.

**손실 함수**: TSDF는 렌더링 손실과 함께 빠른 점 단위 지도 학습(supervision)을 허용합니다 — 표면 이전 지점에서 $\boldsymbol{\phi_g}=1$을 유도하는 자유 공간 손실, 그리고 절단 영역 내부에서 깊이 측정값을 근사 SDF로 사용하는 signed-distance 손실입니다.

$$\mathcal{L}_{T}=\frac{1}{|R|}\sum_{r\in R}\frac{1}{|P_r^T|}\sum_{p\in P_r^T}\big(z(p)+\boldsymbol{\phi_g}(p)\cdot T-D(r)\big)^2,$$

이는 절단 영역의 중앙부와 말단부로 나뉘어 서로 다른 가중치를 갖습니다(더 작은 유효 절단값은 매핑을 정밀하게 만들고, 추적은 전체 밴드를 사용합니다). 여기에 $\ell_2$ 깊이 및 색상 렌더링 손실이 추가됩니다. 동일한 전역 손실(가중치만 다름)이 매핑과 추적 모두를 구동합니다.

**SLAM 루프**: 사전 학습이나 단계적 최적화가 없습니다 — 평면과 디코더는 첫 프레임에서 무작위로 초기화됩니다. 매핑은 $k$개 프레임마다 $W$개 프레임(현재 + 이전 두 키프레임 + $W-3$개의 무작위 키프레임)에 대해 갱신되며, 평면, 디코더, $W$개의 포즈를 함께 최적화합니다. 추적은 매 프레임마다 병진 + 쿼터니언에 대해 Adam으로 실행되며, 깊이가 없는 레이와 이상값(렌더링된 깊이 오차가 배치 중앙값의 10배 초과)은 제외됩니다.

## 실험 결과

- **Replica(8개 장면 평균, 5회 실행에 대한 ±)**: Depth L1 1.18 cm, 정확도 0.97 cm, 완전성 1.05 cm, 완전성 비율 98.60%, ATE RMSE 0.63 cm — NICE-SLAM(3.29 / 1.66 / 1.63 / 96.74% / 2.05 cm), iMAP*(7.16 / 5.83 / 67.17% / 3.42 cm)와 대비됩니다. 이는 재구성 및 위치추정을 "50% 이상" 개선했다는 논문 초록의 주장을 뒷받침합니다.
- **ScanNet**: 평균 ATE RMSE 7.4 cm로, NICE-SLAM 10.7, iMAP* 26.6과 대비됩니다.
- **TUM RGB-D**: fr1/desk, fr2/xyz, fr3/office에서 2.47 / 1.11 / 2.42 cm로, NICE-SLAM의 2.85 / 2.39 / 3.02와 대비됩니다.
- **속도 및 메모리**: Replica에서 프레임당 처리 시간 0.18초로 NICE-SLAM의 2.10초보다 최대 약 10배 빠릅니다(ScanNet에서는 0.55초 대 3.35초). 파라미터 수는 6.79M으로 NICE-SLAM의 12.18M보다 적으며, 장면 한 변의 길이 $L$에 대한 증가율도 $O(L^3)$이 아닌 $O(L^2)$입니다.

## SLAM에서의 의미

ESLAM은 (Co-SLAM의 해시 그리드, Point-SLAM의 신경 포인트와 함께) NICE-SLAM 이후 신경 SLAM 연구를 지배했던 질문 — 지도 표현을 어떻게 효율적으로 만들 것인가 — 에 대한 세 가지 정형적 답 중 하나입니다. 생성적 3D 모델링에서 빌려온 삼중 평면 아이디어는 이후의 메모리 효율적인 밀집 SLAM 설계에 영향을 미쳤으며, 점 단위 손실을 적용한 TSDF 방식은 디코딩되는 값의 선택(SDF 대 점유)이 인코딩 방식만큼이나 중요하다는 것을 보여주었습니다.

## 관련 문서

- [NICE-SLAM](nice-slam.md)
- [Co-SLAM](co-slam.md)
- [Point-SLAM](point-slam.md)
- [iMAP](imap.md)
- [NeRF](../level-05-deep-learning/nerf.md)
