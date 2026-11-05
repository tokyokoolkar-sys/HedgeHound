-- DropForeignKey
ALTER TABLE "PaperOutcome" DROP CONSTRAINT "PaperOutcome_ticketId_fkey";

-- AddForeignKey
ALTER TABLE "PaperOutcome" ADD CONSTRAINT "PaperOutcome_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "PaperTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
