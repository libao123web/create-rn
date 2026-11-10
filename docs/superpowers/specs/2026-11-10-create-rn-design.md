# create-rn 多端脚手架设计

日期：2026-11-10。状态：用户已确认，进入实施。本文是设计，不表示脚手架已经实现。

## 目标与已确认范围

将目前仅有 README 的 create-rn 做成可安装的 TypeScript CLI，像 create-app 一样，可以在没有 package.json 的任意工作目录创建独立的新项目。

用户已确认：

- 首版支持 Android、iOS、Web/H5；不兼容小程序。
- 采用 Expo + React Native + react-native-web + Tamagui。
- 参考 soulmate-app 的依赖组织、UI 封装和代码分层，提炼成可移植的通用项目。

首版不包含 soulmate 的聊天、RTC、Live2D、支付、推送、业务 API、服务器地址或发布凭据，不修改两个参考项目，不执行 commit、push 或 publish。

## 参考项目分析

### create-app：复用创建体验与工程约定

已检查 README.md、package.json、index.ts、utils/resolveOptions.ts、cloneTemplate.ts、directoryTraverse.ts、packageManager.ts、gitCredentials.ts 及相关测试。

- index.ts 负责问答与编排，utils 负责解析、目录操作、模板和后处理，CLI 与业务逻辑边界清楚。
- Node 内置 parseArgs、Clack、Execa、Picocolors 已覆盖所需功能；可以沿用其模式，不增加 CLI 框架。
- 有交互与非交互模式、目录覆盖保护、退出码 0/1/2、包管理器识别和后续命令提示。
- Rolldown 将入口与依赖打进 bundle.js；只向公司 Verdaccio 发布。
- 默认模板依赖 GitLab 网络与鉴权。RN 首版用内置模板，避免把 Git 网络和登录作为创建项目的前提。
- create-app 的 Vue 模板矩阵、Git 分支和内外网 CI 裁剪属于其产品，不照搬到 create-rn。

create-app 当前的本地模板复制会复制整个目录；create-rn 只复制明确纳入包内的模板文件。模板不能来自开发者机器上的 soulmate-app 路径。

### soulmate-app：复用分层，重新组织通用基础

已检查 mobile/package.json、入口、src/App.tsx、components/ui、theme、tamagui、navigation、services/api.ts、Metro/Webpack 配置及已跟踪的 iOS 文件。

- 运行栈是 React Native 0.88.0、React 19.3.1、react-native-web 0.21.4、Tamagui 3.1.1、React Navigation、Zustand、Axios。
- src/components/ui 汇总 AppButton、AppText、AppInput、卡片、弹层等；页面通过统一入口使用组件的做法值得保留。
- theme 与 tamagui 分离语义颜色、主题状态、Tamagui 配置；保留此边界，但删除品牌主题、日出日落和业务开关。
- features/services/store/hooks/config/types 的分工适合作为生成项目的基础结构。
- 原生与 Web 使用不同动画驱动，部分服务采用 .native/.web 文件；这种平台适配方式比页面中堆叠条件判断更适合模板。
- Webpack 中存在大量原生模块 shim、业务资源复制和特定后端代理；不能作为通用模板原样搬运。
- API 层绑定业务 envelope、登录生命周期、刷新令牌和特定配置；只借鉴分层，重新写通用请求入口。
- iOS 已跟踪文件中没有 Xcode project 和 Info.plist，不能直接把该目录视为已验证的完整 iOS 模板。
- Android 包名、品牌资源、构建参数、签名和服务器部署流程均属于 soulmate，不进入模板。

CodeGraph 已优先尝试，但两个参考仓库都没有索引；工具提示允许改用常规检索，本次没有自行建立索引。

## 方案比较与选择

1. **Expo + RN Web + Tamagui：用户已选择。** 用 Expo/Metro 管理三端入口与依赖组合，按配置生成原生工程，减少模板维护和重命名范围。需要自定义原生能力时通过 development build、config plugin 或预构建工程接入。
2. **React Native Community CLI + Webpack：未选择。** 更接近 soulmate 的现状，直接维护原生工程方便，但脚手架需要维护完整 Android/iOS 模板、重命名和两套 bundler。

在只生成一个跨端应用的前提下，采用单包结构，不引入 apps/packages workspace 或 Turborepo。三端共用页面、状态和组件，不分别生成三个应用。

## CLI 契约

建议用法（实现并发布后可用，当前尚不可用）：

```bash
npx --registry=https://npm.gbuilderchina.com/ create-rn
npx --registry=https://npm.gbuilderchina.com/ create-rn my-app --yes
npx --registry=https://npm.gbuilderchina.com/ create-rn my-app --yes --app-name "My App" --app-id com.company.myapp -m pnpm
```

- `[project-name]`：创建当前工作目录下的直属子目录；不接受路径、当前目录、父目录、Windows 设备名或不合法的 npm 包名。
- `--yes` / `-y`：使用默认值，跳过问答；要求提供项目名，避免 CI 等待输入。
- `--app-name`：应用显示名；默认项目名。
- `--app-id`：Android applicationId 与 iOS bundleIdentifier，采用两端兼容的反向域名格式；默认 `com.example.<移除分隔符后的安全项目名>`，必要时增加字母前缀。
- `-m` / `--package-manager`：npm、pnpm、yarn、bun；识别调用者和本机可用工具，用于显示正确命令。
- `--force`：允许覆盖指定子目录内的旧文件；必须先校验完整目标路径，拒绝符号链接、危险路径和已有 Git 仓库，非交互模式缺少该参数时拒绝覆盖。
- `--no-git`：跳过 git init；默认在 Git 可用时初始化，否则给出提示并保留生成结果。
- `--help` / `-h`、`--version` / `-v`：不触发问答、目录写入或包管理器检测。

交互顺序为项目名、显示名、应用 ID、包管理器、必要的目录覆盖确认；Ctrl+C 取消退出 0。非 TTY 不进入问答，提供项目名即使用默认值，缺项目名退出 2。

退出码沿用 create-app：0 成功或取消，1 文件/运行失败，2 参数误用。

首版只有一套内置 Tamagui 模板，不增加无实际区别的 example 选项，也不提供 Git URL、Git 分支、多端裁剪或 CI 部署选项。

默认仅创建文件和初始化 Git，不自动安装依赖、启动应用或自动预构建。成功提示完整输出 cd、install、dev、web、android、ios 命令。包管理器由用户选择或自动识别，不把用户机器的绝对路径写入项目。

## 脚手架仓库结构

```text
create-rn/
  index.ts
  utils/
    resolveOptions.ts
    createProject.ts
    directory.ts
    packageManager.ts
    renderTemplate.ts
  templates/
    expo-tamagui/
  __test__/
  package.json
  rolldown.config.ts
  vite.config.ts
  tsconfig.json
  README.md
```

依赖和工具尽量与 create-app 一致：Clack、Execa、Picocolors、Rolldown、TypeScript、Vitest、vite-plus。格式化和 CLI lint 统一在 vite.config.ts 配置。

发布包的 bin 为 create-rn，入口为带 shebang 的 bundle.js。files 白名单同时包含 bundle.js 和 templates；只打包 bundle.js 会造成安装后找不到模板，必须用真实 tarball 验证。

模板路径以已安装入口的 import.meta.url 为基准解析，不能以 process.cwd()、源代码工作区或绝对开发路径为基准。

模板中的 `_gitignore` 在生成时还原为 `.gitignore`，避免 npm 打包时把模板忽略文件当成包级过滤规则。允许列入发布包的环境文件只有无凭据的 `.env.example`。

## 生成项目结构与功能

```text
my-app/
  App.tsx
  index.ts
  app.config.ts
  package.json
  tsconfig.json
  metro.config.js
  .env.example
  .gitignore
  README.md
  src/
    app/                 # Provider 组合、错误边界
    components/ui/       # AppButton/AppText/AppInput/AppCard/Screen
    features/
      home/              # 欢迎、状态计数和组件展示
      settings/          # 系统/浅色/深色主题选择
    navigation/          # 类型化导航、Web 路径和链接配置
    theme/               # 语义 token、主题偏好和 Tamagui 配置
    services/            # 通用请求客户端，不自动请求后端
    store/               # Zustand 示例状态
    platform/            # 必要的 .native/.web 适配
    config/              # 公开环境配置
    hooks/
    types/
    utils/
```

只创建实际有用途的文件，不用空目录和占位文档扩大结构。目录命名参考 soulmate，入口保持标准 Expo 应用结构。

### UI、导航与状态

- Tamagui 是唯一主 UI 库。页面经 components/ui 使用语义组件，业务页面不耦合组件内部实现。
- 提供按钮的 loading/disabled、输入框、文字、卡片和包含安全区域的页面壳；首页实际使用这些组件，形成可运行示例。
- 使用单一语义主题源，支持跟随系统、浅色、深色；Provider 与页面背景、状态栏一致。首版主题偏好保存在应用状态，不为一个设置引入原生持久化依赖；后续可用统一存储适配扩展。
- 使用 React Navigation，延续 soulmate 的类型化导航方式，提供首页、设置页和 Web 链接配置；避免为文件路由额外引入另一套目录规范。
- Zustand 提供小型状态示例，不加入登录、令牌或任何业务实体。
- 首版不启用 Reanimated/Worklets 动画驱动，不添加 MMKV、相机、推送、RTC 或业务图标全集。Tamagui 基础组件采用运行时配置；实际验证发现 @tamagui/config 的上游依赖会通过 npm peer 安装携带 Reanimated/Worklets，保留官方依赖树，不用强制裁剪绕过兼容检查。

### 请求与平台边界

- 采用与 soulmate 相同的 Axios，但重新定义通用客户端入口，支持配置 baseURL、超时与清晰错误传递，不预设业务响应结构、登录态或刷新令牌。
- `.env.example` 只示范可公开的 `EXPO_PUBLIC_API_URL`；未配置时首页正常运行，不发请求。
- 不把密钥、签名材料和私服 token 写到客户端或模板。
- 原生专用模块仅通过平台文件/适配接口导入，Web 打包不能靠静默空 shim 假装支持能力。

### 应用配置与脚本

生成时同步设置 npm 包名、Expo name/slug、URL scheme、Android package、iOS bundleIdentifier。项目标识只在明确的模板文本或 JSON 字段替换，不在二进制和所有文件中全局字符串替换。

约定脚本：dev/start、web、android、ios、build:web、export:android、export:ios、prebuild、typecheck、lint。android/ios 使用 Expo 的本地原生运行流程；dev/web 可以独立启动开发服务。Web 产物通过 `expo export --platform web` 生成；原生 export 是 JS 与资源导出，不能称为 APK/IPA 构建。

依赖采用实现时验证通过的固定版本组合。2026-11-10 从 npm 元数据确认：Expo 58.0.23，官方 blank TypeScript 模板 58.0.32 使用 React 19.3.0、RN 0.88.1；Tamagui 最新版本为 3.3.1。这是实现的候选基线，不直接照抄 soulmate 的版本，也不单独升级 React/RN 破坏 Expo 兼容矩阵。Web、导航等依赖继续按该 SDK 核对。

Node 版本以 Expo 58 的实际 engines 为准：首版至少 Node 22.13，且 README 与 engines 一致，不只笼统沿用 create-app 的 Node >=22。

## 创建过程与文件保护

1. 解析并完整校验参数；帮助和版本提前退出。
2. 补齐交互输入和默认值；非交互不等待提示。
3. 检查目标是当前目录下的安全直属子目录，拒绝符号链接目标、已有 Git 仓库和同名文件。
4. 在受控临时目录渲染内置模板并校验关键文件、JSON、模板标记和应用配置。
5. 新目录不存在时移动到最终目录；覆盖时先备份旧目录，再替换，失败恢复原目录，成功后清理备份。每个递归清理/移动前均检查解析后绝对路径属于本次创建范围。
6. 按设置尝试 git init；没有 Git 不阻止创建，Git 失败清晰提示且保留文件。不创建提交或 remote。
7. 打印实际使用的项目名、平台和可执行的后续命令。

可移植指的是发布包与生成结果都不引用开发者工作区：安装与生成可离开本仓库运行；生成后是独立项目，不依赖 create-rn 运行，不通过 file:、link: 或 workspace: 回指模板仓库。

## 发布约束

- 沿用公司私有发布策略，package.json 的 publishConfig.registry 固定为 `https://npm.gbuilderchina.com/`。
- 不添加 access、provenance 或自动发布 CI；本次仅完成实现与本地打包验证。
- 私服认证仅在用户级配置；生成的应用依赖是公开包，不要求复制公司发布 token，也不无故把模板的 registry 绑定到私服。
- 初版版本号由实现阶段设为 0.1.0，并在 README 标记为未发布；本次不占用或假设私服已经存在该包。

## 验收与验证限制

CLI 必须通过 format-check、lint、test、typecheck、build。重点测试：参数/默认值、非 TTY、取消退出码、Windows 名称和路径、覆盖失败恢复、应用标识一致性、模板标记完全替换、包管理器命令。

必须执行真实发布包可移植性验证：pack 出 tarball → 在独立临时工作目录安装该 tarball → 从无 package.json 的父目录运行安装后的 bin 创建项目 → 检查 .gitignore/.env.example/模板文件 → 验证没有本地路径引用。此过程不 publish。

生成项目安装依赖后执行 TypeScript 和 lint；Web 生产导出、Android/iOS JS bundle 导出都要跑通。浏览器检查 Web 首屏、导航、主题切换和示例交互。

原生二进制编译另行记录：Windows 可以在 Android SDK/JDK 可用时验证 Android 构建；iOS 本地编译需要 macOS/Xcode。若环境缺少对应工具，只声明已验证 JS 导出与配置，不声明已经在设备上验证 Android/iOS。配置预构建检查也不能替代原生编译或真机验证。

## 官方依据

- Expo 原生工程生成与本地运行：https://docs.expo.dev/workflow/continuous-native-generation/
- Expo 的 Metro 配置：https://docs.expo.dev/guides/customizing-metro/
- Tamagui 安装、版本要求与运行时能力：https://www.tamagui.dev/docs/intro/installation

## 实施状态

用户已确认本设计并授权实施，具体步骤见相邻 plans 目录。集成验证中补充了 Windows 专用的 expo-build-properties 配置：CMake 3.31.6 只在 Windows 预构建启用，避免旧 Ninja 长路径问题，不影响其他平台的默认工具链。
