# Contract Review AI

## 项目简介 / Project Overview

这是一个面向工程咨询、专业服务、知识产权等合同场景的 AI 智能审查平台。
系统支持上传合同文件后自动解析文本、识别条款风险、生成红线建议，并提供交互式问答、流程预测和角色画像分析，帮助用户更快理解合同内容并发现潜在问题。

This is a portfolio-ready AI contract review platform for engineering consulting, professional services, and IP-related agreements.
It helps users upload contracts, extract text, identify risks, generate redline suggestions, and continue the review with interactive follow-up questions.

## 为什么这个项目值得展示 / Why This Project Stands Out

- **端到端完整流程 / End-to-end workflow**：从文件上传到 PDF 导出，一次完成合同审查全流程。
- **可解释的分析 / Explainable analysis**：结合规则筛查与 LLM 辅助分析，结果更透明。
- **交互式追问 / Interactive follow-up**：用户可以继续追问并在补充信息后重新分析。
- **作品集风格界面 / Portfolio-friendly UI**：包含仪表盘、文档浏览器和流程视图等完整展示界面。
- **贴近真实业务 / Real-world contract focus**：覆盖工程咨询和专业服务合同中的高频审查需求。

## 快速概览 / Quick Facts

- **项目类型 / Project type:** 全栈 AI 合同审查平台 / Full-stack AI contract review platform
- **前端 / Frontend:** Next.js + React + TypeScript
- **后端 / Backend:** FastAPI + Python
- **核心价值 / Core value:** 将合同审查转化为可引导、可解释的工作流 / Turns contract review into a guided, explainable workflow
- **适用场景 / Best for:** 作品集、实习面试、AI / 产品工程演示 / Portfolio, internship interviews, and AI/product engineering demos

## 截图展示 / Screenshots

### 1. 首页 / Home Dashboard
![Home Dashboard](./frontend/public/images/screenshots/01.png)

上传入口与核心功能概览集中展示，用户可以快速开始合同审查流程，并直观看到平台支持的主要分析能力。

The landing page highlights the upload entry point and the platform’s core capabilities, helping users start a contract review workflow quickly.

### 2. 文件上传后分析页面 / Document Analysis View
![Document Analysis View](./frontend/public/images/screenshots/02.png)

上传合同后，系统会自动解析文本并高亮关键信息，同时给出风险评分、条款分布和可视化摘要，帮助用户快速定位重点内容。

After upload, the system parses the contract, highlights important text, and presents risk scoring, clause distribution, and a visual summary for faster review.

### 3. 红线建议 / Redline Recommendations
![Redline Recommendations](./frontend/public/images/screenshots/03.png)

系统会针对高风险条款生成红线建议与修改方向，帮助用户快速理解哪里有问题，以及应该如何调整条款。

The system generates redline suggestions and revision guidance for high-risk clauses, making it easier to understand what needs to change and why.

### 4. AI 问答界面 / AI Q&A Assistant
![AI Q&A Assistant](./frontend/public/images/screenshots/04.png)

用户可以围绕合同内容继续追问，系统会结合当前合同上下文进行回答，适合进一步确认条款含义、风险点和修改思路。

Users can ask follow-up questions about the contract, and the assistant responds with contract-aware answers that help clarify clause meaning, risks, and editing strategies.

### 5. 审查流程界面 / Review Workflow Timeline
![Review Workflow Timeline](./frontend/public/images/screenshots/05.png)

系统会展示审查流程与阶段性结果，帮助用户了解当前分析进度，并预测后续审查和协商的重点步骤。

The workflow view shows review stages and intermediate outcomes, helping users understand analysis progress and anticipate the next steps in review and negotiation.

### 6. 角色画像界面 / Persona & Negotiation Preference Insights
![Persona & Negotiation Preference Insights](./frontend/public/images/screenshots/06.png)

根据合作对象类型，系统会提前预测对方更可能关注或争议的条款，帮助用户更快制定审查和谈判策略。

Based on the counterpart type, the system predicts which clauses are more likely to become negotiation points, helping users prepare a stronger review and negotiation strategy.

## 核心功能 / Core Features

- 合同文件上传与解析，支持 PDF / DOCX / TXT / Contract upload and parsing for PDF / DOCX / TXT
- AI 条款审查与风险分级 / AI clause review and risk grading
- 红线建议与合同修订提示 / Redline suggestions and revision guidance
- 可视化文档浏览与条款跳转 / Visual document viewer with clause navigation
- 交互式 AI 问答与补充追问 / Interactive AI Q&A with follow-up questions
- 审查流程预测与角色画像分析 / Review workflow prediction and persona insights
- PDF 报告导出 / PDF report export

## 工作方式 / How It Works

1. 用户上传合同文件 / The user uploads a contract file.
2. 后端解析文档并提取文本 / The backend parses the document and extracts text.
3. 系统识别条款风险并生成红线建议 / The system identifies risky clauses and generates redline suggestions.
4. 用户可以继续追问 AI，补充信息后重新分析 / Users can ask follow-up questions and re-run the analysis with extra context.
5. 最终可导出 PDF 审查报告 / A PDF review report can be exported at the end.

## 技术栈 / Tech Stack

### 前端 / Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- 客户端状态管理与交互式文档视图 / Client-side state management and interactive document views

### 后端 / Backend
- FastAPI
- Python 3.12
- LangGraph / LangChain
- Pydantic
- PyPDF2 / PyMuPDF / python-docx
- ReportLab PDF 导出 / ReportLab for PDF export

### 其他 / Other
- 文件上传与文档解析流水线 / File upload and document parsing pipeline
- 风险评分与建议引擎 / Risk scoring and recommendation engine
- 合同审查工作流编排 / Contract analysis workflow orchestration

## 项目亮点 / Project Highlights

- **端到端全流程**：从文件上传、文本解析到风险识别、建议生成与报告导出，一次完成
- **面试友好**：每个分析结果都可解释，方便展示思路而不是只展示结论
- **交互性强**：用户可针对系统追问继续补充信息并重新分析
- **适合真实业务场景**：覆盖工程咨询和专业服务合同中的高频审查需求
- **作品集表达清晰**：主页、分析页、红线页、问答页、流程页和角色画像页都已经可视化呈现

## 本地运行 / Local Setup

### 1. 启动后端 / Start the backend

```powershell
cd python
.\venv\Scripts\python.exe -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

如果你使用的是系统 Python，可以改成：

```powershell
cd python
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

If you are using the system Python instead of the virtual environment, you can run:

```powershell
cd python
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

### 2. 启动前端 / Start the frontend

```powershell
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:3000`。
The frontend runs at `http://localhost:3000` by default.

## 目录结构 / Project Structure

```text
frontend/   # Next.js 前端 / Next.js frontend
python/     # FastAPI + AI 分析后端 / FastAPI + AI backend
```

## 后续可优化方向 / Future Improvements

- 增加更多合同类型模板 / Add more contract templates
- 优化风险规则库 / Improve the risk rules library
- 支持多语言合同 / Support multilingual contracts
- 增加用户登录和历史记录保存 / Add user accounts and review history
- 加入更丰富的可视化图表 / Add richer visualizations

## License

This project is for portfolio and demonstration purposes unless otherwise specified.
