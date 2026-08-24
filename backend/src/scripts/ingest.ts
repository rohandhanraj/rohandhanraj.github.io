import "../config/env.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mongoClient, getNeo4jSession, qdrantClient } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DocumentNode {
  id: string;
  section: string;
  label: string;
  keywords: string[];
  content: string;
}

const documentTreePath = path.resolve(__dirname, "../../../frontend/lib/documentTree.json");

async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.COHERE_API_KEY?.trim();
  const model = process.env.COHERE_EMBEDDING_MODEL?.trim() || "embed-english-v3.0";
  const baseUrl = process.env.COHERE_BASE_URL?.trim() || "https://api.cohere.com/v2";

  if (!apiKey || apiKey === "mock-key") {
    // Generate a mock 1024-dimensional embedding for testing/fallback
    const embedding = Array.from({ length: 1024 }, () => Math.random() - 0.5);
    return embedding;
  }

  const res = await fetch(`${baseUrl}/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      texts: [text.replace(/\n/g, " ")],
      input_type: "search_document",
      embedding_types: ["float"]
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Embedding API failed: ${res.status} ${res.statusText} - ${errorText}`);
  }

  const data = (await res.json()) as any;
  if (!data?.embeddings?.float?.[0]) {
    throw new Error(`Invalid response structure from embedding API: ${JSON.stringify(data)}`);
  }

  return data.embeddings.float[0];
}

export async function ingestResume() {
  console.log("Starting resume ingestion pipeline...");

  // 1. Read document tree
  if (!fs.existsSync(documentTreePath)) {
    throw new Error(`documentTree.json not found at ${documentTreePath}`);
  }
  const rawTree = fs.readFileSync(documentTreePath, "utf-8");
  const nodes: DocumentNode[] = JSON.parse(rawTree);

  // 2. Setup Qdrant Collection
  const collectionName = "resume_chunks";

  // Get first embedding to dynamically determine dimension size
  console.log("Determining embedding dimension size dynamically...");
  const firstValidNode = nodes.find(n => n.content.trim().length > 0);
  if (!firstValidNode) {
    throw new Error("No valid nodes with content found in document tree.");
  }
  const firstEmbedding = await getEmbedding(firstValidNode.content);
  const embeddingDim = firstEmbedding.length;
  console.log(`Determined embedding dimension: ${embeddingDim}`);

  const collections = await qdrantClient.getCollections();
  const exists = collections.collections.some(c => c.name === collectionName);

  if (exists) {
    console.log(`Deleting existing Qdrant collection '${collectionName}'...`);
    await qdrantClient.deleteCollection(collectionName);
  }

  console.log(`Creating Qdrant collection '${collectionName}' with size ${embeddingDim}...`);
  await qdrantClient.createCollection(collectionName, {
    vectors: {
      size: embeddingDim,
      distance: "Cosine"
    }
  });

  // 3. Process and Upload to Qdrant (Vector DB)
  console.log("Embedding and upserting chunks to Qdrant...");
  const points = [];
  let failedCount = 0;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node.content.trim()) continue;

    console.log(`Embedding node: ${node.id} (${i + 1}/${nodes.length})`);
    try {
      const embedding = await getEmbedding(node.content);
      points.push({
        id: i + 1,
        vector: embedding,
        payload: {
          nodeId: node.id,
          section: node.section,
          label: node.label,
          content: node.content,
          keywords: node.keywords
        }
      });
    } catch (err) {
      failedCount++;
      console.error(`Failed to embed node ${node.id}:`, err);
    }
  }

  if (failedCount > 0) {
    throw new Error(`Ingestion failed: ${failedCount} of ${nodes.length} nodes failed to embed.`);
  }

  if (points.length > 0) {
    await qdrantClient.upsert(collectionName, {
      wait: true,
      points
    });
    console.log(`Successfully uploaded ${points.length} points to Qdrant.`);
  }

  // 4. Setup and Upload to Neo4j (Graph DB)
  console.log("Upserting Graph entities to Neo4j...");
  const session = getNeo4jSession();
  try {
    // Clear existing graph to ensure clean seeding
    await session.run("MATCH (n) DETACH DELETE n");

    // Insert Section nodes
    for (const node of nodes) {
      await session.run(
        `
        MERGE (s:Section {id: $id})
        SET s.name = $name, s.content = $content
        `,
        { id: node.id, name: node.section, content: node.content }
      );
    }

    // Map projects and skills based on the synopsis
    const projects = [
      {
        name: "OMODORE",
        domain: "AI Agent Platform",
        desc: "Auto-agent platform enabling non-technical users to build domain-specific AI agents.",
        skills: [
          "Python", "FastAPI", "Sklearn", "TensorFlow", "Keras", "PyTorch",
          "Hugging Face Transformers", "LLMs", "Model Tuning", "Model Training",
          "Model Evaluation", "Model Deployment", "Model Monitoring", "Model Optimization",
          "Model Versioning", "Model Management", "Generative AI", "Agentic AI", "LangChain", "LangGraph", "GPT",
          "Prompt Chaining", "Chain of Thoughts", "Deep Research", "Web Search",
          "RAG", "Agent Building", "Autonomous Agents", "Multi-Agent Systems",
          "Apache Airflow", "Qdrant", "MongoDB", "Postgresql", "PgVector",
          "Neo4j", "Docker"
        ]
      },
      {
        name: "RBETRAJ",
        domain: "E-commerce Data Intelligence",
        desc: "Automated Dropshipping Platform powered by Shop Scan Agent for competitive analysis.",
        skills: [
          "Python", "FastAPI", "Selenium", "Playwright", "BeautifulSoup", "GPT",
          "LLMs", "Generative AI", "Agentic AI", "LangChain", "LangGraph", "Multi-Agent Systems", "Structured Outputs Generation", "Pydantic", "Apache Airflow", "Qdrant", "MongoDB", "Docker"
        ]
      },
      {
        name: "GALAMBO",
        domain: "Multi-Modal AI Assistant",
        desc: "Multi-modal virtual agent combining context-aware GPT responses with image search.",
        skills: [
          "Python", "FastAPI", "GPT", "LLMs", "Multi-modal AI", "LangChain",
          "Agent Building", "Search Engine Integration", "Docker"
        ]
      },
      {
        name: "SALESMOJI",
        domain: "Sales and Marketing",
        desc: "RAG-based Virtual Sales Assistant answering natural language sales queries.",
        skills: [
          "Python", "FastAPI", "Sklearn", "TensorFlow", "Keras", "PyTorch",
          "Hugging Face Transformers", "LLMs", "Generative AI", "Agentic AI", "LangChain", "LangGraph", "GPT",
          "Prompt Chaining", "Chain of Thoughts", "RAG", "Agent Building",
          "Apache Airflow", "MySQL", "MongoDB", "Qdrant", "Milvus", "Weaviate", "Docker"
        ]
      },
      {
        name: "AISERA",
        domain: "Customer Support & IT Ops",
        desc: "AISM platform automated operations support for Fortune 500 clients.",
        skills: [
          "Python", "Nashorn JAVA", "FastAPI", "Sklearn", "TensorFlow", "Keras", "PyTorch",
          "Spacy", "NLTK", "Hugging Face Transformers", "BERT", "LLMs", "Generative AI", "Agentic AI",
          "LangChain", "Prompt Chaining", "RAG", "Agent Building", "Autonomous Agents", "Multi-Agent Systems",
          "Agentic Guardrails and Middleware for Enterprise AI", "Apache Airflow", "MySQL",
          "MongoDB", "Chroma", "Weaviate", "GCP"
        ]
      },
      {
        name: "EVALMYBRAND",
        domain: "Brand Experience Management",
        desc: "Aspect-based sentiment analysis and translation supporting 15+ languages.",
        skills: [
          "Python", "Poetry", "Flask", "FastAPI", "Sklearn", "TensorFlow", "Keras", "PyTorch",
          "Spacy", "NLTK", "Hugging Face Transformers", "BERT", "RoBERTa", "LLMs",
          "Google Translate", "LibreOffice Translate", "Mixed Code Language Translation",
          "LangChain", "Prompt Chaining", "RAG", "Apache Airflow", "Oracle", "MongoDB", "Cassandra"
        ]
      },
      {
        name: "INVENTTED",
        domain: "Educational Technology",
        desc: "Pioneering education platform with timetabling, essay grading, MCQ generator.",
        skills: [
          "Python", "Poetry", "Flask", "FastAPI", "Oracle", "MongoDB", "Cassandra",
          "Sklearn", "TensorFlow", "Keras", "PyTorch", "Spacy", "NLTK",
          "Hugging Face Transformers", "LLMs", "CLIP", "Flan-T5", "LangChain",
          "Prompt Chaining", "RAG", "Agent Building", "Google Translate",
          "LibreOffice Translate", "Mixed Code Language Translation", "GCP"
        ]
      },
      {
        name: "MICE PROTEIN EXPRESSION",
        domain: "Bioinformatics",
        desc: "Bioinformatics multi-class classification platform for Down syndrome mice.",
        skills: [
          "Python", "Flask", "Cassandra DB", "MySQL", "Sklearn", "Optuna",
          "PyCaret", "Anaconda", "Data Pipeline", "Artificial Intelligence",
          "Machine Learning", "AWS", "Docker"
        ]
      }
    ];

    const experiences = [
      {
        company: "AI Tech Solutions Ltd.",
        role: "AI/ML Engineer",
        duration: "November 2024 – October 2025",
        skills: ["Python", "LangChain", "LangGraph", "FastAPI", "RAG", "Docker", "Qdrant", "Playwright", "Selenium"],
        projects: ["OMODORE", "RBETRAJ", "GALAMBO"]
      },
      {
        company: "Aimlytics Technology",
        role: "Software Engineer",
        duration: "September 2022 – October 2024",
        skills: ["Python", "RAG", "LangChain", "Apache Airflow", "BERT", "RoBERTa", "FastAPI", "Flask", "TensorFlow", "PyTorch", "Qdrant", "Chroma", "GCP"],
        projects: ["SALESMOJI", "AISERA", "EVALMYBRAND", "INVENTTED"]
      },
      {
        company: "iNeuron.ai",
        role: "Machine Learning Engineer Intern",
        duration: "August 2021 – September 2022",
        skills: ["Python", "Flask", "Scikit-Learn", "Optuna", "MySQL", "Cassandra", "Docker", "AWS"],
        projects: ["MICE PROTEIN EXPRESSION"]
      },
      {
        company: "Bureau Veritas Group",
        role: "Metallurgical Quality Engineer",
        duration: "August 2016 – November 2019",
        skills: ["Python", "NumPy", "Pandas", "SciPy", "Plotly"],
        projects: []
      }
    ];

    // Seed Skills
    const allSkills = new Set<string>();
    projects.forEach(p => p.skills.forEach(s => allSkills.add(s)));
    experiences.forEach(e => e.skills.forEach(s => allSkills.add(s)));

    for (const skill of allSkills) {
      await session.run(
        "MERGE (sk:Skill {name: $name})",
        { name: skill }
      );
    }

    // Seed Projects and Link to Skills & Section
    for (const proj of projects) {
      await session.run(
        `
        MERGE (p:Project {name: $name})
        SET p.domain = $domain, p.description = $desc
        `,
        { name: proj.name, domain: proj.domain, desc: proj.desc }
      );

      // Link to Skill
      for (const skill of proj.skills) {
        await session.run(
          `
          MATCH (p:Project {name: $projectName})
          MATCH (sk:Skill {name: $skillName})
          MERGE (p)-[:USES_SKILL]->(sk)
          `,
          { projectName: proj.name, skillName: skill }
        );
      }

      // Link to Project Synopsis Section
      await session.run(
        `
        MATCH (s:Section {id: 'project_synopsis'})
        MATCH (p:Project {name: $projectName})
        MERGE (s)-[:CONTAINS]->(p)
        ` ,
        { projectName: proj.name }
      );
    }

    // Seed Experiences and Link to Skills, Projects & Section
    for (const exp of experiences) {
      await session.run(
        `
        MERGE (e:Experience {company: $company})
        SET e.role = $role, e.duration = $duration
        `,
        { company: exp.company, role: exp.role, duration: exp.duration }
      );

      // Link to Skill
      for (const skill of exp.skills) {
        await session.run(
          `
          MATCH (e:Experience {company: $company})
          MATCH (sk:Skill {name: $skillName})
          MERGE (e)-[:APPLIED_SKILL]->(sk)
          `,
          { company: exp.company, skillName: skill }
        );
      }

      // Link to Projects
      for (const projName of exp.projects) {
        await session.run(
          `
          MATCH (e:Experience {company: $company})
          MATCH (p:Project {name: $projectName})
          MERGE (e)-[:DEVELOPED_PROJECT]->(p)
          `,
          { company: exp.company, projectName: projName }
        );
      }

      // Link to Work Experience Section
      await session.run(
        `
        MATCH (s:Section {id: 'work_experience'})
        MATCH (e:Experience {company: $company})
        MERGE (s)-[:CONTAINS]->(e)
        `,
        { company: exp.company }
      );
    }

    console.log("Graph entities successfully loaded into Neo4j.");
  } finally {
    await session.close();
  }

  console.log("Ingestion pipeline finished successfully.");
}

// Support direct command execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ingestResume()
    .then(() => {
      console.log("Ingestion script complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Ingestion script failed:", err);
      process.exit(1);
    });
}
