import { Router } from "express";
import { prisma } from "../config/db";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ---- Gallery ----
router.get("/gallery", async (req, res, next) => {
  try {
    const { category } = req.query;
    const images = await prisma.galleryImage.findMany({
      where: { category: category ? String(category) : undefined },
      orderBy: { createdAt: "desc" },
    });
    res.json(images);
  } catch (err) {
    next(err);
  }
});
router.post("/gallery", requireAuth, async (req, res, next) => {
  try {
    const image = await prisma.galleryImage.create({ data: req.body });
    res.status(201).json(image);
  } catch (err) {
    next(err);
  }
});
router.delete("/gallery/:id", requireAuth, async (req, res, next) => {
  try {
    await prisma.galleryImage.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---- Reviews ---- (public submit, but hidden until admin marks visible=true)
router.get("/reviews", async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { visible: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});
router.post("/reviews", async (req, res, next) => {
  try {
    const { customerName, rating, reviewText } = req.body;
    const review = await prisma.review.create({
      data: { customerName, rating, reviewText, visible: false, verified: false },
    });
    res.status(201).json({ message: "Thank you — your review is pending approval.", id: review.id });
  } catch (err) {
    next(err);
  }
});
router.patch("/reviews/:id", requireAuth, async (req, res, next) => {
  try {
    const review = await prisma.review.update({ where: { id: req.params.id }, data: req.body });
    res.json(review);
  } catch (err) {
    next(err);
  }
});

// ---- FAQ ----
router.get("/faqs", async (req, res, next) => {
  try {
    const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });
    res.json(faqs);
  } catch (err) {
    next(err);
  }
});
router.post("/faqs", requireAuth, async (req, res, next) => {
  try {
    const faq = await prisma.faq.create({ data: req.body });
    res.status(201).json(faq);
  } catch (err) {
    next(err);
  }
});
router.patch("/faqs/:id", requireAuth, async (req, res, next) => {
  try {
    const faq = await prisma.faq.update({ where: { id: req.params.id }, data: req.body });
    res.json(faq);
  } catch (err) {
    next(err);
  }
});
router.delete("/faqs/:id", requireAuth, async (req, res, next) => {
  try {
    await prisma.faq.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
