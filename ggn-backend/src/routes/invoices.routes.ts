import { Router } from "express";
import { prisma } from "../config/db";
import { generateCode } from "../utils/generateCode";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { customerId, lineItems, discount = 0, tax = 0, paid = 0, paymentMethod } = req.body;
    const subtotal = (lineItems as any[]).reduce((sum, li) => sum + li.qty * li.unitPrice, 0);
    const total = subtotal - discount + tax;
    const due = total - paid;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateCode("GGN-INV"),
        customerId,
        lineItems,
        discount,
        tax,
        total,
        paid,
        due,
        paymentMethod,
      },
    });
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

export default router;
