/**
 * One-time migration: fixes seeded billing data.
 *
 * Problems fixed:
 *  1. All FAC docs have paymentStatus "pagado" (invalid UI value) → "hecho"
 *  2. Active projects have all invoices fully covered by receipts → saldoPendiente = 0
 *
 * Fix applied:
 *  - "pagado" → "hecho" on every FAC doc
 *  - For active projects, the tranche-2 FAC is set to "pendiente"
 *    and its corresponding REC is deleted so saldoPendiente > 0
 */

import "dotenv/config";
import mongoose from "mongoose";
import DocumentModel from "../models/Document.js";
import ProjectModel from "../models/Project.js";
import { env } from "../config/env.js";

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // 1. Rename "pagado" → "hecho" on all FAC docs
  const renamed = await DocumentModel.updateMany(
    { templateId: "fac", "fields.paymentStatus": "pagado" },
    { $set: { "fields.paymentStatus": "hecho" } }
  );
  console.log(`Updated ${renamed.modifiedCount} FAC docs: "pagado" → "hecho"`);

  // 2. For each active project, find the tranche-2 FAC and its paired REC
  const activeProjects = await ProjectModel.find({ status: "activo" }).lean();
  console.log(`Found ${activeProjects.length} active projects`);

  let facPending = 0;
  let recRemoved = 0;

  for (const project of activeProjects) {
    const pid = String(project._id);

    // Find FAC docs for this project, sorted oldest-first
    const facs = await DocumentModel.find({ projectId: pid, templateId: "fac" })
      .sort({ createdAt: 1 })
      .lean();

    if (facs.length < 2) continue; // no tranche 2 to fix

    const fac2 = facs[1]!; // second FAC = tranche 2

    // Mark tranche-2 FAC as pendiente
    await DocumentModel.updateOne(
      { _id: fac2._id },
      { $set: { "fields.paymentStatus": "pendiente" } }
    );
    facPending++;

    // Find and delete the matching REC (tranche 2 ≈ second REC by creation date)
    const recs = await DocumentModel.find({ projectId: pid, templateId: "rec" })
      .sort({ createdAt: 1 })
      .lean();

    if (recs.length >= 2) {
      const rec2 = recs[1]!;
      await DocumentModel.deleteOne({ _id: rec2._id });
      recRemoved++;
    }
  }

  console.log(`Set ${facPending} FAC docs to "pendiente"`);
  console.log(`Removed ${recRemoved} paired REC docs`);

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
