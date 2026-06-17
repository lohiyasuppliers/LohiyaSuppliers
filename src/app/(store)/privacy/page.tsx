export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <div className="prose prose-gray max-w-none space-y-4 text-gray-600 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        <p>Lohiya Suppliers (&quot;we&quot;, &quot;our&quot;) respects your privacy. This policy explains how we collect, use, and protect your information when you use our B2B e-commerce platform.</p>
        <h2 className="text-lg font-bold text-gray-900 pt-4">Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Account details: name, email, phone, company name, GST number</li>
          <li>Order and shipping information</li>
          <li>Inquiry and contact form submissions</li>
          <li>Newsletter subscription email addresses</li>
        </ul>
        <h2 className="text-lg font-bold text-gray-900 pt-4">How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Process and fulfill B2B orders</li>
          <li>Generate GST invoices and shipping documents</li>
          <li>Respond to bulk order and repair service inquiries</li>
          <li>Send order confirmations and business communications</li>
        </ul>
        <h2 className="text-lg font-bold text-gray-900 pt-4">Data Security</h2>
        <p>We use industry-standard security measures including encrypted connections for payment and account data. Passwords are securely hashed and never stored in plain text.</p>
        <h2 className="text-lg font-bold text-gray-900 pt-4">Contact</h2>
        <p>For privacy-related questions, contact us at <a href="mailto:info@lohiyasuppliers.com" className="text-brand-600">info@lohiyasuppliers.com</a>.</p>
      </div>
    </div>
  );
}
