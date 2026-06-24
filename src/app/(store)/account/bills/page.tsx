import { requireAuth } from "@/lib/session";

import { prisma } from "@/lib/prisma";

import { AccountShell } from "@/components/account/AccountShell";

import { AccountPageHeader } from "@/components/account/AccountPageHeader";

import { ClientBillsList } from "@/components/account/ClientBillsList";



export const metadata = { title: "My Bills" };



export default async function AccountBillsPage() {

  const session = await requireAuth();



  const bills = await prisma.clientBill.findMany({

    where: { clientId: session.user.id },

    orderBy: { billDate: "desc" },

  });



  return (

    <div className="max-w-6xl mx-auto px-4 py-8">

      <AccountPageHeader

        title="My Bills"

        subtitle="View and download original bills shared by your account manager"

      />

      <AccountShell>

        <ClientBillsList bills={bills} />

      </AccountShell>

    </div>

  );

}


