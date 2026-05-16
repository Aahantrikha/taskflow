import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/attendance — get attendance records
// Admin: sees all | Others: see only their own
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'admin';
    const { date } = req.query;

    let where: any = {};
    if (!isAdmin) where.userId = req.user!.id;

    // Filter by date if provided
    if (date) {
      const d = new Date(String(date));
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      where.punchIn = { gte: start, lt: end };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
      orderBy: { punchIn: 'desc' },
      take: 100,
    });

    res.json(records.map(r => ({
      id: r.id,
      punchIn: r.punchIn,
      punchOut: r.punchOut,
      hours: r.hours,
      userId: r.userId,
      user: {
        id: r.user.id,
        name: r.user.name,
        avatar: r.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user.name)}&background=3b82f6&color=fff&size=100`,
        role: r.user.role,
      },
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// GET /api/attendance/status — check if user is currently punched in
router.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const active = await prisma.attendance.findFirst({
      where: { userId: req.user!.id, punchOut: null },
      orderBy: { punchIn: 'desc' },
    });
    res.json({ punchedIn: !!active, record: active ? { id: active.id, punchIn: active.punchIn } : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// POST /api/attendance/punch-in
router.post('/punch-in', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if already punched in
    const active = await prisma.attendance.findFirst({
      where: { userId: req.user!.id, punchOut: null },
    });
    if (active) {
      res.status(400).json({ error: 'Already punched in. Punch out first.' });
      return;
    }

    const record = await prisma.attendance.create({
      data: { userId: req.user!.id },
    });

    res.status(201).json({
      id: record.id,
      punchIn: record.punchIn,
      punchOut: null,
      hours: null,
      message: `Punched in at ${record.punchIn.toLocaleTimeString()}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to punch in' });
  }
});

// POST /api/attendance/punch-out
router.post('/punch-out', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const active = await prisma.attendance.findFirst({
      where: { userId: req.user!.id, punchOut: null },
      orderBy: { punchIn: 'desc' },
    });
    if (!active) {
      res.status(400).json({ error: 'Not punched in. Punch in first.' });
      return;
    }

    const punchOut = new Date();
    const diffMs = punchOut.getTime() - active.punchIn.getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    const record = await prisma.attendance.update({
      where: { id: active.id },
      data: { punchOut, hours },
    });

    res.json({
      id: record.id,
      punchIn: record.punchIn,
      punchOut: record.punchOut,
      hours: record.hours,
      message: `Punched out. You worked ${hours} hours today.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to punch out' });
  }
});

export default router;
