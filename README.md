# 创新创业孵化载体管理平台前端

使用 React + TypeScript + Vite + Tauri 构建的创新创业孵化载体管理平台前端。平台面向企业端、载体端、政务端三类用户，覆盖入驻、文件、政策申报、审核流转、绩效考核、通知和账号治理等业务流程。

## 技术栈

- React 19 + TypeScript
- Vite 5
- Tauri 2
- Ant Design 6
- react-router-dom v6
- zustand
- Vitest + Testing Library

## 环境说明

项目已支持 Mock 环境和真实接口环境切换。

```env
VITE_USE_MOCK=true
```

Mock 环境下：

- 登录页任意账号、任意密码都可以登录。
- 企业端、载体端、政务端都可以完整演示主要业务流。
- 不需要后端服务即可预览前端效果。

真实联调时：

- 将 `VITE_USE_MOCK=false`
- 配置真实 API 地址
- 前端接口形状已按最新 API 文档补齐

## 运行命令

```bash
npm install
npm run dev
npm test
npm run build
```

如果 `1420` 端口被系统占用或拒绝绑定，可以使用 Vite 默认端口：

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

## 首页（Landing Page）

首页采用 Mobbin 风格设计，包含以下区块：

- **Hero** — SVG 文字描边动画（"创新创业孵化载体管理平台"）+ 登录/注册入口按钮
- **业务库** — 模拟平台窗口界面，展示主体/事项/组件/流程分类，底部预览卡片
- **设计开发资源** — 设计资源卡片 + 开发资源卡片 + 四项设计原则（一致/有序/清晰/开放）
- **一个持续扩展的业务库** — 三端数据展示 + 浮动图标动画
- **几秒钟找到业务模式** — 四标签切换（页面/组件/流程/材料字段）+ 手机卡片轮播
- **工具平台 · 灵活丰富的生态平台** — 六个平台能力标签页（企业服务/载体协同/政务治理/数据归档/智能辅助/更多），切换时 Dashboard 面板和流程步骤联动展示
- **场景接入 · 三端协同接入场景** — 三张轮播卡片（企业端/载体端/政务端），支持左右切换和圆点指示器
- **平台用户会怎么使用** — 用户反馈卡片网格
- **别再让流程散在各处** — 跑马灯滚动条
- **Footer** — 左侧联系我们（GitHub/邮箱/微信图标 + 团队 brain_404 成员）、中间分形噪声水波动画、右侧更多生态产品/体验反馈（五星评分）

### 首页动画效果

- **导航栏浮现** — 页面加载后导航栏渐显
- **Hero 文字描边动画** — SVG 文字从描边到填充的循环动画
- **滚动浮现** — IntersectionObserver 驱动的标题和内容依次淡入
- **卡片波动** — 标签切换时手机卡片带延迟依次入场
- **深色/浅色模式切换** — `mix-blend-mode: difference` 覆盖层实现，circle clip-path 圆形展开动画
- **分形噪声水波动画** — SVG `feTurbulence` + `feDisplacementMap` 滤镜驱动下半圆形白色边框扰动效果

## 已完成功能

### 认证与角色

- 企业端、载体端、政务端三角色登录
- Mock 模式任意账号密码登录
- 企业、载体、政务三类注册表单
- 登录成功跳转过渡状态
- `/users/me` 用户信息接口对齐

### 企业端

- 企业工作台
- 企业基础信息
- 文件上传、下载、删除、分页列表
- 载体浏览
- 企业入驻申请
- 重大事项变更申请
- 政策申报
- 智能辅助申报
- 政策诉求
- 账号注销申请
- 通知中心

### 载体端

- 载体工作台
- 入驻审核
- 变更审核
- 基础信息维护
- 政策申报
- 企业申报审核
- 绩效考核提交
- 政策诉求
- 账号注销申请

### 政务端

- 政务工作台
- 企业查询
- 载体查询
- 孵化毕业备案
- 政策管理
- 申报终审
- 绩效考核管理
- 账号注销管理
- 政策诉求处理
- 通知中心

## 视觉与交互

- 企业端主色：深蓝 `#14508c`
- 载体端主色：绿色 `#0b7568`
- 政务端主色：红色 `#b83246`
- 登录页角色选中态与登录按钮跟随角色色
- 三端工作台主操作按钮与背景同色系但保留明显色差
- 载体端、政务端 hero 区域配色与右侧指标面板已协调
- 统计卡片、任务列表 hover 状态按角色色统一
- 深色/浅色模式切换（全局 `mix-blend-mode: difference` 覆盖层方案）
- 首页滚动触发浮现动画（IntersectionObserver）
- 场景轮播切换动画

## 页面路径

### 企业端

| 功能 | 路径 |
| --- | --- |
| 工作台 | `/enterprise/dashboard` |
| 企业信息 | `/enterprise/info` |
| 文件管理 | `/enterprise/files` |
| 载体浏览 | `/enterprise/carriers` |
| 企业入驻 | `/enterprise/incubation` |
| 重大事项变更 | `/enterprise/changes` |
| 政策申报 | `/enterprise/policies` |
| 智能辅助申报 | `/enterprise/ai-assist` |
| 政策诉求 | `/enterprise/appeals` |
| 账号注销申请 | `/enterprise/account-deletion` |
| 通知中心 | `/enterprise/notifications` |

### 载体端

| 功能 | 路径 |
| --- | --- |
| 工作台 | `/carrier/dashboard` |
| 入驻审核 | `/carrier/incubation` |
| 变更审核 | `/carrier/changes` |
| 基础信息 | `/carrier/info` |
| 政策申报 | `/carrier/policies` |
| 企业申报审核 | `/carrier/applications` |
| 绩效考核 | `/carrier/performances` |
| 政策诉求 | `/carrier/appeals` |
| 账号注销申请 | `/carrier/account-deletion` |

### 政务端

| 功能 | 路径 |
| --- | --- |
| 工作台 | `/gov/dashboard` |
| 企业查询 | `/gov/enterprises` |
| 载体查询 | `/gov/carriers` |
| 孵化毕业 | `/gov/incubation` |
| 政策管理 | `/gov/policies` |
| 申报终审 | `/gov/applications` |
| 绩效考核 | `/gov/performances` |
| 账号注销管理 | `/gov/account` |
| 政策诉求 | `/gov/appeals` |

## 验证命令

```bash
npm run build
npx vitest run
```

## 目录结构

```text
src/
  api/            API 封装与 Mock 数据
  components/     公共组件（BrandLogo, ClickSpark, MouseTrailGrid, FileUpload 等）
  layouts/        主布局和角色菜单
  pages/          企业端、载体端、政务端页面及首页
  router/         路由与权限守卫
  store/          zustand 状态管理
  types/          TypeScript 类型定义
  utils/          请求封装与业务展示工具
  __tests__/      自动化测试