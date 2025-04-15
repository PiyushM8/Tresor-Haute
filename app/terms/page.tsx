'use client';

import { motion } from 'framer-motion';
import PageHeader from '@/app/components/layout/PageHeader';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. Additionally, when using this website's particular services, you shall be subject to any posted guidelines or rules applicable to such services.`
  },
  {
    title: '2. Description of Service',
    content: `Tresor Haute provides users with access to luxury fashion products and related services. Any new features added to the current service shall also be subject to these Terms of Service. You understand and agree that the service is provided "as-is" and that Tresor Haute assumes no responsibility for the timeliness, deletion, mis-delivery, or failure to store any user communications or personalization settings.`
  },
  {
    title: '3. Registration Obligations',
    content: `In consideration of your use of the service, you agree to: (a) provide true, accurate, current, and complete information about yourself as prompted by the service's registration form and (b) maintain and promptly update the registration data to keep it true, accurate, current, and complete.`
  },
  {
    title: '4. Privacy Policy',
    content: `Your privacy is very important to us. Accordingly, we have developed this Privacy Policy in order for you to understand how we collect, use, communicate, and disclose personal information. Please see our Privacy Policy for detailed information.`
  },
  {
    title: '5. User Conduct',
    content: `You agree not to use the service to: (a) violate any applicable laws or regulations, (b) impersonate any person or entity, (c) interfere with or disrupt the service or servers, (d) collect or store personal data about other users without their express permission.`
  },
  {
    title: '6. Product Information',
    content: `While we strive to provide accurate product and pricing information, pricing or typographical errors may occur. Tresor Haute cannot confirm the price of an item until after you order. In the event that an item is listed at an incorrect price or with incorrect information due to an error in pricing or product information, Tresor Haute shall have the right to refuse or cancel any orders placed for that item.`
  },
  {
    title: '7. Shipping & Returns',
    content: `All orders are subject to our shipping and returns policy. Please review our shipping and returns policy before making a purchase. International customers are responsible for all duties, taxes, and customs charges.`
  },
  {
    title: '8. Modifications to Service',
    content: `Tresor Haute reserves the right at any time to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice. You agree that Tresor Haute shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the service.`
  }
];

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Terms of Service"
        subtitle="Please Read These Terms Carefully"
        backgroundImage="/images/terms-header.jpg"
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
                If you have any questions about these Terms of Service, please{' '}
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