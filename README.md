# 创新创业孵化载体管理平台前端

使用 React + TypeScript + Vite + Tauri 构建的创新创业孵化载体管理平台前端。平台面向企业端、载体端、政务端三类用户，覆盖入驻、文件、政策申报、审核流转、绩效考核、通知和账号治理等业务流程。

## 技术栈

- React 19 + TypeScript
- Vite
- Tauri 2
- Ant Design 6
- react-router-dom v6
- zustand
- Vitest + Testing Library

## 当前分支

当前开发分支：`fix/test-harmony`

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

## 最新调整说明

### API 对齐

已根据最新 API 文档补齐前端接口，包括：

- 认证登录、注册、当前用户
- 企业、载体、政务三端业务接口
- 文件接口字段兼容
- 通知分页与已读接口
- 政策搜索、申报、关注、审核接口
- AI 政策匹配与表单预填充接口

### 智能政策检索

企业端智能辅助申报页面支持：

- 政策语义搜索
- 显示后端返回的 AI 分析
- 将 AI 分析中的 `[1]`、`[6]` 等政策编号渲染为可点击标记
- 点击编号后自动跳转并高亮对应政策结果
- Mock 模式内置 10 条政策结果用于演示

### 业务化表单

所有面向用户的申报、审核和配置页面已去除 JSON 填写或 JSON 展示。

现在用户看到的是业务字段：

- 政策发布：申报条件、兑现标准、办理流程、材料清单
- 企业政策申报：项目名称、联系人、申请金额、材料勾选、补充说明
- 载体政策申报：联系人、材料勾选、服务情况说明
- 绩效申报：服务企业数量、创业活动数量、年度营收、孵化成果说明
- 绩效模板：通过勾选配置考核指标
- 审核列表：展示材料名或业务摘要，不展示对象字符串
- 变更详情：展示可读的新旧值说明

底层请求仍然会在提交时整理成后端需要的结构化数据。

### 视觉与交互

- 企业端主色：深蓝
- 载体端主色：绿色
- 政务端主色：红色
- 登录页角色选中态与登录按钮跟随角色色
- 三端工作台主操作按钮与背景同色系但保留明显色差
- 载体端、政务端 hero 区域配色与右侧指标面板已协调
- 统计卡片、任务列表 hover 状态按角色色统一

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

本轮提交前已通过：

```bash
npx vitest run src/__tests__/comprehensive.test.ts src/__tests__/api-documentation-alignment.test.ts
npm run build
```

完整测试可执行：

```bash
npm test
```

## 目录结构

```text
src/
  api/            API 封装与 Mock 数据
  components/     公共组件
  layouts/        主布局和角色菜单
  pages/          企业端、载体端、政务端页面
  router/         路由与权限守卫
  store/          zustand 状态管理
  types/          TypeScript 类型定义
  utils/          请求封装与业务展示工具
  __tests__/      自动化测试
```
