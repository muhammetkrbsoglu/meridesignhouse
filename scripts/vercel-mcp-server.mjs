#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const SERVER_NAME = "vercel-mcp";
const SERVER_VERSION = "0.1.0";
const VERCEL_API_BASE = "https://api.vercel.com";
const DEFAULT_LIMIT = 20;

const server = new McpServer(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const asPrettyJson = (value) => JSON.stringify(value, null, 2);

const mergeTeamId = (explicitTeamId) => {
  return explicitTeamId ?? process.env.VERCEL_TEAM_ID ?? undefined;
};

const vercelFetch = async (path, { method = "GET", query = {}, teamId, body, headers = {} } = {}) => {
  const token = process.env.VERCEL_API_TOKEN ?? process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("Missing VERCEL_API_TOKEN environment variable.");
  }

  const url = new URL(path, VERCEL_API_BASE);

  const effectiveTeam = mergeTeamId(teamId);
  if (effectiveTeam) {
    url.searchParams.set("teamId", effectiveTeam);
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const requestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": `${SERVER_NAME}/${SERVER_VERSION}`,
      ...headers,
    },
  };

  if (body !== undefined) {
    requestInit.body = typeof body === "string" ? body : JSON.stringify(body);
    if (!requestInit.headers["Content-Type"]) {
      requestInit.headers["Content-Type"] = "application/json";
    }
  }

  const response = await fetch(url, requestInit);
  const text = await response.text();

  if (!response.ok) {
    const truncated = text.length > 2000 ? `${text.slice(0, 2000)}...` : text;
    throw new Error(`Vercel API ${response.status} ${response.statusText}: ${truncated}`);
  }

  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const listProjectsInputSchema = z
  .object({
    teamId: z.string().min(1).optional(),
    search: z.string().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    prev: z.string().min(1).optional(),
    next: z.string().min(1).optional(),
  })
  .strict();

server.registerTool(
  "vercel_list_projects",
  {
    title: "List Vercel projects",
    description: "Lists projects accessible to the configured Vercel token, optionally filtering by search text.",
    inputSchema: listProjectsInputSchema,
  },
  async ({ teamId, search, limit, prev, next }) => {
    const query = {
      limit: limit ?? DEFAULT_LIMIT,
      search,
      prev,
      next,
    };

    const data = await vercelFetch("/v9/projects", { query, teamId });
    const projects = (data?.projects ?? []).map((project) => ({
      id: project.id,
      name: project.name,
      framework: project.framework,
      region: project.region,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      latestDeployment: project.latestDeployments?.[0]?.state ?? null,
      link: project.link?.deployment ?? null,
    }));

    return {
      content: [
        {
          type: "text",
          text: asPrettyJson({
            projects,
            pagination: data?.pagination ?? null,
          }),
        },
      ],
    };
  }
);

const getProjectInputSchema = z
  .object({
    projectIdOrName: z.string().min(1),
    teamId: z.string().min(1).optional(),
  })
  .strict();

server.registerTool(
  "vercel_get_project",
  {
    title: "Get project details",
    description: "Fetches details for a specific Vercel project using its slug or ID.",
    inputSchema: getProjectInputSchema,
  },
  async ({ projectIdOrName, teamId }) => {
    const encoded = encodeURIComponent(projectIdOrName);
    const project = await vercelFetch(`/v9/projects/${encoded}`, { teamId });

    return {
      content: [
        {
          type: "text",
          text: asPrettyJson(project),
        },
      ],
    };
  }
);

const listDeploymentsInputSchema = z
  .object({
    project: z.string().min(1),
    teamId: z.string().min(1).optional(),
    state: z
      .enum([
        "BUILDING",
        "CANCELED",
        "ERROR",
        "INITIALIZING",
        "QUEUED",
        "READY",
      ])
      .optional(),
    target: z.enum(["production", "preview", "staging"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .strict();

server.registerTool(
  "vercel_list_deployments",
  {
    title: "List project deployments",
    description: "Lists deployments for the given Vercel project.",
    inputSchema: listDeploymentsInputSchema,
  },
  async ({ project, teamId, state, target, limit, from, to }) => {
    const query = {
      project,
      state,
      target,
      limit: limit ?? DEFAULT_LIMIT,
      from,
      to,
    };

    const data = await vercelFetch("/v13/deployments", { query, teamId });
    const deployments = (data?.deployments ?? []).map((deployment) => ({
      id: deployment.id ?? deployment.uid,
      name: deployment.name,
      url: deployment.url,
      state: deployment.state,
      target: deployment.target,
      createdAt: deployment.created,
      readyAt: deployment.ready,
      inspectorUrl: deployment.inspectorUrl ?? null,
    }));

    return {
      content: [
        {
          type: "text",
          text: asPrettyJson({
            deployments,
            pagination: data?.pagination ?? null,
          }),
        },
      ],
    };
  }
);

const redeployInputSchema = z
  .object({
    deploymentId: z.string().min(1),
    teamId: z.string().min(1).optional(),
    target: z.enum(["production", "preview", "staging"]).optional(),
    skipBuildCache: z.boolean().optional(),
  })
  .strict();

server.registerTool(
  "vercel_redeploy",
  {
    title: "Redeploy an existing deployment",
    description: "Triggers a redeploy for an existing Vercel deployment.",
    inputSchema: redeployInputSchema,
  },
  async ({ deploymentId, teamId, target, skipBuildCache }) => {
    const body = {};
    if (target) body.target = target;
    if (typeof skipBuildCache === "boolean") body.skipBuildCache = skipBuildCache;

    const payload = Object.keys(body).length > 0 ? body : undefined;

    const result = await vercelFetch(`/v13/deployments/${deploymentId}/redeploy`, {
      method: "POST",
      teamId,
      body: payload,
    });

    return {
      content: [
        {
          type: "text",
          text: asPrettyJson(result),
        },
      ],
    };
  }
);

const envListInputSchema = z
  .object({
    projectIdOrName: z.string().min(1),
    teamId: z.string().min(1).optional(),
    decrypt: z.boolean().optional(),
    target: z.array(z.enum(["production", "preview", "development"])).optional(),
  })
  .strict();

server.registerTool(
  "vercel_list_env_vars",
  {
    title: "List environment variables",
    description: "Lists environment variables for a given Vercel project.",
    inputSchema: envListInputSchema,
  },
  async ({ projectIdOrName, teamId, decrypt, target }) => {
    const query = {
      decrypt,
    };

    if (Array.isArray(target) && target.length > 0) {
      query.target = target.join(",");
    }

    const encoded = encodeURIComponent(projectIdOrName);
    const data = await vercelFetch(`/v10/projects/${encoded}/env`, {
      teamId,
      query,
    });

    const environmentVariables = (data?.envs ?? []).map((envVar) => ({
      id: envVar.id,
      key: envVar.key,
      target: envVar.target,
      createdAt: envVar.createdAt,
      updatedAt: envVar.updatedAt,
      type: envVar.type,
    }));

    return {
      content: [
        {
          type: "text",
          text: asPrettyJson({
            environmentVariables,
            pagination: data?.pagination ?? null,
          }),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} server is ready.`);
}

main().catch((error) => {
  console.error(`${SERVER_NAME} server failed to start`, error);
  process.exit(1);
});


