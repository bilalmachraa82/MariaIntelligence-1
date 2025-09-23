import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { ApiResponse } from "../types/common.js";

export const handleError = (err: any, res: Response): void => {
  console.error("Error details:", err);

  if (err instanceof ZodError) {
    console.error("Validation error:", JSON.stringify(err.errors, null, 2));
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors,
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }

  if (err.stack) {
    console.error("Error stack:", err.stack);
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: err.name || "UnknownError",
    timestamp: new Date().toISOString()
  } as ApiResponse);
};

export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
});

export const createErrorResponse = (message: string, error?: string): ApiResponse => ({
  success: false,
  message,
  error,
  timestamp: new Date().toISOString()
});