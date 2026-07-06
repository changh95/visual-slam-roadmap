# Git/GitHub

Git is the version-control system used by essentially all SLAM research and industry code; GitHub is where that code lives. SLAM is unusually open-source-centric — the systems you will study at later levels (ORB-SLAM3, VINS-Fusion, OpenVINS, DSO, and hundreds more) are all GitHub repositories, and your daily workflow will revolve around cloning, building, and modifying them.

The core Git skills to be fluent in:

- **The everyday loop**: `clone`, `status`, `add`, `commit`, `push`, `pull`. Commit small and often with messages that explain *why*.
- **Branching**: develop features and experiments on branches; merge or rebase back. For research, branches are cheap parallel universes — one per experiment idea.
- **Reading history**: `log`, `diff`, `blame`, and `bisect`. `git bisect` is a superpower for SLAM debugging: when accuracy regresses on a dataset, bisect finds the commit that broke it.
- **Submodules**: SLAM repositories habitually vendor dependencies (DBoW2, g2o, Pangolin) as submodules — know `git clone --recursive` and `git submodule update --init`.
- **Tags and releases**: papers reference specific versions; pinning to a tag is how you reproduce reported results.

On the GitHub side:

- **Issues** are the collective debugging memory of the field. When ORB-SLAM3 fails to build against your OpenCV version, someone has already filed it — searching issues is a legitimate research skill.
- **Pull requests** with code review are the standard collaboration unit, in labs as much as in companies.
- **Forks** let you maintain your modifications (a new sensor, a fixed build) while tracking the upstream project.
- **Actions** hooks into CI/CD: automatically building your code and running dataset regression tests on every push.

A pragmatic habit for SLAM work: treat every experiment as a commit. Estimation systems are sensitive to tiny parameter changes, and being able to answer "what exactly was the code when I got that trajectory?" separates reproducible research from folklore.

## Why it matters for SLAM

You cannot participate in modern SLAM without Git: obtaining systems, tracking the exact code version behind every benchmark number, contributing fixes upstream, and collaborating on a shared codebase all run through it. Version discipline is also directly tied to scientific credibility — trajectory metrics only mean something when the code state that produced them is recoverable.

## Related

- [CI/CD](ci-cd.md)
- [Docker](docker.md)
- [C++](cpp.md)
- [Bash/Linux](bash-linux.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
