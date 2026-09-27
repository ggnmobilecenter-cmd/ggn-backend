import { Router } from "express";
import { prisma } from "../config/db";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.inventoryItem.findMany({ orderBy: { productName: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const item = await prisma.inventoryItem.create({ data: req.body });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const item = await prisma.inventoryItem.update({ where: { id: req.params.id }, data: req.body });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.inventoryItem.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/low-stock — items at or below their minimum stock level
router.get("/alerts/low-stock", async (req, res, next) => {
  try {
    const items = await prisma.inventoryItem.findMany();
    const low = items.filter((i) => i.stock <= i.minimumStock);
    res.json(low);
  } catch (err) {
    next(err);
  }
});

export default router;
