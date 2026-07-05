/**
 * 企业端 — 对话助手
 *
 * 直接渲染 ChatPanel 共享组件。
 * 企业端和载体端共用同一个 ChatPanel，后端根据 JWT 中的 role 自动区分权限。
 */

import ChatPanel from "../../components/ChatPanel";

export default function EnterpriseChat() {
  return <ChatPanel />;
}