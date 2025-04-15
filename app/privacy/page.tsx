'use client';

import { motion } from 'framer-motion';
import PageHeader from '../components/layout/PageHeader';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information that you provide directly to us, including when you create an account, make a purchase, sign up for our newsletter, or contact us. This may include your name, email address, postal address, phone number, and payment information.`
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to process your orders, communicate with you, personalize your shopping experience, improve our services, and send you marketing communications (with your consent).`
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell your personal information to third parties. We may share your information with service providers who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.`
  },
  {
    title: '4. Data Security',
    content: `We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.`
  },
  {
    title: '5. Cookies and Tracking',
    content: `We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.`
  },
  {
    title: '6. Your Rights',
    content: `You have the right to access, correct, or delete your personal information. You may also object to or restrict certain processing of your information or request portability of your information.`
  },
  {
    title: "7. Children's Privacy",
    content: `Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.`
  },
  {
    title: '8. Changes to Privacy Policy',
    content: `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.`
  }
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Privacy Policy"
        subtitle="Your Privacy Matters to Us"
        backgroundImage="/images/privacy-header.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            className="mx-auto max-w-4xl"
          >
            <motion.div
              variants={fadeInUp}
              className="mb-12 rounded-lg bg-primary-50 p-6 text-primary-800"
            >
              <p className="text-sm">
                Last updated: {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="mt-2 text-sm">
                This Privacy Policy describes how Tresor Haute ("we," "us," or "our") collects, uses, and shares your personal information when you visit our website.
              </p>
            </motion.div>

            {sections.map((section) => (
              <motion.div
                key={section.title}
                variants={fadeInUp}
                className="mb-12 rounded-lg bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  {section.title}
                </h2>
                <p className="text-gray-600">{section.content}</p>
              </motion.div>
            ))}

            <motion.div
              variants={fadeInUp}
              className="mt-12 rounded-lg bg-gray-50 p-6 text-center"
            >
              <p className="text-sm text-gray-600">
                If you have any questions about our Privacy Policy, please{' '}
                <a
                  href="/contact"
                  className="text-primary-600 hover:text-primary-700"
                >
                  contact us
                </a>
                .
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 