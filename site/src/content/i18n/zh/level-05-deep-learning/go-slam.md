# GO-SLAM

> Zhang 2023 · [论文](https://arxiv.org/abs/2309.02436)

**一句话总结** — 为神经隐式SLAM带来了在线回环检测与完整光束法平差:采用DROID-SLAM式的学习跟踪加全局关键帧图,以及一个随着位姿被全局校正而实时重新拟合的Instant-NGP SDF地图。

## 问题

神经隐式SLAM已经展示出令人瞩目的稠密重建结果,但iMAP/NICE-SLAM这一代系统只做局部优化:"由于缺乏全局在线优化,例如回环检测(LC)和全局光束法平差(BA),相机漂移误差会随着处理帧数的增加而累积,三维重建很快就会崩溃。"即便是与DROID-SLAM共享前端的NeRF-SLAM,也"缺乏在线回环检测和完整BA。"GO-SLAM的目标是构建一个能够实时地将位姿与重建联合进行全局优化的深度学习稠密SLAM框架——并在每次校正之后重新拟合神经地图,使轨迹与表面永不发散。

## 方法与架构

**前端跟踪与回环检测。** 一个基于RAFT的循环更新算子相对上一个关键帧计算光流;当平均光流超过$\tau_{flow}$时创建新关键帧。基于共视矩阵($N_{local} \times N_{KF}$)构建关键帧图$(\mathcal{V},\mathcal{E})$,其中共视度定义为关键帧对之间的平均刚性光流(光流高于$\tau_{co}=25$的对会被丢弃)。回环边按共视度降序从矩阵的历史部分采样,并施加半径为$r_{loop}=N_{local}/2$的邻域抑制;只有在连续三个候选都通过验证后,才接受一个回环。为保证实时优化,边数上限为$s_{edge}\cdot N_{local}$。所有边都输入DROID-SLAM的可微稠密光束法平差层,通过带阻尼的Gauss-Newton对位姿$\mathbf{G} \in SE(3)$和逐像素逆深度$\mathbf{d}$进行最小化:

$$\mathbf{E}(\mathbf{G},\mathbf{d})=\sum_{(i,j)\in\mathcal{E}}\bigl\lVert\mathbf{p}_{ij}^{*}-\Pi_{c}\bigl(\mathbf{G}_{ij}\circ\Pi_{c}^{-1}(\mathbf{p}_{i},\mathbf{d}_{i})\bigr)\bigr\rVert_{\Sigma_{ij}}^{2}, \qquad \Sigma_{ij}=\operatorname{diag}\,\mathbf{w}_{ij},$$

其中$\mathbf{p}^*_{ij}$为预测光流,$\mathbf{w}_{ij}$为其置信度,$\Pi_c$/$\Pi_c^{-1}$为投影/反投影。

**后端完整BA**在单独线程中,对*完整*的关键帧历史(拥有自己的高共视度加时间上相邻对的图,并以半径$r_{global}$抑制冗余)运行,由于回环检测已经消除了大部分误差,即使面对"多达数万输入帧"也依然高效。

**即时建图。** 建图线程会对所有关键帧的位姿/深度做一次快照,然后选择需要更新的关键帧:始终包括最新的两个关键帧以及任何尚未建图的关键帧,再加上自上次建图以来位姿变化最大的前10个关键帧,以及为防止遗忘而分层采样的10个关键帧。每个三维采样点$\mathbf{x}$经过多分辨率哈希编码(Instant-NGP);一个单层SDF MLP预测$\Phi(\mathbf{x}), \mathbf{g} = f_{\Theta_{sdf}}(\mathbf{x}, h_{\Theta_{hash}}(\mathbf{x}))$,一个双层颜色MLP根据SDF梯度$\mathbf{n}$预测$\Omega(\mathbf{x}) = f_{\Theta_{color}}(\mathbf{x}, \mathbf{n}, \mathbf{g})$。渲染采用NeuS风格的无偏体渲染,权重为$w_i = \alpha_i \prod_{j=1}^{i-1}(1-\alpha_j)$,其中

$$\alpha_{i}=\max\left(\frac{\sigma(\Phi(\mathbf{x}_{i}))-\sigma(\Phi(\mathbf{x}_{i+1}))}{\sigma(\Phi(\mathbf{x}_{i}))},\,0\right), \qquad \hat{\mathbf{c}}=\sum_{i=1}^{N_{ray}}w_{i}\,\Omega(\mathbf{x}_{i}), \quad \hat{\mathbf{D}}=\sum_{i=1}^{N_{ray}}w_{i}\,D_{i}^{ray}.$$

训练最小化$\mathcal{L}=\lambda_{c}\mathcal{L}_{c}+\lambda_{dep}\mathcal{L}_{dep}+\lambda_{eik}\mathcal{L}_{eik}+\lambda_{sdf}\mathcal{L}_{sdf}$(权重分别为1.0、1.0、0.1、1.0):一个L1颜色损失;一个按渲染深度方差降权的深度损失,$\mathcal{L}_{dep}=\frac{1}{M}\sum_{m}\lvert\mathbf{D}_{m}-\hat{\mathbf{D}}_{m}\rvert/\sqrt{\hat{\mathbf{D}}_{m}^{var}}$;一个Eikonal项;以及一个使用$\mathbf{b}(\mathbf{x}_i)=\mathbf{D}_m - D^{ray}_{m,i}$作为伪真值的SDF损失——在16 cm的截断带内为$\mathcal{L}_{near}=\lvert\Phi(\mathbf{x}_{i})-\mathbf{b}(\mathbf{x}_{i})\rvert$,而在自由空间中为松弛后的$\mathcal{L}_{free}=\max(e^{-\beta\Phi(\mathbf{x}_{i})}-1,\ \Phi(\mathbf{x}_{i})-\mathbf{b}(\mathbf{x}_{i}),\ 0)$,$\beta=5$。建图使用全局优化后的位姿/深度,*不再*做进一步精细化。同一框架同时支持单目($N_{local}=50$)、双目以及RGB-D($N_{local}=25$);网格通过对SDF做marching cubes得到。

## 实验结果

- **ScanNet**(长的真实序列,8个场景的平均ATE RMSE):单目为17.59 cm,相比DROID-SLAM的52.60,DROID-SLAM(纯VO)的63.61,以及ORB-SLAM3的119.74;RGB-D为7.02 cm,相比DROID-SLAM的7.15和NICE-SLAM的13.05。
- **消融实验**(ScanNet):不含LC/完整BA的基线为11.59 cm、30 FPS;+LC为8.83、20 FPS;+完整BA为7.11、12 FPS;两者都加上为7.02 cm、10 FPS——回环检测几乎"免费"地消除了大部分漂移。
- **Replica**(8个场景平均):RGB-D——ATE为0.34 cm,深度L1为3.38 cm,完整度比率88.09%,8 FPS,相比NICE-SLAM(ATE为1.95,L1为3.53,远低于1 FPS);单目——ATE为0.39 cm,深度L1为4.39 cm,相比同期NeRF-SLAM的4.49和NICER-SLAM的ATE 1.88。
- **TUM RGB-D**(RGB-D模式):在freiburg1/2/3各组上ATE分别为0.015 / 0.006 / 0.013 m,相比NICE-SLAM的0.027 / 0.018 / 0.030;在EuRoC双目上与最新的双目SLAM方法相当,同时还能提供稠密一致的重建结果。
- 硬件:RTX 3090,在Replica RGB-D上约占用15.6 GB GPU内存(最高18 GB),8 FPS;跳帧以2-8倍速运行时,F-score和ATE仅有极小的下降。

## 对SLAM的意义

GO-SLAM解决了神经渲染SLAM与ORB-SLAM等成熟系统之间最明显的差距:全局一致性。ScanNet单目数据(17.59对52.60 cm)展示了缺失回环检测在长轨迹上是多么灾难性的,而实时地图重拟合则证明了神经地图在位姿校正后不必是冻结不变的。它的DROID-SLAM前端加神经地图后端模式(与NeRF-SLAM共享,并补上了NeRF-SLAM所缺乏的全局优化)已成为全局一致稠密神经SLAM的标准方案,而对单目/双目/RGB-D的支持也使其成为更具部署价值的基于NeRF的系统之一。

## 相关条目

- [DROID-SLAM](droid-slam.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [Co-SLAM](co-slam.md)
- [iMAP](imap.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
