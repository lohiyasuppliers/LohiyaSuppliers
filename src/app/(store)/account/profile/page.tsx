import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ProfileEditForm } from "@/components/account/ProfileEditForm";

export const metadata = { title: "Company Profile" };

export default async function AccountProfilePage() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { clientProfile: true },
  });
  if (!user) return null;

  const p = user.clientProfile;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AccountPageHeader
        title="Company Profile"
        subtitle="Update your business details for billing and order processing"
      />
      <AccountShell>
        <ProfileEditForm
            initial={{
              name: user.name || "",
              email: user.email,
              company: p?.company || "",
              phone: user.phone || "",
              gstin: p?.gstin || "",
              billingState: p?.billingState || "Maharashtra",
              address: p?.address || "",
              city: p?.city || "",
              pincode: p?.pincode || "",
            }}
          />
      </AccountShell>
    </div>
  );
}
