"use client";

import { useState } from "react";
import RedlineViewer from "@/app/components/RedlineViewer";
import { analyzeContractFile, type AnalysisResult } from "@/lib/api";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { analysis } = await analyzeContractFile(file);
      setResult(analysis);
    } catch (err: any) {
      console.error("上传/分析失败:", err);
      setError(err?.message || "上传或分析过程中出现错误，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const riskScore =
    result?.metrics?.critical >= 3
      ? 90
      : result?.metrics?.critical >= 1
        ? 70
        : 30;

  return (
    <div style={{ padding: 40, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 30, fontWeight: 800 }}>
        工程咨询合同智能分析
      </h1>

      <p style={{ color: "#666", marginTop: 8, lineHeight: 1.8 }}>
        上传工程咨询、工程造价、知识产权或专利相关合同，即可获得 AI 驱动的风险识别、条款分析与红线建议。
      </p>

      <div style={{ marginTop: 24 }}>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <button
        onClick={uploadFile}
        disabled={!file || loading}
        style={{
          marginTop: 15,
          padding: "10px 18px",
          background: loading ? "#555" : "#111",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
          border: "none",
        }}
      >
        {loading ? "正在分析…" : "上传并分析"}
      </button>

      {loading && (
        <div style={{ marginTop: 20, color: "#555", lineHeight: 1.9 }}>
          正在读取合同文本… <br />
          正在识别关键条款… <br />
          正在生成风险与红线建议…
        </div>
      )}

      {error && (
        <div style={{ marginTop: 20, color: "red", lineHeight: 1.7 }}>
          发生错误：{error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 40 }}>
          <div
            style={{
              background: "#111",
              color: "white",
              padding: 20,
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <h3>风险评分</h3>
            <h1 style={{ fontSize: 36 }}>{riskScore}/100</h1>
          </div>

          {result.summary && (
            <div
              style={{
                marginTop: 20,
                padding: 20,
                borderRadius: 12,
                background: "#0f172a",
                color: "white",
              }}
            >
              <h2 style={{ marginBottom: 10 }}>分析摘要</h2>
              <p style={{ whiteSpace: "pre-wrap", color: "#cbd5e1", lineHeight: 1.8 }}>
                {result.summary}
              </p>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <h3>关键指标</h3>
            <ul style={{ lineHeight: 1.9 }}>
              <li>高风险条款：{result.metrics?.critical}</li>
              <li>需关注条款：{result.metrics?.minor}</li>
              <li>已对齐条款：{result.metrics?.aligned}</li>
            </ul>
          </div>

          <h2 style={{ marginTop: 30 }}>红线建议</h2>

          {result.clauses ? (
            <RedlineViewer redlines={result.clauses} />
          ) : (
            <p>暂无红线建议</p>
          )}
        </div>
      )}
    </div>
  );
}
