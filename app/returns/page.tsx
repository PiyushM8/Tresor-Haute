export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-offwhite pt-32 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Returns Policy</h1>
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Return Eligibility</h2>
            <p className="text-gray-600">
              We accept returns within 30 days of the purchase date. Items must be unused, in their original packaging, and in the same condition as when you received them.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Return</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Contact our customer service team to initiate a return</li>
              <li>Pack the item securely in its original packaging</li>
              <li>Include the original receipt or order confirmation</li>
              <li>Ship the package to our returns address</li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Refund Process</h2>
            <p className="text-gray-600">
              Once we receive your return, we will inspect the item and process your refund within 5-7 business days. Refunds will be issued to the original payment method.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Non-Returnable Items</h2>
            <p className="text-gray-600">
              The following items are not eligible for return:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Items marked as "Final Sale"</li>
              <li>Personalized or custom-made items</li>
              <li>Items that have been used or damaged</li>
              <li>Items without original packaging</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about our returns policy, please contact our customer service team at support@tresorhaute.com or call us at (555) 123-4567.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 