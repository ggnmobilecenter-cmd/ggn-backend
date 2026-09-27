import { Router } from "express";
import { prisma } from "../config/db";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// GET /api/dashboard/summary — powers the admin dashboard cards
router.get("/summary", async (req, res, next) => {
  try {
    const [newRequests, pendingRepairs, readyDevices, cctvRequests, pendingQuotations, completedJobs] =
      await Promise.all([
        prisma.serviceRequest.count({ where: { status: "NEW" } }),
        prisma.jobCard.count({ where: { status: { in: ["RECEIVED", "DIAGNOSIS", "WAITING_FOR_PARTS", "UNDER_REPAIR", "TESTING"] } } }),
        prisma.jobCard.count({ where: { status: "READY" } }),
        prisma.cctvQuoteRequest.count({ where: { status: "NEW" } }),
        prisma.cctvQuoteRequest.count({ where: { quotation: null } }),
        prisma.jobCard.count({ where: { status: "DELIVERED" } }),
      ]);

    res.json({
      newRequests,
      pendingRepairs,
      readyDevices,
      cctvRequests,
      pendingQuotations,
      completedJobs,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
