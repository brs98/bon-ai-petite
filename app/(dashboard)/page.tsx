import { Button } from '@/components/ui/button';
import { ArrowRight, ChefHat, ShoppingCart, Sparkles, Clock, Heart, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-emerald-100 px-4 py-2 rounded-full border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-primary font-medium text-sm">AI-Powered Nutrition</span>
                </div>
              </div>
              
              <h1 className="text-5xl font-bold text-foreground tracking-tight sm:text-6xl lg:text-7xl">
                <span className="block">Meet</span>
                <span className="block bg-gradient-to-r from-primary via-emerald-500 to-accent bg-clip-text text-transparent">
                  AI Petite
                </span>
              </h1>
              
              <p className="mt-6 text-xl text-muted-foreground sm:text-2xl lg:text-xl xl:text-2xl leading-relaxed">
                Your personal AI nutritionist that creates custom meal plans tailored to your goals, 
                preferences, and lifestyle. From planning to shopping, we've got you covered.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:max-w-lg sm:mx-auto lg:mx-0">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-primary via-emerald-500 to-emerald-600 hover:from-primary/90 hover:via-emerald-500/90 hover:to-emerald-600/90 text-primary-foreground px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-primary/30 hover:border-primary bg-white/50 backdrop-blur-sm text-primary hover:text-primary hover:bg-primary/5 px-8 py-4 text-lg rounded-xl transition-all duration-300"
                >
                  Watch Demo
                </Button>
              </div>
              
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-primary mr-2" />
                  Free 7-day trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-primary mr-2" />
                  No credit card required
                </div>
              </div>
            </div>
            
            <div className="mt-16 lg:mt-0 lg:col-span-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-emerald-400/20 to-accent/20 rounded-3xl blur-3xl opacity-30"></div>
                <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-primary/10">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary to-emerald-500 rounded-xl flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground">Today's Meal Plan</h3>
                        <p className="text-muted-foreground text-sm">Personalized for your goals</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-foreground">Breakfast</span>
                          <span className="text-sm text-primary font-semibold">320 cal</span>
                        </div>
                        <p className="text-muted-foreground text-sm">Avocado Toast with Poached Egg</p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-foreground">Lunch</span>
                          <span className="text-sm text-accent font-semibold">450 cal</span>
                        </div>
                        <p className="text-muted-foreground text-sm">Mediterranean Quinoa Bowl</p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-foreground">Dinner</span>
                          <span className="text-sm text-primary font-semibold">520 cal</span>
                        </div>
                        <p className="text-muted-foreground text-sm">Grilled Salmon with Roasted Vegetables</p>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-primary-foreground rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
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
      <section className="py-20 bg-gradient-to-b from-background to-emerald-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose AI Petite?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of meal planning with our AI-powered platform that understands your unique needs and preferences.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">AI-Powered Personalization</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our advanced AI analyzes your dietary preferences, health goals, and lifestyle to create perfectly tailored meal plans that evolve with you.
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-accent to-blue-500 text-accent-foreground mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Seamless Shopping Integration</h3>
              <p className="text-muted-foreground leading-relaxed">
                One-click integration with Instacart and Amazon Fresh. Your ingredients are automatically added to your cart and delivered to your door.
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Save Time & Reduce Waste</h3>
              <p className="text-muted-foreground leading-relaxed">
                Spend less time planning and shopping, more time enjoying delicious meals. Our smart portions reduce food waste by up to 40%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-50 via-background to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Transform Your Relationship with Food
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of users who have discovered the joy of effortless, healthy eating with AI Petite.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary/20 to-emerald-200 rounded-lg flex items-center justify-center">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Healthier Lifestyle</h3>
                    <p className="text-muted-foreground">Achieve your wellness goals with nutritionally balanced meals designed by experts.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-accent/20 to-blue-200 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">More Free Time</h3>
                    <p className="text-muted-foreground">Reclaim hours each week with automated meal planning and grocery shopping.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-200 to-emerald-300 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Family-Friendly</h3>
                    <p className="text-muted-foreground">Create meal plans that satisfy everyone's tastes and dietary requirements.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl p-6 border border-emerald-200/50">
                  <div className="flex items-center space-x-4 mb-4">
                    <h3 className="text-2xl font-bold text-foreground mb-2">Success Stories</h3>
                    <p className="text-muted-foreground">See what our users are saying</p>
                  </div>
                  
                  <p className="text-foreground mb-4 italic">
                    "AI Petite has completely transformed how my family eats. We're healthier, happier, and I save 5 hours every week!"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-semibold">SM</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Sarah M.</p>
                      <p className="text-muted-foreground text-sm">Busy Mom of 3</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200/50">
                  <p className="text-foreground mb-4 italic">
                    "The AI recommendations are spot-on. I've discovered so many new healthy recipes that I actually enjoy cooking!"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-accent to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-accent-foreground font-semibold">MJ</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Michael J.</p>
                      <p className="text-muted-foreground text-sm">Software Engineer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-emerald-500 to-emerald-600 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Meals?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied users and start your journey to effortless, healthy eating today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold transform hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white/30 text-white hover:bg-white/10 hover:border-white px-8 py-4 text-lg rounded-xl transition-all duration-300 font-semibold backdrop-blur-sm"
              >
                View Pricing
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 flex items-center justify-center space-x-8 text-primary-foreground/80">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">Free 7-day trial</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">No setup fees</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
