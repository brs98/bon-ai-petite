'use client';

import { NutritionProfileBanner } from '@/components/nutrition/NutritionProfileBanner';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import {
  ArrowRight,
  CheckCircle,
  ChefHat,
  Clock,
  Heart,
  ShoppingCart,
  Sparkles,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';

const fadeInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const fadeInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const buttonHover = {
  whileHover: {
    scale: 1.05,
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 300, damping: 20 },
};

export default function HomePage() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary'>
      {/* Hero Section */}
      <section className='relative py-20 lg:py-32 overflow-hidden'>
        <motion.div
          className='absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        <motion.div
          className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent'
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        />

        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Hero heading with logo to the right, vertically centered with the two-line heading */}
          <div className='flex justify-center lg:justify-start mb-8'>
            <div className='flex items-center'>
              {/* Two-line heading */}
              <motion.h1
                className='text-5xl font-bold text-foreground tracking-tight sm:text-6xl lg:text-7xl flex flex-col text-right sm:text-left'
                variants={staggerItem}
              >
                <motion.span
                  className='block font-cursive'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Bon
                </motion.span>
                <motion.span
                  className='block font-cursive text-primary'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  Bon AI Petite
                </motion.span>
              </motion.h1>
              <Logo width={64} height={84} className='ml-4' />
            </div>
          </div>
          <div className='lg:grid lg:grid-cols-12 lg:gap-8 items-center'>
            <motion.div
              className='sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left'
              initial='initial'
              animate='animate'
              variants={staggerContainer}
            >
              <motion.div
                className='flex items-center justify-center lg:justify-start mb-6'
                variants={staggerItem}
              >
                <motion.div
                  className='flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-primary/10 px-4 py-2 rounded-full border border-primary/20'
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <Sparkles className='h-5 w-5 text-primary' />
                  </motion.div>
                  <span className='text-primary font-medium text-sm'>
                    AI-Powered Nutrition
                  </span>
                </motion.div>
              </motion.div>

              <motion.p
                className='mt-6 text-xl text-muted-foreground sm:text-2xl lg:text-xl xl:text-2xl leading-relaxed'
                variants={staggerItem}
              >
                Your personal AI nutritionist that creates custom meal plans
                tailored to your goals, preferences, and lifestyle. From
                planning to shopping, we've got you covered.
              </motion.p>

              <motion.div
                className='mt-10 flex flex-col sm:flex-row gap-4 sm:max-w-lg sm:mx-auto lg:mx-0'
                variants={staggerItem}
              >
                <Link href='/pricing'>
                  <motion.div {...buttonHover} className='rounded-xl'>
                    <Button
                      size='lg'
                      className='w-full sm:w-auto bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/90 hover:to-primary/80 text-primary-foreground px-8 py-4 text-lg rounded-xl shadow-lg transition-all duration-300'
                    >
                      Start Your Journey
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className='ml-2 h-5 w-5' />
                      </motion.div>
                    </Button>
                  </motion.div>
                </Link>
                <motion.div {...buttonHover} className='rounded-xl'>
                  <Button
                    size='lg'
                    variant='outline'
                    className='w-full sm:w-auto border-2 border-primary/30 hover:border-primary bg-white/50 backdrop-blur-sm text-primary hover:text-primary hover:bg-primary/5 px-8 py-4 text-lg rounded-xl transition-all duration-300'
                  >
                    Watch Demo
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                className='mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-muted-foreground'
                variants={staggerItem}
              >
                <motion.div
                  className='flex items-center'
                  whileHover={{ scale: 1.05 }}
                >
                  <CheckCircle className='h-4 w-4 text-primary mr-2' />
                  Free 14-day trial
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              className='mt-16 lg:mt-0 lg:col-span-6'
              {...fadeInRight}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className='relative'>
                <motion.div
                  className='absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/20 to-accent/20 rounded-3xl blur-3xl opacity-30'
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.4, 0.3],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                  className='relative bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-primary/10'
                  whileHover={{
                    y: -5,
                    boxShadow: '0 25px 50px rgba(0,0,0,0.1)',
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className='space-y-6'
                    initial='initial'
                    animate='animate'
                    variants={staggerContainer}
                  >
                    {/* --- Redesigned Value Proposition Section --- */}
                    {/* Food Image Collage - contained within the card */}
                    <div className='flex justify-center items-center mb-6 gap-4'>
                      {/* Left image */}
                      <div className='relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-lg border-4 border-background bg-background'>
                        <Image
                          src='https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=400&fit=crop&crop=center'
                          alt='Avocado Toast with Poached Egg'
                          fill
                          className='object-cover'
                        />
                      </div>
                      {/* Main (center) image */}
                      <div className='relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-xl border-4 border-background bg-background z-10'>
                        <Image
                          src='https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop&crop=center'
                          alt='Mediterranean Quinoa Bowl'
                          fill
                          className='object-cover'
                        />
                      </div>
                      {/* Right image */}
                      <div className='relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-lg border-4 border-background bg-background'>
                        <Image
                          src='https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop&crop=center'
                          alt='Grilled Salmon with Roasted Vegetables'
                          fill
                          className='object-cover'
                        />
                      </div>
                    </div>

                    {/* Value Proposition Bar (Time-Saving & Personalization only) */}
                    <div className='flex justify-between items-center bg-gradient-to-r from-primary/10 via-background to-accent/10 rounded-lg px-6 py-4 border border-primary/10 shadow-sm mb-4'>
                      {/* Time-Saving */}
                      <div className='flex flex-col items-center flex-1'>
                        <Clock className='h-7 w-7 text-primary mb-1' />
                        <span className='font-semibold text-base text-foreground'>
                          Save 3+ hours/week
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          Automated planning & shopping
                        </span>
                      </div>
                      {/* Personalization */}
                      <div className='flex flex-col items-center flex-1'>
                        <Sparkles className='h-7 w-7 text-accent mb-1' />
                        <span className='font-semibold text-base text-foreground'>
                          Personalized for you
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          Adapts to your goals & tastes
                        </span>
                      </div>
                    </div>

                    {/* CTA Button - now generic, no shopping cart icon */}
                    <Link href='/pricing'>
                      <motion.div variants={staggerItem}>
                        <motion.div {...buttonHover} className='rounded-xl'>
                          <Button className='w-full bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 text-primary-foreground rounded-xl shadow-md transition-all duration-200'>
                            Get Started
                          </Button>
                        </motion.div>
                      </motion.div>
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <motion.section
        className='py-20 bg-gradient-to-b from-background/60 to-primary/5'
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
      >
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            className='text-center mb-16'
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-4xl font-bold text-foreground mb-4'>
              How It Works
            </h2>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              Save time, eat healthier, and enjoy more variety—Bon AI Petite makes
              meal planning effortless in just three simple steps.
            </p>
          </motion.div>
          <motion.div
            className='flex flex-col md:flex-row justify-between items-center gap-12 md:gap-8'
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Step 1 */}
            <motion.div
              className='flex-1 flex flex-col items-center text-center group'
              variants={staggerItem}
            >
              <motion.div
                className='w-20 h-20 mb-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg'
                whileHover={{ scale: 1.08, rotate: [0, 8, -8, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Users className='h-10 w-10 text-primary-foreground' />
              </motion.div>
              <h3 className='text-2xl font-bold text-foreground mb-2'>
                Create Your Profile
              </h3>
              <p className='text-muted-foreground text-base'>
                Tell us your goals, preferences, and dietary needs. Our AI gets
                to know you for truly personalized nutrition.
              </p>
            </motion.div>
            {/* Arrow for desktop */}
            <div className='hidden md:block w-12 h-1 bg-gradient-to-r from-primary/30 to-primary/30 rounded-full mx-2' />
            {/* Step 2 */}
            <motion.div
              className='flex-1 flex flex-col items-center text-center group'
              variants={staggerItem}
            >
              <motion.div
                className='w-20 h-20 mb-6 rounded-full bg-primary flex items-center justify-center shadow-lg'
                whileHover={{ scale: 1.08, rotate: [0, 8, -8, 0] }}
                transition={{ duration: 0.5 }}
              >
                <ChefHat className='h-10 w-10 text-primary-foreground' />
              </motion.div>
              <h3 className='text-2xl font-bold text-foreground mb-2'>
                Personalized Meal Plan
              </h3>
              <p className='text-muted-foreground text-base'>
                Instantly receive a week of delicious, healthy meals—customized
                for your tastes and goals, with plenty of variety.
              </p>
            </motion.div>
            {/* Arrow for desktop */}
            <div className='hidden md:block w-12 h-1 bg-gradient-to-r from-accent/30 to-secondary/30 rounded-full mx-2' />
            {/* Step 3 */}
            <motion.div
              className='flex-1 flex flex-col items-center text-center group'
              variants={staggerItem}
            >
              <motion.div
                className='w-20 h-20 mb-6 rounded-full bg-primary flex items-center justify-center shadow-lg'
                whileHover={{ scale: 1.08, rotate: [0, 8, -8, 0] }}
                transition={{ duration: 0.5 }}
              >
                <ShoppingCart className='h-10 w-10 text-primary-foreground' />
              </motion.div>
              <h3 className='text-2xl font-bold text-foreground mb-2'>
                Smart Shopping List
              </h3>
              <p className='text-muted-foreground text-base'>
                Instantly generate a categorized shopping list—shop in minutes
                or send to your favorite delivery service. Less stress, more
                time saved.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Food Gallery Section */}
      <motion.section
        className='py-20 bg-gradient-to-b from-background to-primary/5'
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            className='text-center mb-16'
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-4xl font-bold text-foreground mb-4'>
              Discover Delicious, Healthy Meals
            </h2>
            <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
              From vibrant breakfast bowls to gourmet dinners, our AI creates
              meal plans featuring fresh, nutritious ingredients that you'll
              actually love eating.
            </p>
          </motion.div>

          <motion.div
            className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-16'
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                src: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&h=600&fit=crop&crop=center',
                alt: 'Healthy breakfast bowl with berries',
                title: 'Breakfast Bowls',
              },
              {
                src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop&crop=center',
                alt: 'Fresh salad with vegetables',
                title: 'Fresh Salads',
              },
              {
                src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&fit=crop&crop=center',
                alt: 'Gourmet pizza with fresh ingredients',
                title: 'Comfort Foods',
              },
              {
                src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop&crop=center',
                alt: 'Gourmet dinner plate',
                title: 'Gourmet Dinners',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className='relative aspect-square rounded-2xl overflow-hidden group cursor-pointer'
                variants={staggerItem}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className='object-cover'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                <div className='absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0'>
                  <p className='font-semibold'>{item.title}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Nutrition Profile Banner */}
      <motion.section
        className='py-8'
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <NutritionProfileBanner />
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className='py-20 bg-gradient-to-b from-primary/5 to-background'
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            className='text-center mb-16'
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-4xl font-bold text-primary mb-4'>
              Why Choose Bon AI Petite?
            </h2>
            <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
              Experience the future of meal planning with our AI-powered
              platform that understands your unique needs and preferences.
            </p>
          </motion.div>

          <motion.div
            className='grid lg:grid-cols-3 gap-8'
            initial='initial'
            whileInView='animate'
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: Sparkles,
                gradient: 'from-primary to-primary/80',
                title: 'AI-Powered Personalization',
                description:
                  'Our advanced AI analyzes your dietary preferences, health goals, and lifestyle to create perfectly tailored meal plans that evolve with you.',
              },
              {
                icon: ShoppingCart,
                gradient: 'from-accent to-secondary',
                title: 'Seamless Shopping Integration',
                description:
                  'One-click integration with Instacart and Amazon Fresh. Your ingredients are automatically added to your cart and delivered to your door.',
              },
              {
                icon: Clock,
                gradient: 'from-primary/400 to-primary/600',
                title: 'Save Time & Reduce Waste',
                description:
                  'Spend less time planning and shopping, more time enjoying delicious meals. Our smart portions reduce food waste by up to 40%.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className='text-center group'
                variants={staggerItem}
                whileHover={{ y: -10 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-6 shadow-lg`}
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -10, 10, 0],
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <feature.icon className='h-8 w-8' />
                </motion.div>
                <h3 className='text-2xl font-bold text-primary mb-4'>
                  {feature.title}
                </h3>
                <p className='text-muted-foreground leading-relaxed'>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section
        className='py-20 bg-gradient-to-r from-primary/5 via-background to-secondary'
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='lg:grid lg:grid-cols-2 lg:gap-16 items-center'>
            <motion.div
              {...fadeInLeft}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h2 className='text-4xl font-bold text-foreground mb-6'>
                Transform Your Relationship with Food
              </h2>
              <p className='text-xl text-muted-foreground mb-8'>
                Join thousands of users who have discovered the joy of
                effortless, healthy eating with Bon AI Petite.
              </p>

              <motion.div
                className='space-y-6'
                initial='initial'
                whileInView='animate'
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                {[
                  {
                    icon: Heart,
                    gradient: 'from-primary/20 to-primary/10',
                    iconColor: 'text-primary-foreground',
                    title: 'Healthier Lifestyle',
                    description:
                      'Achieve your wellness goals with nutritionally balanced meals designed by experts.',
                  },
                  {
                    icon: Clock,
                    gradient: 'from-accent/20 to-secondary',
                    iconColor: 'text-primary-foreground',
                    title: 'More Free Time',
                    description:
                      'Reclaim hours each week with automated meal planning and grocery shopping.',
                  },
                  {
                    icon: Users,
                    gradient: 'from-primary/100 to-primary/200',
                    iconColor: 'text-primary-foreground',
                    title: 'Family-Friendly',
                    description:
                      "Create meal plans that satisfy everyone's tastes and dietary requirements.",
                  },
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    className='flex items-start space-x-4'
                    variants={staggerItem}
                    whileHover={{ x: 10 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <motion.div
                      className={`flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center`}
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.3 }}
                    >
                      <benefit.icon
                        className={`h-5 w-5 ${benefit.iconColor}`}
                      />
                    </motion.div>
                    <div>
                      <h3 className='font-semibold text-foreground mb-1'>
                        {benefit.title}
                      </h3>
                      <p className='text-muted-foreground'>
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className='mt-12 lg:mt-0'
              {...fadeInRight}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <motion.div
                className='grid grid-cols-1 gap-6'
                initial='initial'
                whileInView='animate'
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                {[
                  {
                    gradient: 'from-primary/5 to-primary/10',
                    border: 'border-primary/20',
                    quote:
                      "Bon AI Petite has completely transformed how my family eats. We're healthier, happier, and I save 5 hours every week!",
                    name: 'Sarah M.',
                    role: 'Busy Mom of 3',
                    avatar: 'SM',
                  },
                  {
                    gradient: 'from-primary/5 to-primary/10',
                    border: 'border-primary/20',
                    quote:
                      "The AI recommendations are spot-on. I've discovered so many new healthy recipes that I actually enjoy cooking!",
                    name: 'Michael J.',
                    role: 'Software Engineer',
                    avatar: 'MJ',
                  },
                ].map((testimonial, index) => (
                  <motion.div
                    key={index}
                    className={`bg-gradient-to-r ${testimonial.gradient} rounded-xl p-6 border ${testimonial.border}`}
                    variants={staggerItem}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <motion.div
                      className='flex items-center space-x-4 mb-4'
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className='text-2xl font-bold text-foreground mb-2'>
                        Success Stories
                      </h3>
                      <p className='text-muted-foreground'>
                        See what our users are saying
                      </p>
                    </motion.div>

                    <motion.p
                      className='text-foreground mb-4 italic'
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      "{testimonial.quote}"
                    </motion.p>
                    <motion.div
                      className='flex items-center space-x-3'
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div
                        className={`w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center`}
                        whileHover={{ scale: 1.1 }}
                      >
                        <span className='text-primary-foreground font-semibold'>
                          {testimonial.avatar}
                        </span>
                      </motion.div>
                      <div>
                        <p className='font-semibold text-foreground'>
                          {testimonial.name}
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          {testimonial.role}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className='py-20 bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground relative overflow-hidden'
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent'
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className='relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8'
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className='text-4xl font-bold mb-6'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Ready to Transform Your Meals?
          </motion.h2>
          <motion.p
            className='text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Join thousands of satisfied users and start your journey to
            effortless, healthy eating today.
          </motion.p>

          <motion.div
            className='flex flex-col sm:flex-row gap-4 justify-center'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link href='/pricing'>
              <motion.div {...buttonHover} className='rounded-xl'>
                <Button
                  size='lg'
                  className='w-full sm:w-auto bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg rounded-xl shadow-lg font-semibold'
                >
                  Start Free Trial
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </motion.div>
                </Button>
              </motion.div>
            </Link>
            <Link href='/pricing'>
              <motion.div {...buttonHover} className='rounded-xl'>
                <Button
                  size='lg'
                  variant='outline'
                  className='w-full sm:w-auto border-2 border-white/30 text-white hover:bg-white/10 hover:border-white px-8 py-4 text-lg rounded-xl font-semibold backdrop-blur-sm'
                >
                  View Pricing
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          <motion.div
            className='mt-8 flex items-center justify-center space-x-8 text-primary-foreground/80'
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {['Free 14-day trial', 'Cancel anytime', 'No setup fees'].map(
              (text, index) => (
                <motion.div
                  key={index}
                  className='flex items-center'
                  whileHover={{ scale: 1.05 }}
                >
                  <CheckCircle className='h-4 w-4 mr-2' />
                  <span className='text-sm'>{text}</span>
                </motion.div>
              ),
            )}
          </motion.div>
        </motion.div>
      </motion.section>
    </main>
  );
}
