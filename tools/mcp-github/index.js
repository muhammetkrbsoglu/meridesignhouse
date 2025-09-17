#!/usr/bin/env node
/* eslint-disable no-console */
// Minimal GitHub MCP server over stdio
// Requires: @modelcontextprotocol/sdk

const { Server } = require("@modelcontextprotocol/sdk");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/transports/stdio");

const GITHUB_API_BASE = "https://api.github.com";

function getEnvConfig() {
  return {
    token: process.env.GITHUB_TOKEN || "",
    username: process.env.GITHUB_USERNAME || "",
    org: process.env.GITHUB_ORG || "",
  };
}

async function githubFetch(path, init = {}) {
  const { token } = getEnvConfig();
  if (!token) {
    const error = new Error("Missing GITHUB_TOKEN environment variable");
    error.code = "MISSING_TOKEN";
    throw error;
  }
  const url = path.startsWith("http") ? path : `${GITHUB_API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const error = new Error(`GitHub API ${res.status}: ${text}`);
    error.code = `HTTP_${res.status}`;
    throw error;
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

function createServer() {
  const server = new Server({
    name: "mcp-github",
    version: "0.1.0",
    capabilities: {
      tools: {},
    },
  });

  server.tool("github.whoami", "Get authenticated GitHub user", {}, async () => {
    const me = await githubFetch("/user");
    return { content: [{ type: "text", text: JSON.stringify(me, null, 2) }] };
  });

  server.tool(
    "github.listRepos",
    "List repositories for a user or org",
    {
      type: "object",
      properties: {
        username: { type: "string", description: "GitHub username (fallback GITHUB_USERNAME)" },
        org: { type: "string", description: "GitHub organization (fallback GITHUB_ORG)" },
        per_page: { type: "number", description: "Results per page (default 30)" },
      },
      additionalProperties: false,
    },
    async (args) => {
      const { username: argUser, org: argOrg, per_page } = args || {};
      const { username, org } = getEnvConfig();
      const limit = per_page || 30;
      if (argOrg || org) {
        const data = await githubFetch(`/orgs/${argOrg || org}/repos?per_page=${limit}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      const targetUser = argUser || username;
      if (!targetUser) throw new Error("Missing username/org and no env fallback provided");
      const data = await githubFetch(`/users/${targetUser}/repos?per_page=${limit}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "github.listIssues",
    "List issues for a repo",
    {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        state: { type: "string", enum: ["open", "closed", "all"], description: "Issue state" },
        per_page: { type: "number", description: "Results per page (default 30)" },
      },
      required: ["owner", "repo"],
      additionalProperties: false,
    },
    async (args) => {
      const { owner, repo, state, per_page } = args || {};
      const params = new URLSearchParams();
      if (state) params.set("state", state);
      params.set("per_page", String(per_page || 30));
      const data = await githubFetch(`/repos/${owner}/${repo}/issues?${params.toString()}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  return server;
}

async function main() {
  if (typeof fetch === "undefined") {
    // Node < 18 fallback
    global.fetch = (await import("node-fetch")).default;
  }
  const transport = new StdioServerTransport();
  const server = createServer();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("mcp-github failed:", err);
  process.exit(1);
});


