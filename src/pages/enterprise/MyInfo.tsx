import { useState, useEffect } from "react";
import { Card, Typography, Descriptions, message, Skeleton, Tag } from "antd";
import {
  IdcardOutlined,
  BankOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getMyEnterpriseInfo } from "../../api/enterprise";
import type { EnterpriseInfo } from "../../types";

const { Title } = Typography;

export default function EnterpriseMyInfo() {
  const [enterprise, setEnterprise] = useState<EnterpriseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyEnterpriseInfo()
      .then((res) => setEnterprise(res.data))
      .catch(() => message.error("加载企业信息失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <Title level={3}>
          <IdcardOutlined style={{ marginRight: 8 }} />
          我的企业信息
        </Title>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div>
        <Title level={3}>我的企业信息</Title>
        <Card>
          <p>暂无企业信息</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title level={3}>
        <IdcardOutlined style={{ marginRight: 8 }} />
        我的企业信息
      </Title>

      <Card
        style={{ maxWidth: 800 }}
        title={
          <>
            <BankOutlined style={{ marginRight: 8 }} />
            {enterprise.name}
          </>
        }
        extra={<Tag color="blue">{enterprise.scale}</Tag>}
      >
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          bordered
          size="middle"
        >
          <Descriptions.Item
            label={<><IdcardOutlined /> 统一社会信用代码</>}
          >
            {enterprise.credit_code}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><TeamOutlined /> 所属行业</>}
          >
            <Tag>{enterprise.industry || "-"}</Tag>
          </Descriptions.Item>

          <Descriptions.Item
            label={<><EnvironmentOutlined /> 企业地址</>}
            span={2}
          >
            {enterprise.address || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><UserOutlined /> 法定代表人</>}
          >
            {enterprise.legal_person || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><UserOutlined /> 联系人</>}
          >
            {enterprise.contact_name || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><PhoneOutlined /> 联系电话</>}
          >
            {enterprise.contact_phone || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><InfoCircleOutlined /> 企业规模</>}
          >
            {enterprise.scale || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}