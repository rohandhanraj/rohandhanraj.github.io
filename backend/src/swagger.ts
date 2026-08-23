import swaggerUi from "swagger-ui-express";
import { Express } from "express";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Rohan Yadav Portfolio Backend API",
    version: "1.0.0",
    description: "API documentation and interactive test UI for Rohan's Portfolio Chatbot and RAG Engine",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local Development Server",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        description: "Checks if the backend API service is running.",
        responses: {
          "200": {
            description: "Backend service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "healthy" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/chat": {
      post: {
        summary: "Chat completion and RAG context retrieval",
        description: "Streams SSE responses with thinking tokens and retrieved profile context based on user query.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["query"],
                properties: {
                  query: {
                    type: "string",
                    example: "Where did Rohan study?",
                    description: "User question about Rohan's skills, experience, or projects",
                  },
                  history: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string", enum: ["user", "assistant"] },
                        content: { type: "string" },
                      },
                    },
                    description: "Previous conversation turn history",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Server-Sent Events stream containing reasoning and answer choices",
            content: {
              "text/event-stream": {
                schema: {
                  type: "string",
                  example: "data: {\"choices\":[{\"delta\":{\"content\":\"...\"}}]}\n\ndata: [DONE]\n\n",
                },
              },
            },
          },
          "400": {
            description: "Prompt injection or missing query error",
          },
        },
      },
    },
    "/api/chat/history": {
      get: {
        summary: "Retrieve session chat history",
        description: "Gets historical chat messages for the current visitor session.",
        responses: {
          "200": {
            description: "List of historical chat messages",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    messages: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          role: { type: "string" },
                          content: { type: "string" },
                          timestamp: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/analytics": {
      post: {
        summary: "Log analytics event",
        description: "Records user interactions and events for monitoring.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["eventType"],
                properties: {
                  eventType: { type: "string", example: "resume_download" },
                  details: { type: "object", example: { format: "pdf" } },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Event logged successfully",
          },
        },
      },
    },
    "/api/cron/keepalive": {
      get: {
        summary: "Database keep-alive trigger",
        description: "Performs keep-alive queries against MongoDB, Qdrant, and Neo4j to prevent auto-pausing.",
        responses: {
          "200": {
            description: "Database health status report",
          },
        },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
