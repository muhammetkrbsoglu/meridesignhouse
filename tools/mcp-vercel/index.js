#!/usr/bin/env node
/* eslint-disable no-console */
// Minimal Vercel MCP server over stdio
// Requires: @modelcontextprotocol/sdk

const { Server } = require("@modelcontextprotocol/sdk/server");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio");

const VERCE L_API_BASE = "https://api.vercel.com";

function getEnvConfig() {
  return {
    token: process.env.VERCEL_TOKEN || "",
    teamId: process.env.VERCEL_TEAM_ID || "",
    projectId: process.env.VERCEL_PROJECT_ID || "",
  };
}

async function vercelFetch(path, init = {}) {
  const { token } = getEnvConfig();
  if (!token) {
    const error = new Error("Missing VERCEL_TOKEN environment variable");
    error.code = "MISSING_TOKEN";
    throw error;
  }
  const url = path.startsWith("http") ? path : `${VERCE L_API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const error = new Error(`Vercel API ${res.status}: ${text}`);
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
    name: "mcp-vercel",
    version: "0.1.0",
    capabilities: {
      tools: {},
    },
  });

  server.tool("vercel.whoami", "Get Vercel account info (user and teams)", {}, async () => {
    const user = await vercelFetch("/v2/user");
    return {
      content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
    };
  });

  server.tool(
    "vercel.listProjects",
    "List Vercel projects. Uses VERCEL_TEAM_ID if provided.",
    {
      type: "object",
      properties: {
        teamId: { type: "string", description: "Override teamId (optional)" },
        limit: { type: "number", description: "Results limit (default 20)" },
      },
      additionalProperties: false,
    },
    async (args) => {
      const { teamId: overrideTeamId, limit } = args || {};
      const { teamId } = getEnvConfig();
      const params = new URLSearchParams();
      if (overrideTeamId || teamId) params.set("teamId", overrideTeamId || teamId);
      params.set("limit", String(limit || 20));
      const data = await vercelFetch(`/v9/projects?${params.toString()}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "vercel.listDeployments",
    "List deployments for a project. Uses VERCEL_PROJECT_ID if not provided.",
    {
      type: "object",
      properties: {
        projectId: { type: "string", description: "Vercel project ID" },
        teamId: { type: "string", description: "Team ID override (optional)" },
        limit: { type: "number", description: "Results limit (default 20)" },
      },
      required: [],
      additionalProperties: false,
    },
    async (args) => {
      const { projectId: argProjectId, teamId: overrideTeamId, limit } = args || {};
      const { projectId, teamId } = getEnvConfig();
      const effectiveProjectId = argProjectId || projectId;
      if (!effectiveProjectId) {
        throw new Error("Missing projectId argument and VERCEL_PROJECT_ID env var");
      }
      const params = new URLSearchParams({ projectId: effectiveProjectId, limit: String(limit || 20) });
      if (overrideTeamId || teamId) params.set("teamId", overrideTeamId || teamId);
      const data = await vercelFetch(`/v6/deployments?${params.toString()}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "vercel.env.pull",
    "Fetch env vars for a project (metadata only).",
    {
      type: "object",
      properties: {
        projectId: { type: "string" },
        teamId: { type: "string" },
      },
      additionalProperties: false,
    },
    async (args) => {
      const { projectId: argProjectId, teamId: overrideTeamId } = args || {};
      const { projectId, teamId } = getEnvConfig();
      const effectiveProjectId = argProjectId || projectId;
      if (!effectiveProjectId) throw new Error("Missing projectId and VERCEL_PROJECT_ID");
      const params = new URLSearchParams();
      if (overrideTeamId || teamId) params.set("teamId", overrideTeamId || teamId);
      const envs = await vercelFetch(`/v9/projects/${effectiveProjectId}/env?${params.toString()}`);
      return { content: [{ type: "text", text: JSON.stringify(envs, null, 2) }] };
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
  console.error("mcp-vercel failed:", err);
  process.exit(1);
});


