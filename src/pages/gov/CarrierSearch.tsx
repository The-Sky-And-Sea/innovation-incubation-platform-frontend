import { useState, useCallback, useEffect } from "react";
import { Card, Typography, Space, Tag, Table, Button, Input, message, Drawer, Descriptions, Skeleton, Modal } from "antd";
import { BankOutlined, SearchOutlined, EyeOutlined, EnvironmentOutlined, UserOutlined, PhoneOutlined, FileTextOutlined, ReloadOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { deleteCarrier, searchCarriers } from "../../api/gov";
import type { CarrierInfo } from "../../types";

const { Title, Text } = Typography;

export default function GovCarrierSearch() {
  const [carriers, setCarriers] = useState<CarrierInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<CarrierInfo | null>(null);

  const fetchList = useCallback(async (kw = keyword, page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await searchCarriers(kw, page, pageSize);
      setCarriers(res.data.list);
      setPagination(prev => ({ ...prev, current: res.data.page, pageSize: res.data.page_size, total: res.data.total }));
    } catch {
      message.error("查询失败");
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  // 页面加载时自动获取数据
  useEffect(() => {
    fetchList(keyword, 1, pagination.pageSize);
  }, []);

  const viewDetail = (c: CarrierInfo) => { setSelected(c); setDrawerOpen(true); };

  const handleDelete = (record: CarrierInfo) => {
    Modal.confirm({
      title: "确认删除载体？",
      content: `将删除「${record.name}」，该操作会调用政务端删除接口。`,
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        await deleteCarrier(record.id);
        message.success("载体已删除");
        fetchList(keyword, pagination.current, pagination.pageSize);
      },
    });
  };

  const columns: ColumnsType<CarrierInfo> = [
    { title: "载体名称", dataIndex: "name", key: "name", width: 200, render: (n: string) => <Space><BankOutlined /><Text strong>{n}</Text></Space> },
    { title: "类型", dataIndex: "type", key: "type", width: 130, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: "区域", dataIndex: "area", key: "area", width: 100, render: (a: string) => <Tag>{a}</Tag> },
    { title: "联系人", dataIndex: "manager_name", key: "manager", width: 100 },
    { title: "操作", key: "action", width: 130, render: (_, r) => (
      <Space>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r)}>详情</Button>
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)}>删除</Button>
      </Space>
    ) },
  ];

  return (
    <div>
      <Title level={3}><BankOutlined style={{ marginRight: 8 }} />载体检索</Title>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input.Search placeholder="按名称/地址关键词搜索" value={keyword} onChange={e => setKeyword(e.target.value)} onSearch={(v) => fetchList(v, 1, pagination.pageSize)} style={{ width: 320 }} allowClear enterButton={<><SearchOutlined /> 搜索</>} />
          <Button icon={<ReloadOutlined />} onClick={() => fetchList(keyword, pagination.current, pagination.pageSize)}>刷新</Button>
        </Space>
      </Card>
      <Table columns={columns} dataSource={carriers} rowKey="id" loading={loading}
        pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: ["5","10","20"], showTotal: (t, r) => `${r[0]}-${r[1]} / 共 ${t} 条`, onChange: (p, ps) => fetchList(keyword, p, ps) }}
        size="middle" />
      <Drawer title={selected?.name || "载体详情"} open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelected(null); }} width={480}>
        {!selected ? <Skeleton active paragraph={{ rows: 6 }} /> : (
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label={<><BankOutlined /> 载体名称</>}>{selected.name}</Descriptions.Item>
            <Descriptions.Item label="类型"><Tag color="blue">{selected.type}</Tag></Descriptions.Item>
            <Descriptions.Item label={<><EnvironmentOutlined /> 区域</>}>{selected.area}</Descriptions.Item>
            <Descriptions.Item label={<><EnvironmentOutlined /> 地址</>}>{selected.address}</Descriptions.Item>
            <Descriptions.Item label={<><UserOutlined /> 联系人</>}>{selected.manager_name}</Descriptions.Item>
            <Descriptions.Item label={<><PhoneOutlined /> 联系电话</>}>{selected.contact_phone}</Descriptions.Item>
            <Descriptions.Item label={<><FileTextOutlined /> 简介</>}>{selected.description}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
