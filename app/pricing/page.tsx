import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { Check, ChefHat, Sparkles, Zap } from 'lucide-react';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

// Define the full feature list and which plan supports which
const featureList = [
  { label: 'AI-Generated Meals', essential: true, premium: true },
  { label: 'Personalized Dietary Preferences', essential: true, premium: true },
  {
    label: 'Adaptive AI that learns user preferences over time',
    essential: true,
    premium: true,
  },
  {
    label: 'Detailed recipe creation with ingredients and instructions',
    essential: true,
    premium: true,
  },
  {
    label: 'Automatic macronutrient target calculation',
    essential: true,
    premium: true,
  },
  { label: 'Weekly Meal Planning', essential: false, premium: true },
  { label: 'Family Meal Planning', essential: false, premium: true },
  { label: 'Shopping List Creation', essential: false, premium: true },
  {
    label: 'Instacart Integration (coming soon)',
    essential: false,
    premium: true,
  },
  {
    label: 'Amazon Fresh Integration (coming soon)',
    essential: false,
    premium: true,
  },
];

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find(product => product.name === 'Base');
  const plusPlan = products.find(product => product.name === 'Plus');

  const basePrice = prices.find(price => price.productId === basePlan?.id);
  const plusPrice = prices.find(price => price.productId === plusPlan?.id);

  return (
    <main className='min-h-screen bg-gradient-to-br from-emerald-50 via-background to-blue-50 relative overflow-hidden'>
      {/* Background decorative elements */}
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent'></div>
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent'></div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='text-center mb-16'>
          <div className='flex items-center justify-center mb-6'>
            <div className='w-16 h-16 bg-gradient-to-r from-primary via-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg'>
              <ChefHat className='h-8 w-8 text-primary-foreground' />
            </div>
          </div>
          <h1 className='text-5xl font-bold text-foreground mb-6'>
            Choose Your{' '}
            <span className='bg-gradient-to-r from-primary via-emerald-500 to-accent bg-clip-text text-transparent'>
              AI Petite
            </span>{' '}
            Plan
          </h1>
          <p className='text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed'>
            Start your journey to healthier eating with personalized meal plans
            and seamless grocery delivery integration. Transform your
            relationship with food today.
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16'>
          <PricingCard
            name='Essential'
            displayName={basePlan?.name || 'Essential'}
            price={basePrice?.unitAmount || 800}
            interval={basePrice?.interval || 'month'}
            trialDays={basePrice?.trialPeriodDays || 14}
            features={featureList.map(f => ({
              label: f.label,
              included: f.essential,
            }))}
            planId='essential'
            popular={false}
          />
          <PricingCard
            name='Premium'
            displayName={plusPlan?.name || 'Premium'}
            price={plusPrice?.unitAmount || 1200}
            interval={plusPrice?.interval || 'month'}
            trialDays={plusPrice?.trialPeriodDays || 14}
            features={featureList.map(f => ({
              label: f.label,
              included: f.premium,
            }))}
            planId='premium'
            popular={true}
          />
        </div>

        {/* Trust indicators */}
        <div className='text-center mb-12'>
          <div className='bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8 border border-emerald-200/50 max-w-4xl mx-auto'>
            <div className='flex items-center justify-center space-x-8 text-sm text-muted-foreground'>
              <div className='flex items-center'>
                <Check className='h-4 w-4 text-primary mr-2' />
                <span>14-day free trial</span>
              </div>
              <div className='flex items-center'>
                <Check className='h-4 w-4 text-primary mr-2' />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-3xl font-bold text-foreground text-center mb-8'>
            Frequently Asked Questions
          </h2>
          <div className='space-y-6'>
            <div className='bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border'>
              <h3 className='font-semibold text-foreground mb-2'>
                How does the AI meal planning work?
              </h3>
              <p className='text-muted-foreground'>
                Our AI analyzes your dietary preferences, health goals, and
                lifestyle to create personalized meal plans that evolve with
                your needs and feedback.
              </p>
            </div>
            <div className='bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border'>
              <h3 className='font-semibold text-foreground mb-2'>
                Can I cancel my subscription anytime?
              </h3>
              <p className='text-muted-foreground'>
                Yes, you can cancel your subscription at any time. There are no
                cancellation fees or long-term commitments.
              </p>
            </div>
            <div className='bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border'>
              <h3 className='font-semibold text-foreground mb-2'>
                Do you support special dietary requirements?
              </h3>
              <p className='text-muted-foreground'>
                Absolutely! We support vegetarian, vegan, keto, paleo,
                gluten-free, and many other dietary preferences and
                restrictions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  planId,
  popular = false,
}: {
  name: string;
  displayName: string;
  price: number;
  interval: string;
  trialDays: number;
  features: { label: string; included: boolean }[];
  planId: string;
  popular?: boolean;
}) {
  return (
    <div
      className={`relative bg-card/80 backdrop-blur-sm rounded-3xl shadow-xl border transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
        popular
          ? 'border-primary/30 ring-2 ring-primary/20 bg-gradient-to-b from-card to-emerald-50/30'
          : 'border-border hover:border-primary/20'
      } p-8`}
    >
      {popular && (
        <div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
          <div className='bg-gradient-to-r from-primary via-emerald-500 to-emerald-600 text-primary-foreground px-6 py-2 rounded-full text-sm font-medium flex items-center shadow-lg'>
            <Sparkles className='h-4 w-4 mr-1' />
            Most Popular
          </div>
        </div>
      )}

      <div className='text-center mb-8'>
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
            popular
              ? 'bg-gradient-to-r from-primary to-emerald-500'
              : 'bg-gradient-to-r from-accent to-blue-500'
          }`}
        >
          {popular ? (
            <Zap className='h-6 w-6 text-primary-foreground' />
          ) : (
            <ChefHat className='h-6 w-6 text-accent-foreground' />
          )}
        </div>
        <h2 className='text-2xl font-bold text-foreground mb-2'>{name}</h2>
        <p className='text-sm text-muted-foreground mb-6'>
          {trialDays} day free trial included
        </p>
        <div className='mb-4'>
          <span className='text-5xl font-bold text-foreground'>
            ${price / 100}
          </span>
          <span className='text-xl text-muted-foreground ml-1'>
            /{interval}
          </span>
        </div>
      </div>

      <ul className='space-y-4 mb-8'>
        {features.map((feature, index) => (
          <li key={index} className='flex items-start'>
            <div
              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                feature.included
                  ? popular
                    ? 'bg-primary/20'
                    : 'bg-accent/20'
                  : 'bg-gray-200 border border-gray-300'
              }`}
            >
              {feature.included ? (
                <Check
                  className={`h-3 w-3 ${popular ? 'text-primary' : 'text-accent'}`}
                />
              ) : (
                <span className='text-gray-400 font-bold text-lg'>×</span>
              )}
            </div>
            <span
              className={`text-foreground ${!feature.included ? 'opacity-60 line-through' : ''}`}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      <SubmitButton planId={planId} popular={popular} />
    </div>
  );
}
