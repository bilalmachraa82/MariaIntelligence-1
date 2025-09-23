import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { z } from "zod";
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

const client = new Client({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

client.connect();
const db = drizzle(client);

const server = new Server(
  {
    name: "db-mcp",
    version: "1.0.0",
  },
  {
    transport: new StdioServerTransport(),
    capabilities: {
      tools: {
        "query": {
          description: "Executes a raw SQL query against the database.",
          input: z.object({
            sql: z.string(),
          }),
          handler: async ({ sql }) => {
            try {
              const result = await db.execute(sql);
              return {
                success: true,
                result,
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message,
              };
            }
          },
        },
      },
    },
  }
);

server.start();
