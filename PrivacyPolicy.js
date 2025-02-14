import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const PrivacyPolicy = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-xl shadow-xl">
            <CardContent className="p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-red-900">Privacy Policy</h1>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg 
                    className="w-6 h-6 text-red-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </button>
              </div>

              {/* Effective Date */}
              <p className="text-red-600 mb-8">
                Effective Date: February 13, 2025
              </p>

              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-red-900 mb-4">Introduction</h2>
                <p className="text-red-700 leading-relaxed">
                  Knoc is a platform that connects users with shops around them. Users can submit product inquiries, 
                  and shops can respond to those inquiries. The app allows shops to register and provide their details, 
                  including their products and services.
                </p>
              </section>

              {/* Data Collection */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-red-900 mb-4">Data Collection and Usage</h2>
                <div className="space-y-4">
                  <div className="bg-red-50 p-6 rounded-xl">
                    <h3 className="font-medium text-red-900 mb-2">User Information We Collect:</h3>
                    <ul className="list-disc list-inside text-red-700 space-y-2">
                      <li>Full Name</li>
                      <li>Email Address</li>
                      <li>Contact Number</li>
                      <li>Location (for product inquiries)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 p-6 rounded-xl">
                    <h3 className="font-medium text-red-900 mb-2">Shop Information We Collect:</h3>
                    <ul className="list-disc list-inside text-red-700 space-y-2">
                      <li>Shop Name</li>
                      <li>Shop Images</li>
                      <li>Business Address</li>
                      <li>Owner's Name</li>
                      <li>Verification Photos</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Data Usage */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-red-900 mb-4">How We Use Your Data</h2>
                <div className="bg-white p-6 rounded-xl border-2 border-red-100">
                  <ul className="space-y-3 text-red-700">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      User identification and registration
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      Sending updates and notifications
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      Improving the service experience
                    </li>
                  </ul>
                </div>
              </section>

              {/* Data Retention */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-red-900 mb-4">Data Retention</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border-2 border-red-100">
                    <h3 className="font-medium text-red-900 mb-3">User Data Retention</h3>
                    <p className="text-red-700 mb-3">When user accounts are deleted:</p>
                    <div className="space-y-2">
                      <p className="text-red-600 text-sm">We retain (anonymized):</p>
                      <ul className="list-disc list-inside text-red-700 text-sm ml-2">
                        <li>Product inquiries</li>
                        <li>Category preferences</li>
                        <li>Search patterns</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl border-2 border-red-100">
                    <h3 className="font-medium text-red-900 mb-3">Shop Data Retention</h3>
                    <p className="text-red-700 mb-3">When shop accounts are deleted:</p>
                    <div className="space-y-2">
                      <p className="text-red-600 text-sm">We retain (anonymized):</p>
                      <ul className="list-disc list-inside text-red-700 text-sm ml-2">
                        <li>Category information</li>
                        <li>Location data</li>
                        <li>Market trends</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Image Privacy */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-red-900 mb-4">Image Privacy</h2>
                <div className="bg-red-50 p-6 rounded-xl text-red-700">
                  <p className="mb-4">Images captured or uploaded through the app:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      Are stored securely on our servers
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      Are only used for intended purposes
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      May be compressed for optimization
                    </li>
                  </ul>
                </div>
              </section>

              {/* Contact */}
              <section className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
                <p className="mb-2">
                  If you have any questions about our privacy policy, please contact us at:
                </p>
                <a 
                  href="mailto:contact@knoc.in"
                  className="text-white underline hover:text-red-100 transition-colors"
                >
                  contact@knoc.in
                </a>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
