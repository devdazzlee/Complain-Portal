'use client';

import React from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function HelpPage() {
  const faqs = [
    {
      question: 'How do I submit a new complaint?',
      answer: 'Click on the "New Complaint" button on your dashboard, fill in the required information including the caretaker name, type of problem, and description. You can also attach photos if needed.',
    },
    {
      question: 'How long does it take to resolve a complaint?',
      answer: 'Our staff will review your concern within 2-3 working days. You\'ll receive notifications about the status updates on your dashboard.',
    },
    {
      question: 'Can I track the status of my complaint?',
      answer: 'Yes! You can view all your complaints on the dashboard and click "View" to see detailed status, timeline, and compliance information.',
    },
    {
      question: 'What should I do if my complaint is refused?',
      answer: 'If your complaint is refused, you\'ll see the reasons why. You can review the refusal reasons and contact support if you have questions.',
    },
    {
      question: 'How do I export my complaint details?',
      answer: 'On the complaint detail page, click the "Export Compliance PDF" button. This will generate a printable PDF document with all complaint information.',
    },
  ];

  return (
    <Layout role="customer">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#E6E6E6' }}>Help & Support</h1>

        <div className="space-y-6 mb-8">
          <div className="rounded-lg p-6" style={{ backgroundColor: '#2A2B30' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b pb-4" style={{ borderColor: '#E6E6E6', borderWidth: '0 0 1px 0' }}>
                  <h3 className="font-semibold mb-2" style={{ color: '#2AB3EE', fontSize: '1.25rem' }}>
                    {faq.question}
                  </h3>
                  <p style={{ color: '#E6E6E6', fontSize: '1.125rem', lineHeight: '1.7' }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg p-6" style={{ backgroundColor: '#2A2B30' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#E6E6E6' }}>Contact Support</h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Email Support:</p>
                <a href="mailto:support@legacyverify.com" className="transition-colors" style={{ color: '#2AB3EE', fontSize: '1.125rem' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1F8FD0'} onMouseLeave={(e) => e.currentTarget.style.color = '#2AB3EE'}>
                  support@legacyverify.com
                </a>
              </div>
              <div>
                <p className="font-semibold mb-2" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Phone Support:</p>
                <a href="tel:+1-800-LEGACY" className="transition-colors" style={{ color: '#2AB3EE', fontSize: '1.125rem' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1F8FD0'} onMouseLeave={(e) => e.currentTarget.style.color = '#2AB3EE'}>
                  1-800-LEGACY (1-800-534-229)
                </a>
              </div>
              <div>
                <p className="font-semibold mb-2" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Hours:</p>
                <p style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Monday - Friday: 8:00 AM - 6:00 PM EST</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/customer/dashboard"
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

