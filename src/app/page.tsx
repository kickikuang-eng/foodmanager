export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Food Manager
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Smart Recipe & Inventory Management System
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Food Manager</h2>
            <p className="text-gray-600 mb-6">
              A comprehensive food management system featuring:
            </p>
            <ul className="text-left space-y-2 text-gray-600">
              <li>• Recipe scraping from YouTube, Instagram, and TikTok</li>
              <li>• Smart inventory tracking and expiry alerts</li>
              <li>• Meal planning and shopping list generation</li>
              <li>• Receipt scanning with OCR</li>
              <li>• Nutrition tracking and analysis</li>
            </ul>
            <div className="mt-8">
              <button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
