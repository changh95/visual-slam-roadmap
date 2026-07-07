# Python

대부분의 SLAM 시스템의 실시간 코어는 C++로 실행되지만, **Python**은 그 코어를 둘러싼 모든 것의 언어다. 일반적인 SLAM 작업 흐름에서 Python은 세 가지 용도로 쓰인다:

- **딥러닝**: PyTorch(그리고 관련 도구들)는 Python 우선이다. 학습된 특징(SuperPoint), 매처(SuperGlue/LightGlue), 단안 깊이 추정, DROID-SLAM 같은 종단간(end-to-end) 시스템은 모두 Python으로 학습되며 — 보통 처음 프로토타이핑도 Python으로 이루어진다.
- **분석과 시각화**: 배열 연산을 위한 NumPy, 궤적과 오차 플롯을 위한 Matplotlib, 그리고 정답 데이터에 대해 ATE/RPE를 계산하는 평가 도구. SLAM 실행이 오작동할 때, 궤적, 특징 개수, 잔차 히스토그램을 플롯하는 간단한 노트북이 흔히 가장 빠른 디버깅 도구다.
- **시스템 스크립트와 접착제 역할**: 데이터셋 다운로드와 변환, 배치 실험 실행기, 캘리브레이션 파이프라인, CI 작업, 그리고 시간에 크게 민감하지 않은 구성요소를 위한 ROS 2 노드(`rclpy`).

많은 핵심 SLAM 라이브러리는 Python 바인딩을 제공하므로, C++를 건드리지 않고도 전체 파이프라인을 프로토타이핑할 수 있다:

| 라이브러리 | Python 진입점 |
|---|---|
| OpenCV | `opencv-python` (`cv2`) |
| GTSAM | 공식 Python 래퍼 |
| g2o | 커뮤니티 바인딩 (예: g2opy) |
| Open3D | 네이티브 Python API (포인트 클라우드, ICP, TSDF) |

흔하고 생산적인 패턴은 *Python으로 프로토타입을 만들고 C++로 포팅하는* 것이다: 먼저 `cv2`와 NumPy로 데이터셋에서 알고리즘을 검증한 다음, 설계가 안정되면 핵심 반복 루프를 C++/Eigen으로 재구현한다. Python에 계속 머물러야 하는 연구용 코드라면, pybind11을 사용해 성능이 중요한 C++ 부분을 감싸고 실험 로직은 Python으로 유지할 수 있다 — 두 세계의 장점을 모두 취하는 방식이다.

일찍 습관으로 만들어 둘 만한 실용적 습관: 프로젝트마다 가상 환경(venv/conda/uv)을 사용하고, 재현성을 위해 의존성 버전을 고정하며, NumPy는 행 우선(row-major) 규약을 사용하고 OpenCV 이미지는 `[row, col]` = `[y, x]`로 인덱싱된다는 점을 기억하라 — 좌표가 뒤바뀌는 버그의 전형적인 원인이다.

## Python에서의 SLAM 도구 맛보기

여러분의 도구상자에 갖춰둘 가장 유용한 스크립트는 궤적 평가다. Umeyama 방법(SVD를 통한 닫힌 형태의 최소제곱 강체 정합)으로 추정치를 정답 데이터에 정렬하고 ATE RMSE를 계산하는 것은 NumPy로 십여 줄이면 된다:

```python
import numpy as np

def align_and_ate(P_est, P_gt):          # both Nx3
    mu_e, mu_g = P_est.mean(0), P_gt.mean(0)
    U, S, Vt = np.linalg.svd((P_gt - mu_g).T @ (P_est - mu_e))
    D = np.diag([1, 1, np.sign(np.linalg.det(U @ Vt))])
    R = U @ D @ Vt                        # rotation aligning est -> gt
    t = mu_g - R @ mu_e
    err = P_gt - (P_est @ R.T + t)        # residuals after alignment
    return np.sqrt((err ** 2).sum(1).mean())   # ATE RMSE
```

이는 널리 쓰이는 `evo` 패키지(`pip install evo`)가 하는 일과 본질적으로 같다 — 실제로는 TUM/KITTI/EuRoC 형식, 플롯, RPE를 위해 `evo`를 사용하되, 위의 수식을 알고 있으면 그 출력이 블랙박스가 되지 않는다.

## Python을 충분히 빠르게 만들기

Python의 느림은 거의 전부 *루프* 문제다. 기본 원칙은 다음과 같다:

- **NumPy로 벡터화하라** — 10만 개의 점을 변환하는 것은 `for` 루프가 아니라 하나의 행렬 곱(`(R @ pts.T).T + t`)이어야 한다; 그 차이는 일상적으로 100배에 달한다.
- **GIL이 어디서 문제가 되는지 알아두라** — Python 스레드는 CPU 바운드인 순수 Python 코드를 병렬화하지 못한다; NumPy/OpenCV 호출은 GIL을 해제하며, `multiprocessing`은 배치 실험에서 이를 회피한다.
- **최적화 전에 프로파일링하라** — `cProfile`과 라인 프로파일러는 대개 하나의 핫 루프를 드러낸다; 모든 것을 포팅하는 대신 정확히 그 부분만 NumPy, Numba, 또는 작은 pybind11 확장으로 옮겨라.
- **dtype에 주의하라** — 의도치 않은 `float64`는 `float32`에 비해 메모리 대역폭을 두 배로 잡아먹는다; `uint8`로 도착하는 이미지 배열은 산술 연산에서 조용히 오버플로된다(`img1 - img2`는 래핑된다).

## 흔한 함정

- **좌표/레이아웃 혼동** — `img[y, x]`, `(x, y)`로서의 `pts`: OpenCV는 API 전체에서 두 규약을 섞어 사용한다(OpenCV 노트 참고).
- **에일리어싱 대 복사** — NumPy 슬라이싱은 *뷰(view)*를 반환한다; 슬라이스를 변경하면 원본 배열도 변경된다. 복사가 필요하면 `.copy()`를 사용하라.
- **환경 부패(environment rot)** — `opencv-python`과 `opencv-contrib-python`의 충돌, CUDA/PyTorch 버전 불일치; 프로젝트마다 고정된 환경 파일 하나가 몇 주에 걸친 디버깅을 막아준다.
- **쿼터니언 규약** — 라이브러리마다 `(w, x, y, z)`와 `(x, y, z, w)` 순서에 대한 견해가 다르다(예: SciPy는 `xyzw`를 사용); 순서가 틀리면 명백히 망가지는 것이 아니라 미묘하게 잘못된 회전이 만들어진다.

## SLAM에서의 의미

현대 SLAM 연구는 기하학과 학습의 교차점에 있으며, 학습 쪽은 Python으로 말한다. 고전적인 시스템이라 해도, 평가·시각화·데이터셋 도구 생태계는 Python 기반이다; 이에 익숙하면 실험을 실행하고 C++ 시스템이 실제로 무엇을 하고 있는지 이해하는 속도가 극적으로 빨라진다.

## 실습

- [Python 기초 프로그래밍](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_07)

## 관련 문서

- [C++](cpp.md)
- [C++/Python interop](cpp-python-interop.md)
- [OpenCV](opencv.md)
- [Bash/Linux](bash-linux.md)
