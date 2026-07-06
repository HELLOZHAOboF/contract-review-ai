"use client";

import { useState } from "react";

interface PersonaProfile {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  avgDaysToClose: number;
  negotiationStyle: string;
  tendencies: { clause: string; likelihood: number; note: string }[];
  preEmptiveStrategies: string[];
}

const PERSONAS: PersonaProfile[] = [
  {
    id: "engineering", name: "工程咨询机构", shortName: "工程咨询",
    color: "#b85450", bg: "rgba(184,84,80,0.06)", border: "rgba(184,84,80,0.2)",
    description: "大型工程咨询与全过程造价咨询机构，通常关注服务范围、责任边界、付款节点、成果交付标准和违约责任。",
    avgDaysToClose: 112, negotiationStyle: "审慎型 — 多轮条款确认",
    tendencies: [
      { clause: "服务范围", likelihood: 89, note: "会重点确认工作内容边界、是否包含驻场、复核和变更服务。" },
      { clause: "成果交付", likelihood: 94, note: "非常关注交付标准、成果清单、提交时间和验收口径。" },
      { clause: "责任限制", likelihood: 76, note: "通常会对无限责任、过高违约金和过宽赔偿范围比较敏感。" },
      { clause: "保密条款", likelihood: 45, note: "一般可接受，但会关注是否覆盖项目资料、图纸和报价信息。" },
      { clause: "付款条款", likelihood: 52, note: "会重点关注付款节点、发票要求、付款周期和审价配合。" },
    ],
    preEmptiveStrategies: [
      "先明确服务范围和成果清单，减少后续争议",
      "在初稿中直接给出交付周期和验收标准",
      "把责任上限、违约金和赔偿范围写清楚",
      "提前约定付款节点和发票要求，避免回合拉长",
    ],
  },
  {
    id: "ip", name: "知识产权 / 专利代理机构", shortName: "IP/专利",
    color: "#c9974a", bg: "rgba(201,151,74,0.06)", border: "rgba(201,151,74,0.2)",
    description: "知识产权、专利申请与专利布局相关服务机构，通常关注成果归属、保密义务、代理权限、费用结算和违约责任。",
    avgDaysToClose: 78, negotiationStyle: "专业型 — 注重证据与边界",
    tendencies: [
      { clause: "知识产权归属", likelihood: 82, note: "会重点确认委托成果、底稿、检索报告及衍生成果归属。" },
      { clause: "付款条款", likelihood: 71, note: "更关注分阶段付款、固定费用和超范围工作计费方式。" },
      { clause: "争议解决", likelihood: 58, note: "通常会关注管辖地、仲裁条款及执行效率。" },
      { clause: "保密条款", likelihood: 22, note: "会对客户技术信息、专利方案和未公开资料做重点保护。" },
      { clause: "交付标准", likelihood: 18, note: "更关注成果形式、文件版本和审查意见响应时限。" },
    ],
    preEmptiveStrategies: [
      "提前列明服务内容和交付物，避免后续争议",
      "明确阶段费用、超范围费用和付款节点",
      "把保密范围和成果归属写得足够具体",
      "对争议解决和管辖安排提前定稿，减少来回沟通",
    ],
  },
  {
    id: "contracting", name: "工程造价 / 总包合同方", shortName: "工程造价",
    color: "#5d8a90", bg: "rgba(93,138,144,0.06)", border: "rgba(93,138,144,0.2)",
    description: "工程造价、总包与项目管理类客户，通常会关注合同价款、变更签证、工期顺延、结算方式和索赔边界。",
    avgDaysToClose: 65, negotiationStyle: "协同型 — 以项目推进为导向",
    tendencies: [
      { clause: "价款调整", likelihood: 67, note: "会重点关注变更、签证、暂估价和材料价差调整机制。" },
      { clause: "保密条款", likelihood: 61, note: "会要求对造价数据、报价文件和结算资料进行保密。" },
      { clause: "工期顺延", likelihood: 55, note: "对不可抗力、甲方原因和设计变更导致的顺延很敏感。" },
      { clause: "成果交付", likelihood: 48, note: "更关注节点成果、复核时限和提交格式。" },
      { clause: "责任限制", likelihood: 38, note: "通常接受较为标准的责任分配，但会核查上限是否合理。" },
    ],
    preEmptiveStrategies: [
      "把变更、签证、结算与工期顺延规则提前写清",
      "对价款调整机制预设公式或触发条件",
      "把成果提交与审核时限写成可执行条款",
      "把责任上限和索赔边界标准化，减少谈判轮次",
    ],
  },
  {
    id: "legal", name: "企业法务 / 外部律师", shortName: "法务",
    color: "#6a9e78", bg: "rgba(106,158,120,0.06)", border: "rgba(106,158,120,0.2)",
    description: "企业法务或外部律师团队，通常会从风险控制、履约边界、违约责任、争议解决和可执行性角度审阅合同。",
    avgDaysToClose: 28, negotiationStyle: "效率型 — 关注可执行性",
    tendencies: [
      { clause: "付款条款", likelihood: 79, note: "会重点关注付款周期、发票要求、滞纳金和付款保障。" },
      { clause: "解除条款", likelihood: 64, note: "会确认提前解除、违约解除以及通知期安排。" },
      { clause: "知识产权归属", likelihood: 12, note: "通常会按业务场景确认成果归属和许可边界。" },
      { clause: "保密条款", likelihood: 8, note: "重点在于商业秘密、技术资料和例外披露情形。" },
      { clause: "责任限制", likelihood: 31, note: "会审查赔偿范围、责任上限和间接损失排除。" },
    ],
    preEmptiveStrategies: [
      "把付款、解除、赔偿和争议解决条款优先定稿",
      "尽量把风险边界和责任上限写得清晰可执行",
      "把关键定义前置，减少解释空间",
      "保留标准化模板，方便快速出稿和复核",
    ],
  },
];

interface Props {
  clauses: Record<string, { type?: string; deviation?: string; risk_reason?: string }>;
}

export default function SitePersona({ clauses }: Props) {
  const [selectedPersona, setSelectedPersona] = useState<PersonaProfile | null>(null);
  const [showStrategies, setShowStrategies] = useState(false);

  const getClauseRisk = (clauseName: string, persona: PersonaProfile) =>
    persona.tendencies.find(t =>
      clauseName.toLowerCase().includes(t.clause.toLowerCase()) ||
      t.clause.toLowerCase().includes(clauseName.split(" ")[0].toLowerCase())
    ) || null;

  const criticalClauses = Object.entries(clauses).filter(([, c]) => c.deviation === "critical");

  return (
    <div>
      <style>{`
        .persona-intro {
          margin-bottom: 20px;
        }
        .persona-intro-title { font-size: 14px; font-weight: 500; color: #2d3d38; margin-bottom: 5px; }
        .persona-intro-sub { font-family: 'DM Mono', monospace; font-size: 11px; color: #7a9088; line-height: 1.6; }

        .persona-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }
        @media (max-width: 600px) { .persona-grid { grid-template-columns: 1fr; } }

        .persona-card {
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.18s;
          border: 1px solid rgba(90,110,90,0.12);
          background: #f0efdf;
        }
        .persona-card:hover { transform: translateY(-1px); border-color: rgba(90,110,90,0.22); }
        .persona-card.selected { transform: translateY(-1px); }

        .persona-card-name { font-size: 13px; font-weight: 500; color: #2d3d38; margin-bottom: 2px; }
        .persona-card-short { font-family: 'DM Mono', monospace; font-size: 10px; color: #7a9088; margin-bottom: 10px; }
        .persona-days-num { font-size: 26px; font-weight: 600; font-variant-numeric: tabular-nums; }
        .persona-days-label { font-family: 'DM Mono', monospace; font-size: 10px; color: #7a9088; }
        .persona-style {
          font-family: 'DM Mono', monospace; font-size: 10px; color: #b0bfba;
          padding-top: 8px; border-top: 1px solid rgba(90,110,90,0.08); margin-top: 8px;
        }

        .persona-detail {
          border-radius: 14px; padding: 22px; margin-bottom: 20px;
          border: 1px solid;
        }
        .persona-detail-name { font-size: 15px; font-weight: 500; margin-bottom: 6px; }
        .persona-detail-desc { font-size: 13px; color: #7a9088; line-height: 1.65; margin-bottom: 20px; }

        .friction-label {
          font-family: 'DM Mono', monospace; font-size: 10px;
          text-transform: uppercase; letter-spacing: 1.5px; color: #b0bfba; margin-bottom: 12px;
        }
        .friction-row {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 10px 0; border-bottom: 1px solid rgba(90,110,90,0.06);
        }
        .friction-row:last-child { border-bottom: none; }
        .friction-clause { font-size: 12px; font-weight: 500; width: 150px; flex-shrink: 0; color: #2d3d38; }
        .friction-bar-wrap { flex: 1; height: 5px; background: rgba(90,110,90,0.1); border-radius: 4px; overflow: hidden; }
        .friction-bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
        .friction-pct { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; width: 36px; text-align: right; flex-shrink: 0; }
        .friction-note { font-size: 11px; color: #7a9088; line-height: 1.5; margin-top: 3px; }

        .overlap-alert {
          display: flex; gap: 10px; padding: 12px 14px; border-radius: 8px;
          background: rgba(184,84,80,0.05); border: 1px solid rgba(184,84,80,0.15);
          margin-bottom: 8px; font-size: 12px; color: #7a9088; line-height: 1.5;
        }
        .overlap-dot { width: 6px; height: 6px; border-radius: 50%; background: #b85450; flex-shrink: 0; margin-top: 4px; }

        .strategy-toggle {
          background: transparent;
          border: 1px solid rgba(90,110,90,0.18);
          color: #7a9088; padding: 8px 14px;
          border-radius: 8px; font-family: 'DM Mono', monospace;
          font-size: 11px; cursor: pointer; transition: all 0.15s;
          margin-top: 16px; display: flex; align-items: center; gap: 6px;
        }
        .strategy-toggle:hover { border-color: rgba(90,110,90,0.35); color: #2d3d38; }

        .strategy-list { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
        .strategy-item {
          display: flex; gap: 10px; padding: 12px 14px;
          border-radius: 8px; background: rgba(93,138,144,0.05);
          border: 1px solid rgba(93,138,144,0.12);
          font-size: 12.5px; color: #7a9088; line-height: 1.55;
        }
        .strategy-num { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; color: #3d6a70; width: 20px; flex-shrink: 0; }
      `}</style>

      <div className="persona-intro">
        <div className="persona-intro-title">项目角色画像与谈判偏好</div>
        <div className="persona-intro-sub">
          选择你的合作对象类型，系统会提前预测哪些条款更容易产生分歧，帮助你更快完成合同审查与修改。
        </div>
      </div>

      <div className="persona-grid">
        {PERSONAS.map((p) => (
          <div
            key={p.id}
            className={`persona-card ${selectedPersona?.id === p.id ? "selected" : ""}`}
            style={{
              borderColor: selectedPersona?.id === p.id ? p.border : undefined,
              background: selectedPersona?.id === p.id ? p.bg : undefined,
            }}
            onClick={() => { setSelectedPersona(selectedPersona?.id === p.id ? null : p); setShowStrategies(false); }}
          >
            <div className="persona-card-name" style={{ color: selectedPersona?.id === p.id ? p.color : undefined }}>
              {p.name}
            </div>
            <div className="persona-card-short">{p.shortName}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span className="persona-days-num" style={{ color: p.color }}>{p.avgDaysToClose}</span>
              <span className="persona-days-label">平均完成周期</span>
            </div>
            <div className="persona-style">{p.negotiationStyle}</div>
          </div>
        ))}
      </div>

      {selectedPersona && (
        <div className="persona-detail" style={{ borderColor: selectedPersona.border, background: selectedPersona.bg }}>
          <div className="persona-detail-name" style={{ color: selectedPersona.color }}>{selectedPersona.name}</div>
          <div className="persona-detail-desc">{selectedPersona.description}</div>

          {criticalClauses.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="friction-label">与关键条款的重合风险</div>
              {criticalClauses.map(([name]) => {
                const risk = getClauseRisk(name, selectedPersona);
                if (!risk) return null;
                return (
                  <div className="overlap-alert" key={name}>
                    <div className="overlap-dot" />
                    <div>
                      <strong style={{ color: "#2d3d38" }}>{name}</strong> — 这类合作对象对该条款的反馈概率约为 {risk.likelihood}%。
                      该条款已在合同中标记为高风险，预计会带来较长的沟通周期。
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}

          <div className="friction-label">条款冲突概率预测</div>
          {selectedPersona.tendencies.map((t) => {
            const barColor = t.likelihood >= 75 ? "#b85450" : t.likelihood >= 50 ? "#c9974a" : "#6a9e78";
            return (
              <div className="friction-row" key={t.clause}>
                <div className="friction-clause">{t.clause}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="friction-bar-wrap">
                      <div className="friction-bar-fill" style={{ width: `${t.likelihood}%`, background: barColor }} />
                    </div>
                    <div className="friction-pct" style={{ color: barColor }}>{t.likelihood}%</div>
                  </div>
                  <div className="friction-note">{t.note}</div>
                </div>
              </div>
            );
          })}

          <button className="strategy-toggle" onClick={() => setShowStrategies(!showStrategies)}>
            {showStrategies ? "收起" : "展开"} 预置建议（{selectedPersona.preEmptiveStrategies.length}）
          </button>

          {showStrategies && (
            <div className="strategy-list">
              {selectedPersona.preEmptiveStrategies.map((s, i) => (
                <div className="strategy-item" key={i}>
                  <span className="strategy-num">{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}