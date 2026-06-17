import { PrismaClient, Role, CategoryType, ApplicationType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_PLATFORM_SETTINGS, PRODUCT_LEVEL_VARIATION_ID } from "../src/lib/constants";
import { rupeesToPaise } from "../src/lib/money";
import { CATALOG } from "./catalog-data";

const prisma = new PrismaClient();

async function seedUsers() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  const clientPassword = await bcrypt.hash("client123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@lohiyasuppliers.com" },
    update: { role: Role.ADMIN, isActive: true },
    create: {
      email: "admin@lohiyasuppliers.com",
      name: "Platform Admin",
      password: adminPassword,
      role: Role.ADMIN,
      phone: "+91 98765 43210",
    },
  });

  const clientA = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: { role: Role.CLIENT, isActive: true },
    create: {
      email: "client@example.com",
      name: "Rajesh Kumar",
      password: clientPassword,
      role: Role.CLIENT,
      phone: "+91 91234 56789",
      clientProfile: {
        create: {
          company: "Kumar Woodworks Pvt Ltd",
          gstin: "27AABCU9603R1ZM",
          billingState: "Maharashtra",
          address: "Plot 42, MIDC Industrial Area",
          city: "Nagpur",
          pincode: "440016",
        },
      },
    },
  });

  const clientB = await prisma.user.upsert({
    where: { email: "metalworks@example.com" },
    update: { role: Role.CLIENT, isActive: true },
    create: {
      email: "metalworks@example.com",
      name: "Amit Sharma",
      password: clientPassword,
      role: Role.CLIENT,
      phone: "+91 99887 76655",
      clientProfile: {
        create: {
          company: "Sharma Metal Industries",
          gstin: "09AAECS1234F1Z5",
          billingState: "Uttar Pradesh",
          address: "Sector 12, Industrial Estate",
          city: "Ghaziabad",
          pincode: "201001",
        },
      },
    },
  });

  for (const user of [clientA, clientB]) {
    await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        company:
          user.email === "client@example.com"
            ? "Kumar Woodworks Pvt Ltd"
            : "Sharma Metal Industries",
        billingState: user.email === "client@example.com" ? "Maharashtra" : "Uttar Pradesh",
      },
    });
  }

  for (const [key, value] of Object.entries(DEFAULT_PLATFORM_SETTINGS)) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return { admin, clientA, clientB };
}

async function clearCatalog() {
  await prisma.clientPriceOverride.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
}

async function seedCatalog() {
  let productCount = 0;
  let variationCount = 0;

  for (const dept of CATALOG) {
    const department = await prisma.category.create({
      data: {
        name: dept.name,
        slug: dept.slug,
        description: dept.description,
        type: CategoryType.PRODUCT,
        application: dept.application as ApplicationType,
        imageUrl: dept.imageUrl,
        sortOrder: dept.sortOrder,
        isActive: true,
      },
    });

    for (const sub of dept.subcategories) {
      const subcategory = await prisma.category.create({
        data: {
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          type: CategoryType.PRODUCT,
          application: dept.application as ApplicationType,
          parentId: department.id,
          imageUrl: sub.imageUrl,
          sortOrder: sub.sortOrder,
          isActive: true,
        },
      });

      for (const item of sub.products) {
        const product = await prisma.product.create({
          data: {
            name: item.name,
            slug: item.slug,
            brand: item.brand,
            description: item.description,
            hsnCode: item.hsnCode,
            gstRateBps: 1800,
            defaultPricePaise: rupeesToPaise(item.basePriceRupees),
            images: JSON.stringify(item.images),
            categoryId: subcategory.id,
            isActive: true,
          },
        });
        productCount++;

        const brandPrefix = item.brand.toUpperCase().replace(/\s/g, "").slice(0, 4);
        const slugPart = item.slug.toUpperCase().replace(/-/g, "").slice(0, 12);
        for (const v of item.variations) {
          const sku = `${brandPrefix}-${slugPart}-${v.skuSuffix}`;
          await prisma.productVariation.create({
            data: {
              productId: product.id,
              sku,
              attributes: v.attributes,
              defaultPricePaise: rupeesToPaise(item.basePriceRupees + v.priceOffsetRupees),
              imageUrl: item.images[0],
              isActive: true,
            },
          });
          variationCount++;
        }
      }
    }
  }

  return { productCount, variationCount };
}

async function seedSamplePricing(clientAId: string) {
  const bleed = await prisma.product.findFirst({
    where: { slug: "deerfros-inox-cutting-disc" },
    include: { variations: true },
  });
  if (!bleed) return;

  const variation = bleed.variations[0];
  if (variation) {
    await prisma.clientPriceOverride.upsert({
      where: {
        clientId_productId_variationId: {
          clientId: clientAId,
          productId: bleed.id,
          variationId: variation.id,
        },
      },
      update: { pricePaise: rupeesToPaise(75) },
      create: {
        clientId: clientAId,
        productId: bleed.id,
        variationId: variation.id,
        pricePaise: rupeesToPaise(75),
      },
    });
  }

  await prisma.clientPriceOverride.upsert({
    where: {
      clientId_productId_variationId: {
        clientId: clientAId,
        productId: bleed.id,
        variationId: PRODUCT_LEVEL_VARIATION_ID,
      },
    },
    update: { pricePaise: rupeesToPaise(78) },
    create: {
      clientId: clientAId,
      productId: bleed.id,
      variationId: PRODUCT_LEVEL_VARIATION_ID,
      pricePaise: rupeesToPaise(78),
    },
  });
}

async function main() {
  console.log("🌱 Seeding Lohiya Suppliers catalog...");

  const { admin, clientA } = await seedUsers();
  await clearCatalog();
  const { productCount, variationCount } = await seedCatalog();
  await seedSamplePricing(clientA.id);

  const subcategoryCount = CATALOG.reduce((n, d) => n + d.subcategories.length, 0);

  console.log("✅ Seed completed!");
  console.log(`   Admin:  admin@lohiyasuppliers.com / admin123`);
  console.log(`   Client: client@example.com / client123`);
  console.log(`   Client: metalworks@example.com / client123`);
  console.log(`   Departments: ${CATALOG.length} (Metal + Wood)`);
  console.log(`   Subcategories: ${subcategoryCount}`);
  console.log(`   Products: ${productCount}`);
  console.log(`   Variations: ${variationCount}`);
  console.log(`   Brands: Deerfros, Leitz, AIPL`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
