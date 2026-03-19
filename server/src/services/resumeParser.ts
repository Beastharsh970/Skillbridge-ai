import fs from "fs";
import pdf from "pdf-parse";

const TECHNICAL_SKILLS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "c", "go", "rust", "ruby", "php",
  "swift", "kotlin", "dart", "scala", "r", "matlab", "perl", "lua", "haskell", "elixir",
  "react", "angular", "vue", "svelte", "next.js", "nuxt", "gatsby", "remix",
  "react native", "flutter", "ionic", "electron",
  "node.js", "express", "fastify", "nestjs", "koa", "hapi",
  "django", "flask", "fastapi", "spring boot", "laravel", ".net", "asp.net", "ruby on rails",
  "html", "css", "sass", "scss", "less", "tailwindcss", "tailwind", "bootstrap", "material ui",
  "styled-components", "chakra ui", "ant design",
  "mongodb", "postgresql", "mysql", "sqlite", "redis", "elasticsearch", "dynamodb",
  "firebase", "supabase", "cassandra", "neo4j", "couchdb",
  "docker", "kubernetes", "aws", "azure", "gcp", "heroku", "vercel", "netlify", "digitalocean",
  "terraform", "ansible", "puppet", "chef", "cloudformation",
  "jenkins", "github actions", "gitlab ci", "circleci", "travis ci", "ci/cd",
  "git", "github", "gitlab", "bitbucket", "svn",
  "graphql", "rest api", "websocket", "grpc", "soap", "oauth", "jwt", "auth0",
  "webpack", "vite", "rollup", "esbuild", "parcel", "babel",
  "jest", "mocha", "chai", "cypress", "playwright", "selenium", "puppeteer", "vitest",
  "tensorflow", "pytorch", "scikit-learn", "keras", "opencv", "pandas", "numpy", "scipy",
  "spark", "hadoop", "kafka", "airflow", "dbt", "snowflake", "databricks",
  "figma", "sketch", "adobe xd", "photoshop", "illustrator",
  "linux", "nginx", "apache", "bash", "powershell",
  "sql", "nosql", "orm", "prisma", "mongoose", "sequelize", "typeorm", "sqlalchemy",
  "redux", "zustand", "mobx", "context api", "recoil", "jotai",
  "microservices", "serverless", "monorepo", "event-driven", "message queue",
  "rabbitmq", "sqs", "sns", "pub/sub",
  "machine learning", "deep learning", "natural language processing", "computer vision",
  "data science", "data engineering", "data analytics",
  "blockchain", "solidity", "ethereum", "web3", "smart contracts",
  "agile", "scrum", "kanban", "jira", "confluence", "trello",
  "three.js", "d3.js", "chart.js", "webgl",
  "storybook", "chromatic", "design system",
];

const SOFT_SKILLS = [
  "leadership", "team management", "mentoring", "coaching",
  "communication", "presentation", "public speaking",
  "problem solving", "critical thinking", "analytical",
  "project management", "product management",
  "cross-functional", "stakeholder management",
  "agile", "scrum master", "product owner",
  "collaboration", "teamwork", "interpersonal",
  "time management", "organization", "planning",
  "decision making", "strategic thinking",
  "conflict resolution", "negotiation",
  "adaptability", "flexibility",
  "creativity", "innovation",
  "attention to detail", "quality assurance",
  "client-facing", "customer-oriented", "client management",
];

const CERTIFICATIONS_PATTERNS = [
  /aws\s+(?:certified|solutions?\s+architect|developer|sysops|devops)/i,
  /google\s+(?:cloud|professional)\s+(?:certified|engineer|architect)/i,
  /azure\s+(?:certified|administrator|developer|solutions?\s+architect)/i,
  /certified\s+kubernetes/i,
  /cka|ckad|cks/i,
  /pmp|prince2|capm/i,
  /certified\s+scrum\s+master|csm|psm/i,
  /cissp|cism|ceh|oscp|comptia\s+security/i,
  /comptia\s+(?:a\+|network\+|security\+|cloud\+)/i,
  /oracle\s+certified/i,
  /cisco\s+(?:ccna|ccnp|ccie)/i,
  /terraform\s+(?:associate|professional)/i,
  /hashicorp\s+certified/i,
  /meta\s+(?:front|back|full)/i,
  /ibm\s+(?:data|ai|cloud)/i,
  /salesforce\s+(?:certified|administrator|developer)/i,
];

const DEGREE_PATTERNS = [
  /(?:bachelor|b\.?s\.?|b\.?sc\.?|b\.?tech|b\.?e\.?|b\.?a\.?)[\s.,]+(?:of\s+)?(?:science|engineering|technology|arts|computer|information|software|data|mathematics|electronics)/i,
  /(?:master|m\.?s\.?|m\.?sc\.?|m\.?tech|m\.?e\.?|m\.?a\.?|mba)[\s.,]+(?:of\s+)?(?:science|engineering|technology|business|computer|information|software|data|mathematics|artificial)/i,
  /(?:ph\.?d|doctorate|doctor of philosophy)/i,
  /(?:diploma|associate)\s+(?:in|of)\s+\w+/i,
];

function extractSkills(text: string): string[] {
  const lowerText = text.toLowerCase();
  return TECHNICAL_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    return regex.test(lowerText);
  });
}

function extractSoftSkills(text: string): string[] {
  const lowerText = text.toLowerCase();
  return SOFT_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    return regex.test(lowerText);
  });
}

function extractCertifications(text: string): string[] {
  const certs: string[] = [];
  for (const pattern of CERTIFICATIONS_PATTERNS) {
    const match = text.match(pattern);
    if (match) certs.push(match[0].trim());
  }
  return [...new Set(certs)];
}

function extractEducation(text: string): { degree: string; institution: string; year: string }[] {
  const education: { degree: string; institution: string; year: string }[] = [];

  const eduSection = text.match(
    /(?:education|academic|qualification)[\s\S]*?(?=\n(?:experience|work|skills|projects?|certif|award|reference|achievement|$))/i
  );

  const searchText = eduSection?.[0] || text;

  for (const pattern of DEGREE_PATTERNS) {
    const matches = searchText.match(new RegExp(pattern.source, "gi"));
    if (matches) {
      for (const match of matches) {
        const surroundingText = searchText.substring(
          Math.max(0, searchText.indexOf(match) - 100),
          searchText.indexOf(match) + match.length + 100
        );
        const yearMatch = surroundingText.match(/20\d{2}|19\d{2}/);
        education.push({
          degree: match.trim(),
          institution: "",
          year: yearMatch?.[0] || "",
        });
      }
    }
  }

  return education.slice(0, 5);
}

function extractYearsOfExperience(text: string): number | null {
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/i,
    /(?:experience|exp)\s*:?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
    /(?:over|more\s+than|approximately)\s+(\d+)\s+(?:years?|yrs?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1], 10);
  }

  const dateRanges = text.match(/(?:20|19)\d{2}\s*[-–]\s*(?:(?:20|19)\d{2}|present|current|now)/gi);
  if (dateRanges && dateRanges.length > 0) {
    let totalYears = 0;
    for (const range of dateRanges) {
      const [start, end] = range.split(/[-–]/);
      const startYear = parseInt(start.trim(), 10);
      const endYear = /present|current|now/i.test(end)
        ? new Date().getFullYear()
        : parseInt(end.trim(), 10);
      if (startYear && endYear && endYear >= startYear) {
        totalYears += endYear - startYear;
      }
    }
    if (totalYears > 0) return totalYears;
  }

  return null;
}

function extractProjects(text: string): { name: string; description: string; technologies: string[] }[] {
  const projects: { name: string; description: string; technologies: string[] }[] = [];
  const projectSection = text.match(
    /(?:projects?|portfolio|personal projects?|side projects?|notable projects?)[\s\S]*?(?=\n(?:experience|education|skills|certif|reference|award|achievement|$))/i
  );

  if (projectSection) {
    const lines = projectSection[0].split("\n").filter((l) => l.trim().length > 5);
    let current: { name: string; description: string; technologies: string[] } | null = null;

    for (const line of lines.slice(1)) {
      const trimmed = line.trim();
      if (/^[A-Z]/.test(trimmed) && trimmed.length < 80 && !trimmed.includes(".")) {
        if (current) projects.push(current);
        current = { name: trimmed, description: "", technologies: extractSkills(trimmed) };
      } else if (current) {
        current.description += (current.description ? " " : "") + trimmed;
        current.technologies = [...new Set([...current.technologies, ...extractSkills(trimmed)])];
      }
    }
    if (current) projects.push(current);
  }

  return projects;
}

function extractExperience(text: string): { title: string; company: string; duration: string; description: string; skills: string[] }[] {
  const experiences: { title: string; company: string; duration: string; description: string; skills: string[] }[] = [];
  const expSection = text.match(
    /(?:experience|work history|employment|professional experience|work experience)[\s\S]*?(?=\n(?:education|projects?|skills|certif|reference|award|achievement|$))/i
  );

  if (expSection) {
    const lines = expSection[0].split("\n").filter((l) => l.trim().length > 3);
    let current: { title: string; company: string; duration: string; description: string; skills: string[] } | null = null;

    for (const line of lines.slice(1)) {
      const trimmed = line.trim();
      const dateMatch = trimmed.match(/(?:20|19)\d{2}\s*[-–]\s*(?:(?:20|19)\d{2}|present|current|now)/i);

      if (
        dateMatch ||
        (/^[A-Z]/.test(trimmed) &&
          trimmed.length < 100 &&
          (trimmed.includes("|") || trimmed.includes("–") || trimmed.includes("—") || trimmed.includes("@") || trimmed.includes(",")))
      ) {
        if (current) {
          current.skills = extractSkills(current.description);
          experiences.push(current);
        }
        const parts = trimmed.split(/[|–—@]/);
        current = {
          title: parts[0]?.trim() || trimmed,
          company: parts[1]?.trim() || "",
          duration: dateMatch?.[0] || "",
          description: "",
          skills: [],
        };
      } else if (current) {
        current.description += (current.description ? " " : "") + trimmed;
      }
    }
    if (current) {
      current.skills = extractSkills(current.description);
      experiences.push(current);
    }
  }

  return experiences;
}

function extractDomains(text: string): string[] {
  const domains = new Set<string>();
  const domainPatterns: [RegExp, string][] = [
    [/\b(?:e[\s-]?commerce|online\s+(?:shop|store|retail))\b/i, "E-Commerce"],
    [/\b(?:fintech|financial|banking|payment|trading)\b/i, "FinTech"],
    [/\b(?:health\s*(?:care|tech)|medical|clinical|telemedicine|ehr)\b/i, "HealthTech"],
    [/\b(?:edtech|education|learning|lms|e[\s-]?learning)\b/i, "EdTech"],
    [/\b(?:saas|software[\s-]as[\s-]a[\s-]service)\b/i, "SaaS"],
    [/\b(?:social\s+media|social\s+network)\b/i, "Social Media"],
    [/\b(?:gaming|game\s+dev)\b/i, "Gaming"],
    [/\b(?:iot|internet\s+of\s+things|embedded|hardware)\b/i, "IoT"],
    [/\b(?:cybersecurity|information\s+security|infosec)\b/i, "Cybersecurity"],
    [/\b(?:ai|artificial\s+intelligence|ml|machine\s+learning)\b/i, "AI/ML"],
    [/\b(?:devops|site\s+reliability|infrastructure)\b/i, "DevOps"],
    [/\b(?:mobile\s+app|ios|android)\b/i, "Mobile"],
    [/\b(?:real[\s-]?estate|proptech)\b/i, "Real Estate"],
    [/\b(?:logistics|supply\s+chain|shipping)\b/i, "Logistics"],
    [/\b(?:media|content|streaming|publishing)\b/i, "Media"],
  ];

  for (const [regex, domain] of domainPatterns) {
    if (regex.test(text)) domains.add(domain);
  }
  return Array.from(domains);
}

export async function parseResume(filePath: string) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdf(dataBuffer);
  const text = pdfData.text;

  const skills = extractSkills(text);
  const experience = extractExperience(text);

  const experienceSkills = experience.flatMap((e) => e.skills);
  const allSkills = [...new Set([...skills, ...experienceSkills])];

  return {
    skills: allSkills,
    softSkills: extractSoftSkills(text),
    projects: extractProjects(text),
    experience,
    education: extractEducation(text),
    certifications: extractCertifications(text),
    yearsOfExperience: extractYearsOfExperience(text),
    domains: extractDomains(text),
    rawText: text.substring(0, 8000),
  };
}
