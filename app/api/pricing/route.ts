import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [prices, products] = await Promise.all([
      getStripePrices(),
      getStripeProducts(),
    ]);

    // Find Essential and Premium products by name
    const essentialProduct = products.find(
      product => product.name === 'Essential',
    );
    const premiumProduct = products.find(product => product.name === 'Premium');

    // Find the price for each product by matching productId
    const essentialPrice = prices.find(
      price => price.productId === essentialProduct?.id,
    );
    const premiumPrice = prices.find(
      price => price.productId === premiumProduct?.id,
    );

    return NextResponse.json({
      essential: essentialProduct && essentialPrice ? {
        price: essentialPrice.unitAmount,
        interval: essentialPrice.interval,
      } : null,
      premium: premiumProduct && premiumPrice ? {
        price: premiumPrice.unitAmount,
        interval: premiumPrice.interval,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching pricing data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing data' },
      { status: 500 }
    );
  }
}