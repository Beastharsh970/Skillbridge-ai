import { env } from "../config/env";

interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  fork: boolean;
  topics: string[];
  size: number;
  created_at: string;
  updated_at: string;
  default_branch: string;
}

interface GitHubLanguages {
  [key: string]: number;
}

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
}

const LANGUAGE_TO_SKILLS: Record<string, string[]> = {
  JavaScript: ["javascript"],
  TypeScript: ["typescript"],
  Python: ["python"],
  Java: ["java"],
  "C++": ["c++"],
  "C#": ["c#"],
  C: ["c"],
  Go: ["go"],
  Rust: ["rust"],
  Ruby: ["ruby"],
  PHP: ["php"],
  Swift: ["swift"],
  Kotlin: ["kotlin"],
  Dart: ["dart", "flutter"],
  HTML: ["html"],
  CSS: ["css"],
  SCSS: ["sass", "css"],
  Shell: ["bash", "linux"],
  Dockerfile: ["docker"],
  HCL: ["terraform"],
  Solidity: ["solidity", "ethereum"],
};

const TOPIC_TO_SKILLS: Record<string, string> = {
  react: "react", "react-native": "react native", angular: "angular", vue: "vue", vuejs: "vue",
  svelte: "svelte", nextjs: "next.js", "next-js": "next.js", nuxt: "nuxt", gatsby: "gatsby",
  nodejs: "node.js", "node-js": "node.js", express: "express", nestjs: "nestjs", fastify: "fastify",
  django: "django", flask: "flask", "spring-boot": "spring boot", laravel: "laravel", rails: "ruby on rails",
  mongodb: "mongodb", postgresql: "postgresql", mysql: "mysql", redis: "redis", elasticsearch: "elasticsearch",
  firebase: "firebase", supabase: "supabase", prisma: "prisma",
  docker: "docker", kubernetes: "kubernetes", "k8s": "kubernetes",
  aws: "aws", azure: "azure", gcp: "gcp", terraform: "terraform",
  graphql: "graphql", "rest-api": "rest api", grpc: "grpc", websocket: "websocket",
  tailwindcss: "tailwindcss", tailwind: "tailwindcss", bootstrap: "bootstrap", "material-ui": "material ui",
  redux: "redux", zustand: "zustand", mobx: "mobx",
  jest: "jest", cypress: "cypress", playwright: "playwright", selenium: "selenium",
  webpack: "webpack", vite: "vite", rollup: "rollup",
  "ci-cd": "ci/cd", "github-actions": "ci/cd", jenkins: "jenkins",
  "machine-learning": "machine learning", "deep-learning": "deep learning", tensorflow: "tensorflow",
  pytorch: "pytorch", "computer-vision": "computer vision", nlp: "natural language processing",
  blockchain: "blockchain", web3: "web3", solidity: "solidity",
  flutter: "flutter",
  serverless: "serverless", microservices: "microservices",
};

const DEP_TO_SKILL: Record<string, string> = {
  react: "react", "react-dom": "react", "react-native": "react native",
  next: "next.js", nuxt: "nuxt", gatsby: "gatsby", svelte: "svelte",
  vue: "vue", angular: "angular", "@angular/core": "angular",
  express: "express", fastify: "fastify", nestjs: "nestjs", "@nestjs/core": "nestjs", koa: "koa",
  mongoose: "mongoose", prisma: "prisma", "@prisma/client": "prisma", sequelize: "sequelize", typeorm: "typeorm",
  tailwindcss: "tailwindcss", "styled-components": "css-in-js", "@emotion/react": "css-in-js",
  redux: "redux", "@reduxjs/toolkit": "redux", zustand: "zustand", mobx: "mobx", recoil: "recoil",
  axios: "rest api", graphql: "graphql", "@apollo/client": "graphql", "socket.io": "websocket",
  jest: "jest", mocha: "mocha", cypress: "cypress", playwright: "playwright",
  webpack: "webpack", vite: "vite", rollup: "rollup", esbuild: "esbuild",
  typescript: "typescript", zod: "zod",
  "jsonwebtoken": "jwt", passport: "oauth", bcrypt: "security", bcryptjs: "security",
  docker: "docker", "aws-sdk": "aws", "@aws-sdk/client-s3": "aws",
  firebase: "firebase", "@supabase/supabase-js": "supabase",
  "three": "three.js", d3: "d3.js", "chart.js": "data visualization",
  tensorflow: "tensorflow", "@tensorflow/tfjs": "tensorflow",
  ethers: "ethereum", web3: "web3", hardhat: "solidity",
  django: "django", flask: "flask", fastapi: "fastapi",
  pandas: "pandas", numpy: "numpy", scikit_learn: "scikit-learn", pytorch: "pytorch",
  celery: "celery", sqlalchemy: "sqlalchemy",
};

async function githubFetch(url: string): Promise<any> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SkillBridge-Navigator",
  };

  if (env.GITHUB_TOKEN) {
    headers.Authorization = `token ${env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) return null;
    if (response.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Try again later or add a GITHUB_TOKEN.");
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

function extractSkillsFromText(text: string): string[] {
  const skills = new Set<string>();
  const lower = text.toLowerCase();
  const patterns: [RegExp, string][] = [
    [/\breact\b/, "react"], [/\bangular\b/, "angular"], [/\bvue\.?js?\b/, "vue"],
    [/\bnext\.?js\b/, "next.js"], [/\bnode\.?js\b/, "node.js"], [/\bexpress\b/, "express"],
    [/\btailwind/, "tailwindcss"], [/\bmongodb\b/, "mongodb"], [/\bpostgres/, "postgresql"],
    [/\bredis\b/, "redis"], [/\bdocker\b/, "docker"], [/\bkubernetes\b/, "kubernetes"],
    [/\baws\b/, "aws"], [/\bterraform\b/, "terraform"], [/\bgraphql\b/, "graphql"],
    [/\btypescript\b/, "typescript"], [/\bpython\b/, "python"], [/\bdjango\b/, "django"],
    [/\bflask\b/, "flask"], [/\bfastapi\b/, "fastapi"], [/\bspring\s*boot\b/, "spring boot"],
    [/\bfirebase\b/, "firebase"], [/\bsupabase\b/, "supabase"], [/\bprisma\b/, "prisma"],
    [/\bjest\b/, "jest"], [/\bcypress\b/, "cypress"], [/\bplaywright\b/, "playwright"],
    [/\bwebpack\b/, "webpack"], [/\bvite\b/, "vite"], [/\bci\/?cd\b/, "ci/cd"],
    [/\btensorflow\b/, "tensorflow"], [/\bpytorch\b/, "pytorch"], [/\bflutter\b/, "flutter"],
    [/\bsolidity\b/, "solidity"], [/\brust\b/, "rust"], [/\bgo\b(?:lang)?/, "go"],
  ];
  for (const [regex, skill] of patterns) {
    if (regex.test(lower)) skills.add(skill);
  }
  return Array.from(skills);
}

async function extractDepsFromRepo(username: string, repo: GitHubRepo): Promise<string[]> {
  const skills = new Set<string>();

  const pkgJson = await githubFetch(
    `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/contents/package.json`
  );
  if (pkgJson?.content) {
    try {
      const decoded = JSON.parse(Buffer.from(pkgJson.content, "base64").toString());
      const allDeps = {
        ...decoded.dependencies,
        ...decoded.devDependencies,
      };
      for (const dep of Object.keys(allDeps)) {
        const skill = DEP_TO_SKILL[dep];
        if (skill) skills.add(skill);
      }
    } catch { /* ignore parse errors */ }
  }

  const reqTxt = await githubFetch(
    `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/contents/requirements.txt`
  );
  if (reqTxt?.content) {
    try {
      const decoded = Buffer.from(reqTxt.content, "base64").toString();
      for (const line of decoded.split("\n")) {
        const pkg = line.split(/[=<>!]/)[0].trim().toLowerCase().replace(/-/g, "_");
        const skill = DEP_TO_SKILL[pkg];
        if (skill) skills.add(skill);
      }
    } catch { /* ignore */ }
  }

  return Array.from(skills);
}

async function extractReadmeSkills(username: string, repo: GitHubRepo): Promise<string[]> {
  const readme = await githubFetch(
    `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/readme`
  );
  if (!readme?.content) return [];

  try {
    const text = Buffer.from(readme.content, "base64").toString();
    return extractSkillsFromText(text);
  } catch {
    return [];
  }
}

export async function fetchGitHubProfile(username: string) {
  const userProfile = (await githubFetch(
    `https://api.github.com/users/${encodeURIComponent(username)}`
  )) as GitHubUser | null;

  if (!userProfile) throw new Error("GitHub user not found");

  const repos = (await githubFetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`
  )) as GitHubRepo[];

  const ownRepos = repos.filter((r) => !r.fork);
  const languageTotals: Record<string, number> = {};
  const skillSet = new Set<string>();
  const topicSet = new Set<string>();

  const topRepos = ownRepos.slice(0, 15);

  for (const repo of topRepos) {
    if (repo.language) {
      const mapped = LANGUAGE_TO_SKILLS[repo.language];
      if (mapped) mapped.forEach((s) => skillSet.add(s));
    }

    if (repo.topics) {
      for (const topic of repo.topics) {
        topicSet.add(topic);
        const skill = TOPIC_TO_SKILLS[topic.toLowerCase()];
        if (skill) skillSet.add(skill);
      }
    }

    if (repo.description) {
      extractSkillsFromText(repo.description).forEach((s) => skillSet.add(s));
    }

    try {
      const langs = (await githubFetch(
        `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/languages`
      )) as GitHubLanguages | null;
      if (langs) {
        for (const [lang, bytes] of Object.entries(langs)) {
          languageTotals[lang] = (languageTotals[lang] || 0) + bytes;
          const mapped = LANGUAGE_TO_SKILLS[lang];
          if (mapped) mapped.forEach((s) => skillSet.add(s));
        }
      }
    } catch { /* skip */ }
  }

  const deepScanRepos = topRepos.slice(0, 5);
  for (const repo of deepScanRepos) {
    try {
      const depSkills = await extractDepsFromRepo(username, repo);
      depSkills.forEach((s) => skillSet.add(s));
    } catch { /* skip */ }

    try {
      const readmeSkills = await extractReadmeSkills(username, repo);
      readmeSkills.forEach((s) => skillSet.add(s));
    } catch { /* skip */ }
  }

  const accountAge = Math.floor(
    (Date.now() - new Date(userProfile.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const repoComplexity = topRepos.map((r) => ({
    name: r.name,
    size: r.size,
    language: r.language || "",
    topics: r.topics || [],
    stars: r.stargazers_count,
    lastUpdated: r.updated_at,
  }));

  return {
    profile: {
      username: userProfile.login,
      name: userProfile.name || "",
      bio: userProfile.bio || "",
      publicRepos: userProfile.public_repos,
      followers: userProfile.followers,
      accountAgeYears: accountAge,
      profileUrl: userProfile.html_url,
    },
    repos: ownRepos.slice(0, 30).map((r) => ({
      name: r.name,
      description: r.description || "",
      language: r.language || "",
      stars: r.stargazers_count,
      url: r.html_url,
      topics: r.topics || [],
      size: r.size,
    })),
    languages: languageTotals,
    topics: Array.from(topicSet),
    skills: Array.from(skillSet),
    repoComplexity,
    stats: {
      totalRepos: ownRepos.length,
      totalStars: ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0),
      topLanguage: Object.entries(languageTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || "",
      recentlyActive: topRepos.filter((r) => {
        const updated = new Date(r.updated_at);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return updated > sixMonthsAgo;
      }).length,
    },
  };
}
