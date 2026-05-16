import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/remarks?taskId=xxx
// - Admin/Project Lead: see all remarks
// - Quality Reviewer: see only their own remarks
// - Tasker: see only remarks on their own tasks
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user!.role;
    const userId = req.user!.id;
    const { taskId, projectId } = req.query;

    let where: any = {};

    if (taskId) {
      where.taskId = String(taskId);
    }

    if (projectId) {
      where.task = { projectId: String(projectId) };
    }

    // Role-based filtering
    if (role === 'tasker') {
      // Tasker sees only remarks on tasks assigned to them
      where.task = { ...where.task, assigneeId: userId };
    } else if (role === 'quality_reviewer') {
      // Reviewer sees only their own remarks
      where.authorId = userId;
    }
    // Admin and Project Lead see all remarks (no extra filter)

    const remarks = await prisma.remark.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true, role: true } },
        task: { select: { id: true, title: true, assigneeId: true, projectId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(remarks.map(r => ({
      id: r.id,
      content: r.content,
      type: r.type,
      createdAt: r.createdAt,
      taskId: r.taskId,
      taskTitle: r.task.title,
      author: {
        id: r.author.id,
        name: r.author.name,
        avatar: r.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.author.name)}&background=3b82f6&color=fff&size=100`,
        role: r.author.role,
      },
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch remarks' });
  }
});

// POST /api/remarks — Quality Reviewer, Project Lead, or Admin can add remarks
router.post(
  '/',
  [
    body('taskId').notEmpty().withMessage('Task ID is required'),
    body('content').trim().notEmpty().withMessage('Remark content is required'),
    body('type').optional().isIn(['review', 'feedback', 'issue']),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: errors.array()[0].msg }); return; }

    const role = req.user!.role;
    // Only reviewer, project_lead, and admin can add remarks
    if (role === 'tasker') {
      res.status(403).json({ error: 'Taskers cannot add remarks' });
      return;
    }

    const { taskId, content, type } = req.body;

    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) { res.status(404).json({ error: 'Task not found' }); return; }

      const remark = await prisma.remark.create({
        data: {
          content,
          type: type || 'review',
          taskId,
          authorId: req.user!.id,
        },
        include: {
          author: { select: { id: true, name: true, avatar: true, role: true } },
          task: { select: { id: true, title: true, assigneeId: true, projectId: true } },
        },
      });

      res.status(201).json({
        id: remark.id,
        content: remark.content,
        type: remark.type,
        createdAt: remark.createdAt,
        taskId: remark.taskId,
        taskTitle: remark.task.title,
        author: {
          id: remark.author.id,
          name: remark.author.name,
          avatar: remark.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(remark.author.name)}&background=3b82f6&color=fff&size=100`,
          role: remark.author.role,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create remark' });
    }
  }
);

// DELETE /api/remarks/:id — author or admin can delete
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const remark = await prisma.remark.findUnique({ where: { id } });
    if (!remark) { res.status(404).json({ error: 'Remark not found' }); return; }

    if (req.user!.role !== 'admin' && remark.authorId !== req.user!.id) {
      res.status(403).json({ error: 'You can only delete your own remarks' });
      return;
    }

    await prisma.remark.delete({ where: { id } });
    res.json({ message: 'Remark deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete remark' });
  }
});

export default router;
