import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import {
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  FormOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { getAiPolicyMatch, getAiPrefill, searchEnterprisePolicies } from "../../api/ai";
import { getFileList } from "../../api/files";
import { getEnterprisePolicies } from "../../api/policies";
import type { FileInfo, MatchLevel, Policy } from "../../types";
import { savePolicyPrefill } from "../../utils/policyPrefill";

const { Title, Text, Paragraph } = Typography;

const matchConfig: Record<MatchLevel, { color: string; icon: React.ReactNode; label: string }> = {
  high: { color: "success", icon: <CheckCircleOutlined />, label: "高匹配" },
  partial: { color: "warning", icon: <ExclamationCircleOutlined />, label: "部分匹配" },
  none: { color: "error", icon: <CloseCircleOutlined />, label: "不匹配" },
  unknown: { color: "default", icon: <ExclamationCircleOutlined />, label: "未知" },
};

type MatchResult = {
  match_level: MatchLevel;
  level?: MatchLevel;
  reason?: string;
  match_reason?: string;
  policy_title?: string;
  subsidy_amount?: string;
  suggestions?: string[] | string;
};

function normalizeMatchLevel(value: unknown): MatchLevel {
  if (value === "high" || value === "partial" || value === "none" || value === "unknown") return value;
  return "unknown";
}

function normalizePolicyList(payload: unknown): Policy[] {
  if (Array.isArray(payload)) return payload as Policy[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.list)) return record.list as Policy[];
  if (Array.isArray(record.policies)) return record.policies as Policy[];
  if (Array.isArray(record.items)) return record.items as Policy[];
  if (Array.isArray(record.data)) return record.data as Policy[];
  return [];
}

function readAnalysis(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  return String(record.ai_analysis || record.analysis || record.summary || "");
}

function readFileIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function formatMatchedFiles(fileIds: number[], filesById: Map<number, FileInfo>): string {
  if (fileIds.length === 0) return "未匹配到已上传文件";
  const labels = fileIds.map((fileId) => {
    const file = filesById.get(fileId);
    return file?.filename ? `${file.filename}（ID ${fileId}）` : `文件 ID ${fileId}`;
  });
  return `已匹配：${labels.join("、")}`;
}

function flattenPrefillData(data: unknown, filesById: Map<number, FileInfo>): Array<[string, unknown]> {
  if (Array.isArray(data)) {
    return data.map((item, index) => {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const name = String(record.name || record.Name || `材料 ${index + 1}`);
      const fileIds = readFileIds(record.file_ids || record.fileIds || record.FileIDs);
      return [name, formatMatchedFiles(fileIds, filesById)];
    });
  }
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const body =
    record.form_data && typeof record.form_data === "object"
      ? (record.form_data as Record<string, unknown>)
      : record.data && typeof record.data === "object"
        ? (record.data as Record<string, unknown>)
        : record;

  return Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== "");
}

function renderValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

export default function EnterpriseAiAssist() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policyId, setPolicyId] = useState<number | undefined>();
  const [analyzing, setAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillData, setPrefillData] = useState<unknown | null>(null);
  const [prefillNotice, setPrefillNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Policy[]>([]);
  const [searchAnalysis, setSearchAnalysis] = useState("");
  const [filesById, setFilesById] = useState<Map<number, FileInfo>>(new Map());
  const selectedPolicy = useMemo(() => policies.find((policy) => policy.id === policyId), [policies, policyId]);

  useEffect(() => {
    let active = true;
    setPoliciesLoading(true);
    getEnterprisePolicies(1, 100)
      .then((res) => {
        if (!active) return;
        const list = res.data.list || [];
        setPolicies(list);
        setPolicyId((current) => current || list[0]?.id);
      })
      .catch((err) => {
        message.error((err as Error).message || "可申报政策加载失败");
      })
      .finally(() => {
        if (active) setPoliciesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning("请输入政策诉求或申报意图");
      return;
    }

    setSearching(true);
    setSearchAnalysis("");
    try {
      const res = await searchEnterprisePolicies(searchQuery.trim());
      const list = normalizePolicyList(res.data);
      setSearchResults(list);
      setSearchAnalysis(readAnalysis(res.data));
      if (list[0]?.id) setPolicyId(list[0].id);
      message.success(list.length ? "语义搜索完成，已选中第一条结果" : "语义搜索完成");
    } catch (err) {
      message.error((err as Error).message || "语义搜索失败");
    } finally {
      setSearching(false);
    }
  };

  const handleAiMatch = async (targetPolicyId = policyId) => {
    if (!targetPolicyId) {
      message.warning("请先选择一条政策");
      return;
    }

    setAnalyzing(true);
    setMatchResult(null);
    try {
      const res = await getAiPolicyMatch(targetPolicyId);
      const data = res.data as MatchResult;
      const level = normalizeMatchLevel(data.match_level || data.level);
      setMatchResult({
        ...data,
        match_level: level,
        policy_title: data.policy_title || policies.find((policy) => policy.id === targetPolicyId)?.title,
      });
      setPolicyId(targetPolicyId);
      message.success("AI 匹配分析完成");
    } catch (err) {
      message.error((err as Error).message || "AI 匹配分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAiPrefill = async (targetPolicyId = policyId) => {
    if (!targetPolicyId) {
      message.warning("请先选择一条政策");
      return;
    }

    setPrefilling(true);
    setPrefillData(null);
    setPrefillNotice("");
    try {
      const res = await getAiPrefill(targetPolicyId);
      savePolicyPrefill(targetPolicyId, res.data);
      getFileList(1, 1000)
        .then((fileRes) => {
          setFilesById(new Map(fileRes.data.list.map((file) => [file.file_id, file])));
        })
        .catch(() => {
          setFilesById(new Map());
        });
      setPrefillData(res.data);
      setPolicyId(targetPolicyId);
      message.success("AI 预填充数据生成完成");
      navigate(`/enterprise/policies?prefillPolicyId=${targetPolicyId}`, {
        state: { prefilledPolicyId: targetPolicyId },
      });
    } catch (err) {
      const errorMessage = (err as Error).message || "AI 预填充失败";
      if (errorMessage.includes("暂无申报材料")) {
        setPrefillNotice(errorMessage);
      } else {
        message.error(errorMessage);
      }
    } finally {
      setPrefilling(false);
    }
  };

  const searchColumns: ColumnsType<Policy> = [
    {
      title: "序号",
      key: "rank",
      width: 72,
      render: (_, _record, index) => <span className="policy-result-rank">{index + 1}</span>,
    },
    {
      title: "政策",
      dataIndex: "title",
      key: "title",
      render: (value: string, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{value}</Text>
          <Text type="secondary">ID: {record.id}</Text>
        </Space>
      ),
    },
    { title: "部门", dataIndex: "department", key: "department", width: 150, render: (value?: string) => value || "-" },
    {
      title: "有效期",
      key: "date",
      width: 210,
      render: (_, record) => `${record.start_date || "-"} ~ ${record.end_date || "-"}`,
    },
    {
      title: "匹配度",
      dataIndex: "match_level",
      key: "match",
      width: 120,
      render: (value?: MatchLevel) => {
        const level = normalizeMatchLevel(value);
        return <Tag color={matchConfig[level].color}>{matchConfig[level].label}</Tag>;
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleAiMatch(record.id)} loading={analyzing && policyId === record.id}>
            分析
          </Button>
          <Button size="small" onClick={() => handleAiPrefill(record.id)} loading={prefilling && policyId === record.id}>
            预填充
          </Button>
        </Space>
      ),
    },
  ];

  const policyOptions = policies.map((policy) => ({
    label: `${policy.id} - ${policy.title}`,
    value: policy.id,
  }));

  return (
    <div className="enterprise-ai-assist-page">
      <Title level={3}>
        <BulbOutlined style={{ marginRight: 8 }} />
        智能辅助申报
      </Title>

      <Alert
        message="AI 辅助说明"
        description="AI 根据企业画像与政策条件，提供政策语义搜索、匹配度分析和申报表单预填充。若模型暂不可用，后端会自动降级为规则匹配。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: "#1677ff" }} />
                政策语义搜索
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Input.Search
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onSearch={handleSemanticSearch}
                enterButton="搜索"
                loading={searching}
                placeholder="例如：我想申请 AI 行业的创业补贴"
              />
              {searchAnalysis ? (
                <div className="policy-search-analysis">
                  <Text strong>AI 分析</Text>
                  <Paragraph style={{ marginBottom: 0 }}>{searchAnalysis}</Paragraph>
                </div>
              ) : null}
              <Table
                columns={searchColumns}
                dataSource={searchResults}
                rowKey="id"
                loading={searching}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="输入诉求后搜索政策" /> }}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: "#faad14" }} />
                AI 政策匹配
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Space wrap>
                <Text>选择政策：</Text>
                <Select
                  value={policyId}
                  onChange={setPolicyId}
                  loading={policiesLoading}
                  showSearch
                  optionFilterProp="label"
                  placeholder="请选择政策"
                  style={{ minWidth: 280 }}
                  options={policyOptions}
                />
                <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => handleAiMatch()} loading={analyzing}>
                  AI 分析匹配度
                </Button>
              </Space>

              {selectedPolicy ? (
                <Alert
                  type="info"
                  showIcon
                  message={selectedPolicy.title}
                  description={`${selectedPolicy.department || "未标注部门"} · ${selectedPolicy.start_date || "-"} ~ ${selectedPolicy.end_date || "-"}`}
                />
              ) : null}

              {analyzing ? (
                <Card size="small">
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} tip="AI 正在分析企业画像与政策条件...">
                    <div style={{ padding: 40 }} />
                  </Spin>
                </Card>
              ) : null}

              {matchResult && !analyzing ? (
                <Card size="small" style={{ background: "#f8fafc" }}>
                  <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    <Tag icon={matchConfig[matchResult.match_level].icon} color={matchConfig[matchResult.match_level].color}>
                      {matchConfig[matchResult.match_level].label}
                    </Tag>
                    <Text>{matchResult.reason || matchResult.match_reason || "后端未返回具体原因"}</Text>
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="政策">{matchResult.policy_title || selectedPolicy?.title || "-"}</Descriptions.Item>
                      <Descriptions.Item label="补贴额度">{matchResult.subsidy_amount || selectedPolicy?.subsidy_amount || "-"}</Descriptions.Item>
                    </Descriptions>
                  </Space>
                </Card>
              ) : null}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FormOutlined style={{ color: "#1677ff" }} />
                AI 表单预填充
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Button type="primary" icon={<CopyOutlined />} onClick={() => handleAiPrefill()} loading={prefilling} disabled={!policyId}>
                AI 生成预填充数据
              </Button>

              {prefillNotice && !prefilling ? (
                <Alert type="warning" showIcon title={prefillNotice} />
              ) : null}

              {prefilling ? (
                <Card size="small">
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} tip="AI 正在生成表单预填充数据...">
                    <div style={{ padding: 40 }} />
                  </Spin>
                </Card>
              ) : null}

              {prefillData && !prefilling ? (
                <Card size="small" style={{ background: "#f8fafc" }}>
                  <Descriptions column={1} bordered size="small">
                    {flattenPrefillData(prefillData, filesById).map(([key, value]) => (
                      <Descriptions.Item key={key} label={key}>
                        <pre className="enterprise-ai-prefill-value">{renderValue(value)}</pre>
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Card>
              ) : (
                !prefilling && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="选择政策后生成预填充内容" />
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
