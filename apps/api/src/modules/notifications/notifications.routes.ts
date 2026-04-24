import type { FastifyInstance } from "fastify";
import * as controller from "./notifications.controller.js";
import {
  deleteNotificationSchema,
  listNotificationsSchema,
  markAllNotificationsAsReadSchema,
  markNotificationAsReadSchema,
} from "./notifications.schema.js";

export async function notificationsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get("/notifications", { ...auth, schema: listNotificationsSchema }, controller.listNotifications);
  app.patch(
    "/notifications/read-all",
    { ...auth, schema: markAllNotificationsAsReadSchema },
    controller.markAllAsRead,
  );
  app.patch(
    "/notifications/:id/read",
    { ...auth, schema: markNotificationAsReadSchema },
    controller.markAsRead,
  );
  app.delete(
    "/notifications/:id",
    { ...auth, schema: deleteNotificationSchema },
    controller.deleteNotification,
  );
}
