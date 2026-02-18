import bcrypt from 'bcryptjs';
import { PrismaClient, Role, JobType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@portal.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@portal.com',
      passwordHash: password,
      role: Role.ADMIN,
      isApproved: true,
      emailVerified: true
    }
  });

  const companyUser = await prisma.user.upsert({
    where: { email: 'company@portal.com' },
    update: {},
    create: {
      name: 'Acme HR',
      email: 'company@portal.com',
      passwordHash: password,
      role: Role.COMPANY,
      isApproved: true,
      emailVerified: true,
      companyProfile: {
        create: {
          companyName: 'Acme Corp',
          website: 'https://acme.example.com',
          description: 'We build delightful products for modern teams.'
        }
      }
    },
    include: { companyProfile: true }
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@portal.com' },
    update: {},
    create: {
      name: 'Jamie Student',
      email: 'student@portal.com',
      passwordHash: password,
      role: Role.STUDENT,
      isApproved: true,
      emailVerified: true,
      studentProfile: {
        create: {
          skills: 'React, Node.js, SQL',
          bio: 'Computer science junior passionate about full-stack development.',
          resumeUrl: 'https://example.com/resume.pdf'
        }
      }
    },
    include: { studentProfile: true }
  });

  const companyProfileId = companyUser.companyProfile?.id;
  if (!companyProfileId) {
    throw new Error('Company profile missing for seed user.');
  }

  const jobsData = [
    {
      title: 'Frontend Engineer',
      type: JobType.JOB,
      location: 'Remote',
      salaryRange: '$90k - $120k',
      description: 'Build modern UI experiences with React and Tailwind.'
    },
    {
      title: 'Backend Intern',
      type: JobType.INTERNSHIP,
      location: 'New York, NY',
      salaryRange: '$25/hr',
      description: 'Support API development using Node.js and PostgreSQL.'
    },
    {
      title: 'Product Design Intern',
      type: JobType.INTERNSHIP,
      location: 'San Francisco, CA',
      salaryRange: '$30/hr',
      description: 'Collaborate with product and engineering to shape UX.'
    }
  ];

  // Clear dependent applications first to satisfy FK constraints.
  await prisma.application.deleteMany({
    where: { job: { companyId: companyProfileId } }
  });
  await prisma.job.deleteMany({ where: { companyId: companyProfileId } });
  await prisma.job.createMany({
    data: jobsData.map((job) => ({
      ...job,
      companyId: companyProfileId,
      isApproved: true
    }))
  });

  console.log('Seed complete:', {
    admin: admin.email,
    company: companyUser.email,
    student: studentUser.email
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
