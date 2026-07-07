# IMU noise model

生のIMU計測値は構造化された形で誤差を含む。(Woodmanの入門解説に従う)完全な誤差モデルには、バイアス、スケールファクタ誤差、軸間ミスアライメント、センサーごとの白色雑音が含まれる:

$$\tilde{\mathbf{a}} = \mathbf{a} + \mathbf{b}^a + \mathbf{S}^a\mathbf{a} + \mathbf{M}^a\mathbf{a} + \boldsymbol{\eta}^a, \qquad
\tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b}^g + \mathbf{S}^g\boldsymbol{\omega} + \mathbf{M}^g\boldsymbol{\omega} + \boldsymbol{\eta}^g$$

ここで $\mathbf{S}$ は(対角の)スケールファクタ誤差、$\mathbf{M}$ は軸間感度である。VIO推定器は $\mathbf{S}$ と $\mathbf{M}$ が工場またはオフラインのキャリブレーションで処理済みであると仮定し、オンラインの2項 — 加算的な**白色雑音**とゆっくり変化する**バイアス**のみを保持する:

$$\tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b}^g + \boldsymbol{\eta}^g \qquad
\tilde{\mathbf{a}} = \mathbf{a} + \mathbf{b}^a + \boldsymbol{\eta}^a$$

ここで $\boldsymbol{\eta}$ は平均ゼロの白色ガウス雑音であり、各バイアスは**ランダムウォーク**としてモデル化される: $\dot{\mathbf{b}} = \boldsymbol{\eta}^b$、これは独自の白色駆動雑音を持つ。

## この2項がなぜそれほど重要なのか

- **白色雑音はランダムウォーク的ドリフトへ積分される。** 白色ジャイロ雑音を積分すると、$\sigma\sqrt{t}$ のように成長する姿勢誤差(*角度ランダムウォーク*)が生じる; 加速度計雑音を2重積分すると、$t^{3/2}$ のように成長する位置誤差が生じる。これが、MEMS IMUによる純粋な慣性推測航法が数秒で発散する理由であり — カメラが必要とされる理由である。
- **バイアスは一定ではない。** 電源投入時バイアスは起動サイクルごとに異なり、動作中バイアスは時間や温度とともにゆっくり変動する。したがってVIO推定器は $\mathbf{b}^g, \mathbf{b}^a$ を*状態ベクトルに保持し*、これを継続的に推定する; ランダムウォークモデルは推定器にそれらをどのくらいの速さで変化させてよいかを伝える。

## 4つのパラメータとその単位

VIOの構成には(多くの場合軸ごとに、通常は共通の)4つの数値が必要である:

| パラメータ | 記号 | 典型的な連続時間の単位 |
|---|---|---|
| ジャイロ雑音密度(角度ランダムウォーク) | $\sigma_{\eta^g}$ | $\mathrm{rad/s/\sqrt{Hz}}$ |
| 加速度計雑音密度(速度ランダムウォーク) | $\sigma_{\eta^a}$ | $\mathrm{m/s^2/\sqrt{Hz}}$ |
| ジャイロバイアスランダムウォーク | $\sigma_{b^g}$ | $\mathrm{rad/s^2/\sqrt{Hz}}$ |
| 加速度計バイアスランダムウォーク | $\sigma_{b^a}$ | $\mathrm{m/s^3/\sqrt{Hz}}$ |

これらは*連続時間の密度*である。離散サンプリング間隔 $\Delta t$ で用いるには、計測雑音に対して $\sigma_{\eta,d} = \sigma_\eta / \sqrt{\Delta t}$、バイアス増分に対して $\sigma_{b,d} = \sigma_b \sqrt{\Delta t}$ という標準的な変換を行う — これは実装上の慢性的なバグの原因である(落とし穴の項を参照)。これら4つの数値は、EKFの共分散伝播やプレインテグレーションされたIMU因子の共分散へ直接投入される。つまり、推定器がカメラに対してIMUをどの程度信頼するかを決定する。

## Allan分散: パラメータの同定

**Allan分散**は、これらの雑音パラメータを長時間(数時間、温度安定)の静止ログから同定するための標準的な手法である。Allan偏差 $\sigma(\tau)$ を平均化時間 $\tau$ に対して両対数スケールでプロットすると、傾きによって雑音源を分離できる:

| 傾き | 雑音源 | パラメータ |
|---|---|---|
| $-1/2$ | 白色雑音(角度/速度ランダムウォーク) | $\sigma_{\eta}$(雑音密度、$\tau = 1\,\mathrm{s}$ で読み取る) |
| $0$(平坦な最小値) | バイアス不安定性 | — |
| $+1/2$ | バイアスランダムウォーク | $\sigma_{b}$(ランダムウォーク密度) |

このプロットから読み取れる4つの数値は、VINS-Mono、OpenVINS、Kimera-VIO、その他すべてのVIOシステムの設定ファイルが要求するパラメータそのものである。例えばKalibr形式の`imu.yaml`では:

```yaml
# continuous-time noise densities (example structure — measure your own values)
gyroscope_noise_density:     ...   # [rad/s/sqrt(Hz)]
gyroscope_random_walk:       ...   # [rad/s^2/sqrt(Hz)]
accelerometer_noise_density: ...   # [m/s^2/sqrt(Hz)]
accelerometer_random_walk:   ...   # [m/s^3/sqrt(Hz)]
update_rate: 200.0                 # [Hz]
```

`kalibr_allan`や`allan_variance_ros`といったツールが、ログ取得とフィッティングの手順を自動化する。実際には、振動、温度変化、スケールファクタの残差といったモデル化されていない影響を吸収するために、Allan分散から導かれた値よりもいくらか(しばしば数倍)大きな値が用いられることが多い。

## よくある落とし穴

- **単位の混同。** 連続時間の密度と離散時間の標準偏差(あるいはジャイロのデータシートにある $^\circ/\sqrt{\mathrm{h}}$ のような単位)を混在させると、IMUの重みが桁違いに誤って設定されてしまう。推定器がどの規約を期待しているか常に確認すること。
- **データシートの楽観主義。** メーカーの数値は防振ベンチ上で測定されている; クアッドロータのIMUはモーター振動を追加雑音のように受ける。可能なら実際のプラットフォーム上でログを取ること。
- **過信したパラメータ**はフィルタにIMUを過度に信頼させ、振動や高速運動下での発散を招く。**過度に悲観的な**パラメータはIMUの運動情報を捨ててしまい、視覚が失われた際の頑健性を損なう。両方の失敗モードがよく見られる; 意図的に調整すること。
- **短すぎるAllanログ。** $+1/2$ のバイアスランダムウォーク領域は大きな $\tau$ でのみ現れる; 10分のログではこれを同定できない。数時間にわたる静止記録が標準である。

## SLAMにおける意義
雑音モデルは、あなたのハードウェアと推定器の間の契約である: それはIMU因子の重みを視覚因子に対して相対的に決定する。楽観的すぎるパラメータはフィルタをIMUに過信させる(振動下での発散); 悲観的すぎるとIMUの運動情報を捨ててしまう。Allan分散プロットを実行し読み取れることは、実際のハードウェアでVIOをデプロイする誰にとっても基本的な実践スキルである。

## 関連ノート
- [Introduction to Inertial Navigation](introduction-to-inertial-navigation.md) — 誤差源を詳しく扱うWoodmanの入門解説。
- [IMU](../level-02-getting-familiar/imu.md) — センサー自体について。
- [IMU preintegration](imu-preintegration.md) — これらの雑音項が因子の共分散へ伝播していく場所。
- [OpenVINS](openvins.md) — 雑音パラメータのワークフローを明示的にしているシステム。
- [Multi-sensor calibration](../level-02-getting-familiar/multi-sensor-calibration.md) — スケール/ミスアライメント項を除去するオフラインキャリブレーション。
