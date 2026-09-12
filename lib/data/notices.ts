import { z } from "zod";
import { listClinicData, saveClinicData } from "@/lib/clinic-db";

export const noticeSchema = z.object({
  id: z.string(),
  type: z.enum(["appointment-confirmed", "reminder", "schedule-change", "cancelled", "broadcast"]),
  title: z.string().min(1),
  text: z.string().min(1),
  patientEmail: z.string().email().optional(),
  doctor: z.string().optional(),
  actionLabel: z.string().optional(),
  requiresAck: z.boolean(),
  acknowledged: z.boolean().default(false),
  publishAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional()
});

export type ClinicNotice = z.infer<typeof noticeSchema>;

export async function listPatientNotices(email: string) {
  const records = await listClinicData<unknown>("notices");
  const now = Date.now();
  return records.flatMap((record) => {
    const result = noticeSchema.safeParse(record);
    if (!result.success) return [];
    const notice = result.data;
    if (notice.patientEmail && notice.patientEmail !== email) return [];
    if (new Date(notice.publishAt).getTime() > now) return [];
    if (notice.expiresAt && new Date(notice.expiresAt).getTime() < now) return [];
    return [notice];
  });
}

export async function acknowledgeNotice(notice: ClinicNotice) {
  const updated = noticeSchema.parse({ ...notice, acknowledged: true });
  await saveClinicData("notices", updated.id, updated);
  return updated;
}
