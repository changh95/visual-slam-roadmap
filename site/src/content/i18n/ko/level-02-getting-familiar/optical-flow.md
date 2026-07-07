# Optical Flow

**옵티컬 플로우(optical flow)**는 연속된 프레임 사이에서 이미지 밝기 패턴이 보이는 겉보기 2D 움직임입니다: 시간 $t$에서 $t+1$로의 변위를 각 픽셀(또는 각 추적점)에 할당하는 벡터장 $(u, v)$입니다. 이것이 바로 SLAM 프론트엔드가 매 프레임마다 특징을 다시 검출하고 다시 매칭하지 않고도 비디오 전체에서 점을 따라가는 방법입니다.

## 밝기 항상성과 흐름 제약식

기본이 되는 가정은 **밝기 항상성(brightness constancy)**입니다: 장면의 한 점은 움직이더라도 밝기를 유지한다는 가정입니다.

$$
I(x, y, t) = I(x + u,\, y + v,\, t + 1)
$$

움직임이 **작다**고 가정하고, 우변을 1차까지 전개(테일러 전개)한 뒤 $I(x,y,t)$를 소거하면:

$$
I_x u + I_y v + I_t = 0
$$

여기서 $I_x, I_y$는 이미지의 공간적 기울기(gradient)이고 $I_t$는 프레임 간의 시간적 차이입니다. 이 **옵티컬 플로우 제약 방정식**은 픽셀당 두 개의 미지수에 대해 방정식이 하나뿐입니다 — 이미지 기울기 *방향*을 따르는 흐름 성분은 관측 가능하지만, 그에 수직인 성분은 관측할 수 없습니다. 이것이 바로 **어퍼처 문제(aperture problem)**입니다: 작은 창을 통해 움직이는 에지를 보면, 그것이 자기 자신을 따라 얼마나 미끄러지는지 알 수 없습니다.

## Lucas-Kanade: 국소 최소제곱

Lucas-Kanade는 세 번째 가정으로 이 모호성을 해소합니다: 작은 윈도우 $W$ (예: $21\times 21$) 안의 모든 픽셀은 같은 흐름을 공유한다는 가정입니다. 윈도우 내 $N$개 픽셀에 대한 제약식을 쌓으면:

$$
\underbrace{\begin{bmatrix} I_x^{(1)} & I_y^{(1)} \\ \vdots & \vdots \\ I_x^{(N)} & I_y^{(N)} \end{bmatrix}}_{A}
\begin{bmatrix} u \\ v \end{bmatrix}
= -\underbrace{\begin{bmatrix} I_t^{(1)} \\ \vdots \\ I_t^{(N)} \end{bmatrix}}_{\mathbf{b}}
$$

이는 과잉 결정계이며 최소제곱으로 풀립니다: $(A^T A)\,\mathbf{v} = -A^T \mathbf{b}$. $2\times 2$ 행렬 $A^T A$는 Harris [코너 검출기](../level-01-beginner/corner-detector.md)의 **구조 텐서**와 정확히 같습니다 — 깊고 실용적인 연결입니다.

- **코너**(두 고유값이 모두 큰 경우): 조건이 잘 갖춰진 시스템이며 흐름을 신뢰할 수 있습니다. 이것이 추적기가 코너("좋은 추적 특징")를 선택하는 이유입니다.
- **에지**(한 고유값이 0에 가까운 경우): 조건이 나쁨 — 행렬 형태로 나타난 어퍼처 문제입니다.
- **평탄한 영역**(둘 다 0에 가까운 경우): 정보가 전혀 없습니다.

선형화가 작은 움직임을 가정하기 때문에, 실제 구현들은 풀이를 반복하고(워핑, 재선형화) [이미지 피라미드](image-pyramid.md) 위에서 **거친-세밀(coarse-to-fine)** 순서로 실행합니다: 큰 움직임은 거친 스케일에서 작은 움직임으로 줄어들고, 각 레벨의 추정값이 다음 레벨을 초기화합니다. 이 피라미드형 Lucas-Kanade 방식이 [KLT 추적기](klt-tracker.md)의 핵심입니다.

## 희소 흐름 대 밀집 흐름

- **희소 흐름(sparse flow)** (Lucas-Kanade/KLT)은 선택된 키포인트에서만 흐름을 계산합니다 — 저렴하며, 특징 기반 VO/SLAM이 프레임 간 추적에 필요로 하는 그대로입니다.
- **밀집 흐름(dense flow)**은 픽셀마다 벡터를 추정합니다. 고전적인 형식화(Horn-Schunck)는 매끄러움 정규화 항을 추가하여 전역적으로 문제를 well-posed하게 만들며, 전체 이미지에 대해 다음을 최소화합니다.

$$
E(u, v) = \iint \left( I_x u + I_y v + I_t \right)^2 + \lambda \left( \|\nabla u\|^2 + \|\nabla v\|^2 \right) \, dx\, dy
$$

  이로써 텍스처가 없는 영역도 주변으로부터 흐름을 물려받습니다. 현대의 밀집 흐름은 학습 기반 방법(FlowNet, PWC-Net, RAFT)이 지배적이며, 이들은 고전적 가정이 허용하는 것보다 훨씬 잘 큰 변위, 가림, 조명 변화를 다룹니다.

추적의 표준적인 신뢰도 필터는 **정방향-역방향 검사(forward-backward check)**입니다: 한 점을 프레임 $t$에서 $t+1$로 추적한 다음, 그 결과를 다시 $t$로 추적해보고, 원래 위치 근처로 돌아오지 않으면 트랙을 버립니다.

## SLAM에서의 의미

옵티컬 플로우는 프레임 간 대응점을 얻는 가장 저렴한 방법이며, 대응점은 시각적 오도메트리의 원재료입니다. KLT 기반 추적 프론트엔드(예: VINS-Mono 및 많은 VIO 시스템)는 디스크립터를 매칭하는 대신 피라미드형 Lucas-Kanade로 코너를 추적합니다 — 더 빠르고, 디스크립터 매칭에는 없는 서브픽셀 정확도를 갖습니다. 같은 밝기 항상성 메커니즘을 2D 윈도우 이동에서 완전한 카메라 자세 워핑으로 일반화한 것이 직접법(LSD-SLAM, DSO)의 기반입니다. 그리고 학습된 밀집 흐름은 이제 DROID-SLAM과 같은 시스템에서 대응점 추정을 담당합니다. 제약 방정식, 어퍼처 문제, 구조 텐서 조건화를 이해하면 이들 중 무엇이 어디에서 실패할지 알 수 있습니다: 빠른 움직임, 낮은 텍스처, 변화하는 조명입니다.

## 실습

- [특징 추적 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_07)

## 관련 문서

- [KLT Tracker](klt-tracker.md)
- [Image pyramid](image-pyramid.md)
- [Corner detector](../level-01-beginner/corner-detector.md)
- [FlowNet](../level-05-deep-learning/flownet.md)
- [RAFT](../level-05-deep-learning/raft.md)
