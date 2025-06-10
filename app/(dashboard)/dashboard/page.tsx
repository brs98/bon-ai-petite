import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChefHat, Settings, Utensils } from 'lucide-react';
import Link from 'next/link';

const dashboardCards = [
  {
    title: 'Settings',
    description: 'Manage your account and security settings',
    href: '/dashboard/settings',
    icon: Settings,
    color: 'text-blue-600',
  },
  {
    title: 'Recipes',
    description: 'Discover and manage your recipes',
    href: '/dashboard/recipes',
    icon: ChefHat,
    color: 'text-orange-600',
  },
  {
    title: 'Meal Planning',
    description: 'Plan your weekly meals',
    href: '/dashboard/meal-planning/weekly',
    icon: Calendar,
    color: 'text-purple-600',
  },
  {
    title: 'Nutrition Profile',
    description: 'Set up your nutrition preferences',
    href: '/dashboard/settings/nutrition',
    icon: Utensils,
    color: 'text-red-600',
  },
];

export default function DashboardPage() {
  return (
    <section className='flex-1 p-4 lg:p-8'>
      <div className='mb-8'>
        <h1 className='text-2xl lg:text-3xl font-bold text-foreground mb-2'>
          Dashboard
        </h1>
        <p className='text-muted-foreground'>
          Welcome to your dashboard. Navigate to different sections to manage
          your account and meal planning.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {dashboardCards.map(card => (
          <Link key={card.href} href={card.href}>
            <Card className='transition-all hover:shadow-md hover:border-primary/20 cursor-pointer group'>
              <CardHeader className='pb-4'>
                <div className='flex items-center space-x-3'>
                  <div
                    className={`p-2 rounded-lg bg-accent/10 ${card.color} group-hover:scale-110 transition-transform`}
                  >
                    <card.icon className='h-5 w-5' />
                  </div>
                  <CardTitle className='text-lg'>{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  {card.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
