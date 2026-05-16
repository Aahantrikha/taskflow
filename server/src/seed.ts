/**
 * Seed script — creates demo users only (no fake data)
 * Run: npx ts-node src/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password', 12);

  // Create demo users
  await prisma.user.create({
    data: {
      name: 'Alex Chen',
      email: 'alex@taskflow.io',
      password: hashedPassword,
      role: 'admin',
      jobTitle: 'Engineering Lead',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Sarah Miller',
      email: 'sarah@taskflow.io',
      password: hashedPassword,
      role: 'project_lead',
      jobTitle: 'Project Lead',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    },
  });

  await prisma.user.create({
    data: {
      name: 'James Wilson',
      email: 'james@taskflow.io',
      password: hashedPassword,
      role: 'quality_reviewer',
      jobTitle: 'QA Engineer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Emily Davis',
      email: 'emily@taskflow.io',
      password: hashedPassword,
      role: 'tasker',
      jobTitle: 'Developer',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    },
  });

  console.log('✅ Created 4 demo users');
  console.log('\n🎉 Seed complete!');
  console.log('\nDemo accounts:');
  console.log('  Admin:            alex@taskflow.io   / password');
  console.log('  Project Lead:     sarah@taskflow.io  / password');
  console.log('  Quality Reviewer: james@taskflow.io  / password');
  console.log('  Tasker:           emily@taskflow.io  / password');
  console.log('\nThe app starts clean — create projects and tasks from the UI.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
