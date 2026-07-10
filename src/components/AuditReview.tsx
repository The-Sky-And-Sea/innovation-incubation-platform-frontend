import { useState } from "react";
import { Button, Input, Modal, Space, message } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import type { AuditAction } from "../types";

const { TextArea } = Input;

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
  onReview: (action: AuditAction, comment: string) => Promise<void>;
  targetName?: string;
  size?: "small" | "middle" | "large";
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
      await onReview(currentAction, comment.trim() || "无");
      const cfg = REVIEW_ACTIONS.find((item) => item.action === currentAction);
      message.success(`${cfg?.label || "审核"}操作完成`);
      setModalOpen(false);
    } catch (err) {
      message.error((err as Error).message || "审核操作失败");
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = REVIEW_ACTIONS.find(
    (item) => item.action === currentAction,
  );

  return (
    <>
      <Space wrap size={[4, 4]}>
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
            <span>
              审核{currentConfig?.label}
              {targetName ? ` - ${targetName}` : ""}
            </span>
          </Space>
        }
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={loading}
        okText="确认审核"
        cancelText="取消"
        destroyOnClose
      >
        <TextArea
          rows={3}
          placeholder="请输入审核意见，未填写时将记录为“无”"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </>
  );
}
