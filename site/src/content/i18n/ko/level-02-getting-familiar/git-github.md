# Git/GitHub

Git은 거의 모든 SLAM 연구 및 산업 코드에서 사용되는 버전 관리 시스템이며, GitHub은 그 코드가 존재하는 곳입니다. SLAM은 유독 오픈소스 중심적입니다 — 이후 레벨에서 공부하게 될 시스템들(ORB-SLAM3, VINS-Fusion, OpenVINS, DSO 등 수백 가지)은 모두 GitHub 저장소이며, 여러분의 일상적인 작업 흐름은 이들을 클론하고, 빌드하고, 수정하는 것을 중심으로 돌아가게 됩니다.

익숙해져야 할 핵심 Git 기술들:

- **일상적인 루프**: `clone`, `status`, `add`, `commit`, `push`, `pull`. *왜* 변경했는지를 설명하는 메시지와 함께 작게 자주 커밋하세요.
- **브랜칭**: 기능과 실험은 브랜치에서 개발한 뒤, 다시 병합(merge)하거나 리베이스(rebase)합니다. 연구에서는 브랜치가 값싼 병렬 우주입니다 — 실험 아이디어마다 하나씩 만들면 됩니다.
- **히스토리 읽기**: `log`, `diff`, `blame`, `bisect`. `git bisect`는 SLAM 디버깅에서 강력한 도구입니다: 어떤 데이터셋에서 정확도가 나빠졌을 때, bisect는 그것을 망가뜨린 커밋을 찾아줍니다.
- **서브모듈**: SLAM 저장소는 관례적으로 의존성(DBoW2, g2o, Pangolin)을 서브모듈로 벤더링합니다 — `git clone --recursive`와 `git submodule update --init`을 알아두어야 합니다.
- **태그와 릴리스**: 논문은 특정 버전을 참조합니다. 태그에 고정(pin)하는 것이 보고된 결과를 재현하는 방법입니다.

앞으로 수백 번은 입력하게 될 클론 패턴입니다:

```bash
git clone --recursive https://github.com/<org>/<slam-system>.git
cd <slam-system>
git checkout <tag-from-the-paper>       # pin the exact version being reported
git submodule update --init --recursive # in case the checkout moved submodules
```

그리고 Git을 배운 모든 노력을 한 번에 보상해주는 디버깅 패턴 — 데이터셋 지표에 대한 자동화된 이분 탐색(bisection)입니다:

```bash
git bisect start
git bisect bad HEAD          # accuracy is broken here
git bisect good <old-tag>    # ...and was fine here
git bisect run ./scripts/check_ate.sh   # exits non-zero when ATE exceeds a threshold
```

Git은 히스토리를 순회하며 각 단계에서 여러분의 평가 스크립트를 실행하고, 궤적을 나빠지게 만든 정확한 커밋을 알려줍니다.

GitHub 쪽에서는:

- **이슈(Issues)**는 이 분야의 집단적인 디버깅 기억입니다. ORB-SLAM3가 여러분의 OpenCV 버전에서 빌드에 실패한다면, 누군가는 이미 그것을 등록해 두었을 것입니다 — 이슈를 검색하는 것은 정당한 연구 역량입니다.
- 코드 리뷰가 딸린 **풀 리퀘스트(Pull requests)**는 연구실에서든 회사에서든 표준적인 협업 단위입니다.
- **포크(Forks)**를 통해 업스트림 프로젝트를 추적하면서도 여러분의 수정 사항(새로운 센서, 고쳐진 빌드)을 유지할 수 있습니다.
- **Actions**는 CI/CD와 연동됩니다: 매 푸시마다 자동으로 코드를 빌드하고 데이터셋 회귀 테스트를 실행합니다.

## 실험의 재현성 관리

SLAM 작업을 위한 실용적인 습관은 모든 실험을 커밋으로 취급하는 것입니다. 추정 시스템은 아주 작은 파라미터 변화에도 민감하며, "그 궤적을 얻었을 때 코드가 정확히 어떤 상태였는가?"에 답할 수 있는 능력이 재현 가능한 연구와 구전(folklore)을 구분합니다. 구체적으로는:

- **결과에 커밋을 새겨넣으세요** — 모든 출력 로그나 결과 파일명에 `git rev-parse --short HEAD`를 기록하세요(많은 프로젝트가 빌드 시점에 이를 바이너리에 굽습니다).
- **더러운(dirty) 트리로는 절대 벤치마크하지 마세요** — `git status --porcelain`이 비어 있지 않다면, 그 수치는 정의상 재현 불가능합니다. 먼저 커밋하거나 스태시(stash)하세요.
- **큰 바이너리는 히스토리에서 제외하세요** — 어휘집 파일, 네트워크 가중치, 데이터셋은 일반 커밋이 아니라 Git LFS나 외부 저장소에 두어야 합니다. 첫날부터 빌드 디렉터리와 데이터셋 경로를 `.gitignore`에 넣으세요.
- **설정도 코드와 함께 버전 관리하세요** — 특징 개수를 설정한 YAML은 C++ 코드만큼이나 실험의 일부입니다.

## SLAM에서의 의미

Git 없이는 현대 SLAM에 참여할 수 없습니다: 시스템을 얻는 것, 모든 벤치마크 수치 뒤의 정확한 코드 버전을 추적하는 것, 업스트림에 수정을 기여하는 것, 공유 코드베이스에서 협업하는 것 모두 Git을 통해 이루어집니다. 버전 관리 규율은 과학적 신뢰성과도 직접 연결됩니다 — 궤적 지표는 그것을 만들어낸 코드 상태를 복원할 수 있을 때만 의미가 있습니다.

## 관련 문서

- [CI/CD](ci-cd.md)
- [Docker](docker.md)
- [C++](cpp.md)
- [Bash/Linux](bash-linux.md)
