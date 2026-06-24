import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiOk, parseJsonBody } from "@/lib/api";
import {
  approveCashbackRedemption,
  rejectCashbackRedemption,
} from "@/lib/cashback-wallet";
import { Role } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const body = await parseJsonBody<{
    action: "approve" | "reject";
    paymentProof?: string;
    adminComment?: string;
    amazonCode?: string;
    rejectionReason?: string;
  }>(req);

  if (!body?.action) return apiError("Invalid request");

  try {
    if (body.action === "approve") {
      await approveCashbackRedemption(id, {
        paymentProof: body.paymentProof,
        adminComment: body.adminComment,
        amazonCode: body.amazonCode,
      });
      return apiOk({ message: "Redemption approved" });
    }

    if (body.action === "reject") {
      await rejectCashbackRedemption(
        id,
        body.rejectionReason ?? "Rejected by admin",
        body.adminComment
      );
      return apiOk({ message: "Redemption rejected and cashback refunded" });
    }

    return apiError("Unknown action");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 400);
  }
}
