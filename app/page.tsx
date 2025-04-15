'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

export default function Home() {
  const sections = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active')
          }
        })
      },
      { threshold: 0.1 }
    )

    sections.current.forEach((section) => {
      observer.observe(section)
    })

    return () => {
      sections.current.forEach((section) => {
        observer.unobserve(section)
      })
    }
  }, [])

  const addToRefs = (el: HTMLDivElement | null, index: number) => {
    if (el) {
      sections.current[index] = el
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[100vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.jpg"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center text-white px-4"
        >
          <h1 className="text-5xl md:text-7xl font-cormorant font-light mb-4 text-gold-200">
            Tresor Haute
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gold-100 font-cormorant font-light">
            Discover Luxury Fashion & Accessories
          </p>
          <Link
            href="/shop"
            className="bg-gold-500 text-white px-8 py-3 rounded-full hover:bg-gold-600 transition-all duration-300"
          >
            Shop Now
          </Link>
        </motion.div>
      </section>

      {/* Featured Collections */}
      <section className="py-16 px-4">
        <h2 className="text-3xl font-cormorant font-light text-center mb-12 text-gold-600">Featured Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[
            {
              title: 'Spring Collection',
              image: '/images/spring-collection.jpg',
              href: '/collections/spring'
            },
            {
              title: 'Summer Collection',
              image: '/images/summer-collection.jpg',
              href: '/collections/summer'
            },
            {
              title: 'Fall Collection',
              image: '/images/fall-collection.jpg',
              href: '/collections/fall'
            }
          ].map((collection, index) => (
            <motion.div
              key={collection.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group reveal"
              ref={(el) => addToRefs(el, index)}
            >
              <div className="relative h-96">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  className="object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300 rounded-lg" />
              </div>
              <Link
                href={collection.href}
                className="absolute inset-0 flex items-center justify-center"
              >
                <h3 className="text-2xl font-cormorant font-light text-white group-hover:scale-110 transition-all duration-300">
                  {collection.title}
                </h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  )
} 