import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("password123", 10);

  // ── Users ─────────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: "admin@flowmanager.dev" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@flowmanager.dev",
      password_hash: password,
      email_verified: true,
      email_verified_at: new Date(),
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: "alice@flowmanager.dev" },
    update: {},
    create: {
      name: "Alice Chen",
      email: "alice@flowmanager.dev",
      password_hash: password,
      email_verified: true,
      email_verified_at: new Date(),
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@flowmanager.dev" },
    update: {},
    create: {
      name: "Bob Silva",
      email: "bob@flowmanager.dev",
      password_hash: password,
      email_verified: true,
      email_verified_at: new Date(),
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@flowmanager.dev" },
    update: {},
    create: {
      name: "Carol Mendes",
      email: "carol@flowmanager.dev",
      password_hash: password,
      email_verified: true,
      email_verified_at: new Date(),
    },
  });

  console.log("✅ Users: admin / alice / bob / carol  (password: password123)");

  // ── Workspace ─────────────────────────────────────────────────────────────

  const workspace = await prisma.workspace.upsert({
    where: { slug: "flowmanager-dev" },
    update: {},
    create: {
      name: "FlowManager Dev",
      slug: "flowmanager-dev",
      description: "Development workspace for testing",
      owner_id: admin.id,
    },
  });

  await prisma.workspaceMember.upsert({
    where: { workspace_id_user_id: { workspace_id: workspace.id, user_id: admin.id } },
    update: {},
    create: { workspace_id: workspace.id, user_id: admin.id, role: "ADMIN" },
  });

  await prisma.workspaceMember.upsert({
    where: { workspace_id_user_id: { workspace_id: workspace.id, user_id: alice.id } },
    update: {},
    create: { workspace_id: workspace.id, user_id: alice.id, role: "ADMIN" },
  });

  await prisma.workspaceMember.upsert({
    where: { workspace_id_user_id: { workspace_id: workspace.id, user_id: bob.id } },
    update: {},
    create: { workspace_id: workspace.id, user_id: bob.id, role: "MEMBER" },
  });

  await prisma.workspaceMember.upsert({
    where: { workspace_id_user_id: { workspace_id: workspace.id, user_id: carol.id } },
    update: {},
    create: { workspace_id: workspace.id, user_id: carol.id, role: "MEMBER" },
  });

  console.log(`✅ Workspace: ${workspace.slug} (4 members)`);

  // ── Guard — skip projects/tasks if workspace already has data ─────────────

  const existingProjects = await prisma.project.count({
    where: { workspace_id: workspace.id, deleted_at: null },
  });

  if (existingProjects > 0) {
    console.log("⏭️  Projects already exist — skipping the rest");
    console.log("\n✅ Seed complete");
    return;
  }

  // ── Labels ────────────────────────────────────────────────────────────────

  const [bugLabel, featureLabel, improvementLabel, urgentLabel, backendLabel, frontendLabel] =
    await Promise.all([
      prisma.label.create({ data: { workspace_id: workspace.id, name: "Bug", color: "#ef4444", created_by: admin.id } }),
      prisma.label.create({ data: { workspace_id: workspace.id, name: "Feature", color: "#3b82f6", created_by: admin.id } }),
      prisma.label.create({ data: { workspace_id: workspace.id, name: "Improvement", color: "#22c55e", created_by: admin.id } }),
      prisma.label.create({ data: { workspace_id: workspace.id, name: "Urgent", color: "#f97316", created_by: admin.id } }),
      prisma.label.create({ data: { workspace_id: workspace.id, name: "Backend", color: "#8b5cf6", created_by: admin.id } }),
      prisma.label.create({ data: { workspace_id: workspace.id, name: "Frontend", color: "#eab308", created_by: admin.id } }),
    ]);

  console.log("✅ Labels: Bug, Feature, Improvement, Urgent, Backend, Frontend");

  // ── Projects ──────────────────────────────────────────────────────────────

  const websiteProject = await prisma.project.create({
    data: {
      workspace_id: workspace.id,
      name: "Website Redesign",
      slug: "website-redesign",
      description: "Full redesign of the marketing website",
      color: "#3b82f6",
      status: "ACTIVE",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      created_by: admin.id,
      owner_id: alice.id,
    },
  });

  const mobileProject = await prisma.project.create({
    data: {
      workspace_id: workspace.id,
      name: "Mobile App",
      slug: "mobile-app",
      description: "iOS and Android mobile application",
      color: "#22c55e",
      status: "ACTIVE",
      created_by: admin.id,
      owner_id: bob.id,
    },
  });

  const apiProject = await prisma.project.create({
    data: {
      workspace_id: workspace.id,
      name: "API Refactor",
      slug: "api-refactor",
      description: "Performance improvements and refactoring",
      color: "#8b5cf6",
      status: "ARCHIVED",
      archived_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      created_by: admin.id,
    },
  });

  console.log("✅ Projects: Website Redesign, Mobile App, API Refactor (archived)");

  // ── Tasks — Website Redesign ──────────────────────────────────────────────

  const websiteTasks = await Promise.all([
    prisma.task.create({ data: {
      project_id: websiteProject.id, number: 1, order: 1,
      title: "Define brand guidelines",
      status: "DONE", priority: "HIGH", status_is_manual: true,
      assignee_id: alice.id, created_by: admin.id,
      deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    }}),
    prisma.task.create({ data: {
      project_id: websiteProject.id, number: 2, order: 2,
      title: "Design homepage wireframes",
      status: "DONE", priority: "HIGH", status_is_manual: true,
      assignee_id: alice.id, created_by: alice.id,
    }}),
    prisma.task.create({ data: {
      project_id: websiteProject.id, number: 3, order: 3,
      title: "Implement responsive layout",
      status: "IN_PROGRESS", priority: "HIGH",
      assignee_id: bob.id, created_by: alice.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }}),
    prisma.task.create({ data: {
      project_id: websiteProject.id, number: 4, order: 4,
      title: "Write copy for landing page",
      status: "IN_PROGRESS", priority: "MEDIUM",
      assignee_id: carol.id, created_by: admin.id,
    }}),
    prisma.task.create({ data: {
      project_id: websiteProject.id, number: 5, order: 5,
      title: "Set up analytics and tracking",
      status: "TODO", priority: "MEDIUM",
      created_by: alice.id,
    }}),
    prisma.task.create({ data: {
      project_id: websiteProject.id, number: 6, order: 6,
      title: "Optimize images for web",
      status: "TODO", priority: "LOW",
      created_by: bob.id,
    }}),
    prisma.task.create({ data: {
      project_id: websiteProject.id, number: 7, order: 7,
      title: "Fix broken links from old site",
      description: "Several 404s found during the audit. Need to set up 301 redirects.",
      status: "TODO", priority: "HIGH",
      created_by: carol.id,
    }}),
    prisma.task.create({ data: {
      project_id: websiteProject.id, number: 8, order: 8,
      title: "Cross-browser testing",
      status: "TODO", priority: "MEDIUM",
      assignee_id: bob.id, created_by: alice.id,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    }}),
  ]);

  // ── Tasks — Mobile App ────────────────────────────────────────────────────

  const mobileTasks = await Promise.all([
    prisma.task.create({ data: {
      project_id: mobileProject.id, number: 1, order: 1,
      title: "Set up React Native project",
      status: "DONE", priority: "HIGH", status_is_manual: true,
      assignee_id: bob.id, created_by: admin.id,
    }}),
    prisma.task.create({ data: {
      project_id: mobileProject.id, number: 2, order: 2,
      title: "Implement authentication flow",
      status: "DONE", priority: "HIGH", status_is_manual: true,
      assignee_id: bob.id, created_by: bob.id,
    }}),
    prisma.task.create({ data: {
      project_id: mobileProject.id, number: 3, order: 3,
      title: "Build task list screen",
      status: "IN_PROGRESS", priority: "HIGH",
      assignee_id: bob.id, created_by: bob.id,
    }}),
    prisma.task.create({ data: {
      project_id: mobileProject.id, number: 4, order: 4,
      title: "Push notifications integration",
      status: "TODO", priority: "MEDIUM",
      created_by: admin.id,
    }}),
    prisma.task.create({ data: {
      project_id: mobileProject.id, number: 5, order: 5,
      title: "Offline mode support",
      description: "Cache tasks locally and sync when connection is restored.",
      status: "TODO", priority: "LOW",
      created_by: bob.id,
    }}),
    prisma.task.create({ data: {
      project_id: mobileProject.id, number: 6, order: 6,
      title: "App Store submission",
      status: "TODO", priority: "HIGH",
      assignee_id: bob.id, created_by: admin.id,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    }}),
  ]);

  // ── Tasks — API Refactor ──────────────────────────────────────────────────

  const apiTasks = await Promise.all([
    prisma.task.create({ data: {
      project_id: apiProject.id, number: 1, order: 1,
      title: "Audit slow endpoints",
      status: "DONE", priority: "HIGH", status_is_manual: true,
      assignee_id: admin.id, created_by: admin.id,
    }}),
    prisma.task.create({ data: {
      project_id: apiProject.id, number: 2, order: 2,
      title: "Add database indexes",
      status: "DONE", priority: "HIGH", status_is_manual: true,
      assignee_id: admin.id, created_by: admin.id,
    }}),
    prisma.task.create({ data: {
      project_id: apiProject.id, number: 3, order: 3,
      title: "Implement query caching",
      status: "DONE", priority: "MEDIUM", status_is_manual: true,
      created_by: admin.id,
    }}),
  ]);

  console.log(`✅ Tasks: ${websiteTasks.length + mobileTasks.length + apiTasks.length} total`);

  // ── Steps ─────────────────────────────────────────────────────────────────

  const layoutTask = websiteTasks[2];
  const copyTask = websiteTasks[3];
  const mobileListTask = mobileTasks[2];

  const layoutSteps = await Promise.all([
    prisma.step.create({ data: { task_id: layoutTask.id, title: "Set up CSS grid structure", order: 1, status: "DONE", created_by: bob.id } }),
    prisma.step.create({ data: { task_id: layoutTask.id, title: "Build header and navigation", order: 2, status: "DONE", created_by: bob.id } }),
    prisma.step.create({ data: { task_id: layoutTask.id, title: "Implement hero section", order: 3, status: "IN_PROGRESS", created_by: bob.id } }),
    prisma.step.create({ data: { task_id: layoutTask.id, title: "Build footer", order: 4, status: "PENDING", created_by: bob.id } }),
    prisma.step.create({ data: { task_id: layoutTask.id, title: "Mobile breakpoints", order: 5, status: "PENDING", created_by: alice.id } }),
  ]);

  await Promise.all([
    prisma.step.create({ data: { task_id: copyTask.id, title: "Research competitor messaging", order: 1, status: "DONE", created_by: carol.id } }),
    prisma.step.create({ data: { task_id: copyTask.id, title: "Draft hero headline options", order: 2, status: "IN_PROGRESS", created_by: carol.id } }),
    prisma.step.create({ data: { task_id: copyTask.id, title: "Write feature section copy", order: 3, status: "PENDING", created_by: carol.id } }),
    prisma.step.create({ data: { task_id: copyTask.id, title: "Write testimonials section", order: 4, status: "PENDING", created_by: carol.id } }),
  ]);

  const mobileListSteps = await Promise.all([
    prisma.step.create({ data: { task_id: mobileListTask.id, title: "Design screen mockup", order: 1, status: "DONE", created_by: bob.id } }),
    prisma.step.create({ data: { task_id: mobileListTask.id, title: "Create FlatList component", order: 2, status: "IN_PROGRESS", created_by: bob.id } }),
    prisma.step.create({ data: { task_id: mobileListTask.id, title: "Integrate with API", order: 3, status: "PENDING", created_by: bob.id } }),
    prisma.step.create({ data: { task_id: mobileListTask.id, title: "Add pull-to-refresh", order: 4, status: "PENDING", created_by: bob.id } }),
  ]);

  await Promise.all([
    prisma.step.create({ data: { task_id: websiteTasks[7].id, title: "Test on Chrome and Firefox", order: 1, status: "PENDING", created_by: bob.id } }),
    prisma.step.create({ data: { task_id: websiteTasks[7].id, title: "Test on Safari", order: 2, status: "PENDING", created_by: bob.id } }),
    prisma.step.create({ data: { task_id: websiteTasks[7].id, title: "Test on mobile browsers", order: 3, status: "PENDING", created_by: bob.id } }),
  ]);

  console.log("✅ Steps created");

  // ── Step assignments ──────────────────────────────────────────────────────

  await prisma.stepAssignment.createMany({
    data: [
      { step_id: layoutSteps[0].id, user_id: bob.id, assigned_by: alice.id },
      { step_id: layoutSteps[1].id, user_id: bob.id, assigned_by: alice.id },
      { step_id: layoutSteps[2].id, user_id: bob.id, assigned_by: alice.id },
      { step_id: mobileListSteps[1].id, user_id: bob.id, assigned_by: admin.id },
    ],
    skipDuplicates: true,
  });

  // ── Task labels ───────────────────────────────────────────────────────────

  await prisma.taskLabel.createMany({
    data: [
      { task_id: websiteTasks[2].id, label_id: frontendLabel.id },
      { task_id: websiteTasks[3].id, label_id: featureLabel.id },
      { task_id: websiteTasks[6].id, label_id: bugLabel.id },
      { task_id: websiteTasks[6].id, label_id: urgentLabel.id },
      { task_id: mobileTasks[2].id, label_id: featureLabel.id },
      { task_id: mobileTasks[2].id, label_id: frontendLabel.id },
      { task_id: mobileTasks[3].id, label_id: backendLabel.id },
      { task_id: apiTasks[0].id, label_id: backendLabel.id },
      { task_id: apiTasks[1].id, label_id: improvementLabel.id },
    ],
    skipDuplicates: true,
  });

  // ── Task watchers ─────────────────────────────────────────────────────────

  await prisma.taskWatcher.createMany({
    data: [
      { task_id: websiteTasks[2].id, user_id: alice.id },
      { task_id: websiteTasks[2].id, user_id: admin.id },
      { task_id: websiteTasks[6].id, user_id: alice.id },
      { task_id: mobileTasks[2].id, user_id: admin.id },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Labels, watchers and assignments linked");

  // ── Comments ──────────────────────────────────────────────────────────────

  const comment1 = await prisma.comment.create({
    data: {
      task_id: layoutTask.id,
      user_id: alice.id,
      content: "Bob, make sure the header sticks on scroll. Check the Figma file for the exact behavior.",
    },
  });

  await prisma.comment.create({
    data: {
      task_id: layoutTask.id,
      user_id: bob.id,
      parent_id: comment1.id,
      content: "Got it. I'll use position: sticky with a backdrop-blur effect.",
    },
  });

  await prisma.comment.create({
    data: {
      task_id: layoutTask.id,
      user_id: carol.id,
      content: "The mobile version also needs a hamburger menu. Is that in scope for this task?",
    },
  });

  await prisma.comment.create({
    data: {
      task_id: websiteTasks[6].id,
      user_id: admin.id,
      content: "I found 14 broken links in the audit. I'll share the full list in Notion.",
    },
  });

  const mobileComment = await prisma.comment.create({
    data: {
      task_id: mobileListTask.id,
      user_id: admin.id,
      content: "Bob, what's the current status on the API integration for this screen?",
    },
  });

  await prisma.comment.create({
    data: {
      task_id: mobileListTask.id,
      user_id: bob.id,
      parent_id: mobileComment.id,
      content: "Almost done. Need to handle pagination and error states.",
    },
  });

  console.log("✅ Comments created");

  // ── Activity logs ─────────────────────────────────────────────────────────

  await prisma.activityLog.createMany({
    data: [
      {
        workspace_id: workspace.id,
        user_id: admin.id,
        action: "WORKSPACE_CREATED",
        entity_type: "workspace",
        entity_id: workspace.id,
      },
      {
        workspace_id: workspace.id,
        project_id: websiteProject.id,
        user_id: alice.id,
        action: "PROJECT_CREATED",
        entity_type: "project",
        entity_id: websiteProject.id,
      },
      {
        workspace_id: workspace.id,
        project_id: websiteProject.id,
        task_id: websiteTasks[0].id,
        user_id: alice.id,
        action: "TASK_STATUS_CHANGED",
        entity_type: "task",
        entity_id: websiteTasks[0].id,
        metadata: { from: "IN_PROGRESS", to: "DONE", is_manual: true },
      },
      {
        workspace_id: workspace.id,
        project_id: websiteProject.id,
        task_id: layoutTask.id,
        user_id: alice.id,
        action: "STEP_ASSIGNED",
        entity_type: "step",
        entity_id: layoutSteps[0].id,
        metadata: { assigned_to: [bob.id] },
      },
      {
        workspace_id: workspace.id,
        project_id: mobileProject.id,
        task_id: mobileTasks[1].id,
        user_id: bob.id,
        action: "TASK_STATUS_CHANGED",
        entity_type: "task",
        entity_id: mobileTasks[1].id,
        metadata: { from: "IN_PROGRESS", to: "DONE", is_manual: true },
      },
    ],
  });

  // ── Notifications ─────────────────────────────────────────────────────────

  await prisma.notification.createMany({
    data: [
      {
        user_id: bob.id,
        type: "STEP_ASSIGNED",
        title: "You were assigned to a step",
        body: `You have been assigned to "${layoutSteps[0].title}"`,
        entity_type: "step",
        entity_id: layoutSteps[0].id,
        sent_at: new Date(),
      },
      {
        user_id: alice.id,
        type: "COMMENT_MENTION",
        title: "New comment on your task",
        body: `Bob commented on "${layoutTask.title}"`,
        entity_type: "task",
        entity_id: layoutTask.id,
        sent_at: new Date(),
      },
      {
        user_id: bob.id,
        type: "DEADLINE_APPROACHING",
        title: "Deadline approaching",
        body: `"${websiteTasks[7].title}" is due in 14 days`,
        entity_type: "task",
        entity_id: websiteTasks[7].id,
        sent_at: new Date(),
      },
      {
        user_id: admin.id,
        type: "TASK_STATUS_CHANGED",
        title: "Task marked as done",
        body: `"${mobileTasks[1].title}" was marked as done`,
        entity_type: "task",
        entity_id: mobileTasks[1].id,
        read_at: new Date(),
        sent_at: new Date(),
      },
    ],
  });

  console.log("✅ Activity logs and notifications created");

  console.log(`
✅ Seed complete
   Workspace : ${workspace.slug}
   Users     : admin / alice / bob / carol  (password: password123)
   Projects  : Website Redesign (8 tasks), Mobile App (6 tasks), API Refactor (3 tasks, archived)
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
