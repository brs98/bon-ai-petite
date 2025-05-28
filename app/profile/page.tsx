import { redirect } from 'next/navigation';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, User, CreditCard, Settings, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import PaymentStatusMessage from '@/app/profile/payment-status-message';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const userWithTeam = await getUserWithTeam(user.id);
  const hasTeam = userWithTeam?.teamId !== null;
  
  // Await searchParams since it's async in Next.js 15+
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-blue-50">
      {/* Payment Status Messages */}
      <PaymentStatusMessage paymentStatus={params.payment} />

      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 border-b border-border bg-background/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center group">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/90 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Petite
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-primary via-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to Your Profile
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your account and subscription settings
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Account Information */}
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your personal account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground font-medium">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-foreground font-medium">{user.name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <span className="capitalize">{user.role}</span>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <p className="text-foreground font-medium">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-primary" />
                Subscription Status
              </CardTitle>
              <CardDescription>
                Your current plan and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasTeam ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Plan</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-foreground font-medium">
                        Active Subscription
                      </p>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Team ID</label>
                    <p className="text-foreground font-medium">{userWithTeam?.teamId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-foreground font-medium">Active</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No active subscription</p>
                  <Link href="/pricing">
                    <Button className="bg-gradient-to-r from-primary to-emerald-500">
                      Choose a Plan
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card/80 backdrop-blur-sm border-border md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Manage your account and subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                    <ChefHat className="h-6 w-6 text-primary" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <span>View Plans</span>
                  </Button>
                </Link>
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2" disabled>
                  <Settings className="h-6 w-6 text-muted-foreground" />
                  <span>Settings</span>
                  <span className="text-xs text-muted-foreground">Coming Soon</span>
                </Button>
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2" disabled>
                  <User className="h-6 w-6 text-muted-foreground" />
                  <span>Edit Profile</span>
                  <span className="text-xs text-muted-foreground">Coming Soon</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8 border border-emerald-200/50">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome to AI Petite!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your account has been successfully created. Start exploring personalized meal plans and transform your eating habits today.
            </p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-primary via-emerald-500 to-emerald-600 hover:from-primary/90 hover:via-emerald-500/90 hover:to-emerald-600/90">
                Get Started with Meal Planning
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 