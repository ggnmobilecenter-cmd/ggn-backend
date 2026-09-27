import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { generateCode } from "../utils/generateCode";
import { requireAuth } from "../middleware/auth";

const router = Router();

const cctvSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(7),
  location: z.string().min(1),
  propertyType: z.enum(["HOME", "SHOP", "SCHOOL", "OFFICE", "FACTORY", "OTHER"]).default("HOME"),
  cameraCount: z.number().int().min(1),
  cameraType: z.enum(["ANALOG", "IP", "DOME", "BULLET", "PTZ"]).default("DOME"),
  recording: z.enum(["DVR", "NVR"]).default("DVR"),
  storage: z.string().min(1),
  addons: z.array(z.string()).optional(),
});

// POST /api/cctv-quotes  (public — from the website CCTV quotation form)
router.post("/", async (req, res, next) => {
  try {
    const data = cctvSchema.parse(req.body);

    const customer = await prisma.customer.create({
      data: { name: data.name, phone: data.phone, address: data.location },
    });

    const request = await prisma.cctvQuoteRequest.create({
      data: {
        requestCode: generateCode("GGN-CCTV"),
        customerId: customer.id,
        location: data.location,
        propertyType: data.propertyType,
        cameraCount: data.cameraCount,
        cameraType: data.cameraType,
        recording: data.recording,
        storage: data.storage,
        addons: data.addons || [],
      },
    });

    res.status(201).json({ requestCode: request.requestCode, id: request.id });
  } catch (err) {
    next(err);
  }
});

// GET /api/cctv-quotes  (admin)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const requests = await prisma.cctvQuoteRequest.findMany({
      include: { customer: true, quotation: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// POST /api/cctv-quotes/:id/quotation  (admin — prepare formal quotation)
router.post("/:id/quotation", requireAuth, async (req, res, next) => {
  try {
    const { lineItems, subtotal, discount, vat, total, validUntil, preparedBy } = req.body;
    const quotation = await prisma.quotation.create({
      data: {
        quotationCode: generateCode("GGN-QT"),
        cctvRequestId: req.params.id,
        lineItems,
        subtotal,
        discount: discount || 0,
        vat: vat || 0,
        total,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        preparedBy,
      },
    });
    res.status(201).json(quotation);
  } catch (err) {
    next(err);
  }
});

export default router;
