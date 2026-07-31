import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { fetchDistinctProductBrands } from "@/lib/brands";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, categories, brandOptions] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: { variations: { orderBy: { sku: "asc" } } },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { parent: { select: { name: true } } },
    }),
    fetchDistinctProductBrands(),
  ]);

  if (!product) notFound();

  const initialVariations = product.variations.map((v) => ({
    id: v.id,
    sku: v.sku,
    label: v.label || "",
    attributes: v.attributes as Record<string, string>,
    priceRupees: v.defaultPricePaise != null ? (v.defaultPricePaise / 100).toString() : "",
    purchasePriceRupees:
      v.purchasePricePaise != null ? (v.purchasePricePaise / 100).toString() : "",
    purchasePriceDate:
      v.purchasePriceDate
        ? new Date(v.purchasePriceDate).toISOString().slice(0, 10)
        : "",
    imageUrl: v.imageUrl || "",
    isActive: v.isActive,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      <ProductForm
        categories={categories}
        initialData={product}
        initialVariations={initialVariations}
        brandOptions={brandOptions}
      />
    </div>
  );
}
