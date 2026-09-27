import { Router } from "express";
import { prisma } from "../config/db";
import { generateCode } from "../utils/generateCode";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth); // job cards are internal/admin only

// GET /api/job-cards?status=UNDER_REPAIR
router.get("/", async (req, res, next) => {
  try {
    const { status } = req.query;
    const jobs = await prisma.jobCard.findMany({
      where: { status: status ? (status as any) : undefined },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// POST /api/job-cards  (create from a service request, or walk-in)
router.post("/", async (req, res, next) => {
  try {
    const {
      customerId,
      serviceRequestId,
      deviceBrand,
      deviceModel,
      imei,
      deviceColor,
      accessoriesReceived,
      customerComplaint,
      physicalCondition,
      estimatedCost,
      advancePayment,
      expectedDelivery,
    } = req.body;

    const job = await prisma.jobCard.create({
      data: {
        jobCode: generateCode("GGN-JOB"),
        customerId,
        serviceRequestId,
        deviceBrand,
        deviceModel,
        imei,
        deviceColor,
        accessoriesReceived,
        customerComplaint,
        physicalCondition,
        estimatedCost,
        advancePayment,
        remainingAmount:
          estimatedCost && advancePayment ? estimatedCost - advancePayment : undefined,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined,
      },
    });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/job-cards/:id  (update status, notes, delivery)
router.patch("/:id", async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.status === "DELIVERED" && !data.dateDelivered) {
      data.dateDelivered = new Date();
    }
    const job = await prisma.jobCard.update({ where: { id: req.params.id }, data });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

export default router;
