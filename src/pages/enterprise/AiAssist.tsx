/**
 * 企业端 — 智能辅助申报页面
 *
 * 功能：AI 政策匹配度分析（含加载动画）+ AI 表单预填充
 */

import { useState } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
  Button,
  message,
  Alert,
  Result,
  Spin,
  Row,
  Col,
  Descriptions,
  Select,
  Input,
  Table,
} from "antd";
import {
  BulbOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FormOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { getAiPolicyMatch, getAiPrefill, searchEnterprisePolicies } from "../../api/ai";
import type { MatchLevel, Policy } from "../../types";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

/** 匹配度结果配置 */
const matchConfig: Record<MatchLevel, { color: string; icon: React.ReactNode; label: string }> = {
  high: { color: "success", icon: <CheckCircleOutlined />, label: "高匹配" },
  partial: { color: "warning", icon: <ExclamationCircleOutlined />, label: "部分匹配" },
  none: { color: "error", icon: <CloseCircleOutlined />, label: "不匹配" },
  unknown: { color: "default", icon: <ExclamationCircleOutlined />, label: "未知" },
};

export default function EnterpriseAiAssist() {
  const [policyId, setPolicyId] = useState<number>(601);
  const [analyzing, setAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    match_level: MatchLevel;
    reason: string;
    policy_title: string;
    subsidy_amount: string;
  } | null>(null);

  // 预填充
  const [prefilling, setPrefilling] = useState(false);
  const [prefillData, setPrefillData] = useState<Record<string, unknown> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Policy[]>([]);
  const [searchAnalysis, setSearchAnalysis] = useState("");
  const [highlightedPolicyIndex, setHighlightedPolicyIndex] = useState<number | null>(null);

  /** AI 政策匹配 */
  const handleAiMatch = async () => {
    setAnalyzing(true);
    setMatchResult(null);
    try {
      const res = await getAiPolicyMatch(policyId, {
        industry: "信息技术",
        scale: "小型",
      });
      setMatchResult(res.data as { match_level: MatchLevel; reason: string; policy_title: string; subsidy_amount: string });
      message.success("AI 匹配分析完成");
    } catch (err) {
      message.error((err as Error).message || "AI 分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  /** AI 表单预填充 */
  const handleAiPrefill = async () => {
    setPrefilling(true);
    setPrefillData(null);
    try {
      const res = await getAiPrefill(policyId);
      setPrefillData(res.data);
      message.success("AI 预填充完成，已自动填写企业信息");
    } catch (err) {
      message.error((err as Error).message || "AI 预填充失败");
    } finally {
      setPrefilling(false);
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning("请输入政策诉求或申报意图");
      return;
    }
    setSearching(true);
    try {
      const res = await searchEnterprisePolicies(searchQuery.trim());
      setSearchResults(res.data.list);
      setSearchAnalysis(res.data.ai_analysis || res.data.analysis || res.data.summary || "");
      setHighlightedPolicyIndex(null);
      message.success("语义搜索完成");
    } catch (err) {
      message.error((err as Error).message || "语义搜索失败");
    } finally {
      setSearching(false);
    }
  };

  const searchColumns: ColumnsType<Policy> = [
    {
      title: "序号",
      key: "rank",
      width: 70,
      render: (_, _record, index) => <span className="policy-result-rank">{index + 1}</span>,
    },
    { title: "政策", dataIndex: "title", key: "title", render: (value: string) => <Text strong>{value}</Text> },
    { title: "部门", dataIndex: "department", key: "department", width: 110, render: (value?: string) => value || "-" },
    { title: "有效期", key: "date", width: 190, render: (_, record) => `${record.start_date} ~ ${record.end_date}` },
    { title: "匹配度", dataIndex: "match_level", key: "match", width: 100, render: (value: MatchLevel) => <Tag color={matchConfig[value]?.color}>{matchConfig[value]?.label || value}</Tag> },
  ];

  const jumpToPolicyResult = (index: number) => {
    if (index < 1 || index > searchResults.length) {
      message.warning(`当前结果中没有第 ${index} 条政策`);
      return;
    }

    setHighlightedPolicyIndex(index);
    document.getElementById(`policy-search-result-${index}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    window.setTimeout(() => {
      setHighlightedPolicyIndex((current) => (current === index ? null : current));
    }, 1800);
  };

  const renderAnalysisWithRefs = (text: string) => {
    const nodes: React.ReactNode[] = [];
    const pattern = /\[(\d+)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }

      const policyIndex = Number(match[1]);
      nodes.push(
        <button
          type="button"
          key={`${match[0]}-${match.index}`}
          className="policy-ref-jump"
          onClick={() => jumpToPolicyResult(policyIndex)}
          aria-label={`跳到第 ${policyIndex} 条政策`}
        >
          {match[0]}
        </button>,
      );
      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes;
  };

  return (
    <div>
      <Title level={3}>
        <BulbOutlined style={{ marginRight: 8 }} />
        智能辅助申报
      </Title>

      <Alert
        message="AI 辅助说明"
        description="AI 根据企业画像（行业、规模等）+ 政策条件，分析匹配度并预填充申报表单。当 LLM 不可用时自动降级为字段级规则匹配。AI 接口限流 5 RPM。"
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
                  <p>{renderAnalysisWithRefs(searchAnalysis)}</p>
                </div>
              ) : null}
              <Table
                columns={searchColumns}
                dataSource={searchResults}
                rowKey="id"
                rowClassName={(_, index) =>
                  highlightedPolicyIndex === index + 1 ? "policy-search-row-highlight" : ""
                }
                onRow={(_, index) => ({
                  id: `policy-search-result-${(index ?? 0) + 1}`,
                })}
                loading={searching}
                pagination={false}
                size="small"
              />
            </Space>
          </Card>
        </Col>

        {/* 左栏：AI 政策匹配 */}
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
              <Space>
                <Text>选择政策 ID：</Text>
                <Select
                  value={policyId}
                  onChange={setPolicyId}
                  style={{ width: 100 }}
                  options={[
                    { label: "601", value: 601 },
                    { label: "602", value: 602 },
                    { label: "603", value: 603 },
                  ]}
                />
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleAiMatch}
                  loading={analyzing}
                >
                  AI 分析匹配度
                </Button>
              </Space>

              {analyzing && (
                <Card size="small">
                  <Spin
                    indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                    tip="AI 正在分析企业画像与政策条件的匹配度..."
                  >
                    <div style={{ padding: 40 }} />
                  </Spin>
                </Card>
              )}

              {matchResult && !analyzing && (
                <Card size="small" style={{ background: "#f6ffed" }}>
                  <Result
                    status={
                      matchResult.match_level === "high"
                        ? "success"
                        : matchResult.match_level === "partial"
                          ? "warning"
                          : matchResult.match_level === "none"
                            ? "error"
                            : "info"
                    }
                    title={
                      <Tag color={matchConfig[matchResult.match_level]?.color}>
                        {matchConfig[matchResult.match_level]?.label}
                      </Tag>
                    }
                    subTitle={matchResult.reason}
                  />
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="政策">{matchResult.policy_title}</Descriptions.Item>
                    <Descriptions.Item label="补贴额度">{matchResult.subsidy_amount}</Descriptions.Item>
                  </Descriptions>
                </Card>
              )}
            </Space>
          </Card>
        </Col>

        {/* 右栏：AI 表单预填充 */}
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
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={handleAiPrefill}
                loading={prefilling}
              >
                AI 生成预填充数据
              </Button>

              {prefilling && (
                <Card size="small">
                  <Spin
                    indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                    tip="AI 正在根据企业信息和历史申报数据生成预填充数据..."
                  >
                    <div style={{ padding: 40 }} />
                  </Spin>
                </Card>
              )}

              {prefillData && !prefilling && (
                <Card size="small" style={{ background: "#f0f5ff" }}>
                  <Descriptions column={1} bordered size="small">
                    {Object.entries(prefillData).map(([key, value]) => (
                      <Descriptions.Item key={key} label={key}>
                        {String(value)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Card>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
