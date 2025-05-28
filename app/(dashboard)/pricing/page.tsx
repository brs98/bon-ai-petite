import { checkoutAction } from '@/lib/payments/actions';
import { Check, ChefHat, Sparkles } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find((product) => product.name === 'Base');
  const plusPlan = products.find((product) => product.name === 'Plus');

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-emerald-50 via-white to-blue-50 min-h-screen">
      <div className="text-center mb-16">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Choose Your <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">AI Petite</span> Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start your journey to healthier eating with personalized meal plans and seamless grocery delivery integration.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <PricingCard
          name="Essential"
          displayName={basePlan?.name || 'Essential'}
          price={basePrice?.unitAmount || 800}
          interval={basePrice?.interval || 'month'}
          trialDays={basePrice?.trialPeriodDays || 7}
          features={[
            'AI-Generated Meal Plans',
            'Basic Dietary Preferences',
            'Shopping List Generation',
            'Instacart Integration',
            'Email Support',
            'Mobile App Access'
          ]}
          priceId={basePrice?.id}
          popular={false}
        />
        <PricingCard
          name="Premium"
          displayName={plusPlan?.name || 'Premium'}
          price={plusPrice?.unitAmount || 1200}
          interval={plusPrice?.interval || 'month'}
          trialDays={plusPrice?.trialPeriodDays || 7}
          features={[
            'Everything in Essential, plus:',
            'Advanced Nutrition Tracking',
            'Family Meal Planning',
            'Amazon Fresh Integration',
            'Custom Recipe Requests',
            'Priority Support',
            'Nutritionist Consultations'
          ]}
          priceId={plusPrice?.id}
          popular={true}
        />
      </div>

      <div className="text-center mt-16">
        <p className="text-muted-foreground mb-4">
          All plans include a 7-day free trial. No credit card required to start.
        </p>
        <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Check className="h-4 w-4 text-primary mr-2" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 text-primary mr-2" />
            <span>No setup fees</span>
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 text-primary mr-2" />
            <span>30-day money back guarantee</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function PricingCard({
  name,
  displayName,
  price,
  interval,
  trialDays,
  features,
  priceId,
  popular = false,
}: {
  name: string;
  displayName: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  popular?: boolean;
}) {
  return (
    <div className={`relative bg-white rounded-3xl shadow-xl border ${popular ? 'border-primary/20 ring-2 ring-primary' : 'border-border'} p-8`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">{name}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {trialDays} day free trial included
        </p>
        <div className="mb-4">
          <span className="text-5xl font-bold text-foreground">${price / 100}</span>
          <span className="text-xl text-muted-foreground ml-1">/{interval}</span>
        </div>
        <p className="text-sm text-muted-foreground">per person</p>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton popular={popular} />
      </form>
    </div>
  );
}
