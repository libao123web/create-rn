# create-rn

创建独立的 **Expo + React Native + react-native-web + Tamagui** 项目，共用一套代码支持 **Android、iOS、Web/H5**。

当前版本 **0.1.0（尚未发布）**。Node 支持范围见 package.json：22.13+ 的 22.x、24.3+ 的 24.x、26.x、27+。不支持小程序。

## 使用

发布到公司私服后，可在任意目录运行，无需预先创建 package.json：

```bash
npx --registry=https://npm.gbuilderchina.com/ create-rn
npx --registry=https://npm.gbuilderchina.com/ create-rn my-app --yes
npx --registry=https://npm.gbuilderchina.com/ create-rn my-app --yes --app-name "我的应用" --app-id com.company.myapp -m pnpm
```

交互询问项目名、显示名、应用标识和包管理器；默认只生成文件，不自动安装、启动或预构建。模板随安装包分发，创建过程不需要访问 GitLab 或参考项目，且没有模板仓库鉴权要求。

创建后按提示执行，以 pnpm 为例：

```bash
cd my-app
pnpm install
pnpm dev
pnpm web
pnpm android
pnpm ios
```

android/ios 通过 Expo 生成并编译原生工程；Android 需 JDK/Android SDK，iOS 本地编译需 macOS/Xcode/CocoaPods。

Windows 的 app.config.ts 通过官方 expo-build-properties 插件选择 CMake 3.31.6，规避旧 Ninja 的长路径问题；其他系统使用默认配置。请在 Android Studio 安装该 SDK 工具版本，依据见 [Expo Windows 长路径文档](https://docs.expo.dev/troubleshooting/windows-long-paths/)。

## 参数

- `[project-name]`：当前目录下的直属子目录名，须为小写 npm 包名，不接受路径、Windows 保留名或已有 Git 仓库。
- `-y` / `--yes`：跳过问答，需项目名。非 TTY 提供项目名时也会自动使用默认值。
- `--app-name`：应用显示名，默认项目名。
- `--app-id`：Android package 与 iOS bundleIdentifier，须为反向域名，每段以字母开头且仅含字母数字，避开 Java/Kotlin 保留字。默认 com.example 加规范化项目名；发布前改成自己的标识。
- `-m` / `--package-manager`：npm、pnpm、yarn、bun，默认从调用者推断；交互时检测可用工具。
- `--force`：覆盖非空目标目录。先渲染临时模板，再备份替换；拒绝链接目录、已有 Git 仓库和危险路径。
- `--no-git`：不初始化 Git。默认尝试 git init，Git 不可用时仍保留创建结果并提示，不创建提交或 remote。
- `-h` / `--help`、`-v` / `--version`：帮助和版本，不触发文件写入或问答。

退出码：0 成功/取消，1 运行失败，2 参数误用。非 TTY 缺项目名立即退出 2，不等待输入。

## 生成项目

单包结构，三端共享代码，不引入多应用 workspace：

```text
App.tsx / index.ts       Expo 入口
app.config.ts           显示名、slug、scheme、Android/iOS 应用标识
src/app/                Provider 与错误边界
src/components/ui/      AppButton / AppText / AppInput / AppCard / Screen
src/features/           首页、外观设置；实际业务按功能扩展
src/navigation/         类型化 React Navigation、Web 路径与 deep link
src/theme/              语义颜色、Tamagui 配置、系统/浅色/深色
src/store/              Zustand 示例状态
src/config/             公开环境变量
src/services/           Axios 客户端，无业务响应或鉴权假设
```

主题切换同步组件、页面、导航、状态栏；首页包含计数和输入交互。基础 UI 采用 Tamagui 运行时模式，不默认引入动画编译器、MMKV、RTC、推送、相机等原生依赖。

Tamagui 官方配置的传递依赖可能由包管理器安装 Reanimated/Worklets；模板未启用其动画驱动，保留上游依赖树。安装后应提交所选包管理器的 lockfile。

平台专用功能按需增加 `.native.ts` / `.web.ts` 适配。`.env.example` 仅含可公开配置；不配置后端也能运行。模板不含参考项目的品牌资源、业务代码、服务器地址、签名或凭据。

生成项目有独立依赖和配置，不引用本地工作区或脚手架运行时。依赖按 Expo SDK 58 锁定，升级应使用 Expo 的依赖检查，避免单独升级 RN/React。

## 导出与原生构建

```bash
pnpm typecheck
pnpm lint
npx expo install --check
pnpm build:web
pnpm export:android
pnpm export:ios
```

Web 输出到 dist，Android/iOS 的 export 输出 JS 和资源到 dist-android/dist-ios，**不生成 APK/IPA**。原生二进制通过 `expo run:*` 生成的工程或自行配置的构建服务构建。证书与发布签名由应用维护者管理。

Web 是单页应用，静态服务器需要为 `/settings` 等路径配置 index.html 回退。详细扩展说明见生成项目 README。

## 本地开发与安装验证

```bash
pnpm install
pnpm dev my-app --yes --no-git
pnpm format-check
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm smoke:package
```

`smoke:package` 会真实打包，安装 tarball 到临时目录，再从无 package.json 且路径带空格的目录调用已安装 bin 和 npm exec 创建项目，检查模板与隐藏配置文件，最后清理临时文件。此过程不发布。

也可本地打包后安装使用：

```bash
pnpm build
pnpm pack
npm exec --yes --package=./create-rn-0.1.0.tgz -- create-rn demo --yes
```

CLI 格式化和 lint 集中在 vite.config.ts；生成应用独立使用 Expo 的 ESLint 配置。`templates` 和 bundle.js 都必须在发布包内；模板路径以安装入口为基准解析。

`pnpm install` 的 prepare 会配置 Git hooks，仓库内 `.vite-hooks/pre-commit` 在提交时运行 `vp staged`，规则同样来自 vite.config.ts。`.gitattributes` 将文本文件统一为 LF，使 Windows checkout 与格式检查保持一致，并确保钩子可由 shell 执行。

## 发布约束

**只允许公司 Verdaccio：`https://npm.gbuilderchina.com/`。禁止发布到 npmjs。** publishConfig.registry 已固定，不添加 access/provenance，不通过 CI 自动发布。凭据放用户级 ~/.npmrc，参考 .npmrc.example，不能提交。

提交、推送、打 tag 和发布按维护者的明确授权执行。发版前核对身份、版本、完整检查与目标 registry。

## 设计与参考

- [设计与源码分析](docs/superpowers/specs/2026-11-10-create-rn-design.md)
- [实现计划](docs/superpowers/plans/2026-11-10-create-rn.md)
- 创建流程参考 create-app；UI 封装与 src 分层参考 soulmate-app，未直接复制其业务依赖。
- [Expo 原生工程生成](https://docs.expo.dev/workflow/continuous-native-generation/)、[Expo Metro](https://docs.expo.dev/guides/customizing-metro/)、[Tamagui 安装](https://www.tamagui.dev/docs/intro/installation)。
