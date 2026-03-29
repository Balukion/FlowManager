import { describe, it, expect } from "vitest";
import { verifyEmailTemplate } from "./verify-email.js";
import { resetPasswordTemplate } from "./reset-password.js";
import { invitationTemplate } from "./invitation.js";
import { stepAssignedTemplate } from "./step-assigned.js";
import { deadlineReminderTemplate } from "./deadline-reminder.js";

describe("Email templates", () => {
  describe("verifyEmailTemplate", () => {
    it("should include the confirmation link", () => {
      const html = verifyEmailTemplate({
        name: "João",
        token: "abc123",
        frontend_url: "https://app.example.com",
      });
      expect(html).toContain("https://app.example.com/verify-email?token=abc123");
    });

    it("should include the user name", () => {
      const html = verifyEmailTemplate({ name: "Maria", token: "x", frontend_url: "https://x.com" });
      expect(html).toContain("Maria");
    });
  });

  describe("resetPasswordTemplate", () => {
    it("should include the reset link", () => {
      const html = resetPasswordTemplate({
        name: "Ana",
        token: "tok-456",
        frontend_url: "https://app.example.com",
      });
      expect(html).toContain("https://app.example.com/reset-password?token=tok-456");
    });

    it("should mention expiry", () => {
      const html = resetPasswordTemplate({ name: "x", token: "t", frontend_url: "https://x.com" });
      expect(html).toContain("1 hora");
    });
  });

  describe("invitationTemplate", () => {
    it("should include workspace name and inviter name", () => {
      const html = invitationTemplate({
        workspace_name: "Minha Startup",
        inviter_name: "Carlos",
        token: "invite-token",
        frontend_url: "https://app.example.com",
      });
      expect(html).toContain("Minha Startup");
      expect(html).toContain("Carlos");
    });

    it("should include the accept link", () => {
      const html = invitationTemplate({
        workspace_name: "W",
        inviter_name: "I",
        token: "t123",
        frontend_url: "https://app.example.com",
      });
      expect(html).toContain("https://app.example.com/invitations/accept?token=t123");
    });
  });

  describe("stepAssignedTemplate", () => {
    it("should include step and task titles", () => {
      const html = stepAssignedTemplate({
        assignee_name: "Pedro",
        step_title: "Revisar PR",
        task_title: "Lançar v2",
        workspace_name: "Dev Team",
        frontend_url: "https://app.example.com",
      });
      expect(html).toContain("Revisar PR");
      expect(html).toContain("Lançar v2");
      expect(html).toContain("Dev Team");
    });
  });

  describe("deadlineReminderTemplate", () => {
    it("should include entity title and deadline", () => {
      const html = deadlineReminderTemplate({
        user_name: "Luís",
        entity_title: "Deploy produção",
        entity_type: "task",
        deadline: "30/03/2026",
        frontend_url: "https://app.example.com",
      });
      expect(html).toContain("Deploy produção");
      expect(html).toContain("30/03/2026");
    });

    it("should say 'tarefa' for task type", () => {
      const html = deadlineReminderTemplate({
        user_name: "x",
        entity_title: "x",
        entity_type: "task",
        deadline: "x",
        frontend_url: "https://x.com",
      });
      expect(html).toContain("tarefa");
    });

    it("should say 'passo' for step type", () => {
      const html = deadlineReminderTemplate({
        user_name: "x",
        entity_title: "x",
        entity_type: "step",
        deadline: "x",
        frontend_url: "https://x.com",
      });
      expect(html).toContain("passo");
    });
  });
});
