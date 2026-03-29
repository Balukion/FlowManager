import type { FastifyInstance } from "fastify";
import * as controller from "./users.controller.js";
import {
  getMeSchema,
  updateMeSchema,
  changePasswordSchema,
  presignAvatarSchema,
  updateAvatarSchema,
  deleteAvatarSchema,
} from "./users.schema.js";

export async function usersRoutes(app: FastifyInstance) {
  app.get(
    "/users/me",
    { schema: getMeSchema, preHandler: [app.authenticate] },
    controller.getMe,
  );

  app.patch(
    "/users/me",
    { schema: updateMeSchema, preHandler: [app.authenticate] },
    controller.updateMe,
  );

  app.patch(
    "/users/me/password",
    { schema: changePasswordSchema, preHandler: [app.authenticate] },
    controller.changePassword,
  );

  app.post(
    "/users/me/avatar/presign",
    { schema: presignAvatarSchema, preHandler: [app.authenticate] },
    controller.presignAvatar,
  );

  app.patch(
    "/users/me/avatar",
    { schema: updateAvatarSchema, preHandler: [app.authenticate] },
    controller.updateAvatar,
  );

  app.delete(
    "/users/me/avatar",
    { schema: deleteAvatarSchema, preHandler: [app.authenticate] },
    controller.deleteAvatar,
  );
}
