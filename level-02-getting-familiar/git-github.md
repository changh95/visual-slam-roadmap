# Git/GitHub

Git is the version-control system used by essentially all SLAM research and industry code; GitHub is where that code lives. SLAM is unusually open-source-centric — the systems you will study at later levels (ORB-SLAM3, VINS-Fusion, OpenVINS, DSO, and hundreds more) are all GitHub repositories, and your daily workflow will revolve around cloning, building, and modifying them.

The core Git skills to be fluent in:

- **The everyday loop**: `clone`, `status`, `add`, `commit`, `push`, `pull`. Commit small and often with messages that explain *why*.
- **Branching**: develop features and experiments on branches; merge or rebase back. For research, branches are cheap parallel universes — one per experiment idea.
- **Reading history**: `log`, `diff`, `blame`, and `bisect`. `git bisect` is a superpower for SLAM debugging: when accuracy regresses on a dataset, bisect finds the commit that broke it.
- **Submodules**: SLAM repositories habitually vendor dependencies (DBoW2, g2o, Pangolin) as submodules — know `git clone --recursive` and `git submodule update --init`.
- **Tags and releases**: papers reference specific versions; pinning to a tag is how you reproduce reported results.

The cloning pattern you will type hundreds of times:

```bash
git clone --recursive https://github.com/<org>/<slam-system>.git
cd <slam-system>
git checkout <tag-from-the-paper>       # pin the exact version being reported
git submodule update --init --recursive # in case the checkout moved submodules
```

And the debugging pattern that pays for all the Git learning at once — automated bisection against a dataset metric:

```bash
git bisect start
git bisect bad HEAD          # accuracy is broken here
git bisect good <old-tag>    # ...and was fine here
git bisect run ./scripts/check_ate.sh   # exits non-zero when ATE exceeds a threshold
```

Git walks the history, runs your evaluation script at each step, and hands you the exact commit that regressed the trajectory.

On the GitHub side:

- **Issues** are the collective debugging memory of the field. When ORB-SLAM3 fails to build against your OpenCV version, someone has already filed it — searching issues is a legitimate research skill.
- **Pull requests** with code review are the standard collaboration unit, in labs as much as in companies.
- **Forks** let you maintain your modifications (a new sensor, a fixed build) while tracking the upstream project.
- **Actions** hooks into CI/CD: automatically building your code and running dataset regression tests on every push.

## Reproducibility hygiene for experiments

A pragmatic habit for SLAM work: treat every experiment as a commit. Estimation systems are sensitive to tiny parameter changes, and being able to answer "what exactly was the code when I got that trajectory?" separates reproducible research from folklore. Concretely:

- **Stamp results with the commit** — write `git rev-parse --short HEAD` into every output log or result filename (many projects bake it into the binary at build time).
- **Never benchmark a dirty tree** — if `git status --porcelain` is non-empty, the number is unreproducible by definition; commit or stash first.
- **Keep large binaries out of history** — vocabulary files, network weights, and datasets belong in Git LFS or external storage, not regular commits; `.gitignore` build directories and dataset paths from day one.
- **Version configs with code** — the YAML that set the feature count is as much a part of the experiment as the C++.

## Why it matters for SLAM

You cannot participate in modern SLAM without Git: obtaining systems, tracking the exact code version behind every benchmark number, contributing fixes upstream, and collaborating on a shared codebase all run through it. Version discipline is also directly tied to scientific credibility — trajectory metrics only mean something when the code state that produced them is recoverable.

## Related

- [CI/CD](ci-cd.md)
- [Docker](docker.md)
- [C++](cpp.md)
- [Bash/Linux](bash-linux.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
