# PL-SLAM

> Pumarola 2017 · [논문](https://www.albertpumarola.com/research/pl-slam/index.html)

**한 줄 요약** — 포인트와 함께 선분 특징점을 도입하여 ORB-SLAM을 확장하며 — 선분은 3D 끝점으로 파라미터화되어 포인트 처리 구조에 그대로 접목되며 — 새로운 선분 전용 지도 초기화까지 더하여, 저질감 인공 환경에서 강건한 단안 SLAM을 구현합니다.

## 문제

저질감 장면은 포인트 기반 기하 비전의 "가장 큰 아킬레스건 중 하나"입니다: ORB-SLAM은 질감이 부족한 영상이나 모션 블러로 특징점이 일시적으로 사라질 때 실패하기 쉬운데, 이는 인공 환경에서 흔한 상황입니다. 이러한 장면에도 신뢰할 수 있는 선분 기반 요소는 여전히 존재합니다(도시 장면, "맨해튼 월드"), 하지만 선분 검출기와 파라미터화는 포인트에 비해 덜 확립되어 있고, 선분으로부터의 포즈 추정(pose-from-lines)은 신뢰성이 낮고 부분 가림에 민감하며, 표준 SLAM은 포인트 대응 없이는 지도를 부트스트랩할 수조차 없습니다.

## 방법 및 아키텍처

PL-SLAM은 ORB-SLAM의 세 스레드 아키텍처 — 추적, 지역 매핑, 루프 클로징 — 를 유지하며, 검출, 삼각측량, 매칭, 정리(culling), 재지역화, 최적화 전 과정에 선분 처리를 엮어 넣습니다. 루프 *감지*는 전체 지도에서 선분을 매칭하는 비용이 너무 크기 때문에 포인트만 사용합니다.

- **검출 및 매칭**: LSD가 $O(n)$으로 선분을 추출합니다; 선분은 Line Band Descriptor(LBD) 외관과 쌍별 기하 일관성을 결합한 관계 그래프 전략으로 지도 선분에 매칭됩니다. 3개 미만의 시점에서 관측되거나, 가시적이어야 할 프레임의 25% 미만에서 관측된 선분은 정리됩니다.
- **끝점 파라미터화 및 선분 재투영 오차**: Vakhitov et al.을 따라, 3D 선분은 끝점 $P,Q\in\mathbb{R}^3$로 표현됩니다. 검출된 균질(homogeneous) 2D 끝점 $p^h_d,q^h_d$로부터 정규화된 선 계수는 $l=\frac{p^h_d\times q^h_d}{\lVert p^h_d\times q^h_d\rVert}$이며, 선분 재투영 오차는 투영된 끝점의 점-대-선 거리의 합입니다:

$$E_{line}(P,Q,l,\theta,K)=E^2_{pl}(P,l,\theta,K)+E^2_{pl}(Q,l,\theta,K),\qquad E_{pl}(P,l,\theta,K)=l^{\top}\pi(P,\theta,K)$$

  여기서 $\pi$는 카메라 포즈 $\theta=\{R,t\}\in SE(3)$와 내부 파라미터 $K$로 투영합니다. 이 오차는 3D 선을 따라 $P,Q$가 이동해도 변하지 않으며, 이는 암묵적 정규화(implicit regularisation)로 작용하여 비최소(non-minimal) 파라미터화가 BA 안에서 안전하게 존재할 수 있게 합니다.
- **결합 BA 비용**: 포인트 오차 $e_{i,j}=x_{i,j}-\tilde{x}_{i,j}$와 선분 끝점 오차 $e^{\prime}_{i,j}=(\tilde{l}_{i,j})^{\top}(K^{-1}p^{h}_{i,j})$, $e^{\prime\prime}_{i,j}=(\tilde{l}_{i,j})^{\top}(K^{-1}q^{h}_{i,j})$와 함께, BA는 다음을 최소화합니다

$$C=\sum_{i,j}\rho\left(e_{i,j}^{\top}\Omega_{i,j}^{-1}e_{i,j}+e^{\prime\top}_{i,j}\Omega^{\prime-1}_{i,j}e^{\prime}_{i,j}+e^{\prime\prime\top}_{i,j}\Omega^{\prime\prime-1}_{i,j}e^{\prime\prime}_{i,j}\right)$$

  Huber 비용 $\rho$와 검출 스케일에 결부된 공분산 $\Omega$가 사용됩니다.
- **재지역화**: EPnP는 EPnPL로 대체되어, 검출된 선분 재투영 오차를 최소화하고 검출된 끝점을 선을 따라 이동시켜 투영된 모델 끝점과 매칭시킴으로써 가림과 오검출에 대한 강건성을 제공합니다.
- **선분 전용 초기화**: 연속된 세 프레임에 걸쳐 작고 일정한 회전을 가정하면($R_1=R^{\top}$, $R_2=I$, $R_3=R$), 추적된 각 선분은 제약 조건 $l_{2}^{\top}\left((R^{\top}l_{1})\times(Rl_{3})\right)=0$을 제공합니다. 1차 근사 회전 $R\approx I+[\mathbf{r}]_{\times}$을 사용하면, 매칭된 세 개의 선분이 $r_1,r_2,r_3$에 대한 세 개의 2차 방정식을 제공하며, 이는 수정된 Kukelova 다항식 솔버(최대 8개의 해)로 풀립니다; 이동 $t_1,t_3$은 그 후 삼중초점 텐서(trifocal-tensor) 방정식으로부터 선형적으로 구해집니다. 총 5개의 선분 대응으로 충분합니다.

## 실험 결과

TUM RGB-D 벤치마크에서(ATE RMSE, cm 단위, 5회 실행의 중앙값), PL-SLAM은 "모든 시퀀스에서 ORB-SLAM의 궤적 정확도를 일관되게 향상시킵니다": f1_xyz 1.21 대 1.38, f2_xyz 0.43 대 0.54, f3_long_office 1.97 대 4.05, f2_desk_person 1.99 대 5.95, f3_sit_xyz 0.066 대 0.08, f3_walk_halfsph 1.60 대 2.09. 두 개를 제외한 모든 시퀀스에서 최고 성능을 보입니다(그 두 시퀀스에서는 PTAM이 약간 앞섭니다), 하지만 PTAM은 12개 중 5개 시퀀스에서, LSD-SLAM은 3개에서, RGBD-SLAM은 7개에서 추적을 잃었습니다. 선분 전용 초기화는 고전적인 단응/기초 행렬 초기화가 모호성을 감지하여 시작할 수 없는 f3_nstr_tex_far조차 부트스트랩합니다; 이는 프레임 간 회전이 클 때만 실패합니다. 다항식 솔버는 수치적으로 안정적입니다(오차는 약 1e-15). 비용: 추적은 ORB-SLAM의 50 Hz 대비 20 Hz로, 지역 매핑은 7 Hz 대비 3 Hz로 실행됩니다(지역 BA 218.25 대 118.5 ms) — 표준 i7 CPU에서 거의 실시간입니다.

## SLAM에서의 의미

PL-SLAM은 선분 특징점을 추가하는 것이 정확도를 의미 있게 향상시킨다는 것을 보여주었습니다 — 포인트가 사라지는 저질감 장면뿐만 아니라 질감이 풍부한 시퀀스에서도 체계적으로 그렇습니다 — 동시에 끝점 파라미터화 덕분에 포인트 기반 파이프라인 거의 전체를 재사용합니다. 선분 기반 삼중 뷰 초기화는 부트스트래핑을 위한 포인트 대응에 대한 마지막 강한 의존성을 제거했습니다. 이후의 포인트-선분 시스템(Gomez-Ojeda의 스테레오 PL-SLAM과 AirVO와 같은 선분 보조 VIO 포함)은 동일한 포인트-플러스-선분 철학을 기반으로 구축되었습니다.

## 관련 문서

- [ORB-SLAM](orb-slam.md)
- [Pop-up SLAM](pop-up-slam.md)
- [CubeSLAM](cubeslam.md)
- [AirVO](../level-06-vio-vins/airvo.md)
- [Edge detector](../level-01-beginner/edge-detector.md)
