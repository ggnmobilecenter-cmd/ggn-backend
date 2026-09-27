import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { generateCode } from "../utils/generateCode";
import { requireAuth } from "../middleware/auth";

const router = Router();

const bookingSchema = z.object({
  category: z.enum(["MOBILE_REPAIR", "CCTV", "ELECTRONICS", "HVAC", "REFRIGERATOR", "FAN", "OTHER"]),
  name: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  serviceType: z.string().optional(),
  description: z.string().min(1),
  mediaUrls: z.array(z.string()).optional(),
});

// POST /api/service-requests  (public — from the website booking form)
router.post("/", async (req, res, next) => {
  try {
    const data = bookingSchema.parse(req.body);

    const customer = await prisma.customer.create({
      data: { name: data.name, phone: data.phone, email: data.email || undefined, address: data.address },
    });

    const request = await prisma.serviceRequest.create({
      data: {
        requestCode: generateCode("GGN"),
        customerId: customer.id,
        category: data.category,
        serviceType: data.serviceType,
        problemDesc: data.description,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : undefined,
        preferredTime: data.preferredTime,
        address: data.address,
        mediaUrls: data.mediaUrls || [],
      },
    });

    // TODO: trigger WhatsApp/SMS/email notification here (see notifications.md)
    res.status(201).json({ requestCode: request.requestCode, id: request.id });
  } catch (err) {
    next(err);
  }
});

// GET /api/service-requests  (admin — list/filter)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const requests = await prisma.serviceRequest.findMany({
      where: {
        status: status ? (status as any) : undefined,
        category: category ? (category as any) : undefined,
      },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/service-requests/:id  (admin — update status/notes/assignment)
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { status, notes, assignedTechId } = req.body;
    const updated = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status, notes, assignedTechId },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
