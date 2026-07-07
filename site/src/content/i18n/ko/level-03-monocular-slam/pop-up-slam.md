# Pop-up SLAM

> Yang 2016 · [논문](https://arxiv.org/abs/1703.07334)

**한 줄 요약** — 단일 이미지 기반 "pop-up" 평면 감지를 단안 SLAM에 통합하여, 평면을 팩터 그래프의 랜드마크로 사용함으로써 밀집 의미론적 매핑과 상태 추정이 포인트 특징점 방법이 실패하는 저질감 환경에서도 살아남을 수 있게 합니다.

## 문제

특징점 기반 SLAM 시스템은 뚜렷한 포인트 특징점에 의존하며, "뚜렷한 특징점이 몇 개뿐인 까다로운 저질감 환경에서는 강건하지 않습니다"; 복도, 흰 벽, 바닥은 LSD-SLAM과 ORB-SLAM을 완전히 실패하게 만듭니다. 살아남더라도 "그 결과로 나온 희소하거나 반밀집(semi-dense)한 지도는 동작 계획을 위한 정보를 거의 전달하지 못합니다". 밀집 지도 정규화를 위해 평면이나 장면 배치를 사용한 이전 연구들도 여전히 "다른 소스로부터의 양질의 상태 추정을 필요로 합니다". Pop-up SLAM은 장면 이해가 상태 추정과 밀집 매핑 모두를 개선할 수 있음을, 특히 저질감 환경에서 시연합니다.

## 방법 및 아키텍처

시스템은 세 부분으로 구성됩니다: 단일 이미지 평면 "pop-up" 프론트엔드, 평면-랜드마크 SLAM 백엔드, 그리고 포인트 기반 LSD-SLAM과의 두 가지 융합 방식입니다.

**단일 이미지 평면 pop-up.** CNN이 지면 영역을 분할합니다; 폴리라인을 피팅하는 대신, 진짜 벽-지면 경계는 서브모듈러 최적화(submodular optimisation)를 통해 검출된 선분 중에서 선택됩니다: 검출된 에지 $V=\{e_1,\dots,e_n\}$가 주어졌을 때, $\max_{S\subseteq V}F(S),\ st\colon S\in I$를 찾습니다. 여기서 점수 $F=C(S)$는 수평 이미지 커버리지이고, 제약 $I=I_{close}\cap I_{ovlp}$는 에지가 CNN 경계에 가까우면서 수평으로 겹치지 않도록 요구합니다. 탐욕적 갱신 $S\leftarrow S\cup\{\operatorname{arg\,max}_{e\notin S}\bigtriangleup(e\mid S)\}$는 최악의 경우 $\frac{1}{k+1}$의 최적성 한계를 갖습니다. 평면은 균질 벡터 $\boldsymbol{\pi}=(\mathbf{n}^\top,d)^\top$로 표현되며, 프레임 간에는 $\boldsymbol{\pi}_w=\text{T}_{w,c}^{-\top}\boldsymbol{\pi}_c$로 변환됩니다. 평면 위의 각 픽셀 $\mathbf{u}$는 다음의 3D 점으로 pop-up됩니다

$$\mathbf{p}_{c}=\frac{-d_{c}}{\mathbf{n}_{c}^{\top}(\text{K}^{-1}\mathbf{u})}\text{K}^{-1}\mathbf{u}$$

벽 법선은 수직성으로부터 유도됩니다: $\mathbf{n}_{wall,c}=\mathbf{n}_{gnd,c}\times(\mathbf{p}_{c1}-\mathbf{p}_{c0})$. 초기화를 위한 카메라 회전은 $\mathbf{v}_{i}=\mathbf{K}\mathbf{R}_{w,c}^{\top}\mathbf{e}_{i}$를 통해 맨해튼 소실점으로부터 구해집니다.

**평면 SLAM 백엔드.** 팩터 그래프(iSAM)가 pop-up 평면 측정치와 오도메트리로부터 6-DoF 포즈 $x_0,\dots,x_t$와 평면 랜드마크 $\boldsymbol{\pi}_0,\dots,\boldsymbol{\pi}_n$을 추정합니다; 각 평면은 지면/벽 레이블을 갖습니다. $(\mathbf{n}^\top,d)^\top$는 과도하게 파라미터화(특이 정보 행렬)되어 있으므로, 평면은 최소 쿼터니언 표현 $\mathbf{q}\in\mathbb{R}^4$, $\|q\|=1$으로 최적화되며, 지수 사상(exponential map)을 통해 갱신됩니다. 데이터 연관은 평면 법선 차이, 상호 거리, 투영 겹침을 사용합니다; 루프 클로저는 ORB bag-of-words를 사용하며, 그 후 중복된 평면의 팩터는 매칭된 랜드마크로 옮겨집니다. 평면 측정치는 매 포즈 갱신 후 다시 pop-up됩니다(100개 평면당 1 ms 미만).

**포인트-평면 융합.** 평면 전용 SLAM은 복도에서 (평행한 벽을 따르는 자유 방향 $t_{free}$로 인해) 저제약(under-constrained) 상태이므로, LSD-SLAM과의 두 가지 결합 방식이 제안됩니다: (1) *Depth Enhanced LSD SLAM*은 pop-up 깊이 $d_p$(오차 전파에 의해 $\sigma_p^2\propto d_p^2$)를 LSD의 전파된 깊이 $d_l$과 다음처럼 융합합니다 $\mathcal{N}\left(\frac{\sigma_{l}^{2}d_{p}+\sigma_{p}^{2}d_{l}}{\sigma_{l}^{2}+\sigma_{p}^{2}},\frac{\sigma_{l}^{2}\sigma_{p}^{2}}{\sigma_{l}^{2}+\sigma_{p}^{2}}\right)$; (2) *LSD Pop-up SLAM*은 향상된 LSD 포즈를 오도메트리 팩터로 사용하여 평면 SLAM을 실행합니다.

## 실험 결과

- **TUM fr3/structure_notexture_far**(다섯 개의 흰 벽 + 지면): LSD-SLAM과 ORB-SLAM 모두 실패합니다. Pop-up Plane SLAM은 4.58 m 궤적에서 평균 위치 오차 $0.18\pm0.07$ m(3.9%), 종점 오차 0.10 m를 달성합니다; 평면 법선 오차 2.83°, 평균 픽셀 깊이 오차 6.2 cm이며, 픽셀 깊이의 86.8%가 0.1 m 이내입니다.
- **Corridor 데이터셋 II**(60 m 루프, 640×480 핸드헬드 카메라): LSD Pop-up SLAM은 0.4 m 오차로(궤적 길이의 0.67%) 루프를 닫는 반면, LSD와 ORB SLAM은 성능이 좋지 않습니다(ORB는 종종 초기화에 실패합니다).
- **런타임**(i7 4.0 GHz + CNN용 GPU): CNN 분할 17.8 ms, 에지 검출/선택 13.2 ms, iSAM 증분 갱신 17.4 ms; 처리된 프레임당 총 49.4 ms(단일 스레드로 20 Hz 이상), pop-up은 10번째 이미지마다 실행됩니다(3 Hz). 지도 통계: 146개의 평면, 344개의 포즈, 1974개의 팩터.

## SLAM에서의 의미

Pop-up SLAM은 구조적 및 의미론적 사전 정보를 기하 기반 SLAM에 주입한 초기 사례로서, 장면 이해와 SLAM이 상호 유익함을 보여줍니다: 단일 이미지 사전 정보는 퇴화된 장면에서 SLAM을 구해내고, SLAM은 그 사전 정보에 3D 일관성을 부여합니다. 이는 이후의 평면 및 구조 인식 SLAM 연구에 영향을 미쳤으며, 지면 평면 역투영 기하를 재사용하는 같은 저자들의 물체 수준 CubeSLAM의 직접적인 전신입니다.

## 관련 문서

- [ORB-SLAM](orb-slam.md)
- [PL-SLAM](pl-slam.md)
- [CubeSLAM](cubeslam.md)
- [LSD-SLAM](lsd-slam.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
