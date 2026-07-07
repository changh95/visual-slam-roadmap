# KLT Tracker

**Kanade-Lucas-Tomasi (KLT) 추적기**는 매 프레임마다 디스크립터를 다시 검출하고 다시 매칭하는 대신, 작은 이미지 패치를 직접 정렬하여 프레임 간 희소 특징점을 추적합니다. 이는 Lucas-Kanade 광류 해법(Lucas & Kanade, 1981), Tomasi & Kanade의 추적 공식화(1991), Shi & Tomasi의 특징 선택 기준(1994)을 결합한 것이며 — 피라미드형(Bouguet)으로는 많은 VIO 시스템(MSCKF 구현체, VINS-Mono)의 프론트엔드이자 `cv::calcOpticalFlowPyrLK`의 근간입니다.

## Lucas-Kanade의 핵심

**밝기 불변성(brightness constancy)**을 가정합니다: 특징 주변의 패치는 프레임 사이에서 $(u, v)$만큼 이동해도 강도를 유지합니다,

$$
I(x, y, t) = I(x + u,\; y + v,\; t + 1).
$$

작은 움직임에 대해 1차 테일러 전개를 하면 **광류 제약 방정식(optical flow constraint equation)**을 얻습니다:

$$
I_x u + I_y v + I_t = 0
$$

여기서 $I_x, I_y$는 공간 이미지 기울기이고 $I_t$는 시간적 차이입니다. 미지수 두 개에 방정식 하나 — 조리개 문제(aperture problem)입니다. Lucas-Kanade는 **공간적 일관성(spatial coherence)**을 추가합니다: 특징 주변 윈도우 $W$ 안의 모든 $N$개 픽셀이 동일한 $(u, v)$를 공유한다는 것입니다. $N$개의 제약을 쌓아 최소제곱으로 풀면 $2 \times 2$ 시스템을 얻습니다

$$
A^T A \begin{bmatrix} u \\ v \end{bmatrix} = -A^T \mathbf{b},
\qquad
A^T A = \begin{bmatrix} \sum I_x^2 & \sum I_x I_y \\ \sum I_x I_y & \sum I_y^2 \end{bmatrix}
$$

여기서 $\mathbf{b}$는 시간적 기울기의 벡터입니다. 움직임이 실제로 무한소가 아니기 때문에, 이 풀이는 가우스-뉴턴 방식으로 **반복**됩니다: 현재 추정값으로 패치를 워핑하고, 잔차를 재계산하고, 증분에 대해 풀고, 업데이트가 임계값 아래로 떨어질 때까지 반복합니다.

## 추적하기 좋은 특징

행렬 $A^T A$는 정확히 Harris 코너 검출기의 **구조 텐서(structure tensor)**이며, 그 조건은 추적 가능성을 결정합니다. 고유값 $\lambda_1 \ge \lambda_2$에 대해:

- 둘 다 큰 경우 — 코너; 시스템의 조건이 잘 갖춰져 있고 전체 2D 움직임을 복원할 수 있습니다;
- $\lambda_2 \approx 0$ — 에지; 에지를 따르는 움직임은 관측 불가능합니다(조리개 문제);
- 둘 다 작은 경우 — 평평한 영역; 추적할 것이 없습니다.

Shi & Tomasi의 기준은 $\min(\lambda_1, \lambda_2) > \tau$인 특징을 선택합니다 — "추적하기 좋은 특징"은 그 구성 자체로 KLT 풀이가 안정적인 점들입니다. 이것이 `cv::goodFeaturesToTrack`입니다.

## 실제 움직임에서도 동작하게 만들기

- **피라미드형 거친-세밀(coarse-to-fine) 처리**: 원시 LK는 작은 변위만 견딜 수 있습니다(테일러 선형화 때문). 피라미드형 KLT는 이미지 피라미드의 가장 거친 레벨에서 흐름을 먼저 풀고, 레벨별로 추정값을 전파하고 정제합니다 — 각 풀이를 선형 영역 안에 유지하면서 포착 범위를 몇 픽셀에서 수십 픽셀로 확장합니다.
- **순방향-역방향 검사(forward-backward check)**: 각 점을 프레임 $t$에서 $t+1$까지 추적한 뒤, 그 결과를 다시 $t$로 추적합니다; 왕복 결과가 시작 지점 근처로 돌아오지 않으면 트랙을 버립니다. 가려짐(occlusion)과 표류하는 트랙을 걸러내는 저렴하고 효과적인 필터입니다.
- **트랙 유지와 표류(drift)**: 트랙은 가려짐과 외형 변화로 손실되므로, 추적기는 특징을 다시 채웁니다(특징이 부족한 그리드 셀에서 새로운 Shi-Tomasi/FAST 코너를 검출). 각 단계가 *이전* 프레임에 대해 정렬되기 때문에 작은 오차가 누적됩니다 — 템플릿 표류입니다. Tomasi-Kanade의 해법은 트랙의 *첫* 프레임에 대한 패치 비유사도를 (시점 변화를 흡수하기 위한 아핀 워프와 함께) 모니터링하고, 저하된 트랙을 제거하는 것입니다.

## SLAM에서의 의미

KLT는 *프레임 간* 대응을 위한 디스크립터 매칭의 저렴하고 정밀한 대안입니다: 디스크립터 계산도 없고, 최근접 이웃 검색도 없으며, 서브픽셀 정확도를 가지고, 계산량이 추적하는 점의 개수에 비례합니다 — 임베디드 하드웨어에서 실시간 시스템의 추적 스레드에 이상적입니다. 이 때문에 광류 기반 프론트엔드가 VIO를 지배하고 있으며(VINS-Mono는 KLT 코너를 추적하고 정상 동작 중에는 디스크립터를 전혀 계산하지 않습니다), SVO와 같은 반직접(semi-direct) 방법도 동일한 패치 정렬 수학 위에 구축됩니다. 그 한계 또한 프론트엔드 설계를 규정합니다: KLT는 큰 기준선, 조명 변화(밝기 불변성이 깨짐), 모션 블러 아래에서 저하되며, 잃어버린 특징을 다시 찾을 방법이 없습니다 — 이것이 바로 디스크립터 기반 매칭과 장소 인식이 존재하는 이유입니다. KLT의 정규 방정식은 또한 SLAM의 모든 스케일에서 — 완전한 광도 번들 조정에 이르기까지 — 반복적으로 나타나는 가우스-뉴턴 패턴의 가장 단순한 사례입니다.

## 실습

- [특징 추적 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_07)

## 관련 문서

- [Optical flow](optical-flow.md)
- [Image pyramid](image-pyramid.md)
- [Corner detector](../level-01-beginner/corner-detector.md)
- [FAST](fast.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
