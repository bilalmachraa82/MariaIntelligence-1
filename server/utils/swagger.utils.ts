/**
 * OpenAPI/Swagger Documentation Utilities - MariaIntelligence 2025
 * Automatic API documentation generation with OpenAPI 3.0
 */

import type { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { API_CONFIG } from "../config/api.config.js";

/**
 * OpenAPI specification configuration
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: API_CONFIG.documentation.title,
      version: API_CONFIG.documentation.version,
      description: API_CONFIG.documentation.description,
      contact: {
        name: "MariaIntelligence Support",
        email: "support@mariaintelligence.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://api.mariaintelligence.com"
            : `http://localhost:${process.env.PORT || 5100}`,
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
            message: { type: "string" },
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { type: "object" },
              },
            },
            metadata: {
              type: "object",
              properties: {
                timestamp: { type: "string", format: "date-time" },
                version: { type: "string" },
                requestId: { type: "string" },
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    limit: { type: "number" },
                    total: { type: "number" },
                    totalPages: { type: "number" },
                  },
                },
              },
            },
          },
        },
        Property: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            ownerId: { type: "number" },
            cleaningCost: { type: "string" },
            checkInFee: { type: "string" },
            commission: { type: "string" },
            teamPayment: { type: "string" },
            active: { type: "boolean" },
          },
          required: ["name", "ownerId"],
        },
        Reservation: {
          type: "object",
          properties: {
            id: { type: "number" },
            propertyId: { type: "number" },
            guestName: { type: "string" },
            guestEmail: { type: "string" },
            guestPhone: { type: "string" },
            checkInDate: { type: "string", format: "date" },
            checkOutDate: { type: "string", format: "date" },
            numGuests: { type: "number" },
            totalAmount: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled", "completed"],
            },
            platform: {
              type: "string",
              enum: ["airbnb", "booking", "direct", "other"],
            },
          },
          required: ["propertyId", "guestName", "checkInDate", "checkOutDate"],
        },
        ValidationError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                message: { type: "string" },
                details: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: { type: "string" },
                      message: { type: "string" },
                      code: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        Forbidden: {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        ValidationError: {
          description: "Validation Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationError" },
            },
          },
        },
        TooManyRequests: {
          description: "Rate limit exceeded",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }, { apiKey: [] }],
  },
  apis: [
    "./server/routes/v1/*.ts",
    "./server/routes/v1/*.js",
    "./server/controllers/*.ts",
    "./server/controllers/*.js",
  ],
};

/**
 * Setup OpenAPI documentation
 */
export async function setupDocumentation(app: Express): Promise<void> {
  try {
    const specs = swaggerJsdoc(swaggerOptions);

    // Serve swagger UI
    app.use(
      API_CONFIG.documentation.path,
      swaggerUi.serve,
      swaggerUi.setup(specs, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: API_CONFIG.documentation.title,
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          tryItOutEnabled: true,
        },
      }),
    );

    // Serve raw OpenAPI spec
    app.get("/api/openapi.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(specs);
    });

    console.log(
      `📚 OpenAPI documentation initialized at ${API_CONFIG.documentation.path}`,
    );
  } catch (error) {
    console.error("❌ Failed to setup API documentation:", error);
  }
}

/**
 * OpenAPI route decorator
 */
export function apiDoc(operation: any) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // Store OpenAPI metadata for the route
    if (!target.constructor.__openapi) {
      target.constructor.__openapi = {};
    }
    target.constructor.__openapi[propertyKey] = operation;
    return descriptor;
  };
}

/**
 * OpenAPI parameter decorator
 */
export function apiParam(param: any) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    // Store parameter metadata
    if (!target.constructor.__params) {
      target.constructor.__params = {};
    }
    if (!target.constructor.__params[propertyKey]) {
      target.constructor.__params[propertyKey] = [];
    }
    target.constructor.__params[propertyKey][parameterIndex] = param;
  };
}

/**
 * OpenAPI response decorator
 */
export function apiResponse(
  statusCode: number,
  description: string,
  schema?: any,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    if (!target.constructor.__responses) {
      target.constructor.__responses = {};
    }
    if (!target.constructor.__responses[propertyKey]) {
      target.constructor.__responses[propertyKey] = {};
    }
    target.constructor.__responses[propertyKey][statusCode] = {
      description,
      ...(schema && {
        content: {
          "application/json": {
            schema,
          },
        },
      }),
    };
    return descriptor;
  };
}
