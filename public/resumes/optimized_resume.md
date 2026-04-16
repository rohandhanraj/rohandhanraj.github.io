<style>
  @page { margin: 15mm; }
  body { font-family: system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.2; margin: 0; padding: 0; color: #222; }
  h1 { font-size: 24px; margin: 0 0 8px 0; text-align: center; text-transform: uppercase; letter-spacing: 1.5px; color: #111; }
  h2 { font-size: 16px; margin: 16px 0 8px 0; border-bottom: 2px solid #ddd; padding-bottom: 4px; text-transform: uppercase; color: #333; }
  h3 { font-size: 14px; margin: 0; font-weight: bold; padding-top: 8px; color: #222; }
  p, ul, li { margin: 0 0 6px 0; }
  ul { padding-left: 20px; margin-bottom: 12px; margin-top: 4px; }
  hr { display: none; }
  a { text-decoration: none; color: #000; }
  .contact-info { text-align: center; font-size: 12px; margin-bottom: 16px; line-height: 1.6; color: #444; }
  .grid-2 { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; border-bottom: none; }
  .date { color: #555; font-size: 12px; font-weight: 500; }
  .tech { font-style: italic; color: #555; font-size: 12px; margin-bottom: 12px; display: block; }
  strong { color: #000; font-weight: 700; }
  .icon { display: inline-block; width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px; background-size: contain; background-repeat: no-repeat; }
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
<span class="icon i-email"></span> <a href="mailto:rohan.dhanraj.y@gmail.com">rohan.dhanraj.y@gmail.com</a> | <span class="icon i-phone"></span> +91-7008958143 | <span class="icon i-loc"></span> Bengaluru, India<br>
<span class="icon i-li"></span> <a href="https://linkedin.com/in/rohan-dhanraj-yadav">LinkedIn</a> | <span class="icon i-port"></span> <a href="https://rohandhanraj.github.io/">Portfolio</a> | <span class="icon i-git"></span> <a href="https://github.com/rohandhanraj">GitHub</a>
</div>


## SUMMARY


Results-driven AI/ML Engineer with **7+ years of total professional experience**, including **4+ years** building production-grade AI systems. Expert in **Generative AI, Agentic AI, LLMs, RAG,** and **Multi-Agent Orchestration**. Proven track record leading cross-functional teams of **15+ engineers**, architecting systems handling **4,500+ daily API requests**, processing **100K+ daily records**, and delivering **18–38% model performance improvements** for **Fortune 500 clients** (Cisco, ITC, KDP, Marco). Deep expertise in end-to-end ML pipelines, containerized deployment, and robust cloud API architecture.

---

## TECHNICAL SKILLS

Python, FastAPI, Scikit Learn, Tensorflow, PyTorch, Transformers, LangChain, LangGraph, RAG, Multi-Agent Systems, Apache Airflow, Docker, AWS, GCP, SQL, NoSQL and Vector Databases

---

## EXPERIENCE

### AI/ML Engineer

AI Tech Solutions Ltd. | Nov 2024 – Oct 2025

* Designed and orchestrated multi-agent AI systems utilizing LangGraph for complex task execution
* Enhanced context retrieval relevance by 38% through hybrid RAG implementation
* Built high-throughput, asynchronous backend microservices using FastAPI

### Software Engineer

Aimlytics Technology | Sep 2022 – Oct 2024

* Architected scalable RAG-based assistants reliably processing 4,500+ daily API requests
* Fine-tuned BERT and RoBERTa models, improving text classification F1-scores by 18%
* Orchestrated ETL data pipelines via Airflow to handle 100K+ daily records for ML workflows

### Machine Learning Engineer Intern

iNeuron.ai | Aug 2021 – Sep 2022

* Accelerated hyperparameter tuning cycles by 35% using Optuna optimization
* Deployed containerized machine learning endpoints using Docker and Flask

---

## PROJECTS

* **Omodore**: Autonomous Agentic AI platform demonstrating LangGraph state orchestration
* **GALAMBO**: Multi-modal AI assistant integrating vision models and real-time tool use
* **SalesMoji**: Scalable AI sales intelligence system leveraging vector search retrieval

---

## EDUCATION

B.Tech Mechanical Engineering | GATE Qualified
