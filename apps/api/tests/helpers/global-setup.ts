import { config } from "dotenv";
import { resolve } from "path";

export function setup() {
  // Carrega o .env antes dos workers serem criados
  config({ path: resolve(process.cwd(), ".env") });

  // Em ambiente de teste, aponta DATABASE_URL para o banco de testes
  // para que o PrismaClient da aplicação não escreva no banco de produção
  if (process.env.DATABASE_TEST_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
  }
}
