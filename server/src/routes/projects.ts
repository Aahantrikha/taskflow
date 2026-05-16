import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!m;
}

const memberInclude = {
  members: {
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true, role: true, jobTitle: true },
      },
    },
  },
  tasks: { select: { id: true, status: true } },
  creator: { select: { id: true, name: true } },
} as const;

function shapeProject(project: {
  id: string; name: string; description: string; status: string;
  color: string; dueDate: Date | null; createdAt: Date;
  creator: { id: string; name: string };
  members: { user: { id: string; name: string; email: string; avatar: string | null; role: string; jobTitle: string } }[];
  tasks: { id: string; status: string }[];
}) {
  const taskCount = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.status === 'done').length;
  const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    progress,
    color: project.color,
    dueDate: project.dueDate,
    taskCount,
    completedTasks,
    createdAt: project.createdAt,
    creator: project.creator,
    members: project.members.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user.name)}&background=3b82f6&color=fff&size=100`,
      role: m.user.role,
      jobTitle: m.user.jobTitle,
    })),
  };
}

// GET /api/projects
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = ['admin', 'project_lead'].includes(req.user!.role);
    const projects = await prisma.project.findMany({
      where: isAdmin ? {} : { members: { some: { userId: req.user!.id } } },
      include: memberInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects.map(shapeProject));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const isAdmin = ['admin', 'project_lead'].includes(req.user!.role);
    if (!isAdmin && !(await isProjectMember(id, req.user!.id))) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    const project = await prisma.project.findUnique({ where: { id }, include: memberInclude });
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    res.json(shapeProject(project));
  } catch {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects — admin only
router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
    body('color').optional().isString(),
    body('dueDate').optional().isISO8601(),
    body('memberIds').optional().isArray(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: errors.array()[0].msg }); return; }

    const { name, description, color, dueDate, memberIds = [] } = req.body;
    const allIds: string[] = Array.from(new Set([req.user!.id, ...memberIds]));

    try {
      const project = await prisma.project.create({
        data: {
          name,
          description: description || '',
          color: color || '#3b82f6',
          dueDate: dueDate ? new Date(dueDate) : null,
          creatorId: req.user!.id,
          members: { create: allIds.map((userId: string) => ({ userId })) },
        },
        include: memberInclude,
      });

      await prisma.activity.create({
        data: { action: 'created project', target: name, type: 'project', userId: req.user!.id, projectId: project.id },
      });

      res.status(201).json(shapeProject(project));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// PATCH /api/projects/:id — admin only
router.patch(
  '/:id',
  requireAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
    body('color').optional().isString(),
    body('dueDate').optional(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: errors.array()[0].msg }); return; }

    const id = String(req.params.id);
    const { name, description, status, color, dueDate } = req.body;

    try {
      const project = await prisma.project.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
          ...(color && { color }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        },
        include: memberInclude,
      });
      res.json(shapeProject(project));
    } catch {
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// DELETE /api/projects/:id — admin only
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// POST /api/projects/:id/members — admin only
router.post(
  '/:id/members',
  requireAdmin,
  [body('userId').notEmpty().withMessage('userId is required')],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: errors.array()[0].msg }); return; }

    const projectId = String(req.params.id);
    const { userId } = req.body as { userId: string };

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }

      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId, userId } },
        create: { projectId, userId },
        update: {},
      });

      await prisma.activity.create({
        data: { action: 'added member', target: user.name, type: 'member', userId: req.user!.id, projectId },
      });

      const project = await prisma.project.findUnique({ where: { id: projectId }, include: memberInclude });
      res.json(project ? shapeProject(project) : null);
    } catch {
      res.status(500).json({ error: 'Failed to add member' });
    }
  }
);

// DELETE /api/projects/:id/members/:userId — admin only
router.delete('/:id/members/:userId', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = String(req.params.id);
  const userId = String(req.params.userId);
  try {
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    const project = await prisma.project.findUnique({ where: { id: projectId }, include: memberInclude });
    res.json(project ? shapeProject(project) : null);
  } catch {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;
