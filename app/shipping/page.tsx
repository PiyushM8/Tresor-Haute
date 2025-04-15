export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-offwhite pt-32 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Information</h1>
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Methods</h2>
            <p className="text-gray-600">
              We offer several shipping options to meet your needs:
            </p>
            <ul className="mt-4 space-y-4">
              <li>
                <h3 className="font-medium text-gray-900">Standard Shipping</h3>
                <p className="text-gray-600">3-5 business days - Free on orders over $100</p>
              </li>
              <li>
                <h3 className="font-medium text-gray-900">Express Shipping</h3>
                <p className="text-gray-600">1-2 business days - $15.00</p>
              </li>
              <li>
                <h3 className="font-medium text-gray-900">International Shipping</h3>
                <p className="text-gray-600">5-10 business days - Rates vary by destination</p>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Processing Time</h2>
            <p className="text-gray-600">
              Orders are typically processed within 1-2 business days. During peak seasons, processing may take longer.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tracking Information</h2>
            <p className="text-gray-600">
              Once your order has shipped, you will receive a tracking number via email. You can use this number to track your package on our website or the carrier's website.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Restrictions</h2>
            <p className="text-gray-600">
              Some items may have shipping restrictions based on your location. If you have any questions about shipping to your area, please contact our customer service team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 