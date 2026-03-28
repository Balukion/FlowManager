import { AppError } from "./app-error.js";

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado", code = "UNAUTHORIZED") {
    super(message, 401, code);
    this.name = "UnauthorizedError";
  }
}
