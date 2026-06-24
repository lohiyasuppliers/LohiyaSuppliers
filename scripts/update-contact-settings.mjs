/** Push latest contact/address defaults into platform settings. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SETTINGS = {
  business_name: "Lohiya Suppliers",
  business_gstin: "",
  business_state: "Rajasthan",
  business_address:
    "145 Ram Nagar Shopping Center, Shastri Nagar, Jaipur 302016, Rajasthan",
  allow_voucher_cashback_stack: "true",
  contact_email: "lohiyasuppliers@gmail.com",
  contact_phone: "7062099524 (Shivam), 9314526796 (Sunil)",
};

async function main() {
  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    console.log(`Updated ${key}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
