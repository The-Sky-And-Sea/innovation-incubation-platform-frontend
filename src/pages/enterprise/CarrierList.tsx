import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
  Table,
  Button,
  message,
  Drawer,
  Descriptions,
  Skeleton,
} from "antd";
import {
  BankOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  EyeOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getCarrierList, getCarrierDetail } from "../../api/carriers";
import type { CarrierInfo } from "../../types";

const { Title, Text } = Typography;

export default function EnterpriseCarrierList() {
  const [carriers, setCarriers] = useState<CarrierInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 详情抽屉
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierInfo | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getCarrierList(page, pageSize);
      setCarriers(res.data.list);
      setPagination(prev => ({
        ...prev,
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      }));
    } catch {
      message.error("加载载体列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(1, 10); }, [fetchList]);

  const viewDetail = async (id: number) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const res = await getCarrierDetail(id);
      setSelectedCarrier(res.data);
    } catch {
      message.error("加载载体详情失败");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ColumnsType<CarrierInfo> = [
    {
      title: "载体名称",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name: string) => (
        <Space>
          <BankOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 130,
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: "区域",
      dataIndex: "area",
      key: "area",
      width: 100,
      render: (a: string) => <Tag>{a}</Tag>,
    },
    {
      title: "联系人",
      dataIndex: "manager_name",
      key: "manager_name",
      width: 100,
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => viewDetail(record.id)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <BankOutlined style={{ marginRight: 8 }} />
        载体浏览
      </Title>

      <Card
        extra={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => fetchList(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={carriers}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`,
            onChange: (page, pageSize) => fetchList(page, pageSize),
          }}
          size="middle"
        />
      </Card>

      {/* 载体详情抽屉 */}
      <Drawer
        title={selectedCarrier?.name || "载体详情"}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedCarrier(null); }}
        width={480}
      >
        {detailLoading || !selectedCarrier ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label={<><BankOutlined /> 载体名称</>}>
              {selectedCarrier.name}
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag color="blue">{selectedCarrier.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={<><EnvironmentOutlined /> 所在区域</>}>
              {selectedCarrier.area}
            </Descriptions.Item>
            <Descriptions.Item label={<><EnvironmentOutlined /> 详细地址</>}>
              {selectedCarrier.address}
            </Descriptions.Item>
            <Descriptions.Item label={<><UserOutlined /> 联系人</>}>
              {selectedCarrier.manager_name}
            </Descriptions.Item>
            <Descriptions.Item label={<><PhoneOutlined /> 联系电话</>}>
              {selectedCarrier.contact_phone}
            </Descriptions.Item>
            <Descriptions.Item label={<><FileTextOutlined /> 简介</>}>
              {selectedCarrier.description}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}