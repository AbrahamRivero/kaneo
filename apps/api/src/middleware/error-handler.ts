import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { MiddlewareHandler } from "hono";

export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      const message = firstError?.message || "Validation error";

      return c.json(
        {
          message,
          code: "VALIDATION_ERROR",
        },
        422
      );
    }

    if (error instanceof HTTPException) {
      const status = error.status;
      const message = error.message || "Error";
      return c.json({ message, code: "HTTP_ERROR" }, status);
    }

    console.error("Unexpected error:", error);
    return c.json(
      {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      500
    );
  }
};