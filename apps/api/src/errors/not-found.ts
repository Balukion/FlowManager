import { AppError } from "./app-error.js";

export class NotFoundError extends AppError {
  constructor(code: string, message = "Recurso não encontrado") {
    super(message, 404, code);
    this.name = "NotFoundError";
  }
}
