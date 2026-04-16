<style>
  @page { margin: 8mm; }
  body { font-family: system-ui, -apple-system, sans-serif; font-size: 10px; line-height: 1.3; margin: 0; padding: 0; color: #111; }
  h1 { font-size: 16px; margin: 0 0 4px 0; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
  h2 { font-size: 11px; margin: 10px 0 4px 0; border-bottom: 1px solid #ccc; padding-bottom: 2px; text-transform: uppercase; color: #222; }
  h3 { font-size: 10.5px; margin: 0; font-weight: bold; padding-top: 6px; }
  p, ul, li { margin: 0 0 3px 0; }
  ul { padding-left: 16px; margin-bottom: 6px; margin-top: 2px; }
  hr { display: none; }
  a { text-decoration: none; color: #000; }
  .contact-info { text-align: center; font-size: 10px; margin-bottom: 8px; line-height: 1.4; color: #333; }
  .grid-2 { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; border-bottom: none; }
  .date { color: #555; font-size: 9.5px; font-weight: 500; }
  .tech { font-style: italic; color: #444; font-size: 9.5px; margin-bottom: 8px; display: block; }
  strong { color: #000; font-weight: 700; }
  .icon { display: inline-block; width: 10px; height: 10px; vertical-align: -1px; margin-right: 3px; background-size: contain; background-repeat: no-repeat; }
  .i-email { background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="%23333" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>'); }
  .i-phone { background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="%23333" xmlns="http://www.w3.org/2000/svg"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>'); }
  .i-loc { background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="%23333" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'); }
  .i-li { background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="%230072b1" xmlns="http://www.w3.org/2000/svg"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>'); }
  .i-port { background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="%23333" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'); }
  .i-git { background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="%23181717" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>'); }
  .i-trophy { background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="%23f59e0b" xmlns="http://www.w3.org/2000/svg"><path d="M20.2 2H19.5v-.5c0-.83-.67-1.5-1.5-1.5h-12c-.83 0-1.5.67-1.5 1.5V2H3.8c-1.1 0-2 .9-2 2v2c0 2.24 1.5 4.14 3.51 4.78C5.83 12.02 7.08 13 8.5 13h7c1.42 0 2.67-.98 3.19-2.22C20.7 10.14 22.2 8.24 22.2 6V4c0-1.1-.9-2-2-2zM5.3 8.87c-1.19-.48-2-1.63-2-2.87V4h1.2v4.87zM12 15c-2.31 0-4.32-1.39-5.26-3.41h10.52C16.32 13.61 14.31 15 12 15zm8.7 1.13c0 1.24-.81 2.39-2 2.87V14.13h1.2v2zM12 17c2.76 0 5-2.24 5-5v-1H7v1c0 2.76 2.24 5 5 5zm-3 2h6v3H9v-3z"/></svg>'); }
</style>

# ROHAN DHANRAJ YADAV
<div class="contact-info">
<strong>AI/ML Engineer | Generative AI | Agentic AI Systems</strong><br>
<span class="icon i-email"></span> <a href="mailto:rohan.dhanraj.y@gmail.com">rohan.dhanraj.y@gmail.com</a> | <span class="icon i-phone"></span> <a href="tel:+91-7008958143">+91-7008958143</a> | <span class="icon i-loc"></span> Bengaluru, India<br>
<span class="icon i-li"></span> <a href="https://linkedin.com/in/rohan-dhanraj-yadav">LinkedIn</a> | <span class="icon i-port"></span> <a href="https://rohandhanraj.github.io/">Portfolio</a> | <span class="icon i-git"></span> <a href="https://github.com/rohandhanraj">GitHub</a>
</div>

## PROFESSIONAL SUMMARY
**AI/ML Engineer specializing in Generative AI, Multi-Agent Systems, and AI Platform Development**, with 7+ years of experience including 4+ years in production AI systems. Proven expertise in building scalable **LLM-powered applications**, **RAG pipelines**, and **Complex Agentic architectures** that handle 10K+ daily queries and process 1M+ records.

Led cross-functional teams to design and deploy **Multi-Agent Systems**, autonomous workflows, and enterprise-grade AI platforms. Strong experience across **end-to-end AI lifecycle** — from data pipelines and model fine-tuning to API development and cloud deployment.

Delivered high-impact AI solutions for **Fortune 500 clients**, achieving up to **50% performance improvements** and building intelligent systems for real-world applications.


## CORE COMPETENCIES
<strong>Languages/Frameworks:</strong> Python, FastAPI | <strong>Cloud/DevOps:</strong> Docker, CI/CD, GCP, AWS, Linux, MLOps<br>
<strong>GenAI & Agentic Systems:</strong> LLMs, LangChain, LangGraph, RAG, Prompt Chaining, Chain-of-Thought, Agent Orchestration<br>
<strong>ML & NLP:</strong> Scikit-Learn, Tensorflow, PyTorch, Transformers, BERT/RoBERTa, Sentiment Analysis, NER, Text Classification, Optuna<br>
<strong>Data Engineering:</strong> Apache Airflow, ETL, Pandas, SQL (MySQL, PostgreSQL), NoSQL, Vector DBs (Qdrant, Milvus, Chroma)<br>
<strong>Web Scraping & Tools:</strong> Playwright, Selenium, Scrapy, BeautifulSoup, Git, Docker Compose

## PROFESSIONAL EXPERIENCE

<div class="grid-2"><h3>AI Tech Solutions Ltd. | AI/ML Engineer — Generative AI & Agentic Systems</h3><span class="date">Nov 2024 – Oct 2025</span></div>

<ul>
  <li>Led a <strong>15-member team</strong> building scalable AI workflows using LangGraph, natively achieving a <strong>38% accuracy improvement</strong> via hybrid RAG.</li>
  <li>Architected multi-modal autonomous assistants executing GPT-4 context orchestration, rapid image search, and LLM-based tool decisions.</li>
  <li>Developed <a href="https://pypi.org/project/ai-tech-crawler/" target="_blank" style="text-decoration: underline;"><strong>AI-Tech-Crawler</strong></a>, an open-source web scraping platform natively utilizing LLMs and Pydantic schemas for data extraction.</li>
  <li>Scaled complex containerized orchestration models deploying <strong>Docker</strong> against Vector DBs for robust enterprise semantic search.</li>
</ul>
<span class="tech">Tech: Python, LangChain, LangGraph, FastAPI, LLMs, RAG, Agent Orchestration, Docker, Vector DBs</span>

<div class="grid-2"><h3>Aimlytics Technology | Software Engineer — Generative AI & ML</h3><span class="date">Sep 2022 – Oct 2024</span></div>

<ul>
  <li>Led an <strong>8-member team</strong> resolving <strong>50%+</strong> of critical deployment issues and delivering custom AI workflows for Fortune 500 clients (Cisco, ITC).</li>
  <li>Architected a robust RAG-based virtual sales pipeline (<strong>SalesMoji</strong>) structurally scaling to consistently process <strong>4,500+ daily API requests</strong>.</li>
  <li>Fine-tuned <strong>BERT & RoBERTa</strong> NLP models driving <strong>18% performance improvements</strong> across a 15-language sentiment tracking stack.</li>
  <li>Automated rigorous ETL architectures utilizing <strong>Apache Airflow</strong> to seamlessly ingest and process <strong>100K+ daily records</strong>.</li>
</ul>
<span class="tech">Tech: Python, RAG, LangChain, Airflow, BERT, RoBERTa, FastAPI, Flask, TensorFlow, PyTorch, Vector DBs, GCP</span>

<div class="grid-2"><h3>iNeuron.ai | Machine Learning Engineer Intern</h3><span class="date">Aug 2021 – Sep 2022</span></div>

<ul>
  <li>Led <strong>10 engineers</strong> building automated ML pipeline architectures, natively deploying scalable classification networks via <strong>Flask and Docker</strong>.</li>
  <li>Reduced backend model training times by natively <strong>35%</strong> employing <strong>Optuna</strong> for strictly automated hyperparameter optimizations.</li>
  <li>Built a multi-class bioinformatics processing system successfully parsing <strong>77 protein expression markers</strong> accurately across 8 functional classes.</li>
</ul>
<span class="tech">Tech: Python, Flask, Scikit-Learn, Optuna, MySQL, Cassandra, Docker, AWS</span>

<div class="grid-2"><h3>Bureau Veritas Group | Metallurgical Quality Engineer</h3><span class="date">Aug 2016 – Nov 2019</span></div>

<ul>
  <li>Directed quality assurance and supervised metallurgical standards compliance across major industry frameworks (Jindal, Tata Steels).</li>
  <li>Targeted data-driven quality enhancement leveraging <strong>Python (NumPy, Pandas, SciPy)</strong> for rigorous technical statistical and predictive tracking.</li>
</ul>
<span class="tech">Tech: Data Analysis, Python, NumPy, Pandas, SciPy, Statistical Analysis, Quality Control</span>

## KEY PROJECTS & ARCHITECTURES
<ul style="padding-left: 14px; margin-bottom: 2px;">
  <li><strong>Omodore:</strong> No-code AI agent platform with autonomous reasoning, hybrid RAG, and multi-agent orchestration via LangGraph.</li>
  <li><strong>Rbetraj:</strong> Automated dropshipping platform powered by AI-Crawler with LLM-based structured data extraction.</li>
  <li><strong>GALAMBO:</strong> Multi-modal agentic AI assistant with GPT-4, real-time image search, and autonomous tool usage.</li>
  <li><strong>SalesMoji:</strong> AI-powered sales intelligence system reliably processing 100K+ records/day and 4,500+ daily API requests.</li>
  <li><strong>AISERA:</strong> Enterprise AI system for Fortune 500 clients with BERT fine-tuning and production issue resolution.</li>
  <li><strong>evalmyBRAND:</strong> Aspect-based sentiment analysis system (RoBERTa, 18% improvement) with 15+ language support.</li>
  <li><strong>InventtEd:</strong> AI-powered educational platform with CLIP, Flan-T5, automated essay grading, and virtual tutoring.</li>
  <li><strong>Mice Protein ML:</strong> Automated ML pipeline for 8-class protein classification achieving 35% training time reduction natively via Optuna.</li>
</ul>

<div style="display: flex; justify-content: space-between; margin-top: 10px;">
  <div style="flex: 1;">
    <h2>EDUCATION</h2>
    <strong>B.Tech. Mechanical Engineering</strong><br>
    Biju Patnaik University of Technology | 2016<br>
    GATE Qualified (ID: A2WR3)
  </div>
  <div style="flex: 1;">
    <h2>CERTIFICATIONS & ACHIEVEMENTS</h2>
    <span class="icon i-trophy"></span> <strong>ML Zoom Camp:</strong> DataTalksClub (8F163B)<br>
    <span class="icon i-trophy"></span> <strong>HackerRank Gold:</strong> Python, Problem Solving, Statistics<br>
    <span class="icon i-trophy"></span> <strong>Kaggle 30 Days ML:</strong> Rank 69 / 7,573 Teams
  </div>
</div>
