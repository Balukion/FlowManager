import { AppError } from "./app-error.js";

export class ConflictError extends AppError {
  constructor(code: string, message = "Conflito") {
    super(message, 409, code);
    this.name = "ConflictError";
  }
}
