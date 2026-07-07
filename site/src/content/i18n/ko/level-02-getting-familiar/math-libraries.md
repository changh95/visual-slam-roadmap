# 수학 라이브러리

사실상 모든 C++ SLAM 시스템의 수치적 기반을 이루는 네 가지 라이브러리가 있습니다: 선형대수를 위한 **Eigen**, 그리고 비선형 최소제곱 최적화를 위한 **Ceres Solver / g2o / GTSAM**입니다. 어느 것이 어떤 것인지 — 그리고 시스템의 선택이 언제 중요한지 — 아는 것은 SLAM의 기본 소양입니다.

**Eigen.** SLAM을 위한 *그* 선형대수 라이브러리입니다: 모든 행렬/벡터 연산, 분해 (SVD, QR, 콜레스키), 선형 솔버를 제공합니다. 헤더 온리이며 템플릿으로 심하게 최적화되어 있어서, 잘 작성된 Eigen 코드는 벡터화된 기계어 코드로 컴파일됩니다. 자주 사용하게 될 타입: `Eigen::Matrix3d`, `Eigen::Vector3d`, `Eigen::Isometry3d` (강체 변환), `Eigen::Quaterniond`, `Eigen::Map` (복사 없이 원시 버퍼를 감쌈).

```cpp
Eigen::Isometry3d T_wc = Eigen::Isometry3d::Identity();
T_wc.rotate(Eigen::AngleAxisd(0.1, Eigen::Vector3d::UnitZ()));
T_wc.pretranslate(Eigen::Vector3d(1.0, 0.0, 0.0));

Eigen::Vector3d p_c = T_wc.inverse() * p_w;   // 세계 좌표 점을 카메라 프레임으로
```

누구나 한 번쯤 겪는 실용적인 함정: 고정 크기 Eigen 멤버는 정렬된 할당이 필요하고 (`EIGEN_MAKE_ALIGNED_OPERATOR_NEW`), 의존성 간에 Eigen 버전을 섞으면 빌드가 고통스러워집니다 — SLAM에서 Docker가 널리 쓰이는 주요 이유 중 하나입니다.

**Ceres Solver.** Google의 범용 비선형 최소제곱 프레임워크입니다. 잔차를 템플릿화된 비용 함수자로 정의하면, Ceres가 **자동 미분** (야코비안을 손으로 유도할 필요 없음), 강건 손실 함수, 회전과 자세를 위한 매니폴드/로컬 파라미터화 지원, 그리고 다양한 희소 솔버 모음을 제공합니다. 보편적인 패턴:

```cpp
struct ReprojectionError {
  ReprojectionError(double u, double v) : u_(u), v_(v) {}

  template <typename T>
  bool operator()(const T* const pose, const T* const point, T* residual) const {
    // pose로 점을 회전+이동시키고, 픽셀 (pu, pv)로 투영한 다음:
    // residual[0] = pu - T(u_);  residual[1] = pv - T(v_);
    return true;
  }
  double u_, v_;
};

problem.AddResidualBlock(
    new ceres::AutoDiffCostFunction<ReprojectionError, 2, 6, 3>(
        new ReprojectionError(u, v)),
    new ceres::HuberLoss(1.0), pose, point);
```

번들 조정과 포즈 그래프 최적화에 사용됩니다; VINS-Mono의 슬라이딩 윈도우 백엔드는 Ceres 기반이며, 잔차가 특이하고 자동 미분이 미적분을 대신 처리해 주기를 원할 때 기본적으로 선택됩니다. 솔버 선택이 중요합니다: 번들 조정에는 `DENSE_SCHUR` (카메라/랜드마크 블록 구조를 활용), 포즈 그래프에는 `SPARSE_NORMAL_CHOLESKY`.

**g2o.** "General Graph Optimization" — 명시적으로 그래프 형태의 API입니다: **정점**은 상태 변수(자세, 3D 점), **에지**는 제약 조건(관측값, 오도메트리, 루프 클로저)이며, 희소 콜레스키로 풀립니다. ORB-SLAM (모든 버전)과 LSD-SLAM의 백엔드입니다 — ORB-SLAM의 BA는 문자 그대로 `VertexSE3Expmap` 자세 정점과 `EdgeSE3ProjectXYZ` 재투영 에지입니다 — 따라서 g2o의 정점/에지 정의를 읽는 것은 그 코드베이스를 읽기 위한 전제 조건입니다. 야코비안은 대개 손으로 유도됩니다(수치 미분을 대체 수단으로 사용) — 실행 시에는 더 빠르지만 작성하는 데 더 많은 노력이 필요합니다.

**GTSAM.** Georgia Tech Smoothing and Mapping — 가장 강력한 이론적 계보를 가진 팩터 그래프 라이브러리입니다: 변수 소거, 베이즈 트리, 그리고 실시간 스무딩을 위한 **iSAM2 증분 솔버**. 고품질의 내장 팩터(IMU 사전 적분, 투영 팩터, 스마트/구조 없는 팩터)와 Python 래퍼를 제공합니다:

```cpp
gtsam::NonlinearFactorGraph graph;
graph.addPrior(X(0), gtsam::Pose3(), priorNoise);
graph.emplace_shared<gtsam::BetweenFactor<gtsam::Pose3>>(X(0), X(1), odom, odomNoise);

gtsam::ISAM2 isam;
isam.update(graph, initialValues);        // 증분 스무딩 단계
gtsam::Values estimate = isam.calculateEstimate();
```

VIO와 로보틱스 추정 세계를 지배하고 있습니다: Kimera-VIO와 LIO-SAM이 이를 기반으로 구축되어 있습니다.

## 선택하기

| 필요 | 선택할 라이브러리 |
|---|---|
| 어디서든 필요한 행렬 연산 | Eigen (필수) |
| 커스텀 잔차, 자동 미분, 배치 BA | Ceres |
| ORB-SLAM 방식의 그래프 BA / PGO | g2o |
| 증분 스무딩, IMU 팩터, VIO | GTSAM |

가져야 할 성능에 대한 직관: 자동 미분은 손으로 유도한 해석적 야코비안보다 반복당 비용이 다소 더 들지만 유도 과정의 버그라는 하나의 오류 범주 전체를 없애줍니다; 희소 선형 솔버의 선택(슈어 대 일반 희소 콜레스키)이 보통 자동 미분 대 해석적 미분의 문제보다 더 중요합니다; 그리고 세 가지 최적화기 모두 궁극적으로 동일한 감쇠 정규 방정식을 풉니다 — 차이는 API, 분해 전략, 생태계에 있을 뿐, 그 근본적인 수학에 있지 않습니다.

## SLAM에서의 의미

여러분이 공부할 모든 시스템의 백엔드는 이 라이브러리들 중 하나를 대상으로 작성되며, 그 API는 논문이 사고하는 방식을 형성합니다: "팩터를 추가한다", "에지를 정의한다", "강건 커널을 붙인다". 이에 익숙해지면 어떤 시스템의 최적화 코드도 읽을 수 있고, 오후 시간 안에 새로운 잔차를 프로토타이핑할 수 있으며, 메서드가 실시간으로 실행되는지를 결정하는 성능 논의(자동 미분 대 해석적 야코비안, 희소 솔버 선택, 증분 대 배치)를 이해할 수 있습니다.

## 실습

- [Eigen + Sophus 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch03_05)
- [g2o 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_13)
- [GTSAM 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_14)
- [Ceres-solver 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_15)
- [SymForce 실습](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_16)

## 관련 문서

- [C++](cpp.md)
- [팩터 그래프](factor-graph.md)
- [희소 비선형 최소제곱으로서의 MAP 추정](map-inference-as-sparse-nonlinear-least-squares.md)
- [증분 스무딩 (iSAM/iSAM2)](incremental-smoothing.md)
- [슈어 보완 / 희소성](schur-complement-sparsity.md)
