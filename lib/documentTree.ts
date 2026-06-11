// Vectorless RAG — Document Tree
// Each node represents a section of Rohan's professional profile.
// Keywords are used for query routing — no embeddings needed.

import { DocNode } from "./types";

export function buildDocumentTree(): DocNode[] {
  return [
    // ─── PERSONAL ────────────────────────────────────────────────────────────
    {
      id: "personal",
      section: "About",
      label: "Personal Information & Summary",
      keywords: [
        "who", "about", "rohan", "person", "introduction", "bio",
        "profile", "summary", "background", "overview", "engineer",
        "specialist", "ai", "ml", "himself", "he", "his",
      ],
      content: `
Rohan Dhanraj Yadav is a Senior AI/ML Engineer and Generative AI Specialist based in Bengaluru, India.
He has 7+ years of total professional experience including 4+ years specializing in production-grade AI systems, 2+ years in Generative AI, and 1+ year in Agentic AI systems.

Professional summary:
Results-driven AI/ML Engineer with deep expertise in Generative AI, Agentic AI, Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), Multi-Agent Orchestration, and Statistical Machine Learning. Proven track record leading cross-functional teams of 15+ engineers, architecting scalable ML/AI pipelines, and delivering high-impact AI applications for Fortune 500 clients (Cisco, ITC Fairview, KDP, Omnitrax, PDS, Marco Technologies). Known for building production-grade systems and mastering new tech stacks swiftly under pressure.

Career Metrics:
- 7+ total years experience | 4+ years AI/ML | 2+ years GenAI | 1+ year Agentic AI
- 8+ production AI projects delivered
- Built systems handling 10,000+ daily queries with 92% accuracy
- Processed 1M+ daily records through Apache Airflow pipelines
- Achieved 45% accuracy boost in RAG pipelines via advanced multi-stage retrieval
- Delivered 50% model performance improvements in production (BERT, RoBERTa fine-tuning)
- Led cross-functional teams of 8–15 members across high-stakes enterprise projects
- Reduced training time by 40% through Optuna hyperparameter optimization
- 3+ years of earlier industrial quality engineering experience at Jindal Steels, Vedanta Aluminum, and Tata Steels
      `.trim(),
      children: [
        {
          id: "personal.contact",
          section: "Contact",
          label: "Contact Details",
          keywords: [
            "contact", "email", "phone", "reach", "linkedin", "github",
            "twitter", "reach out", "hire", "connect", "message",
          ],
          content: `
Contact Rohan Dhanraj Yadav:
- Email: rohan.dhanraj.y@gmail.com
- Phone: +91-7008958143
- LinkedIn: https://www.linkedin.com/in/rohan-dhanraj-yadav
- GitHub: https://github.com/rohandhanraj
- Portfolio: https://rohandhanraj.github.io/
- Twitter: https://twitter.com/rdx2496
- Location: Bengaluru, India
          `.trim(),
        },
      ],
    },

    // ─── EXPERIENCE ──────────────────────────────────────────────────────────
    {
      id: "experience",
      section: "Experience",
      label: "Work Experience Overview",
      keywords: [
        "experience", "work", "job", "career", "history", "employment",
        "professional", "years", "worked", "companies", "organizations",
      ],
      content: `
Rohan has 7+ years of total professional experience across 4 organizations:
1. AI Tech Solutions Ltd. — AI Engineer, Backend & AI Systems Architecture (Nov 2024 – Oct 2025)
2. Aimlytics Technology — Software Engineer, Generative AI | ML | Python (Sep 2022 – Oct 2024)
3. iNeuron.ai — Machine Learning Engineer Intern (Aug 2021 – Sep 2022)
4. Bureau Veritas Group — Metallurgical Quality Engineer (Aug 2016 – Nov 2019)
      `.trim(),
      children: [
        {
          id: "experience.aitechsolutions",
          section: "Experience",
          label: "AI Tech Solutions Ltd. — Senior AI Engineer",
          keywords: [
            "ai tech", "ai tech solutions", "current", "senior", "latest",
            "omodore", "rbetraj", "galambo", "2024", "2025", "november",
            "agentic", "multi-agent", "langgraph", "architect",
          ],
          content: `
Company: AI Tech Solutions Ltd.
Role: Senior AI Engineer
Duration: November 2024 – October 2025
Focus: Architecting production-ready agentic AI platforms and advanced RAG systems

Key Achievements & Responsibilities:
- Led technology vision and AI strategy for next-generation autonomous agent platforms
- Architected scalable agentic AI infrastructure with 45% accuracy improvement through advanced RAG pipelines
- Designed multi-agent orchestration systems using LangGraph for complex workflow automation
- Implemented sophisticated prompt chaining and chain-of-thought (CoT) reasoning mechanisms
- Built scalable FastAPI microservices integrating multiple LLMs for enterprise applications
- Engineered vector database architectures (Qdrant, Milvus, Weaviate) for semantic search at scale
- Built and mentored AI engineering teams; led a 15-member cross-functional group
- Key projects: OMODORE (autonomous agent platform), RBETRAJ (e-commerce scraper), GALAMBO (multi-modal agent)

Technologies: Python, LangChain, LangGraph, FastAPI, LLMs, GPT, Prompt Chaining, RAG, Agent Building, Qdrant, Milvus, Weaviate, Docker
          `.trim(),
        },
        {
          id: "experience.aimlytics",
          section: "Experience",
          label: "Aimlytics Technology — Software Engineer",
          keywords: [
            "aimlytics", "salesmoji", "aisera", "evalmybrand", "inventted",
            "fortune 500", "cisco", "itc", "kdp", "marco", "software engineer",
            "2022", "2023", "2024", "september", "generative ai", "ml",
          ],
          content: `
Company: Aimlytics Technology
Role: Software Engineer (Generative AI | ML | Data Science | Python)
Duration: September 2022 – October 2024
Focus: Enterprise-scale Generative AI and NLP solutions for Fortune 500 clients

Key Achievements & Responsibilities:
- Led team of 8 engineers delivering custom AI workflows for Fortune 500 clients: Cisco, ITC Fairview, KDP, Omnitrax, PDS, Marco Technologies
- Architected RAG-based virtual sales assistant handling 10,000+ daily queries with 92% accuracy
- Built end-to-end ML pipelines using Airflow for automated model training and deployment
- Fine-tuned BERT and RoBERTa models for sentiment analysis, achieving 50% performance improvement
- Implemented vector DB solutions (Qdrant, Milvus, Weaviate, Chroma) for semantic search
- Resolved 28 critical production tickets while mentoring junior developers
- Built custom LangChain workflows with OpenAI APIs for context-aware conversational AI
- Key projects: SalesMoji, AISERA, evalmyBrand, InventtEd

Technologies: Python, RAG, LangChain, LangGraph, Airflow, BERT, RoBERTa, Vector DB, FastAPI, TensorFlow, PyTorch, GCP
          `.trim(),
        },
        {
          id: "experience.ineuron",
          section: "Experience",
          label: "iNeuron.ai — ML Engineer Intern",
          keywords: [
            "ineuron", "intern", "internship", "2021", "2022", "august",
            "machine learning", "flask", "scikit", "optuna", "mice", "protein",
            "junior", "early career", "first job",
          ],
          content: `
Company: iNeuron.ai
Role: Machine Learning Engineer Intern
Duration: August 2021 – September 2022
Focus: ML pipeline development and optimization

Key Achievements & Responsibilities:
- Developed and deployed scalable ML applications for diverse business use cases
- Led team of 10 members in building automated ML pipeline architecture
- Implemented hyperparameter optimization using Optuna, reducing training time by 40%
- Collaborated on AI-driven automation projects across multiple client engagements
- Deployed containerized ML solutions using Docker for scalable deployment
- Key project: Mice Protein Expression Classification (bioinformatics multi-class classification)

Technologies: Python, Flask, Scikit-Learn, MySQL, Cassandra, Optuna, Docker, AWS
          `.trim(),
        },
        {
          id: "experience.bureauveritas",
          section: "Experience",
          label: "Bureau Veritas Group — Metallurgical Quality Engineer",
          keywords: [
            "bureau veritas", "metallurgical", "quality engineer", "2016",
            "2017", "2018", "2019", "jindal", "vedanta", "tata",
            "steels", "metals", "minerals", "industrial", "quality assurance",
            "earlier career", "non-tech", "before ai",
          ],
          content: `
Company: Bureau Veritas Group
Role: Metallurgical Quality Engineer
Duration: August 2016 – November 2019
Focus: Quality assurance, metallurgical testing, and industrial analytics

Key Responsibilities:
- Performed quality assurance for metals and minerals across three major industrial divisions
- Jindal Steels (Coal & Coke Division) — metallurgical testing and quality control
- Vedanta Aluminum (Coal & Coke Division) — quality assurance and compliance
- Tata Steels (Metals & Minerals Division) — industrial materials testing
- Applied statistical analysis and data-driven quality improvement methodologies
- Managed quality standards compliance across three major steel manufacturing facilities
- This industrial background gives Rohan a unique domain perspective in AI for manufacturing
          `.trim(),
        },
      ],
    },

    // ─── PROJECTS ─────────────────────────────────────────────────────────────
    {
      id: "projects",
      section: "Projects",
      label: "Projects Overview",
      keywords: [
        "project", "projects", "built", "created", "developed", "portfolio",
        "work", "application", "system", "platform", "tool",
      ],
      content: `
Rohan has built 8 major AI/ML projects:
1. OMODORE — Autonomous no-code agent platform (2024–2025)
2. RBETRAJ — E-commerce agentic scraper (2024–2025)
3. GALAMBO — Multi-modal virtual agent (2024–2025)
4. SalesMoji — AI sales intelligence platform (2023–2024)
5. AISERA — Enterprise AI service management (2023–2024)
6. evalmyBrand — Brand analytics platform (2022–2024)
7. InventtEd — Educational AI platform (2023)
8. Mice Protein Expression — Bioinformatics ML system (2021–2022)
      `.trim(),
      children: [
        {
          id: "projects.omodore",
          section: "Projects",
          label: "OMODORE — Autonomous Agent Platform",
          keywords: [
            "omodore", "autonomous", "no-code", "no code", "agent platform",
            "agentic", "non-technical", "domain-specific", "rag pipeline",
            "45%", "accuracy", "omodore.com",
          ],
          content: `
Project: OMODORE
URL: https://omodore.com
GitHub: https://github.com/rohandhanraj/omodore
Duration: November 2024 – October 2025
Domain: AI Agent Platform
Role: Senior AI Engineer, led 15-member team

Description:
Revolutionary no-code platform enabling non-technical users to build sophisticated domain-specific AI agents with autonomous reasoning capabilities. Achieved 45% accuracy improvement through advanced RAG pipeline architecture.

Key Features:
- No-code AI agent builder for domain-specific applications
- Advanced RAG pipeline with 45% accuracy improvement
- Context-aware intelligent responses using Chain of Thoughts (CoT)
- Multi-agent orchestration using LangGraph
- Scalable enterprise-grade architecture

Tech Stack: Python, LangChain, LangGraph, FastAPI, GPT, LLMs, Prompt Chaining, RAG, Agent Building, Qdrant, Milvus, Weaviate, Docker
          `.trim(),
        },
        {
          id: "projects.rbetraj",
          section: "Projects",
          label: "RBETRAJ — E-commerce Agentic Scraper",
          keywords: [
            "rbetraj", "scraper", "scraping", "ecommerce", "e-commerce",
            "price tracking", "data extraction", "pydantic", "open source",
            "selenium", "playwright", "shop scan",
          ],
          content: `
Project: RBETRAJ
URL: https://rbetraj.com
GitHub: https://github.com/rohandhanraj/rbetraj
Duration: November 2024 – October 2025
Domain: E-commerce Data Intelligence
Role: Senior AI Engineer

Description:
Open-source agentic scraping platform combining LLM intelligence with structured data extraction for e-commerce competitive analysis. Features Pydantic-validated outputs and autonomous decision-making.

Key Features:
- Automated website scraping with intelligent LLM-guided data extraction
- Structured output via Pydantic validation — clean JSON from any e-commerce site
- Real-time price tracking across multiple platforms
- GPT-powered data structuring and query answering
- Competitive analysis and market intelligence

Tech Stack: Python, FastAPI, Selenium, Playwright, GPT, LLMs, LangChain, Pydantic, Docker
          `.trim(),
        },
        {
          id: "projects.galambo",
          section: "Projects",
          label: "GALAMBO — Multi-Modal Virtual Agent",
          keywords: [
            "galambo", "multi-modal", "multimodal", "image", "vision",
            "visual", "search", "galambo.com", "text and image",
          ],
          content: `
Project: GALAMBO
URL: https://galambo.com
GitHub: https://github.com/rohandhanraj/galambo
Duration: November 2024 – October 2025
Domain: Multi-Modal AI Assistant
Role: Senior AI Engineer

Description:
Sophisticated multi-modal virtual agent integrating text and image processing with real-time information retrieval. Features advanced context management and search engine tool integration.

Key Features:
- Multi-modal AI processing (text + images)
- Context-aware conversational responses via LLMs
- Intelligent image search and analysis
- Real-time information retrieval from the web
- Scalable FastAPI microservice architecture

Tech Stack: Python, FastAPI, GPT, LLMs, Multi-modal AI, LangChain, Agent Building, Docker
          `.trim(),
        },
        {
          id: "projects.salesmoji",
          section: "Projects",
          label: "SalesMoji — AI Sales Intelligence Platform",
          keywords: [
            "salesmoji", "sales", "1m", "1 million", "records",
            "airflow", "pipeline", "10k", "queries", "92%",
            "dashboard", "analytics", "forecasting",
          ],
          content: `
Project: SalesMoji
Duration: November 2023 – October 2024
Domain: Sales and Marketing Intelligence
Role: Software Engineer (Generative AI | ML)

Description:
Production-scale GPT-powered sales intelligence platform processing 1M+ daily records and handling 10,000+ queries at 92% accuracy. Features advanced RAG architecture with multi-stage retrieval and LangGraph-based agents.

Key Metrics:
- 1,000,000+ daily records processed through Airflow pipelines
- 10,000+ daily natural language queries at 92% accuracy
- Real-time data visualization and predictive analytics
- Served Fortune 500 clients: Cisco, ITC Fairview, KDP

Key Features:
- AI-powered sales insights via conversational interface
- Custom ML models for predictive analytics and forecasting
- Multi-channel RAG pipelines with vector DB retrieval
- LangGraph-based agent workflows for complex reasoning

Tech Stack: Python, FastAPI, GPT, RAG, LangChain, LangGraph, Airflow, Qdrant, Milvus, Weaviate, MySQL, MongoDB, TensorFlow, PyTorch
          `.trim(),
        },
        {
          id: "projects.aisera",
          section: "Projects",
          label: "AISERA — Enterprise AI Service Management",
          keywords: [
            "aisera", "enterprise", "customer support", "cisco", "itc",
            "kdp", "marco", "omnitrax", "fortune 500", "aism",
            "it operations", "service management", "bert",
          ],
          content: `
Project: AISERA (ChatGPT for Enterprises)
Duration: July 2023 – October 2024
Domain: Customer Service & IT Operations Management
Role: Software Engineer (AI | ML)

Description:
RAG-based conversational AI assistants for Fortune 500 clients processing 10,000+ daily queries. Enterprise-grade platform automating customer support and IT operations.

Clients: Cisco, ITC Fairview, KDP, Omnitrax, PDS, Marco Technologies

Key Features:
- AI Service Management (AISM) framework for automated IT operations
- BERT fine-tuned for sentiment analysis with 50% performance gain
- Custom field prediction via advanced BERT architectures
- Vector DB solutions (Chroma, Weaviate) for RAG applications
- 28 production tickets resolved with 100% on-time delivery

Tech Stack: Python, FastAPI, BERT, LangChain, RAG, Chroma, Weaviate, Postgres, MongoDB, Airflow, GCP
          `.trim(),
        },
        {
          id: "projects.evalmybrand",
          section: "Projects",
          label: "evalmyBrand — Brand Analytics Platform",
          keywords: [
            "evalmybrand", "brand", "sentiment", "analytics", "roberta",
            "aspect-based", "15 languages", "competitor", "nlp",
            "social media", "feedback",
          ],
          content: `
Project: evalmyBrand
Duration: September 2022 – October 2024
Domain: Customer Experience & Brand Intelligence
Role: Software Developer (AI | ML)

Description:
AI-powered platform turning unstructured customer feedback into actionable brand intelligence. Supports 15+ languages for comprehensive global brand monitoring.

Key Features:
- Aspect-Based Sentiment Analysis with 50% performance gain (RoBERTa fine-tuned)
- 15+ language support via mixed-code translation pipeline
- Competitor benchmarking and brand goal monitoring
- BERT models for Neural Machine Translation (27% accuracy improvement)
- Intelligent case management and customer engagement tracking

Tech Stack: Python, FastAPI, Flask, RoBERTa, BERT, LangChain, RAG, Airflow, Oracle, MongoDB, Cassandra
          `.trim(),
        },
        {
          id: "projects.inventted",
          section: "Projects",
          label: "InventtEd — Educational AI Platform",
          keywords: [
            "inventted", "education", "edtech", "clip", "flan-t5",
            "mcq", "grading", "tutoring", "student", "phishing",
            "summarization", "timetable",
          ],
          content: `
Project: InventtEd
Duration: January 2023 – August 2023
Domain: Educational Technology
Role: Software Developer (AI | ML)

Description:
Pioneer education platform leveraging AI to make educators and students more productive. Features text summarization, automated grading, MCQ generation, and virtual tutoring.

Key Features:
- CLIP multi-modal vision transformer fine-tuned for text-to-image generation
- Flan-T5 fine-tuned for automated keyword-based MCQ generation
- Scalable phishing classifier for email security
- Multi-modal model for social media content classification
- Virtual Tutor (Q&A bot) for student support

Tech Stack: Python, FastAPI, CLIP, Flan-T5, LangChain, RAG, Transformers, Oracle, MongoDB, GCP
          `.trim(),
        },
        {
          id: "projects.mice",
          section: "Projects",
          label: "Mice Protein Expression Classification",
          keywords: [
            "mice", "protein", "expression", "bioinformatics",
            "classification", "down syndrome", "optuna", "flask",
            "multi-class", "77 proteins", "8 classes",
          ],
          content: `
Project: Mice Protein Expression Classification
GitHub: https://github.com/rohandhanraj/mice-protein-expression
Duration: August 2021 – September 2022
Domain: Bioinformatics & Medical AI
Role: Machine Learning Engineer Intern (led 10-member team)

Description:
Multi-class classification system analyzing 77 protein expression levels across 8 classes in control and Down syndrome mice. Published to identify discriminant protein subsets for medical research.

Key Features:
- 8-class multi-label classification across 77 protein markers
- Automated ML pipeline for hyperparameter tuning via Optuna (40% training time reduction)
- Model selection algorithms for identifying best production-ready model
- Deployed as Flask web application with MySQL + Cassandra data backend

Tech Stack: Python, Flask, Scikit-Learn, Optuna, MySQL, Cassandra, Docker, AWS
          `.trim(),
        },
      ],
    },

    // ─── SKILLS ──────────────────────────────────────────────────────────────
    {
      id: "skills",
      section: "Skills",
      label: "Technical Skills Overview",
      keywords: [
        "skills", "technologies", "tech", "stack", "tools", "can",
        "knows", "expertise", "proficient", "capable", "knowledge",
      ],
      content: `
Rohan's technical skills span the full AI/ML stack:
- Languages/Frameworks: Python, FastAPI, Flask, Django, Streamlit
- Generative AI: LLMs, OpenAI GPT, LangChain, LangGraph, RAG Architecture, Prompt Engineering, Agent Building, Prompt Chaining, Chain-of-Thought Reasoning
- Agentic AI: Agent Orchestration, LangGraph Workflows, Multi-Agent Systems, Tool Integration, Memory Management, Agent Planning & Reasoning, Autonomous Decision-Making
- ML/DL: Scikit-Learn, TensorFlow, Keras, PyTorch, HuggingFace Transformers, Optuna, PyCaret, Model Fine-tuning
- NLP: BERT, RoBERTa, CLIP, Flan-T5, Spacy, NLTK, Sentiment Analysis, Named Entity Recognition (NER), Text Classification, Neural Machine Translation
- Data Engineering: Apache Airflow, ETL, MySQL, Postgres, MongoDB, Cassandra, Oracle, BigQuery
- Vector Databases: Qdrant, Milvus, Weaviate, Chroma
- Analytics: NumPy, Pandas, Matplotlib, Seaborn, Plotly, SciPy, Statistical Analysis
- DevOps: Docker, Kubernetes, CI/CD, Jenkins, GCP, AWS, MLOps, MLflow, GitHub, GitLab
- Web Scraping: Selenium, Playwright, BeautifulSoup, Scrapy
      `.trim(),
      children: [
        {
          id: "skills.generative_ai",
          section: "Skills",
          label: "Generative AI & LLM Skills",
          keywords: [
            "langchain", "langgraph", "rag", "retrieval augmented generation",
            "llm", "gpt", "generative ai", "prompt engineering", "agent",
            "chain of thought", "agentic", "openai", "anthropic", "gemini",
            "llama", "mistral", "prompt chaining", "fine-tuning", "finetuning",
          ],
          content: `
Generative AI & LLM Expertise:
- LLMs: GPT-4, Claude, Gemini, Llama, Mistral — integration and fine-tuning
- LangChain: chains, agents, tools, memory, document loaders, retrievers
- LangGraph: multi-agent orchestration, stateful workflows, cyclic graphs
- RAG (Retrieval-Augmented Generation): advanced pipelines with 45% accuracy improvement
- Prompt Engineering: prompt chaining, chain-of-thought, few-shot, structured output
- Agent Building: autonomous agents, tool-use, web-crawling agents, multi-agent systems
- Fine-tuning: BERT, RoBERTa, CLIP, Flan-T5 with 27–50% performance improvements
          `.trim(),
        },
        {
          id: "skills.agentic_ai",
          section: "Skills",
          label: "Agentic AI & Multi-Agent Systems",
          keywords: [
            "agentic", "agentic ai", "agent orchestration", "multi-agent",
            "autonomous", "tool integration", "memory management",
            "agent planning", "decision-making", "langgraph workflows",
          ],
          content: `
Agentic AI & Multi-Agent Systems:
- Agent Orchestration: designing and managing autonomous AI agent workflows
- LangGraph Workflows: stateful, cyclic multi-agent orchestration graphs
- Multi-Agent Systems: coordinating specialized agents for complex task decomposition
- Tool Integration: dynamic tool selection and autonomous API consumption
- Memory Management: short-term and long-term context management for agents
- Agent Planning & Reasoning: chain-of-thought and tree-of-thought reasoning
- Autonomous Decision-Making: self-directed agents that plan, execute, and adapt
- Applications: OMODORE (no-code agent platform), GALAMBO (multi-modal agentic assistant), RBETRAJ (agentic scraper)
          `.trim(),
        },
        {
          id: "skills.languages",
          section: "Skills",
          label: "Programming Languages & Frameworks",
          keywords: [
            "python", "fastapi", "flask", "django", "streamlit",
            "programming", "backend", "api", "web", "framework",
            "rest", "microservice", "async",
          ],
          content: `
Programming Languages & Backend Frameworks:
- Python: primary language (4+ years, production-grade)
- FastAPI: REST APIs, async microservices, LLM application backends
- Flask: ML model serving, lightweight APIs
- Django: full-stack web applications
- Streamlit: data apps and AI demos
- Java (Nashorn): enterprise system integrations
          `.trim(),
        },
        {
          id: "skills.ml_dl",
          section: "Skills",
          label: "Machine Learning & Deep Learning",
          keywords: [
            "machine learning", "deep learning", "tensorflow", "pytorch",
            "scikit", "sklearn", "keras", "optuna", "pycaret",
            "neural network", "model", "training", "classification",
            "regression", "transformers", "huggingface",
          ],
          content: `
Machine Learning & Deep Learning:
- Frameworks: Scikit-Learn, TensorFlow, Keras, PyTorch
- Transformers: HuggingFace Transformers, BERT, RoBERTa, CLIP, Flan-T5
- AutoML: Optuna (hyperparameter tuning — 40% training time reduction), PyCaret
- Tasks: classification, regression, NLP, computer vision, multi-modal
- MLOps: MLflow, CI/CD pipelines, model monitoring, Docker containerization
          `.trim(),
        },
        {
          id: "skills.data_engineering",
          section: "Skills",
          label: "Data Engineering & Databases",
          keywords: [
            "airflow", "etl", "pipeline", "data engineering", "database",
            "sql", "mysql", "postgres", "postgresql", "mongodb", "cassandra",
            "oracle", "bigquery", "nosql", "qdrant", "milvus", "weaviate",
            "chroma", "vector", "vector database", "vector db",
          ],
          content: `
Data Engineering & Database Skills:
- Orchestration: Apache Airflow (complex DAGs, 1M+ daily records)
- SQL: MySQL, PostgreSQL, Oracle, BigQuery
- NoSQL: MongoDB, Cassandra
- Vector Databases: Qdrant, Milvus, Weaviate, Chroma (for RAG applications)
- ETL Pipelines: multi-source data integration, real-time processing
          `.trim(),
        },
        {
          id: "skills.devops",
          section: "Skills",
          label: "DevOps & Cloud",
          keywords: [
            "docker", "kubernetes", "k8s", "gcp", "aws", "cloud",
            "devops", "mlops", "ci/cd", "jenkins", "mlflow",
            "github", "gitlab", "git", "deployment", "container",
          ],
          content: `
DevOps & Cloud Skills:
- Containerization: Docker, Kubernetes (K8s)
- Cloud: GCP, AWS
- CI/CD: Jenkins, GitHub Actions, GitLab CI
- MLOps: MLflow, model lifecycle management, reproducibility
- Version Control: GitHub, GitLab
- Monitoring: production issue resolution across Fortune 500 deployments
          `.trim(),
        },
        {
          id: "skills.web_scraping",
          section: "Skills",
          label: "Web Scraping & Automation",
          keywords: [
            "selenium", "playwright", "scraping", "web scraping",
            "beautifulsoup", "scrapy", "automation", "crawling",
          ],
          content: `
Web Scraping & Automation:
- Selenium: browser automation and dynamic content scraping
- Playwright: modern browser automation with TypeScript/Python support
- BeautifulSoup: HTML parsing and static site scraping
- Scrapy: large-scale web crawling frameworks
- Application: RBETRAJ open-source scraper, built intelligent crawling with rate limiting and error handling
          `.trim(),
        },
      ],
    },

    // ─── EDUCATION & CERTIFICATIONS ──────────────────────────────────────────
    {
      id: "education",
      section: "Education",
      label: "Education & Certifications",
      keywords: [
        "education", "degree", "university", "college", "btech",
        "engineering", "mechanical", "gate", "certification", "certified",
        "hackerrank", "kaggle", "course", "qualification",
      ],
      content: `
Education:
- Degree: Bachelor of Engineering in Mechanical Engineering
- Institution: Biju Patnaik University of Technology, Odisha, India
- Year: 2016
- GATE Qualified — Credential ID: A2WR3

Certifications:
1. GATE ME 2016 — Credential ID: A2WR3
2. Machine Learning Zoom Camp — DataTalksClub — Credential ID: 8F163B (Feb 2022)
3. Gold Badge: Python — HackerRank — Credential ID: 6920934A49FA (Aug 2021)
4. Gold Badge: Problem Solving — HackerRank — Credential ID: 113775E95540 (Aug 2021)
5. Gold Badge: Statistics (10 Days) — HackerRank (Aug 2021)
6. 30 Days of ML Challenge — Kaggle — Rank: 69 out of 7,573 teams
      `.trim(),
    },

    // ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────
    {
      id: "achievements",
      section: "Achievements",
      label: "Achievements & Awards",
      keywords: [
        "achievement", "award", "accomplishment", "rank", "badge",
        "gold", "kaggle", "hackerrank", "top", "best", "recognition",
        "notable", "proud", "milestone",
      ],
      content: `
Notable Achievements:
- 7+ years total experience: 4+ years AI/ML, 2+ years GenAI, 1+ year Agentic AI
- Gold Badges on HackerRank: Python, Problem Solving, 10 Days of Statistics
- Ranked 69th out of 7,573 teams in Kaggle's 30 Days of ML Challenge
- Led cross-functional teams of 8–15 members in high-stakes enterprise AI projects
- 50% model performance improvements in production systems (BERT, RoBERTa fine-tuning)
- Architected systems handling 10,000+ daily queries with 92% accuracy
- Processed 1M+ daily records through Apache Airflow production pipelines
- 45% accuracy boost in RAG pipelines through advanced multi-stage retrieval strategies
- Reduced training time 40% via Optuna hyperparameter optimization
- Resolved 28 critical production issues for Fortune 500 clients (Cisco, ITC Fairview, KDP, Omnitrax, PDS, Marco Technologies)
- GATE qualifier in Mechanical Engineering (credential ID: A2WR3)
- Contributed to open-source AI community through RBETRAJ project
- 3+ years industrial quality engineering at Jindal Steels, Vedanta Aluminum, Tata Steels (Bureau Veritas Group)
      `.trim(),
    },
  ];
}

// Flatten the entire tree into a list of all nodes (for scoring all nodes)
export function flattenTree(nodes: DocNode[]): DocNode[] {
  const result: DocNode[] = [];
  function traverse(node: DocNode) {
    result.push(node);
    if (node.children) node.children.forEach(traverse);
  }
  nodes.forEach(traverse);
  return result;
}
