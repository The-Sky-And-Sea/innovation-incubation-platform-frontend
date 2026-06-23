
## 创新创业孵化载体管理平台前端
使用 React + Tauri 构建的创新创业孵化载体管理平台的前端

### 技术栈
- React 19 + TypeScript
- Tauri 2（桌面端）
- Ant Design 6（UI 组件）
- react-router-dom v6（路由）
- zustand（状态管理）
- vitest + testing-library（测试）

### 开发进度

| 层级 | 功能 | 状态 |
|------|------|------|
| 第 0 层 | 前端工程基础（目录结构、类型定义、API 封装、路由、布局、zustand、测试框架） | ✅ |
| 第 1 层 | 认证模块（登录/注册页面、Mock API、authStore） | ✅ |
| 第 2 层 | 基础信息展示（企业信息、载体浏览、政务企业/载体检索） | ✅ |
| 第 3 层 | 文件管理（上传、下载、删除、列表分页） | ✅ |
| 第 4 层 | 企业入驻（单级审核） | ⬜ |
| 第 5 层 | 审批组件抽象 + SSE 通知 | ⬜ |
| 第 6 层 | 重大事项变更 | ⬜ |
| 第 7 层 | 政策管理 + 政策申报 | ⬜ |
| 第 8 层 | 绩效考核 + 账号注销 + AI | ⬜ |

### 运行命令

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器 (http://localhost:1420)
npm run build    # 构建
npm test         # 运行测试
npm run test:watch  # watch 模式
```

### 手动测试方法

> 当前所有 API 使用前端 Mock 数据，无需后端服务即可完整运行。

#### 1. 启动项目
```bash
npm run dev
```
浏览器打开 `http://localhost:1420`

#### 2. 测试登录/注册
- 打开页面后自动跳转 `/login`
- 选择角色「企业端」，输入**任意凭据+6位以上密码**即可登录（Mock 100% 成功）
- 点击「立即注册」切换到注册页，填写信息完成注册

#### 3. 测试企业端功能（以 enterprise 角色登录后）
| 菜单 | 路径 | 测试内容 |
|------|------|----------|
| 工作台 | `/enterprise/dashboard` | 统计卡片展示 |
| 企业信息 | `/enterprise/info` | 查看 Descriptions 信息卡片 |
| 文件管理 | `/enterprise/files` | 拖拽/点击上传文件 → 查看列表 → 下载 → 删除 |
| 载体浏览 | `/enterprise/carriers` | 载体列表 → 点击详情查看 Drawer |

#### 4. 测试政务端功能（需以 government 角色重新登录）
| 菜单 | 路径 | 测试内容 |
|------|------|----------|
| 工作台 | `/gov/dashboard` | 统计卡片展示 |
| 企业查询 | `/gov/enterprises` | 关键词搜索 → 查看详情 Drawer |
| 载体查询 | `/gov/carriers` | 关键词搜索 → 查看详情 Drawer |

#### 5. 运行自动化测试
```bash
npm test                 # 一次性运行 7 个测试
npm run test:watch       # watch 模式，修改文件自动重跑
```

### 项目结构

```
src/
├── api/           # API 层（mock 数据 + 后端对接，USE_MOCK=true 切换）
│   ├── mock.ts    # Mock 工具（mockApi / mockApiFail）
│   ├── auth.ts    # 认证 API（登录/注册/me）
│   ├── enterprise.ts  # 企业端 API（企业信息）
│   ├── carriers.ts    # 载体 API（列表/详情）
│   ├── files.ts       # 文件 API（上传限制/上传/列表/下载/删除）
│   └── gov.ts         # 政务端 API（企业搜索/载体搜索）
├── components/    # 公共组件
│   └── FileUpload.tsx  # 拖拽文件上传组件（校验/回显/移除）
├── hooks/         # 自定义 hooks
├── layouts/       # 布局
│   └── MainLayout.tsx  # 主布局（左右侧边栏 + 三角色动态菜单）
├── pages/         # 页面
│   ├── auth/      # 登录/注册
│   ├── enterprise/  # 企业端（Dashboard, 企业信息, 文件管理, 载体浏览）
│   ├── carrier/   # 载体端（Dashboard）
│   └── gov/       # 政务端（Dashboard, 企业检索, 载体检索）
├── router/        # 路由配置（GuestGuard/AuthGuard/RoleGuard 三层守卫）
├── store/         # zustand 状态管理（authStore）
├── types/         # TypeScript 类型定义（全平台请求/响应/枚举）
├── utils/         # 工具函数（request 封装：JWT 注入/错误码映射/超时）
└── __tests__/     # 测试（request 工具层 4 + LoginPage 组件 3）
```
</replace_in_file>
<task_progress>
- [x] 第 0 层 + 第 1 层（已完成）
- [x] 第 3 层 — 文件上传：API mock 层
- [x] 第 3 层 — 文件上传：FileUpload 组件
- [x] 第 3 层 — 文件上传：企业端文件管理页面
- [x] 第 3 层 — 文件上传：路由 + 菜单
- [x] 第 3 层 — 文件上传：更新 README
- [x] 第 3 层 — 文件上传：TypeScript 编译 + 测试
</task_progress>
