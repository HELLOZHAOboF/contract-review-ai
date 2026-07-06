from __future__ import annotations

from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from src.api.schemas import AnalyzeResponse


FONT_NAME = "STSong-Light"
pdfmetrics.registerFont(UnicodeCIDFont(FONT_NAME))


def _style_sheet() -> dict[str, ParagraphStyle]:
    styles = getSampleStyleSheet()
    base = ParagraphStyle(
        "BaseCN",
        parent=styles["BodyText"],
        fontName=FONT_NAME,
        fontSize=10.5,
        leading=15,
        spaceAfter=6,
        textColor=colors.HexColor("#2d3d38"),
    )
    return {
        "title": ParagraphStyle(
            "TitleCN",
            parent=styles["Title"],
            fontName=FONT_NAME,
            fontSize=20,
            leading=26,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#2d3d38"),
        ),
        "h2": ParagraphStyle(
            "HeadingCN",
            parent=styles["Heading2"],
            fontName=FONT_NAME,
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#4a7a5a"),
            spaceAfter=8,
        ),
        "base": base,
        "small": ParagraphStyle(
            "SmallCN",
            parent=base,
            fontSize=9.5,
            textColor=colors.HexColor("#6f847d"),
        ),
    }


def _p(text: str, style: ParagraphStyle) -> Paragraph:
    safe = (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
    return Paragraph(safe, style)


def build_analysis_pdf(result: AnalyzeResponse, *, filename: str) -> bytes:
    styles = _style_sheet()
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="工程咨询合同智能审查报告",
        author="HackPrinceton Agent",
    )

    story = [
        _p("工程咨询合同智能审查报告", styles["title"]),
        Spacer(1, 6),
        _p(f"文件名：{filename}", styles["small"]),
        _p(f"生成时间：{__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles["small"]),
        Spacer(1, 10),
        _p("风险概览", styles["h2"]),
    ]

    metrics = [
        ["风险评分", f"{result.risk_score} / 100"],
        ["高风险条款", str(sum(1 for c in result.clauses if c.assessment.risk_level.upper() in {"HIGH", "CRITICAL"}))],
        ["需关注条款", str(sum(1 for c in result.clauses if c.assessment.risk_level.upper() == "MEDIUM"))],
        ["缺失条款", str(len(result.missing_clause_types))],
    ]
    metric_table = Table(metrics, colWidths=[38 * mm, 120 * mm])
    metric_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), FONT_NAME),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fafaf4")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#d8dfd8")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d8dfd8")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#2d3d38")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEADING", (0, 0), (-1, -1), 14),
            ]
        )
    )
    story.extend([metric_table, Spacer(1, 12)])

    story.append(_p("建议", styles["h2"]))
    story.append(_p(result.summary or result.version_diff or "暂无摘要。", styles["base"]))
    if result.missing_clause_types:
        story.append(_p("缺失条款：" + "、".join(result.missing_clause_types), styles["base"]))
    if result.clarifying_questions:
        story.append(_p("补充追问", styles["h2"]))
        for question in result.clarifying_questions:
            story.append(_p(f"• {question}", styles["base"]))

    story.append(_p("条款分析", styles["h2"]))
    for clause in result.clauses:
        heading = f"{clause.assessment.clause_type} / {clause.assessment.risk_level}"
        story.append(_p(heading, styles["base"]))
        story.append(_p(clause.assessment.deviation_summary or clause.assessment.suggested_action, styles["small"]))
        if clause.redline:
            story.append(_p(f"建议条文：{clause.redline.suggested_text}", styles["base"]))
        story.append(Spacer(1, 4))

    doc.build(story)
    return buffer.getvalue()
