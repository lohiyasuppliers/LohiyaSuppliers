export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
      <div className="prose prose-gray max-w-none space-y-4 text-gray-600 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        <p>By using the Lohiya Suppliers website and placing orders, you agree to these terms governing our B2B industrial supplies business.</p>
        <h2 className="text-lg font-bold text-gray-900 pt-4">Products & Pricing</h2>
        <p>All prices are listed in INR and are subject to change. Bulk pricing is available on request. Product specifications are provided for industrial use — please verify compatibility before ordering.</p>
        <h2 className="text-lg font-bold text-gray-900 pt-4">Orders & Payment</h2>
        <p>Orders are confirmed upon payment verification. We accept UPI, bank transfer, COD (for approved B2B accounts), and card payments. GST invoices are provided for registered business accounts.</p>
        <h2 className="text-lg font-bold text-gray-900 pt-4">Shipping</h2>
        <p>We ship across India with worldwide shipping available for bulk orders. Delivery timelines depend on product availability and destination. Free shipping applies above the threshold shown at checkout.</p>
        <h2 className="text-lg font-bold text-gray-900 pt-4">Returns & Repairs</h2>
        <p>Defective products may be returned within 7 days of delivery. Book repair and bandsaw sharpening services are governed by separate service agreements communicated at inquiry.</p>
        <h2 className="text-lg font-bold text-gray-900 pt-4">Contact</h2>
        <p>Questions about these terms? Reach us at <a href="/contact" className="text-brand-600">our contact page</a>.</p>
      </div>
    </div>
  );
}
