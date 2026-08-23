import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicResumesDir = path.resolve(__dirname, '../public/resumes');
const outputJsonPath = path.resolve(__dirname, '../lib/documentTree.json');

const stopwords = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is',
  'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of',
  'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same',
  'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll',
  'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt',
  'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which',
  'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll',
  'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves'
]);

function extractKeywords(title, content) {
  const words = `${title} ${content}`.toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/);
  const keywords = new Set();
  
  // Add direct tokens from title
  title.toLowerCase().split(/\s+/).forEach(w => {
    const cleaned = w.replace(/[^\w]/g, '');
    if (cleaned.length > 2 && !stopwords.has(cleaned)) {
      keywords.add(cleaned);
    }
  });

  // Extract unique technical terms and nouns
  words.forEach(w => {
    const cleaned = w.replace(/[^\w]/g, '');
    if (cleaned.length > 2 && !stopwords.has(cleaned)) {
      if (
        /^[a-zA-Z]/.test(cleaned) || 
        ['omodore', 'rbetraj', 'galambo', 'salesmoji', 'aisera', 'evalmybrand', 'inventted', 'mice'].includes(cleaned)
      ) {
        keywords.add(cleaned);
      }
    }
  });

  // Add specific mappings
  const titleLower = title.toLowerCase();
  if (titleLower.includes('summary') || titleLower.includes('profile')) {
    keywords.add('who'); keywords.add('about'); keywords.add('rohan'); keywords.add('bio'); keywords.add('profile');
  }
  if (titleLower.includes('education') || titleLower.includes('academic') || titleLower.includes('qualification')) {
    keywords.add('education'); keywords.add('study'); keywords.add('studied'); keywords.add('degree');
    keywords.add('college'); keywords.add('university'); keywords.add('school'); keywords.add('academics'); keywords.add('btech');
  }
  if (titleLower.includes('senior ai') || titleLower.includes('r systems') || titleLower.includes('lendistry')) {
    keywords.add('rsystems'); keywords.add('r systems'); keywords.add('lendistry'); keywords.add('current');
    keywords.add('mcp'); keywords.add('guardrails'); keywords.add('agentic ops'); keywords.add('harness engineering');
  }
  if (titleLower.includes('certif')) {
    keywords.add('certifications'); keywords.add('certificate'); keywords.add('certified'); keywords.add('accreditation');
  }
  if (titleLower.includes('achievement') || titleLower.includes('award')) {
    keywords.add('achievements'); keywords.add('awards'); keywords.add('honors'); keywords.add('rank'); keywords.add('gold badge');
  }

  return Array.from(keywords);
}

function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = [];
  const lines = content.split('\n');
  
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }
      const title = line.replace(/^##+\s+/, '').trim();
      const level = line.startsWith('### ') ? 3 : 2;
      const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
      const id = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      
      currentSection = {
        id,
        title: cleanTitle,
        level,
        content: '',
        rawHeader: line
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

function run() {
  const masterPath = path.join(publicResumesDir, 'master_cv.md');
  const detailedPath = path.join(publicResumesDir, 'detailed_resume.md');
  const optimizedPath = path.join(publicResumesDir, 'optimized_resume.md');

  if (!fs.existsSync(masterPath)) {
    console.error('master_cv.md not found at', masterPath);
    process.exit(1);
  }

  const masterSections = parseMarkdown(masterPath);
  const detailedSections = fs.existsSync(detailedPath) ? parseMarkdown(detailedPath) : [];
  const optimizedSections = fs.existsSync(optimizedPath) ? parseMarkdown(optimizedPath) : [];

  // Group sections by normalized ID to scan other resumes for extra content
  const sectionsMap = new Map();
  masterSections.forEach(s => {
    sectionsMap.set(s.id, s);
  });

  // Merge extra content from other resumes if they exist
  [...detailedSections, ...optimizedSections].forEach(s => {
    if (sectionsMap.has(s.id)) {
      const existing = sectionsMap.get(s.id);
      // Append unique lines/bullet points if any
      const existingLines = new Set(existing.content.split('\n').map(l => l.trim()));
      const extraLines = s.content.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !existingLines.has(l));
      
      if (extraLines.length > 0) {
        existing.content += '\n' + extraLines.join('\n');
      }
    } else {
      // If a section is unique to other resumes, add it
      sectionsMap.set(s.id, s);
    }
  });

  // Construct Document Tree matching the schema of DocNode
  const tree = [];
  const sections = Array.from(sectionsMap.values());

  // Helper to map section categories to main sections
  sections.forEach(s => {
    // Strip HTML from content
    const cleanContent = s.content.replace(/<[^>]*>/g, '').trim();
    
    // Generate keywords
    const keywords = extractKeywords(s.title, cleanContent);

    const node = {
      id: s.id,
      section: s.title,
      label: s.title,
      keywords: keywords,
      content: cleanContent
    };

    tree.push(node);
  });

  fs.writeFileSync(outputJsonPath, JSON.stringify(tree, null, 2), 'utf-8');
  console.log(`Successfully generated dynamic RAG knowledge base at ${outputJsonPath}`);
}

run();
