import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

function fmtAvatar(name: string, avatar: string | null) {
  return avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=100`;
}

// GET /api/users
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;
    const showAll = req.query.all === 'true';

    let users;

    if (showAll) {
      // Used by admin for task assignment — show all users
      users = await prisma.user.findMany({
        select: {
          id: true, name: true, email: true, avatar: true,
          role: true, jobTitle: true, createdAt: true,
        },
        orderBy: { name: 'asc' },
      });
    } else {
      // Team page — only show users who share a project with current user
      const sharedProjectIds = await prisma.projectMember.findMany({
        where: { userId: currentUserId },
        select: { projectId: true },
      });
      const projectIds = sharedProjectIds.map(p => p.projectId);

      const ownedProjects = await prisma.project.findMany({
        where: { creatorId: currentUserId },
        select: { id: true },
      });
      const allProjectIds = [...new Set([...projectIds, ...ownedProjects.map(p => p.id)])];

      let userIds: string[] = [currentUserId];

      if (allProjectIds.length > 0) {
        const projectMembers = await prisma.projectMember.findMany({
          where: { projectId: { in: allProjectIds } },
          select: { userId: true },
        });
        const projectCreators = await prisma.project.findMany({
          where: { id: { in: allProjectIds } },
          select: { creatorId: true },
        });
        userIds = [...new Set([
          currentUserId,
          ...projectMembers.map(m => m.userId),
          ...projectCreators.map(p => p.creatorId),
        ])];
      }

      users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true, name: true, email: true, avatar: true,
          role: true, jobTitle: true, createdAt: true,
        },
        orderBy: { name: 'asc' },
      });
    }

    // Get task counts separately
    const taskCounts = await prisma.task.groupBy({
      by: ['assigneeId'],
      _count: { assigneeId: true },
      where: { assigneeId: { not: null } },
    });
    const countMap: Record<string, number> = {};
    for (const t of taskCounts) {
      if (t.assigneeId) countMap[t.assigneeId] = t._count.assigneeId;
    }

    const completedCounts = await prisma.task.groupBy({
      by: ['assigneeId'],
      _count: { assigneeId: true },
      where: { assigneeId: { not: null }, status: 'done' },
    });
    const completedMap: Record<string, number> = {};
    for (const t of completedCounts) {
      if (t.assigneeId) completedMap[t.assigneeId] = t._count.assigneeId;
    }

    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: fmtAvatar(u.name, u.avatar),
      role: u.role,
      jobTitle: u.jobTitle,
      createdAt: u.createdAt,
      tasksAssigned: countMap[u.id] || 0,
      tasksCompleted: completedMap[u.id] || 0,
      status: 'online' as const,
      joinDate: u.createdAt.toISOString().split('T')[0],
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, avatar: true, role: true, jobTitle: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const assigned = await prisma.task.count({ where: { assigneeId: id } });
    const completed = await prisma.task.count({ where: { assigneeId: id, status: 'done' } });

    res.json({
      ...user,
      avatar: fmtAvatar(user.name, user.avatar),
      tasksAssigned: assigned,
      tasksCompleted: completed,
      status: 'online' as const,
      joinDate: user.createdAt.toISOString().split('T')[0],
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/users/:id/role — admin only, change user role
router.patch(
  '/:id/role',
  // Strict admin-only check (not project_lead)
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can change user roles' });
      return;
    }
    next();
  },
  [body('role').isIn(['admin', 'project_lead', 'quality_reviewer', 'tasker']).withMessage('Role must be admin, project_lead, quality_reviewer, or tasker')],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: errors.array()[0].msg }); return; }

    const id = String(req.params.id);
    const { role } = req.body;

    try {
      // Prevent admin from demoting themselves
      if (id === req.user!.id) {
        res.status(400).json({ error: 'You cannot change your own role' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, name: true, email: true, avatar: true, role: true, jobTitle: true, createdAt: true },
      });

      res.json({
        ...updated,
        avatar: fmtAvatar(updated.name, updated.avatar),
        status: 'online' as const,
        joinDate: updated.createdAt.toISOString().split('T')[0],
      });
    } catch {
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
);

export default router;
