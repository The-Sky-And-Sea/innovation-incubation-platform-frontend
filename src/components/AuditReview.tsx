/**
 * 通用审批审核组件
 *
 * 提供通过/拒绝/退回三种审核操作，含审核意见输入弹窗。
 * 复用场景：入驻审核、变更审核、政策申报审核、绩效考核评分审核
 */

import { useState } from "react";
import { Button, Modal, Input, Space, message } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import type { AuditAction } from "../types";

const { TextArea } = Input;

/** 审核操作配置 */
interface ReviewActionConfig {
  action: AuditAction;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  type?: "primary" | "default";
}

const REVIEW_ACTIONS: ReviewActionConfig[] = [
  {
    action: "approve",
    label: "通过",
    icon: <CheckCircleOutlined />,
    type: "primary",
  },
  {
    action: "reject",
    label: "拒绝",
    icon: <CloseCircleOutlined />,
    danger: true,
  },
  {
    action: "return",
    label: "退回",
    icon: <RollbackOutlined />,
  },
];

interface AuditReviewProps {
  /** 审核后的回调，传入 action 和 comment */
  onReview: (action: AuditAction, comment: string) => Promise<void>;
  /** 审核对象名称（用于弹窗标题），如 "入驻申请 #201" */
  targetName?: string;
  /** 按钮尺寸 */
  size?: "small" | "middle" | "large";
  /** 审核通过后的提示文本（可选，如 "已通过"） */
  successLabel?: string;
}

export default function AuditReview({
  onReview,
  targetName = "",
  size = "small",
}: AuditReviewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<AuditAction | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const openModal = (action: AuditAction) => {
    setCurrentAction(action);
    setComment("");
    setModalOpen(true);
  };

  const handleOk = async () => {
    if (!currentAction) return;
    setLoading(true);
    try {
      await onReview(currentAction, comment || "无");
      const cfg = REVIEW_ACTIONS.find((a) => a.action === currentAction);
      message.success(`${cfg?.label || "审核"}操作完成`);
      setModalOpen(false);
    } catch (err) {
      message.error((err as Error).message || "审核操作失败");
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = REVIEW_ACTIONS.find(
    (a) => a.action === currentAction,
  );

  return (
    <>
      <Space>
        {REVIEW_ACTIONS.map((cfg) => (
          <Button
            key={cfg.action}
            size={size}
            type={cfg.type || "default"}
            danger={cfg.danger}
            icon={cfg.icon}
            onClick={() => openModal(cfg.action)}
          >
            {cfg.label}
          </Button>
        ))}
      </Space>

      <Modal
        title={
          <Space>
            {currentConfig?.icon}
            审核{currentConfig?.label}
            {targetName && ` — ${targetName}`}
          </Space>
        }
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={loading}
        okText="确认审核"
        cancelText="取消"
      >
        <TextArea
          rows={3}
          placeholder="请输入审核意见（选填）"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </>
  );
}