import { useState, useCallback } from "react";
import { Card, Typography, Space, Tag, Table, Button, Input, message, Drawer, Descriptions, Skeleton } from "antd";
import { TeamOutlined, SearchOutlined, EyeOutlined, IdcardOutlined, EnvironmentOutlined, UserOutlined, PhoneOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { searchEnterprises, getEnterpriseDetail } from "../../api/gov";
import type { EnterpriseInfo } from "../../types";

const { Title, Text } = Typography;

export default function GovEnterpriseSearch() {
  const [enterprises, setEnterprises] = useState<EnterpriseInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<EnterpriseInfo | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchList = useCallback(async (kw = keyword, page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await searchEnterprises(kw, page, pageSize);
      setEnterprises(res.data.list);
      setPagination(prev => ({ ...prev, current: res.data.page, pageSize: res.data.page_size, total: res.data.total }));
    } catch {
      message.error("查询失败");
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  const viewDetail = async (id: number) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const res = await getEnterpriseDetail(id);
      setSelected(res.data);
    } catch { message.error("加载详情失败"); }
    finally { setDetailLoading(false); }
  };

  const columns: ColumnsType<EnterpriseInfo> = [
    { title: "企业名称", dataIndex: "name", key: "name", width: 180, render: (n: string) => <Text strong>{n}</Text> },
    { title: "信用代码", dataIndex: "credit_code", key: "credit_code", width: 180 },
    { title: "行业", dataIndex: "industry", key: "industry", width: 100, render: (i: string) => <Tag>{i}</Tag> },
    { title: "规模", dataIndex: "scale", key: "scale", width: 80, render: (s: string) => <Tag color="blue">{s}</Tag> },
    { title: "法人", dataIndex: "legal_person", key: "legal_person", width: 80 },
    { title: "操作", key: "action", width: 80, render: (_, r) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r.id)}>详情</Button> },
  ];

  return (
    <div>
      <Title level={3}><TeamOutlined style={{ marginRight: 8 }} />企业检索</Title>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input.Search
            placeholder="按名称/信用代码/行业关键词搜索"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onSearch={(v) => fetchList(v, 1, pagination.pageSize)}
            style={{ width: 360 }}
            allowClear
            enterButton={<><SearchOutlined /> 搜索</>}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchList(keyword, pagination.current, pagination.pageSize)}>刷新</Button>
        </Space>
      </Card>
      <Table columns={columns} dataSource={enterprises} rowKey="id" loading={loading}
        pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: ["5","10","20"], showTotal: (t, r) => `${r[0]}-${r[1]} / 共 ${t} 条`, onChange: (p, ps) => fetchList(keyword, p, ps) }}
        size="middle" />
      <Drawer title={selected?.name || "企业详情"} open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelected(null); }} width={480}>
        {detailLoading || !selected ? <Skeleton active paragraph={{ rows: 6 }} /> : (
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label={<><IdcardOutlined /> 信用代码</>}>{selected.credit_code}</Descriptions.Item>
            <Descriptions.Item label="行业"><Tag>{selected.industry}</Tag></Descriptions.Item>
            <Descriptions.Item label="规模"><Tag color="blue">{selected.scale}</Tag></Descriptions.Item>
            <Descriptions.Item label={<><EnvironmentOutlined /> 地址</>}>{selected.address}</Descriptions.Item>
            <Descriptions.Item label={<><UserOutlined /> 法定代表人</>}>{selected.legal_person}</Descriptions.Item>
            <Descriptions.Item label="联系人">{selected.contact_name}</Descriptions.Item>
            <Descriptions.Item label={<><PhoneOutlined /> 联系电话</>}>{selected.contact_phone}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}