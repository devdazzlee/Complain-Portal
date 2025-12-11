'use client';

import React from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <Layout role="provider">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#E6E6E6' }}>Privacy Policy</h1>

        <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#2A2B30' }}>
          <div className="space-y-6" style={{ color: '#E6E6E6', fontSize: '1.125rem', lineHeight: '1.8' }}>
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2AB3EE' }}>1. Information We Collect</h2>
              <p className="mb-3">
                We collect information that you provide directly to us, including your name, email address, and complaint details when you use our complaint portal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2AB3EE' }}>2. How We Use Your Information</h2>
              <p className="mb-3">
                We use the information we collect to process your complaints, communicate with you about your complaints, and improve our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2AB3EE' }}>3. Information Sharing</h2>
              <p className="mb-3">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only with authorized personnel involved in processing your complaint.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2AB3EE' }}>4. Data Security</h2>
              <p className="mb-3">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2AB3EE' }}>5. Your Rights</h2>
              <p className="mb-3">
                You have the right to access, update, or delete your personal information at any time by contacting our support team.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2AB3EE' }}>6. Contact Us</h2>
              <p className="mb-3">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mb-3">
                Email: <a href="mailto:privacy@legacyverify.com" className="transition-colors" style={{ color: '#2AB3EE' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1F8FD0'} onMouseLeave={(e) => e.currentTarget.style.color = '#2AB3EE'}>privacy@legacyverify.com</a>
              </p>
            </section>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/provider/dashboard"
            className="px-6 py-3 rounded-lg font-semibold transition-colors text-center"
            style={{ backgroundColor: '#2AB3EE', color: '#FFFFFF', fontSize: '1.125rem', minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F8FD0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2AB3EE'}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </Layout>
  );
}

