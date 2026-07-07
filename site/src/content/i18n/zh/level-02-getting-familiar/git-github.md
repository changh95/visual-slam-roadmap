# Git/GitHub

Git 是几乎所有 SLAM 研究和产业代码所使用的版本控制系统;GitHub 则是这些代码存放的地方。SLAM 领域非常以开源为中心——你在后续等级中要学习的系统(ORB-SLAM3、VINS-Fusion、OpenVINS、DSO 及其他数百个系统)全部都是 GitHub 仓库,你的日常工作流将围绕克隆、构建和修改它们展开。

需要熟练掌握的核心 Git 技能:

- **日常循环**:`clone`、`status`、`add`、`commit`、`push`、`pull`。要小步且频繁地提交,提交信息要解释*为什么*这么做。
- **分支**:在分支上开发功能和实验;之后合并或 rebase 回去。对于研究工作而言,分支就是廉价的平行宇宙——每个实验想法一个分支。
- **阅读历史**:`log`、`diff`、`blame` 以及 `bisect`。`git bisect` 是 SLAM 调试的一大利器:当某个数据集上的精度出现回退时,bisect 能找出是哪个提交导致的。
- **子模块**:SLAM 仓库习惯将依赖项(DBoW2、g2o、Pangolin)作为子模块引入——要掌握 `git clone --recursive` 和 `git submodule update --init`。
- **标签与发布**:论文会引用特定版本;固定到某个标签是复现论文报告结果的方法。

你会输入无数次的克隆模式:

```bash
git clone --recursive https://github.com/<org>/<slam-system>.git
cd <slam-system>
git checkout <tag-from-the-paper>       # 固定到论文报告所用的确切版本
git submodule update --init --recursive # 以防 checkout 移动了子模块
```

以及一次性回本所有 Git 学习投入的调试模式——针对数据集指标的自动化二分查找:

```bash
git bisect start
git bisect bad HEAD          # 这里精度已经出问题
git bisect good <old-tag>    # ……而这里还是好的
git bisect run ./scripts/check_ate.sh   # 当 ATE 超过阈值时以非零状态退出
```

Git 会遍历历史,在每一步运行你的评估脚本,并交给你导致轨迹回退的确切提交。

在 GitHub 这一侧:

- **Issues** 是这个领域集体的调试记忆。当 ORB-SLAM3 无法针对你的 OpenCV 版本构建时,早已有人提交过相关 issue——搜索 issue 是一项正当的研究技能。
- 带有代码审查的**Pull request** 是标准的协作单元,在实验室和公司里都是如此。
- **Fork** 让你能够维护自己的修改(一个新传感器、一个修复过的构建),同时跟踪上游项目。
- **Actions** 挂接到 CI/CD:在每次推送时自动构建你的代码并运行数据集回归测试。

## 实验的可复现性卫生习惯

对 SLAM 工作而言一个务实的习惯是:把每一次实验都当作一个提交来对待。估计系统对微小的参数变化很敏感,能够回答"我得到那条轨迹时代码到底是什么样子"这个问题,正是可复现研究与传说轶事之间的分界线。具体做法:

- **用提交号给结果打上标记**——把 `git rev-parse --short HEAD` 写入每一个输出日志或结果文件名(许多项目在构建时就把它烘焙进二进制文件)。
- **绝不在脏树上做基准测试**——如果 `git status --porcelain` 的输出非空,那么这个数字从定义上就是不可复现的;先提交或 stash。
- **让大型二进制文件远离历史记录**——词汇文件、网络权重和数据集应该放在 Git LFS 或外部存储中,而不是普通提交里;从第一天起就把构建目录和数据集路径加入 `.gitignore`。
- **将配置与代码一起做版本管理**——设定特征数量的那份 YAML,和 C++ 代码一样,同样是实验的一部分。

## 对SLAM的意义

没有 Git,你无法参与现代 SLAM 研究:获取系统、追踪每一个基准数字背后的确切代码版本、向上游贡献修复,以及在共享代码库上协作,这些全都要通过它来完成。版本管理的严谨性也与科研可信度直接相关——只有当产生轨迹指标的代码状态是可恢复的,这些指标才真正有意义。

## 相关条目

- [CI/CD](ci-cd.md)
- [Docker](docker.md)
- [C++](cpp.md)
- [Bash/Linux](bash-linux.md)
