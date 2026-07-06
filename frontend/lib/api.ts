const BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

type Deviation = "critical" | "minor" | "aligned";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type BackendRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "red" | "yellow" | "green";

interface BackendUploadResponse {
  filename: string;
  full_text: string;
  char_count: number;
  text_preview: string;
}

interface BackendAssessmentPayload {
  clause_type: string;
  raw_text: string;
  risk_level: BackendRiskLevel;
  deviation_summary: string;
  suggested_action: string;
  confidence: number;
}

interface BackendRedlinePayload {
  proposed_text: string;
  original_text: string;
  suggested_text: string;
  reason: string;
  priority: string;
}

interface BackendClausePayload {
  assessment: BackendAssessmentPayload;
  redline?: BackendRedlinePayload | null;
  model_used?: string | null;
}

interface BackendSuggestionPayload {
  clause_id: string;
  clause_type: string;
  original_text: string;
  suggested_text: string;
  reason: string;
  priority: string;
  confidence: number;
}

interface BackendAnalyzeResponse {
  summary: string;
  clauses: BackendClausePayload[];
  suggestions: BackendSuggestionPayload[];
  missing_clause_types: string[];
  clarifying_questions?: string[];
  extraction_model?: string | null;
  version_diff: string;
  risk_score: number;
}

export interface UploadResponse {
  filename: string;
  full_text: string;
  char_count: number;
  text_preview: string;
}

export interface AnalysisClause {
  type: string;
  text: string;
  deviation: Deviation;
  risk_reason: string;
  suggested_clause: string;
  confidence: number;
  model_used: string;
}

export interface AnalysisMetrics {
  risk_score: number;
  risk_level: RiskLevel;
  total_clauses: number;
  critical: number;
  minor: number;
  aligned: number;
  recommendation: string;
}

export interface RedlineItem {
  clause: string;
  type: string;
  severity: Deviation;
  action: string;
  priority: number;
  original_text: string;
  suggested_text: string;
  text_changed: boolean;
  diff: { removed: string; added: string };
  reason: string;
  confidence: number;
  model_used: string;
  ui_style: { color: string };
}

export interface AnalysisResult {
  filename: string;
  summary: string;
  clauses: Record<string, AnalysisClause>;
  metrics: AnalysisMetrics;
  redlines: RedlineItem[];
  missing_clause_types: string[];
  clarifying_questions: string[];
  version_diff: string;
  extraction_model: string;
}

async function getErrorMessage(response: Response): Promise<string> {
  const fallback = `请求失败（${response.status}）`;
  try {
    const payload = (await response.json()) as { detail?: string; message?: string };
    return payload.detail || payload.message || fallback;
  } catch {
    return fallback;
  }
}

function toDeviation(riskLevel: BackendRiskLevel): Deviation {
  const normalized = riskLevel.trim().toLowerCase();
  if (["red", "critical", "high", "severe", "danger"].includes(normalized)) {
    return "critical";
  }
  if (["yellow", "medium", "minor", "moderate", "warning"].includes(normalized)) {
    return "minor";
  }
  return "aligned";
}

function toRiskLevel(score: number, critical: number, minor: number): RiskLevel {
  if (critical >= 3 || score >= 85) {
    return "CRITICAL";
  }
  if (critical > 0 || score >= 55) {
    return "HIGH";
  }
  if (minor > 0 || score >= 25) {
    return "MEDIUM";
  }
  return "LOW";
}

function toRecommendation(critical: number, minor: number, missingClauseTypes: string[]): string {
  if (critical > 0) {
    return "建议优先处理高风险条款，再进入签署流程。";
  }
  if (missingClauseTypes.length > 0) {
    return `建议补充缺失的${missingClauseTypes.length === 1 ? "条款" : "条款项"}后再进行最终复核。`;
  }
  if (minor > 0) {
    return "建议对需关注条款做进一步微调，以贴合当前合同基线。";
  }
  return "整体条款与当前合同基线基本一致。";
}

const CLAUSE_TYPE_LABELS: Record<string, string> = {
  "Confidentiality": "保密条款",
  "Indemnification": "赔偿责任",
  "Payment Terms": "付款条款",
  "Intellectual Property": "知识产权",
  "Publication Rights": "成果发表",
  "Termination": "解除条款",
  "Governing Law": "准据法",
  "Subject Injury": "责任范围",
  "Protocol Deviations": "履约偏差",
  "General Clause": "通用条款",
};

function localizeClauseType(clauseType: string): string {
  return CLAUSE_TYPE_LABELS[clauseType] || clauseType;
}

function createClauseKey(clauseType: string, seen: Map<string, number>): string {
  const label = localizeClauseType(clauseType);
  const nextCount = (seen.get(label) || 0) + 1;
  seen.set(label, nextCount);
  return nextCount === 1 ? label : `${label} (${nextCount})`;
}

function priorityToNumber(priority: string): number {
  switch (priority.toLowerCase()) {
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    default:
      return 4;
  }
}

function normalizeAnalysisResponse(payload: BackendAnalyzeResponse, filename: string): AnalysisResult {
  const clauses: Record<string, AnalysisClause> = {};
  const suggestionsByType = new Map<string, BackendSuggestionPayload[]>();
  const seenTypes = new Map<string, number>();

  for (const suggestion of payload.suggestions) {
    const key = suggestion.clause_type || "General Clause";
    const existing = suggestionsByType.get(key) || [];
    existing.push(suggestion);
    suggestionsByType.set(key, existing);
  }

  for (const clause of payload.clauses) {
    const clauseType = clause.assessment.clause_type || "General Clause";
    const key = createClauseKey(clauseType, seenTypes);
    const matchingSuggestion = (suggestionsByType.get(clauseType) || []).shift();
    clauses[key] = {
      type: clauseType,
      text: clause.assessment.raw_text,
      deviation: toDeviation(clause.assessment.risk_level),
      risk_reason: clause.assessment.deviation_summary || clause.assessment.suggested_action,
      suggested_clause:
        clause.redline?.suggested_text ||
        clause.redline?.proposed_text ||
        matchingSuggestion?.suggested_text ||
        clause.assessment.raw_text,
      confidence: clause.assessment.confidence ?? matchingSuggestion?.confidence ?? 0,
      model_used: clause.model_used || payload.extraction_model || "python-review-pipeline",
    };
  }

  const entries = Object.entries(clauses);
  const critical = entries.filter(([, clause]) => clause.deviation === "critical").length;
  const minor = entries.filter(([, clause]) => clause.deviation === "minor").length;
  const aligned = entries.filter(([, clause]) => clause.deviation === "aligned").length;
  const riskLevel = toRiskLevel(payload.risk_score, critical, minor);

  const redlines: RedlineItem[] = entries.map(([key, clause]) => ({
    clause: key,
    type: clause.type,
    severity: clause.deviation,
    action: clause.deviation === "aligned" ? "保持现状" : "调整为合同基线",
    priority: clause.deviation === "critical" ? 1 : clause.deviation === "minor" ? 2 : 3,
    original_text: clause.text,
    suggested_text: clause.suggested_clause,
    text_changed: clause.text.trim() !== clause.suggested_clause.trim(),
    diff: {
      removed: clause.text,
      added: clause.suggested_clause,
    },
    reason: clause.risk_reason,
    confidence: clause.confidence,
    model_used: clause.model_used,
    ui_style: {
      color:
        clause.deviation === "critical"
          ? "#b85450"
          : clause.deviation === "minor"
            ? "#c9974a"
            : "#6a9e78",
    },
  }));

  return {
    filename,
    summary: payload.summary,
    clauses,
    metrics: {
      risk_score: payload.risk_score,
      risk_level: riskLevel,
      total_clauses: entries.length,
      critical,
      minor,
      aligned,
      recommendation: toRecommendation(critical, minor, payload.missing_clause_types),
    },
    redlines,
    missing_clause_types: payload.missing_clause_types,
    clarifying_questions: payload.clarifying_questions || [],
    version_diff: payload.version_diff,
    extraction_model: payload.extraction_model || "python-review-pipeline",
  };
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = (await response.json()) as BackendUploadResponse;
  return {
    filename: payload.filename,
    full_text: payload.full_text,
    char_count: payload.char_count,
    text_preview: payload.text_preview,
  };
}

export async function analyzeCTA(
  text: string,
  filename: string,
  _geminiKey?: string,
  _maxClauses?: number,
): Promise<AnalysisResult> {
  const response = await fetch(`${BASE}/api/v1/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: filename,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = (await response.json()) as BackendAnalyzeResponse;
  return normalizeAnalysisResponse(payload, filename);
}

export async function analyzeContractFile(file: File): Promise<{
  upload: UploadResponse;
  analysis: AnalysisResult;
}> {
  const upload = await uploadFile(file);

  const form = new FormData();
  form.append("title", upload.filename || file.name);
  form.append("file", file);

  const response = await fetch(`${BASE}/api/analyze`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const analysis = normalizeAnalysisResponse(
    (await response.json()) as BackendAnalyzeResponse,
    upload.filename || file.name,
  );

  return { upload, analysis };
}

export async function chatWithContract(
  question: string,
  context: string,
): Promise<{ answer: string; status: string }> {
  const response = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, context }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = (await response.json()) as { answer: string };
  return {
    answer: payload.answer,
    status: "ok",
  };
}

interface RewriteClauseInput {
  type?: string;
  text: string;
  risk_reason?: string;
  suggested_clause?: string;
  deviation?: string;
}

export async function rewriteACTA(
  clauses: Record<string, RewriteClauseInput>,
): Promise<Record<string, string>> {
  const response = await fetch(`${BASE}/api/acta-rewrite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clauses: Object.fromEntries(
        Object.entries(clauses).map(([key, clause]) => [
          key,
          {
            type: clause.type,
            text: clause.text,
            risk_reason: clause.risk_reason,
            suggested_clause: clause.suggested_clause,
            deviation: clause.deviation,
          },
        ]),
      ),
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = (await response.json()) as { rewrites: Record<string, string> };
  return payload.rewrites;
}

export async function downloadAnalysisPdf(text: string, filename: string): Promise<Blob> {
  const response = await fetch(`${BASE}/api/v1/export/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: filename,
      filename,
      text,
    }),
  });

  if (!response.ok) {
    const message = await getErrorMessage(response);
    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return await response.blob();
}

export function summarizeSuggestionPriority(priority: string): number {
  return priorityToNumber(priority);
}
