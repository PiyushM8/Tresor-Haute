'use client';

import { motion } from 'framer-motion';
import PageHeader from '@/app/components/layout/PageHeader';
import Image from 'next/image';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="About Tresor Haute"
        subtitle="Crafting Luxury Experiences Since 2024"
        backgroundImage="/images/about-header.jpg"
      />

      {/* Mission Section */}
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
            className="grid gap-12 lg:grid-cols-2 lg:gap-16"
          >
            <motion.div variants={fadeInUp} className="relative h-[400px] lg:h-[600px]">
              <Image
                src="/images/about-mission.jpg"
                alt="Our Mission"
                fill
                className="rounded-lg object-cover"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="flex flex-col justify-center">
              <h2 className="mb-6 text-3xl font-bold text-gray-900 lg:text-4xl">
                Our Mission
              </h2>
              <p className="mb-8 text-lg text-gray-600">
                At Tresor Haute, we believe in the power of exceptional fashion to transform
                and inspire. Our mission is to bring the finest luxury fashion to discerning
                clients worldwide, curating collections that blend timeless elegance with
                contemporary innovation.
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-6">
                  <h3 className="mb-2 font-semibold text-gray-900">Quality First</h3>
                  <p className="text-gray-600">
                    We source only the finest materials and partner with renowned artisans.
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-6">
                  <h3 className="mb-2 font-semibold text-gray-900">Sustainability</h3>
                  <p className="text-gray-600">
                    Committed to ethical practices and environmental responsibility.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-12 text-3xl font-bold text-gray-900 lg:text-4xl"
            >
              Our Core Values
            </motion.h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: 'Excellence',
                  description: 'Striving for perfection in every detail',
                  icon: '✨'
                },
                {
                  title: 'Innovation',
                  description: 'Pushing boundaries in luxury fashion',
                  icon: '💡'
                },
                {
                  title: 'Integrity',
                  description: 'Honest and transparent in all we do',
                  icon: '🤝'
                },
                {
                  title: 'Community',
                  description: 'Building lasting relationships',
                  icon: '❤️'
                }
              ].map((value, index) => (
                <motion.div
                  key={value.title}
                  variants={fadeInUp}
                  className="rounded-lg bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 text-4xl">{value.icon}</div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
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
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-12 text-3xl font-bold text-gray-900 lg:text-4xl"
            >
              Meet Our Leadership
            </motion.h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: 'Sarah Johnson',
                  role: 'CEO & Founder',
                  image: '/images/team-1.jpg'
                },
                {
                  name: 'Michael Chen',
                  role: 'Creative Director',
                  image: '/images/team-2.jpg'
                },
                {
                  name: 'Emma Williams',
                  role: 'Head of Design',
                  image: '/images/team-3.jpg'
                }
              ].map((member, index) => (
                <motion.div
                  key={member.name}
                  variants={fadeInUp}
                  className="group relative overflow-hidden rounded-lg"
                >
                  <div className="relative h-[400px]">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute bottom-0 w-full p-6 text-white">
                      <h3 className="text-xl font-semibold">{member.name}</h3>
                      <p className="text-gray-300">{member.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 