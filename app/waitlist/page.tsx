'use client';

import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import { WaitlistSignup } from '@/components/WaitlistSignup';
import {
  CheckCircle,
  ChefHat,
  Clock,
  Heart,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';

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

export default function WaitlistPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary relative overflow-hidden'>
      {/* Background Effects */}
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

      {/* Main Content */}
      <main className='relative z-10 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-6xl mx-auto'>
          {/* Hero Section */}
          <motion.div
            className='text-center mb-16'
            initial='initial'
            animate='animate'
            variants={staggerContainer}
          >
            <motion.div
              className='flex items-center justify-center mb-6'
              variants={staggerItem}
            >
              <motion.div
                className='flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-primary/10 px-6 py-3 rounded-full border border-primary/20'
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
                  Exclusive Waitlist Access
                </span>
              </motion.div>
            </motion.div>

            <motion.h1
              className='text-5xl font-bold text-foreground tracking-tight sm:text-6xl lg:text-7xl mb-6'
              variants={staggerItem}
            >
              <span className='block font-cursive'>Reserve Your Seat at</span>
              <span className='block font-cursive text-primary'>
                Bon AI Petite
              </span>
            </motion.h1>

            <motion.p
              className='text-xl text-muted-foreground sm:text-2xl lg:text-xl xl:text-2xl leading-relaxed max-w-4xl mx-auto mb-8'
              variants={staggerItem}
            >
              Be among the first to experience the future of AI-powered
              nutrition. Your feedback will directly shape the features we
              build, making Bon AI Petite the perfect companion for your health
              journey.
            </motion.p>

            <motion.div
              className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 text-sm text-muted-foreground'
              variants={staggerItem}
            >
              <motion.div
                className='flex items-center'
                whileHover={{ scale: 1.05 }}
              >
                <CheckCircle className='h-5 w-5 sm:h-4 sm:w-4 text-primary mr-3 sm:mr-2' />
                Early access to features
              </motion.div>
              <motion.div
                className='flex items-center'
                whileHover={{ scale: 1.05 }}
              >
                <Zap className='h-5 w-5 sm:h-4 sm:w-4 text-primary mr-3 sm:mr-2' />
                Shape the product roadmap
              </motion.div>
              <motion.div
                className='flex items-center'
                whileHover={{ scale: 1.05 }}
              >
                <Users className='h-5 w-5 sm:h-4 sm:w-4 text-primary mr-3 sm:mr-2' />
                Join exclusive community
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Waitlist Form */}
          <motion.div
            className='mb-16'
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <WaitlistSignup />
          </motion.div>

          {/* Features Preview */}
          <motion.section
            className='mb-16'
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className='text-center mb-12'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className='text-3xl font-bold text-foreground mb-4'>
                What You'll Get Early Access To
              </h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                These are just some of the revolutionary features you'll
                experience first
              </p>
            </motion.div>

            <motion.div
              className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'
              initial='initial'
              whileInView='animate'
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {[
                {
                  icon: ChefHat,
                  title: 'AI Recipe Generation',
                  description:
                    'Personalized recipes based on your preferences, dietary restrictions, and nutritional goals',
                  gradient: 'from-orange-500/10 to-red-500/10',
                  border: 'border-orange-500/20',
                },
                {
                  icon: Clock,
                  title: 'Smart Meal Planning',
                  description:
                    'Weekly meal plans that adapt to your schedule, budget, and cooking time',
                  gradient: 'from-blue-500/10 to-purple-500/10',
                  border: 'border-blue-500/20',
                },
                {
                  icon: Heart,
                  title: 'Nutrition Tracking',
                  description:
                    'Advanced nutrition insights with AI-powered recommendations for optimal health',
                  gradient: 'from-green-500/10 to-emerald-500/10',
                  border: 'border-green-500/20',
                },
                {
                  icon: Users,
                  title: 'Family Meal Planning',
                  description:
                    'Create meals that satisfy everyone in your household, from picky eaters to health enthusiasts',
                  gradient: 'from-pink-500/10 to-rose-500/10',
                  border: 'border-pink-500/20',
                },
                {
                  icon: Sparkles,
                  title: 'Smart Shopping Lists',
                  description:
                    'Automatically generated shopping lists with ingredient consolidation and store optimization',
                  gradient: 'from-indigo-500/10 to-blue-500/10',
                  border: 'border-indigo-500/20',
                },
                {
                  icon: Star,
                  title: 'Personalized Coaching',
                  description:
                    'AI nutrition coach that learns your preferences and guides you toward your health goals',
                  gradient: 'from-yellow-500/10 to-orange-500/10',
                  border: 'border-yellow-500/20',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className={`bg-gradient-to-br ${feature.gradient} rounded-2xl p-6 border ${feature.border} backdrop-blur-sm`}
                  variants={staggerItem}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    y: -5,
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className='flex items-center mb-4'>
                    <div
                      className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm border ${feature.border}`}
                    >
                      <feature.icon className='h-6 w-6 text-foreground' />
                    </div>
                    <h3 className='text-xl font-semibold text-foreground ml-4'>
                      {feature.title}
                    </h3>
                  </div>
                  <p className='text-muted-foreground leading-relaxed'>
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* Social Proof */}
          <motion.section
            className='mb-16'
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className='bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl p-8 border border-primary/20'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className='text-center mb-8'>
                <h2 className='text-2xl font-bold text-foreground mb-4'>
                  Why People Are Excited About Bon AI Petite
                </h2>
                <p className='text-muted-foreground'>
                  Join thousands of health enthusiasts who can't wait to
                  transform their nutrition journey
                </p>
              </div>

              <motion.div
                className='grid md:grid-cols-2 gap-6'
                initial='initial'
                whileInView='animate'
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                {[
                  {
                    quote:
                      "As a busy mom of three, I'm always struggling to plan meals that everyone will eat. The idea of AI that knows my kids' picky eating habits and my husband's fitness goals is a total game-changer!",
                    name: 'Jennifer L.',
                    role: 'Mom of 3',
                    avatar: 'JL',
                  },
                  {
                    quote:
                      "I've been hitting the gym for years but always struggled with meal prep. Having an AI that creates recipes based on my macros and actually tastes good? Sign me up!",
                    name: 'Alex R.',
                    role: 'Gym Enthusiast',
                    avatar: 'AR',
                  },
                ].map((testimonial, index) => (
                  <motion.div
                    key={index}
                    className='bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-primary/10'
                    variants={staggerItem}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className='flex items-start space-x-4'>
                      <div className='w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold'>
                        {testimonial.avatar}
                      </div>
                      <div className='flex-1'>
                        <p className='text-foreground mb-4 italic leading-relaxed'>
                          "{testimonial.quote}"
                        </p>
                        <div>
                          <p className='font-semibold text-foreground'>
                            {testimonial.name}
                          </p>
                          <p className='text-muted-foreground text-sm'>
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Final CTA */}
          <motion.section
            className='text-center'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className='bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground rounded-3xl p-8 relative overflow-hidden'
              whileHover={{
                scale: 1.02,
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div
                className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent'
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div className='relative z-10'>
                <h2 className='text-3xl font-bold mb-4'>
                  Ready to Shape the Future of Nutrition?
                </h2>
                <p className='text-xl text-primary-foreground/90 mb-6 max-w-2xl mx-auto'>
                  Join our exclusive waitlist and be among the first to
                  experience the revolutionary Bon AI Petite platform.
                </p>
                <motion.div
                  className='flex flex-col sm:flex-row gap-4 justify-center'
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div {...buttonHover} className='rounded-xl'>
                    <Button
                      size='lg'
                      className='w-full sm:w-auto bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg rounded-xl shadow-lg font-semibold'
                      onClick={() => {
                        const waitlistForm = document.querySelector(
                          '[data-waitlist-form]',
                        );
                        if (waitlistForm) {
                          waitlistForm.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      Join the Waitlist Now
                      <Sparkles className='ml-2 h-5 w-5' />
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </motion.section>
        </div>
      </main>

      {/* Footer */}
      <footer className='relative z-10 py-8 mt-16 border-t border-primary/10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <motion.div
              className='flex items-center justify-center space-x-3 mb-4'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Logo width={32} height={42} />
              <div className='flex flex-col'>
                <span className='font-bold text-primary font-cursive text-2xl'>
                  Bon AI Petite
                </span>
              </div>
            </motion.div>
            <p className='text-muted-foreground text-sm'>
              © 2025 Bon AI Petite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
