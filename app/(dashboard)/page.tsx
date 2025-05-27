import { Button } from '@/components/ui/button';
import { ArrowRight, ChefHat, ShoppingCart, Sparkles, Clock, Heart, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <div className="flex items-center space-x-2 bg-emerald-100 px-4 py-2 rounded-full">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium text-sm">AI-Powered Nutrition</span>
                </div>
              </div>
              
              <h1 className="text-5xl font-bold text-gray-900 tracking-tight sm:text-6xl lg:text-7xl">
                <span className="block">Meet</span>
                <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  AI Petite
                </span>
              </h1>
              
              <p className="mt-6 text-xl text-gray-600 sm:text-2xl lg:text-xl xl:text-2xl leading-relaxed">
                Your personal AI nutritionist that creates custom meal plans tailored to your goals, 
                preferences, and lifestyle. From planning to shopping, we've got you covered.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:max-w-lg sm:mx-auto lg:mx-0">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-gray-300 hover:border-emerald-500 text-gray-700 hover:text-emerald-700 px-8 py-4 text-lg rounded-xl transition-all duration-200"
                >
                  Watch Demo
                </Button>
              </div>
              
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  Free 7-day trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  No credit card required
                </div>
              </div>
            </div>
            
            <div className="mt-16 lg:mt-0 lg:col-span-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-3xl blur-3xl opacity-20"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Today's Meal Plan</h3>
                        <p className="text-gray-500 text-sm">Personalized for your goals</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">Breakfast</span>
                          <span className="text-sm text-emerald-600">320 cal</span>
                        </div>
                        <p className="text-gray-600 text-sm">Avocado Toast with Poached Egg</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">Lunch</span>
                          <span className="text-sm text-emerald-600">450 cal</span>
                        </div>
                        <p className="text-gray-600 text-sm">Mediterranean Quinoa Bowl</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">Dinner</span>
                          <span className="text-sm text-emerald-600">520 cal</span>
                        </div>
                        <p className="text-gray-600 text-sm">Grilled Salmon with Roasted Vegetables</p>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart (12 items)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose AI Petite?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of meal planning with our AI-powered platform that understands your unique needs and preferences.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white mb-6 group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Personalization</h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI analyzes your dietary preferences, health goals, and lifestyle to create perfectly tailored meal plans that evolve with you.
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white mb-6 group-hover:scale-110 transition-transform duration-200">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Seamless Shopping Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                One-click integration with Instacart and Amazon Fresh. Your ingredients are automatically added to your cart and delivered to your door.
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white mb-6 group-hover:scale-110 transition-transform duration-200">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Save Time & Reduce Waste</h3>
              <p className="text-gray-600 leading-relaxed">
                Spend less time planning and shopping, more time enjoying delicious meals. Our smart portions reduce food waste by up to 40%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Transform Your Relationship with Food
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of users who have discovered the joy of effortless, healthy eating with AI Petite.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Heart className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Healthier Lifestyle</h3>
                    <p className="text-gray-600">Achieve your wellness goals with nutritionally balanced meals designed by experts.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">More Free Time</h3>
                    <p className="text-gray-600">Reclaim hours each week with automated meal planning and grocery shopping.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Family-Friendly</h3>
                    <p className="text-gray-600">Create meal plans that satisfy everyone's tastes and dietary requirements.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Success Stories</h3>
                  <p className="text-gray-600">See what our users are saying</p>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-emerald-50 rounded-xl p-6">
                    <p className="text-gray-700 mb-4 italic">
                      "AI Petite has completely transformed how I approach meal planning. I've lost 15 pounds and feel more energetic than ever!"
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center">
                        <span className="text-emerald-700 font-semibold">SM</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Sarah M.</p>
                        <p className="text-gray-500 text-sm">Busy Mom of 3</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-6">
                    <p className="text-gray-700 mb-4 italic">
                      "The grocery integration is a game-changer. I save 3 hours every week and never run out of ingredients."
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold">MJ</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Michael J.</p>
                        <p className="text-gray-500 text-sm">Software Engineer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Healthy Journey?
          </h2>
          <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied users who have transformed their eating habits with AI Petite. 
            Start your free trial today and experience the future of meal planning.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-emerald-600 hover:bg-gray-50 px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-emerald-600 px-8 py-4 text-lg rounded-xl transition-all duration-200 font-semibold"
              >
                View Pricing
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 flex items-center justify-center space-x-8 text-emerald-100">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>No setup fees</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
