'use client';

import { motion } from 'framer-motion';
import PageHeader from '@/app/components/layout/PageHeader';
import Image from 'next/image';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const timeline = [
  {
    year: '2020',
    title: 'The Beginning',
    description: 'Founded with a vision to revolutionize luxury fashion retail.',
    image: '/images/story-1.jpg'
  },
  {
    year: '2021',
    title: 'Digital Innovation',
    description: 'Launched our cutting-edge e-commerce platform.',
    image: '/images/story-2.jpg'
  },
  {
    year: '2022',
    title: 'Global Expansion',
    description: 'Expanded our presence to major fashion capitals worldwide.',
    image: '/images/story-3.jpg'
  },
  {
    year: '2023',
    title: 'Sustainability Initiative',
    description: 'Introduced our eco-friendly collection and sustainable practices.',
    image: '/images/story-4.jpg'
  },
  {
    year: '2024',
    title: 'The Future',
    description: 'Continuing to innovate and shape the future of luxury fashion.',
    image: '/images/story-5.jpg'
  }
];

export default function OurStoryPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Our Story"
        subtitle="A Journey of Passion and Innovation"
        backgroundImage="/images/story-header.jpg"
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
            <motion.p variants={fadeInUp} className="text-lg text-gray-600 lg:text-xl">
              Tresor Haute was born from a simple yet powerful idea: to create a luxury
              fashion destination that combines timeless elegance with modern innovation.
              Our journey has been one of passion, perseverance, and unwavering
              commitment to excellence.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
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
          >
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                variants={fadeInUp}
                className="relative mb-16 last:mb-0"
              >
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
                  <div className={`flex flex-col justify-center ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div className="relative">
                      <span className="mb-4 inline-block text-5xl font-bold text-primary-600">
                        {item.year}
                      </span>
                      <h2 className="mb-4 text-3xl font-bold text-gray-900">
                        {item.title}
                      </h2>
                      <p className="text-lg text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className={`relative h-[300px] lg:h-[400px] ${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="rounded-lg object-cover shadow-lg"
                    />
                  </div>
                </div>
                {index !== timeline.length - 1 && (
                  <div className="absolute left-1/2 h-16 w-px -translate-x-1/2 bg-gray-200" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Vision for the Future */}
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
              className="mb-8 text-3xl font-bold text-gray-900 lg:text-4xl"
            >
              Our Vision for the Future
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-600">
              As we look to the future, we remain committed to pushing the boundaries
              of luxury fashion. Our vision is to continue creating exceptional
              experiences that inspire and delight our customers while maintaining our
              commitment to sustainability and innovation.
            </motion.p>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 