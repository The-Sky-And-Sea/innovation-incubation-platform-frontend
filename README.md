
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
| 第 2 层 | 基础信息展示（企业信息、载体浏览、政务综合查询：企业/载体实时搜索过滤） | ✅ |
| 第 3 层 | 文件管理（上传限制查询、拖拽上传、下载、删除、列表分页） | ✅ |
| 第 4 层 | 企业入驻（企业提交入驻申请表单弹窗 → 载体审核：通过/退回/拒绝 → 退回可重编） | ✅ |
| 第 5 层 | 审批组件抽象 + 重大事项变更（复用审批组件，自动更新企业字段） | ✅ |
| 第 6 层 | 政策兑现管理（政务创建模板/发布政策，企业/载体申报，AI 匹配度标注，载体审核，政务终审） | ✅ |
| 第 7 层 | 智能辅助申报（AI 分析动画 + 表单预填充，LLM 不可用时降级规则匹配） | ✅ |
| 第 8 层 | 绩效考核管理（政务创建模板/启动考核，载体提交，政务评分） | ✅ |
| 基础支撑 | SSE 通知机制（实时推送 16 种事件，心跳保活，已读标记） | ✅ |
| 基础支撑 | 载体端基础信息管理（可编辑名称/类型/地址/联系人） | ⬜ |

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
| 企业信息 | `/enterprise/info` | 查看 Descriptions 信息卡片（为入驻申请提供企业数据） |
| 文件管理 | `/enterprise/files` | 拖拽上传 → 列表分页 → 下载 → 删除（为入驻协议上传做准备） |
| 载体浏览 | `/enterprise/carriers` | 载体列表分页 → 点击查看详情 Drawer（入驻前选择目标载体） |
| 企业入驻 | `/enterprise/incubation` | 新建入驻申请弹窗（选载体+上传协议+选时间）→ 查看记录列表 → 状态标签 |
| 重大事项变更 | `/enterprise/changes` | 新建变更申请弹窗（选变更类型 + 填新值 + 上传文件[可选]）→ 记录列表 → 状态标签 |
| 政策申报 | `/enterprise/policies` | 可申报政策列表（AI 匹配度标签）+ Tabs 我的申报记录 → 点击申报填写 JSON → 提交 |
| 智能辅助申报 | `/enterprise/ai-assist` | AI 匹配度分析（Spin 动画 + Result）+ AI 表单预填充（Descriptions 展示） |

#### 4. 测试载体端功能（需以 carrier 角色重新登录）
| 菜单 | 路径 | 测试内容 |
|------|------|----------|
| 工作台 | `/carrier/dashboard` | 统计卡片展示 |
| 入驻审核 | `/carrier/incubation` | 待审核列表（预置 2 条 demo）→ 点击通过/拒绝/退回 → 输入审核意见 → 确认 |
| 变更审核 | `/carrier/changes` | 待审核变更列表（预置 1 条 demo）→ 点击通过/拒绝/退回 → 确认 |
| 企业申报审核 | `/carrier/policies` | 待审核企业申报列表 → AuditReview 审核 → 通过后流转政务 |
| 基础信息 | `/carrier/info` | 功能开发中 |
| 绩效考核 | `/carrier/performances` | 考核活动列表 → 提交申报（JSON 表单） |

#### 5. 测试政务端功能（需以 government 角色重新登录）
| 菜单 | 路径 | 测试内容 |
|------|------|----------|
| 工作台 | `/gov/dashboard` | 统计卡片展示 |
| 企业查询 | `/gov/enterprises` | 关键词实时搜索 → 查看企业详情 Drawer |
| 载体查询 | `/gov/carriers` | 关键词实时搜索 → 查看载体详情 Drawer |
| 政策管理 | `/gov/policies` | 发布政策弹窗（选模板+标题+额度+有效期+条件JSON+附件）→ 政策列表 |
| 申报终审 | `/gov/applications` | 载体已审的申报列表 → AuditReview 终审（通过/拒绝/退回） |
| 绩效考核 | `/gov/performances` | 启动考核弹窗 + 申报列表 + 评分审核（分数+通过/拒绝+评语） |

#### 6. 运行自动化测试
```bash
npm test                 # 一次性运行 43 个测试（4 组）
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

