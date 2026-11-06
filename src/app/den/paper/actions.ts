"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { paperTicketSchema } from "@/lib/schemas/paper-ticket";

export type TicketFormState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

function readTicket(formData: FormData) {
  return {
    symbol: String(formData.get("symbol") ?? ""),
    side: String(formData.get("side") ?? ""),
    notionalUsd: Number(formData.get("notionalUsd")),
    leverage: Number(formData.get("leverage")),
    holdHours: Number(formData.get("holdHours")),
    note: String(formData.get("note") ?? ""),
    confirmPaper: formData.get("confirmPaper"),
  };
}

export async function ubahTiket(
  id: string,
  _state: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  try {
    const parsed = paperTicketSchema.safeParse(readTicket(formData));
    if (!parsed.success) {
      return {
        message: "Periksa kembali isian.",
        errors: z.flattenError(parsed.error).fieldErrors,
      };
    }

    const { confirmPaper: _confirm, note, ...fields } = parsed.data;

    await prisma.paperTicket.update({
      where: { id },
      data: { ...fields, note: note ? note : null },
    });

    revalidatePath("/den/paper");
    revalidatePath(`/den/paper/${id}`);
    return { message: "Perubahan disimpan." };
  } catch {
    return { message: "Gagal menyimpan." };
  }
}

export async function hapusTiket(
  id: string,
  _state: TicketFormState,
  _formData: FormData,
): Promise<TicketFormState> {
  try {
    await prisma.paperTicket.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return {
        message: "Tiket ini punya catatan hasil. Hapus catatannya dulu.",
      };
    }
    throw error;
  }

  revalidatePath("/den/paper");
  redirect("/den/paper");
}

export async function tambahCatatan(
  ticketId: string,
  _state: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const note = String(formData.get("catatan") ?? "").trim();

  if (note.length < 3) {
    return { message: "Catatan minimal 3 karakter." };
  }

  await prisma.paperOutcome.upsert({
    where: { ticketId },
    update: { note },
    create: { ticketId, status: "open", note, openedAt: new Date() },
  });

  revalidatePath(`/den/paper/${ticketId}`);
  return { message: "Catatan disimpan." };
}
