'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/app/components/layout/PageHeader';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const departments = [
  'All',
  'Design',
  'Technology',
  'Marketing',
  'Operations',
  'Customer Service'
];

const jobs = [
  {
    id: 1,
    title: 'Senior Fashion Designer',
    department: 'Design',
    location: 'Paris, France',
    type: 'Full-time',
    description: 'Join our creative team to design and develop luxury fashion collections.'
  },
  {
    id: 2,
    title: 'Full Stack Developer',
    department: 'Technology',
    location: 'Remote',
    type: 'Full-time',
    description: 'Help build and maintain our e-commerce platform and internal tools.'
  },
  {
    id: 3,
    title: 'Digital Marketing Manager',
    department: 'Marketing',
    location: 'London, UK',
    type: 'Full-time',
    description: 'Lead our digital marketing initiatives and brand strategy.'
  },
  {
    id: 4,
    title: 'Supply Chain Coordinator',
    department: 'Operations',
    location: 'Milan, Italy',
    type: 'Full-time',
    description: 'Manage relationships with suppliers and oversee logistics.'
  },
  {
    id: 5,
    title: 'Customer Experience Specialist',
    department: 'Customer Service',
    location: 'New York, USA',
    type: 'Full-time',
    description: 'Provide exceptional support to our luxury clientele.'
  }
];

export default function CareersPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  const filteredJobs = selectedDepartment === 'All'
    ? jobs
    : jobs.filter(job => job.department === selectedDepartment);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Join Our Team"
        subtitle="Shape the Future of Luxury Fashion"
        backgroundImage="/images/careers-header.jpg"
      />

      {/* Introduction */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-6 text-3xl font-bold text-gray-900 lg:text-4xl"
            >
              Why Join Tresor Haute?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-600">
              At Tresor Haute, we're building the future of luxury fashion. Join our
              team of passionate individuals who are committed to excellence,
              innovation, and creating exceptional experiences for our customers.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                title: 'Competitive Salary',
                description: 'Industry-leading compensation packages',
                icon: '💰'
              },
              {
                title: 'Growth Opportunities',
                description: 'Clear career progression paths',
                icon: '📈'
              },
              {
                title: 'Global Team',
                description: 'Work with talented people worldwide',
                icon: '🌍'
              },
              {
                title: 'Work-Life Balance',
                description: 'Flexible working arrangements',
                icon: '⚖️'
              }
            ].map((benefit) => (
              <motion.div
                key={benefit.title}
                variants={fadeInUp}
                className="rounded-lg bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 text-4xl">{benefit.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-12 text-center text-3xl font-bold text-gray-900 lg:text-4xl"
            >
              Open Positions
            </motion.h2>

            {/* Department Filter */}
            <motion.div variants={fadeInUp} className="mb-12">
              <div className="flex flex-wrap justify-center gap-4">
                {departments.map((department) => (
                  <button
                    key={department}
                    onClick={() => setSelectedDepartment(department)}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors
                      ${selectedDepartment === department
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {department}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Job Cards */}
            <motion.div
              variants={fadeInUp}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredJobs.map((job) => (
                <motion.div
                  key={job.id}
                  variants={fadeInUp}
                  className="group rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4">
                    <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-600">
                      {job.department}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    {job.title}
                  </h3>
                  <p className="mb-4 text-gray-600">{job.description}</p>
                  <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                  </div>
                  <button className="inline-flex items-center text-primary-600 transition-colors hover:text-primary-700">
                    Learn more
                    <svg
                      className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 