"use server";

import { ZodError, ZodSchema } from "zod";
import { UnauthorizedError, ValidationError } from "../http-errors";
import { auth } from "@/auth";
import dbConnect from "../mongoose";
import { Session } from "next-auth";

type ActionOptions<T> = {
  params?: T;
  schema?: ZodSchema<T>;
  authorize?: boolean;
};

async function action<T>({ params, schema, authorize = false }: ActionOptions<T>) {
  // Check if schema and params are provided and validated
  if (schema && params) {
    try {
      schema.parse(params);
    } catch (error) {
      if (error instanceof ZodError) {
        return new ValidationError(error.flatten().fieldErrors as Record<string, string[]>);
      } else {
        return new Error("Schema validation failed");
      }
    }
  }

  let session: Session | null = null;

  // Check if user is authorized
  if (authorize) {
    session = await auth();
    if (!session) {
      return new UnauthorizedError();
    }
  }

  await dbConnect();

  return { params, session };
}

export default action;
