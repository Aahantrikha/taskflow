import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/dashboard — aggregated stats
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = ['admin', 'project_lead'].includes(req.user!.role);
    const canSeeAll = ['admin', 'project_lead', 'quality_reviewer'].includes(req.user!.role);
    const userId = req.user!.id;
    const now = new Date();

    // Task filter: admin/project_lead/reviewer sees all, tasker sees own
    const taskWhere = canSeeAll ? {} : { assigneeId: userId };

    const [
      totalTasks,
      tasksByStatus,
      overdueTasks,
      totalProjects,
      totalMembers,
      recentActivities,
      tasksByUser,
    ] = await Promise.all([
      // Total tasks
      prisma.task.count({ where: taskWhere }),

      // Tasks by status
      prisma.task.groupBy({
        by: ['status'],
        where: taskWhere,
        _count: { status: true },
      }),

      // Overdue tasks (past due date, not done)
      prisma.task.count({
        where: {
          ...taskWhere,
          dueDate: { lt: now },
          status: { not: 'done' },
        },
      }),

      // Active projects
      prisma.project.count({
        where: isAdmin
          ? { status: 'active' }
          : { status: 'active', members: { some: { userId } } },
      }),

      // Total team members (admin only)
      isAdmin ? prisma.user.count() : Promise.resolve(0),

      // Recent activities (last 10)
      prisma.activity.findMany({
        where: isAdmin ? {} : { userId },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Tasks per user (admin only)
      isAdmin
        ? prisma.task.groupBy({
            by: ['assigneeId'],
            _count: { assigneeId: true },
            where: { assigneeId: { not: null } },
          })
        : Promise.resolve([]),
    ]);

    // Format tasks by status into a map
    const statusMap: Record<string, number> = {};
    for (const s of tasksByStatus) {
      statusMap[s.status] = s._count.status;
    }

    // Format tasks per user (admin only)
    let tasksPerUser: { userId: string; name: string; count: number }[] = [];
    if (isAdmin && Array.isArray(tasksByUser) && tasksByUser.length > 0) {
      const userIds = tasksByUser.map(t => t.assigneeId).filter(Boolean) as string[];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      });
      const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
      tasksPerUser = tasksByUser.map(t => ({
        userId: t.assigneeId!,
        name: userMap[t.assigneeId!] || 'Unknown',
        count: t._count.assigneeId,
      }));
    }

    res.json({
      totalTasks,
      completedTasks: statusMap['done'] || 0,
      inProgressTasks: statusMap['in_progress'] || 0,
      todoTasks: statusMap['todo'] || 0,
      backlogTasks: statusMap['backlog'] || 0,
      inReviewTasks: statusMap['in_review'] || 0,
      overdueTasks,
      totalProjects,
      totalMembers,
      tasksByStatus: statusMap,
      tasksPerUser,
      recentActivities: recentActivities.map(a => ({
        id: a.id,
        action: a.action,
        target: a.target,
        type: a.type,
        createdAt: a.createdAt,
        user: {
          id: a.user.id,
          name: a.user.name,
          avatar: a.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.user.name)}&background=3b82f6&color=fff&size=100`,
        },
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
