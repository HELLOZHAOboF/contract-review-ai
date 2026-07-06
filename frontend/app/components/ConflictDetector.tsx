"use client";

import { useState } from "react";

interface ContractEntry {
  id: string;
  siteName: string;
  filename: string;
  clauses: Record<string, { type?: string; text: string; deviation?: string; suggested_clause?: string }>;
  uploadedAt: string;
}

interface Conflict {
  type: "exclusive_ip" | "jurisdiction" | "payment_inconsistency" | "publication_window" | "indemnification_mismatch" | "other";
  severity: "critical" | "warning";
  title: string;
  description: string;
  affectedSites: string[];
  affectedClause: string;
  recommendation: string;
}

function findClauseText(contract: ContractEntry, keywords: string[]): string | null {
  const match = Object.entries(contract.clauses).find(([name, clause]) => {
    const haystack = `${name} ${clause.type || ""} ${clause.text}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });
  return match?.[1].text || null;
}

function normalizeStateFromText(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(
    /\b(?:new york|california|massachusetts|delaware|new jersey|illinois|texas|pennsylvania|florida|connecticut)\b/i,
  );
  return match ? match[0].toLowerCase() : null;
}

function extractDays(text: string | null): number | null {
  if (!text) return null;
  const match = text.match(/\b(\d{1,3})\s*day/i);
  return match ? Number(match[1]) : null;
}

function extractNetDays(text: string | null): number | null {
  if (!text) return null;
  const match = text.match(/\bnet[\s-]?(\d{1,3})\b/i) || text.match(/\bwithin\s+(\d{1,3})\s+days\b/i);
  return match ? Number(match[1]) : null;
}

function detectConflicts(contracts: ContractEntry[]): Conflict[] {
  if (contracts.length < 2) return [];

  const conflicts: Conflict[] = [];

  const jurisdictionStates = contracts
    .map(contract => ({
      siteName: contract.siteName,
      state: normalizeStateFromText(findClauseText(contract, ["governing law", "jurisdiction"])),
    }))
    .filter((entry): entry is { siteName: string; state: string } => Boolean(entry.state));

  const uniqueStates = [...new Set(jurisdictionStates.map(entry => entry.state))];
  if (uniqueStates.length > 1) {
    conflicts.push({
      type: "jurisdiction",
      severity: "warning",
      title: "管辖法律设置不一致",
      description: `当前合同组引用了多个管辖州：${uniqueStates.join(", ")}。`,
      affectedSites: jurisdictionStates.map(entry => entry.siteName),
      affectedClause: "争议解决 / 准据法",
      recommendation: "建议先统一准据法口径，再推进后续谈判。",
    });
  }

  const paymentTerms = contracts
    .map(contract => ({
      siteName: contract.siteName,
      days: extractNetDays(findClauseText(contract, ["payment", "invoice", "net-"])),
    }))
    .filter((entry): entry is { siteName: string; days: number } => entry.days !== null);

  const uniquePaymentDays = [...new Set(paymentTerms.map(entry => entry.days))];
  if (uniquePaymentDays.length > 1) {
    conflicts.push({
      type: "payment_inconsistency",
      severity: "warning",
      title: "付款周期不一致",
      description: `不同合同的付款周期存在差异（${uniquePaymentDays.join(", ")} 天），容易造成预算与结算口径不统一。`,
      affectedSites: paymentTerms.map(entry => entry.siteName),
      affectedClause: "付款条款",
      recommendation: "建议先统一付款周期和开票要求，再同步各项目版本。",
    });
  }

  const publicationWindows = contracts
    .map(contract => ({
      siteName: contract.siteName,
      days: extractDays(findClauseText(contract, ["publication", "manuscript", "patent delay"])),
    }))
    .filter((entry): entry is { siteName: string; days: number } => entry.days !== null);

  const uniquePublicationDays = [...new Set(publicationWindows.map(entry => entry.days))];
  if (uniquePublicationDays.length > 1) {
    conflicts.push({
      type: "publication_window",
      severity: "warning",
      title: "成果发表/披露窗口不一致",
      description: `不同合同对成果审阅窗口的设置不一致（${uniquePublicationDays.join(", ")} 天），可能影响统一管理。`,
      affectedSites: publicationWindows.map(entry => entry.siteName),
      affectedClause: "成果发表 / 审阅",
      recommendation: "建议统一审阅期限与披露规则，避免后续版本分裂。",
    });
  }

  const indemnificationProfiles = contracts
    .map(contract => {
      const text = (findClauseText(contract, ["indemnification", "indemnify"]) || "").toLowerCase();
      return {
        siteName: contract.siteName,
        profile: text.includes("mutual") ? "mutual" : text.includes("sponsor") ? "sponsor_only" : null,
      };
    })
    .filter((entry): entry is { siteName: string; profile: string } => Boolean(entry.profile));

  const uniqueProfiles = [...new Set(indemnificationProfiles.map(entry => entry.profile))];
  if (uniqueProfiles.length > 1) {
    conflicts.push({
      type: "indemnification_mismatch",
      severity: "critical",
      title: "赔偿责任安排不一致",
      description: "部分合同体现互相赔偿，部分合同偏向单方赔偿，可能导致整体责任边界不一致。",
      affectedSites: indemnificationProfiles.map(entry => entry.siteName),
      affectedClause: "赔偿责任",
      recommendation: "建议统一赔偿责任模板后，再推进各合同的个性化修改。",
    });
  }

  const ipProfiles = contracts
    .map(contract => {
      const text = (findClauseText(contract, ["intellectual property", "ip ownership", "inventions"]) || "").toLowerCase();
      return {
        siteName: contract.siteName,
        profile: text.includes("site retains") || text.includes("site shall own")
          ? "site_favored"
          : text.includes("sponsor retains") || text.includes("sponsor shall own")
            ? "sponsor_favored"
            : null,
      };
    })
    .filter((entry): entry is { siteName: string; profile: string } => Boolean(entry.profile));

  const uniqueIpProfiles = [...new Set(ipProfiles.map(entry => entry.profile))];
  if (uniqueIpProfiles.length > 1) {
    conflicts.push({
      type: "exclusive_ip",
      severity: "critical",
      title: "知识产权归属口径冲突",
      description: "不同合同对知识产权归属的处理存在明显差异，可能导致成果权属冲突。",
      affectedSites: ipProfiles.map(entry => entry.siteName),
      affectedClause: "知识产权",
      recommendation: "建议先统一知识产权归属条款，再处理各项目的例外情形。",
    });
  }

  return conflicts;
}

interface Props {
  currentContract: {
    filename: string;
    clauses: Record<string, { type?: string; text: string; deviation?: string }>;
  };
}

export default function ConflictDetector({ currentContract }: Props) {
  const [contracts, setContracts] = useState<ContractEntry[]>([{
    id: "current", siteName: "当前合同",
    filename: currentContract.filename, clauses: currentContract.clauses,
    uploadedAt: new Date().toLocaleDateString("zh-CN"),
  }]);
  const [newSiteName, setNewSiteName] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [addingContract, setAddingContract] = useState(false);

  const handleAddContract = async () => {
    if (!newFile || !newSiteName.trim()) return;
    const text = await newFile.text();
    const mockClauses: Record<string, { type: string; text: string; deviation: string }> = {};
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.length > 30).slice(0, 10);
    sentences.forEach((s, i) => {
      mockClauses[`Clause #${i + 1}`] = { type: "General Clause", text: s, deviation: "minor" };
    });
    setContracts(prev => [...prev, {
      id: `contract-${Date.now()}`, siteName: newSiteName,
      filename: newFile.name, clauses: mockClauses,
      uploadedAt: new Date().toLocaleDateString("zh-CN"),
    }]);
    setNewSiteName(""); setNewFile(null); setAddingContract(false); setScanned(false);
  };

  const handleScan = async () => {
    setScanning(true); setConflicts([]);
    const found = detectConflicts(contracts);
    setConflicts(found); setScanning(false); setScanned(true);
  };

  const removeContract = (id: string) => {
    if (id === "current") return;
    setContracts(prev => prev.filter(c => c.id !== id));
    setScanned(false);
  };

  return (
    <div>
      <style>{`
        .cd-intro { margin-bottom: 20px; }
        .cd-intro-title { font-size: 14px; font-weight: 500; color: #2d3d38; margin-bottom: 5px; }
        .cd-intro-sub { font-family: 'DM Mono', monospace; font-size: 11px; color: #7a9088; line-height: 1.6; }

        .contract-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
        .contract-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 10px;
          background: #f0efdf; border: 1px solid rgba(90,110,90,0.12);
        }
        .contract-item-site { font-size: 13px; font-weight: 500; color: #2d3d38; }
        .contract-item-file { font-family: 'DM Mono', monospace; font-size: 10px; color: #7a9088; margin-top: 2px; }
        .contract-item-date { font-family: 'DM Mono', monospace; font-size: 10px; color: #b0bfba; }
        .current-tag {
          font-family: 'DM Mono', monospace; font-size: 9px;
          padding: 2px 7px; border-radius: 4px;
          background: rgba(74,122,90,0.1); color: #4a7a5a;
        }
        .contract-remove {
          background: transparent; border: none; color: #b0bfba;
          font-size: 14px; cursor: pointer; padding: 4px; border-radius: 4px;
          transition: color 0.15s;
        }
        .contract-remove:hover { color: #b85450; }

        .add-panel {
          padding: 16px; border-radius: 10px;
          background: rgba(90,110,90,0.04);
          border: 1px dashed rgba(90,110,90,0.18);
          margin-bottom: 14px;
        }
        .add-row {
          display: grid; grid-template-columns: 1fr 1fr auto;
          gap: 10px; align-items: end;
        }
        @media (max-width: 600px) { .add-row { grid-template-columns: 1fr; } }
        .add-label { font-family: 'DM Mono', monospace; font-size: 10px; color: #7a9088; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .add-input {
          width: 100%; padding: 9px 12px;
          background: #fafaf4; border: 1px solid rgba(90,110,90,0.18);
          border-radius: 8px; color: #2d3d38;
          font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none;
        }
        .add-input:focus { border-color: rgba(74,122,90,0.4); }
        .add-input::placeholder { color: #b0bfba; }
        .add-btn {
          padding: 9px 16px; background: rgba(74,122,90,0.1);
          color: #4a7a5a; border: 1px solid rgba(74,122,90,0.2);
          border-radius: 8px; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s;
        }
        .add-btn:hover { background: rgba(74,122,90,0.18); }
        .add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .action-row { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
        .scan-btn {
          flex: 1; padding: 11px 20px; background: #4a7a5a; color: white;
          border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .scan-btn:hover:not(:disabled) { background: #3d6a70; }
        .scan-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .add-contract-btn {
          padding: 11px 20px; background: transparent; color: #7a9088;
          border: 1px solid rgba(90,110,90,0.18); border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.15s;
        }
        .add-contract-btn:hover { border-color: rgba(90,110,90,0.3); color: #2d3d38; }

        .scan-ready {
          text-align: center; padding: 36px;
          border-radius: 12px; border: 1px dashed rgba(90,110,90,0.18);
          color: #7a9088; font-family: 'DM Mono', monospace; font-size: 12px; line-height: 1.7;
        }
        .no-conflicts {
          text-align: center; padding: 32px; border-radius: 12px;
          border: 1px solid rgba(106,158,120,0.2); background: rgba(106,158,120,0.05);
          color: #4a7a5a; font-size: 14px; font-weight: 500;
        }

        .conflict-card { border-radius: 12px; margin-bottom: 10px; border: 1px solid; overflow: hidden; }
        .conflict-card-body { display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px; }
        .conflict-title { font-size: 14px; font-weight: 500; margin-bottom: 6px; }
        .conflict-desc { font-size: 13px; color: #7a9088; line-height: 1.6; margin-bottom: 8px; }
        .conflict-meta { display: flex; gap: 8px; flex-wrap: wrap; }
        .site-tag {
          font-family: 'DM Mono', monospace; font-size: 10px;
          padding: 2px 8px; border-radius: 4px;
          background: rgba(90,110,90,0.08); color: #7a9088;
          border: 1px solid rgba(90,110,90,0.12);
        }
        .clause-tag {
          font-family: 'DM Mono', monospace; font-size: 10px;
          padding: 2px 8px; border-radius: 4px;
          background: rgba(93,138,144,0.1); color: #3d6a70;
          border: 1px solid rgba(93,138,144,0.18);
        }
        .severity-badge {
          padding: 3px 10px; border-radius: 4px;
          font-family: 'DM Mono', monospace; font-size: 10px;
          font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;
          flex-shrink: 0;
        }
        .conflict-rec {
          margin-top: 10px; padding: 10px 12px; border-radius: 8px;
          font-size: 12px; line-height: 1.5; color: #7a9088; border-left: 3px solid;
        }
        .spin-ring {
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: white;
          border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="cd-intro">
        <div className="cd-intro-title">多合同冲突检测</div>
        <div className="cd-intro-sub">
          上传多份合同后，可自动发现跨合同不一致问题，例如知识产权归属冲突、管辖法律冲突、付款周期不一致等。
        </div>
      </div>

      <div className="contract-list">
        {contracts.map((c) => (
          <div className="contract-item" key={c.id}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#7a9088" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <path d="M4 2h6l4 4v8H4V2z" /><path d="M10 2v4h4" />
            </svg>
            <div style={{ flex: 1 }}>
              <div className="contract-item-site">{c.siteName}</div>
              <div className="contract-item-file">{c.filename}</div>
            </div>
            <div className="contract-item-date">{c.uploadedAt}</div>
            {c.id === "current"
              ? <span className="current-tag">当前</span>
              : <button className="contract-remove" onClick={() => removeContract(c.id)}>✕</button>
            }
          </div>
        ))}
      </div>

      {addingContract && (
        <div className="add-panel">
          <div className="add-row">
            <div>
              <div className="add-label">项目/客户名称</div>
              <input className="add-input" placeholder="例如：某工程咨询机构" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} />
            </div>
            <div>
              <div className="add-label">合同文件</div>
              <input type="file" accept=".txt,.docx,.pdf"
                style={{ padding: "7px 12px", background: "#fafaf4", border: "1px solid rgba(90,110,90,0.18)", borderRadius: 8, color: "#7a9088", fontSize: 12, width: "100%" }}
                onChange={e => setNewFile(e.target.files?.[0] || null)} />
            </div>
            <button className="add-btn" onClick={handleAddContract} disabled={!newFile || !newSiteName.trim()}>添加</button>
          </div>
        </div>
      )}

      <div className="action-row">
        <button className="add-contract-btn" onClick={() => setAddingContract(!addingContract)}>
          {addingContract ? "取消" : "+ 再添加一份合同"}
        </button>
        <button className="scan-btn" onClick={handleScan} disabled={contracts.length < 2 || scanning}>
          {scanning
            ? <><span className="spin-ring" /> 正在扫描冲突…</>
            : `扫描 ${contracts.length} 份合同`
          }
        </button>
      </div>

      {!scanned && !scanning && (
        <div className="scan-ready">
          请先添加 2 份及以上合同，再点击扫描以检测跨合同不一致问题。<br />
          3 份及以上合同时效果更好。
        </div>
      )}

      {scanned && conflicts.length === 0 && (
        <div className="no-conflicts">
          已扫描 {contracts.length} 份合同，未发现跨合同冲突。
        </div>
      )}

      {conflicts.map((c, i) => {
        const isCritical = c.severity === "critical";
        const color = isCritical ? "#b85450" : "#c9974a";
        const bg = isCritical ? "rgba(184,84,80,0.04)" : "rgba(201,151,74,0.04)";
        const border = isCritical ? "rgba(184,84,80,0.18)" : "rgba(201,151,74,0.18)";
        return (
          <div className="conflict-card" key={i} style={{ borderColor: border, background: bg }}>
            <div className="conflict-card-body">
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <div className="conflict-title" style={{ color }}>{c.title}</div>
                  <div className="severity-badge" style={{ background: isCritical ? "rgba(184,84,80,0.1)" : "rgba(201,151,74,0.1)", color }}>
                    {c.severity}
                  </div>
                </div>
                <div className="conflict-desc">{c.description}</div>
                <div className="conflict-meta">
                  {c.affectedSites.map(s => <span className="site-tag" key={s}>{s}</span>)}
                  <span className="clause-tag">{c.affectedClause}</span>
                </div>
                <div className="conflict-rec" style={{ background: bg, borderLeftColor: color }}>
                  <strong style={{ color }}>建议： </strong>{c.recommendation}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
