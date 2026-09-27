import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import serviceRequestRoutes from "./routes/serviceRequests.routes";
import cctvQuoteRoutes from "./routes/cctvQuotes.routes";
import jobCardRoutes from "./routes/jobCards.routes";
import inventoryRoutes from "./routes/inventory.routes";
import invoiceRoutes from "./routes/invoices.routes";
import contentRoutes from "./routes/content.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { errorHandler, notFound } from "./middleware/errorHandler";

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") || "*",
  })
);
app.use(express.json({ limit: "5mb" }));

// Basic rate limiting on public-facing form endpoints to reduce spam.
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api/service-requests", formLimiter);
app.use("/api/cctv-quotes", formLimiter);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/cctv-quotes", cctvQuoteRoutes);
app.use("/api/job-cards", jobCardRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api", contentRoutes); // /api/gallery, /api/reviews, /api/faqs
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GGN backend running on port ${PORT}`);
});
