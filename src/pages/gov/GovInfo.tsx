import { Card, Descriptions, Space, Tag, Typography } from "antd";
import {
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";

const { Title, Text } = Typography;

const permissionModules = ["政策管理", "申报终审", "绩效考核", "账号治理", "政策诉求"];

export default function GovInfoPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <Title level={3}>
        <IdcardOutlined style={{ marginRight: 8 }} />
        政务信息
      </Title>

      <Card className="info-overview-card" style={{ marginBottom: 16 }}>
        <div className="info-overview-grid">
          <section className="info-overview-lead">
            <span className="info-overview-icon">
              <SafetyCertificateOutlined />
            </span>
            <div>
              <Typography.Text type="secondary">当前政务账号</Typography.Text>
              <strong>{user?.name || "政务账号"}</strong>
              <small>科技管理部门 · 平台政务辖区</small>
            </div>
          </section>
          <section className="info-overview-metrics">
            <div>
              <span>职责范围</span>
              <strong>政策、申报、绩效与账号治理</strong>
            </div>
            <div>
              <span>权限模块</span>
              <Space wrap size={[6, 6]}>
                {permissionModules.map((item) => (
                  <Tag key={item} color="red">
                    {item}
                  </Tag>
                ))}
              </Space>
            </div>
          </section>
        </div>
      </Card>

      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            <span>{user?.name || "政务账号"}</span>
          </Space>
        }
        extra={<Tag color="red">政务端</Tag>}
      >
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="middle">
          <Descriptions.Item
            label={
              <>
                <UserOutlined /> 账号名称
              </>
            }
          >
            {user?.name || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <>
                <TeamOutlined /> 角色身份
              </>
            }
          >
            政务端
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <>
                <TrophyOutlined /> 岗位职责
              </>
            }
          >
            申报终审、政策发布、绩效监管
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <>
                <PhoneOutlined /> 联系电话
              </>
            }
          >
            {user?.phone || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <>
                <MailOutlined /> 邮箱
              </>
            }
          >
            {user?.email || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <>
                <IdcardOutlined /> 用户编号
              </>
            }
            span={2}
          >
            <Text code>{user?.id || "-"}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
