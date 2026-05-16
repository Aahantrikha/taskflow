import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const userSelect = {
  id: true, name: true, email: true, avatar: true, role: true, jobTitle: true,
} as const;

const taskInclude = {
  assignee: { select: userSelect },
  creator: { select: userSelect },
} as const;

type UserShape = { id: string; name: string; email: string; avatar: string | null; role: string; jobTitle: string };

function fmtUser(u: UserShape) {
  return { ...u, avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=3b82f6&color=fff&size=100` };
}

function fmtTask(task: {
  id: string; title: string; description: string; status: string; priority: string;
  dueDate: Date | null; tags: string[]; createdAt: Date; updatedAt: Date; projectId: string;
  assignee: UserShape | null; creator: UserShape;
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    tags: task.tags,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    projectId: task.projectId,
    assignee: task.assignee ? fmtUser(task.assignee) : null,
    creator: fmtUser(task.creator),
  };
}

// GET /api/tasks
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const canSeeAll = ['admin', 'project_lead', 'quality_reviewer'].includes(req.user!.role);
    const { projectId, status, priority } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        ...(canSeeAll ? {} : { assigneeId: req.user!.id }),
        ...(projectId ? { projectId: String(projectId) } : {}),
        ...(status ? { status: String(status) as any } : {}),
        ...(priority ? { priority: String(priority) as any } : {}),
      },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks.map(fmtTask));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    if (req.user!.role !== 'admin' && req.user!.role !== 'project_lead' && req.user!.role !== 'quality_reviewer' && task.assigneeId !== req.user!.id) {
      res.status(403).json({ error: 'Access denied' }); return;
    }
    res.json(fmtTask(task));
  } catch {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks — admin only
router.post(
  '/',
  requireAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('description').optional().trim(),
    body('status').optional().isIn(['backlog', 'todo', 'in_progress', 'in_review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('assigneeId').optional(),
    body('dueDate').optional(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: errors.array()[0].msg }); return; }

    const { title, description, status, priority, assigneeId, projectId, dueDate, tags } = req.body;

    try {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

      // Auto-add assignee as project member if not already
      if (assigneeId) {
        await prisma.projectMember.upsert({
          where: { projectId_userId: { projectId, userId: assigneeId } },
          create: { projectId, userId: assigneeId },
          update: {},
        });
      }

      const task = await prisma.task.create({
        data: {
          title,
          description: description || '',
          status: status || 'todo',
          priority: priority || 'medium',
          assigneeId: assigneeId || null,
          projectId,
          creatorId: req.user!.id,
          dueDate: dueDate ? new Date(dueDate) : null,
          tags: tags || [],
        },
        include: taskInclude,
      });

      await prisma.activity.create({
        data: { action: 'created task', target: title, type: 'task', userId: req.user!.id, projectId },
      });

      res.status(201).json(fmtTask(task));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

// PATCH /api/tasks/:id
// Admin: full edit | Member: status only (own tasks)
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('status').optional().isIn(['backlog', 'todo', 'in_progress', 'in_review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('assigneeId').optional(),
    body('dueDate').optional(),
    body('tags').optional().isArray(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: errors.array()[0].msg }); return; }

    const id = String(req.params.id);
    try {
      const existing = await prisma.task.findUnique({ where: { id } });
      if (!existing) { res.status(404).json({ error: 'Task not found' }); return; }

      const role = req.user!.role;
      const canFullEdit = role === 'admin' || role === 'project_lead';
      const canReview = role === 'quality_reviewer';

      // Taskers can only update their own tasks; reviewers can update any task's status
      if (!canFullEdit && !canReview && existing.assigneeId !== req.user!.id) {
        res.status(403).json({ error: 'You can only update tasks assigned to you' }); return;
      }

      const { title, description, status, priority, assigneeId, dueDate, tags } = req.body;

      // Auto-add new assignee as project member
      if (assigneeId && canFullEdit) {
        await prisma.projectMember.upsert({
          where: { projectId_userId: { projectId: existing.projectId, userId: assigneeId } },
          create: { projectId: existing.projectId, userId: assigneeId },
          update: {},
        });
      }

      let data: any;
      if (canFullEdit) {
        // Admin / Project Lead: full edit
        data = {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(priority !== undefined && { priority }),
          ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(tags !== undefined && { tags }),
        };
      } else if (canReview) {
        // Quality Reviewer: can change status and priority
        data = {
          ...(status !== undefined && { status }),
          ...(priority !== undefined && { priority }),
        };
      } else {
        // Tasker: status only on own tasks
        data = { ...(status !== undefined && { status }) };
      }

      const task = await prisma.task.update({ where: { id }, data, include: taskInclude });

      if (status && status !== existing.status) {
        await prisma.activity.create({
          data: {
            action: `moved task to ${status.replace(/_/g, ' ')}`,
            target: task.title,
            type: 'task',
            userId: req.user!.id,
            projectId: task.projectId,
          },
        });
      }

      res.json(fmtTask(task));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
);

// DELETE /api/tasks/:id — admin only
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }

    await prisma.task.delete({ where: { id } });

    await prisma.activity.create({
      data: { action: 'deleted task', target: task.title, type: 'task', userId: req.user!.id, projectId: task.projectId },
    });

    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
