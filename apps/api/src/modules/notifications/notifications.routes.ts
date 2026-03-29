import type { FastifyInstance } from "fastify";
import * as controller from "./notifications.controller.js";

export async function notificationsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get("/notifications", auth, controller.listNotifications);
  app.patch("/notifications/read-all", auth, controller.markAllAsRead);
  app.patch("/notifications/:id/read", auth, controller.markAsRead);
  app.delete("/notifications/:id", auth, controller.deleteNotification);
}
