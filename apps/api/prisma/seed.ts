import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("password123", 10);

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

  const workspace = await prisma.workspace.upsert({
    where: { slug: "flowmanager-dev" },
    update: {},
    create: {
      name: "FlowManager Dev",
      slug: "flowmanager-dev",
      description: "Workspace de desenvolvimento",
      owner_id: admin.id,
    },
  });

  console.log(`✅ Admin: ${admin.email}`);
  console.log(`✅ Workspace: ${workspace.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
