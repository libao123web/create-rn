# 跨端应用

Expo + React Native + react-native-web + Tamagui，支持 Android、iOS、Web/H5。Node 版本需满足 package.json 的 engines。

## 开始开发

用创建时选择的包管理器安装依赖，再运行脚本。以下以 npm 为例，pnpm 用户可将 npm run 改为 pnpm：

```bash
npm install
npm run dev
npm run web
```

原生开发：先配置 Android Studio/JDK/Android SDK，或 macOS/Xcode/CocoaPods，再运行：

```bash
npm run android
npm run ios
```

这两个命令通过 Expo 自动生成并编译原生工程。iOS 本地编译只能在 macOS 上执行。Windows 可开发 Web 与 Android。Expo Go 可以辅助预览支持的模块；项目接入自定义原生模块后使用 development build。

Windows 预构建通过 expo-build-properties 选择 CMake 3.31.6，避免旧 Ninja 的长路径构建问题；请在 Android Studio 的 SDK Tools 安装该版本。该设置只在 Windows 启用，其他系统沿用 Expo 默认值。详见 [Expo Windows 长路径说明](https://docs.expo.dev/troubleshooting/windows-long-paths/)。

## 结构

- `src/components/ui`：统一按钮、文字、输入框、卡片和安全区域页面壳。
- `src/features`：按业务功能组织页面；首页和设置是可删除的运行示例。
- `src/theme`：语义颜色、Tamagui 配置、系统/浅色/深色主题。
- `src/navigation`：类型化页面、路径与 deep link。
- `src/store`：Zustand 示例状态，当前主题偏好不持久化。
- `src/services`、`src/config`：请求客户端与公开环境配置。

三端共用一套代码；原生专用能力通过 `.native.ts` / `.web.ts` 文件隔离，并为 Web 提供真实实现或明确不可用的接口。

Tamagui 是唯一 UI 库。页面优先从 `components/ui` 使用组件；修改 `theme/palette.ts` 和 `theme/config.ts` 即可统一外观。基础配置采用运行时模式，暂未启用静态编译器或动画驱动。

Tamagui 配置的上游依赖可能通过 peer 安装携带 Reanimated/Worklets，模板保留官方依赖树。数字 `lineHeight` 在 Tamagui v3 中表示字号倍数，例如 1.5，不要传 React Native 风格的绝对数值 24。

## 环境与请求

复制 `.env.example` 为 `.env`，按需设置 `EXPO_PUBLIC_API_URL`。`EXPO_PUBLIC_` 会进入客户端包，不能放密钥。未设置时示例页面仍可运行，不会发起任何后端请求。

需要请求时从 `src/services/api.ts` 调用 `createApiClient()`；自行定义接口类型、业务响应结构和鉴权策略。不要把令牌放进源码或公共环境变量。

## 应用配置与原生扩展

`app.config.ts` 集中管理显示名、slug、scheme、Android package 和 iOS bundleIdentifier。发布前将示例 `com.example.*` 改成自己的标识。

`npm run prebuild` 按配置生成 android/ios 工程。原生改动优先通过 Expo config plugin 管理；`expo prebuild --clean` 会重建原生目录，手动修改需自行维护。原生目录默认忽略，不携带开发者本地 SDK 路径、签名或凭据。

## 验证与导出

```bash
npm run typecheck
npm run lint
npx expo install --check
npm run build:web
npm run export:android
npm run export:ios
```

Web 输出到 dist，Android/iOS 导出输出到 dist-android/dist-ios。原生 export 只导出 JS 和资源，不生成 APK/IPA。二进制包通过本地原生工程或按需配置的构建服务生成，证书和签名自行管理。

Web 使用单页应用路径；部署静态服务器时，将未知页面路径回退到 index.html，确保刷新 `/settings` 可正常访问。

依赖已按 Expo SDK 配套锁定。升级先使用 Expo 的升级流程及 `expo install --check`，避免单独升级 React/RN。安装后提交所选包管理器生成的 lockfile。
