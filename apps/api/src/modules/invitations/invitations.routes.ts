import type { FastifyInstance } from "fastify";
import * as controller from "./invitations.controller.js";
import {
  acceptInvitationSchema,
  cancelInvitationSchema,
  createInvitationSchema,
  declineInvitationSchema,
  getInvitationPreviewSchema,
  listInvitationsSchema,
  resendInvitationSchema,
} from "./invitations.schema.js";

export async function invitationsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post(
    "/workspaces/:id/invitations",
    {
      ...auth,
      schema: createInvitationSchema,
      config: {
        rateLimit: {
          max: process.env.DISABLE_RATE_LIMIT ? 10000 : 10,
          timeWindow: "1 hour",
          hook: "preHandler",
          keyGenerator: (req: any) => req.headers.authorization ?? req.ip,
        },
      },
    },
    controller.createInvitation,
  );
  app.get("/workspaces/:id/invitations", { ...auth, schema: listInvitationsSchema }, controller.listInvitations);
  app.delete(
    "/workspaces/:id/invitations/:invitationId",
    { ...auth, schema: cancelInvitationSchema },
    controller.cancelInvitation,
  );
  app.post(
    "/workspaces/:id/invitations/:invitationId/resend",
    { ...auth, schema: resendInvitationSchema },
    controller.resendInvitation,
  );
  app.get("/invitations/preview", { schema: getInvitationPreviewSchema }, controller.getInvitationPreview);
  app.post("/invitations/:token/accept", { ...auth, schema: acceptInvitationSchema }, controller.acceptInvitation);
  app.post("/invitations/:token/decline", { ...auth, schema: declineInvitationSchema }, controller.declineInvitation);
}
