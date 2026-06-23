
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
| 第 2 层 | 基础信息展示 | ⬜ |
| 第 3 层 | 文件管理 | 🚧 进行中 |
| 第 3.1 层 | ↳ 文件上传（API mock + FileUpload 组件 + 企业端页面） | ✅ |
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

### 项目结构

```
src/
├── api/           # API 层（mock 数据 + 后端对接）
│   ├── mock.ts    # Mock 工具
│   ├── auth.ts    # 认证 API
│   └── files.ts   # 文件 API
├── components/    # 公共组件
│   └── FileUpload.tsx  # 文件上传组件
├── hooks/         # 自定义 hooks
├── layouts/       # 布局
│   └── MainLayout.tsx  # 主布局（左右侧边栏 + 角色菜单）
├── pages/         # 页面
│   ├── auth/      # 登录/注册
│   ├── enterprise/  # 企业端（Dashboard, 文件管理）
│   ├── carrier/   # 载体端
│   └── gov/       # 政务端
├── router/        # 路由配置
├── store/         # zustand 状态管理
├── types/         # TypeScript 类型定义
└── utils/         # 工具函数（request 封装）
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
