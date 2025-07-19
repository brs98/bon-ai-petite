'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Heart,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface WaitlistStats {
  total: number;
  waiting: number;
  invited: number;
  joined: number;
}

interface WaitlistEntry {
  id: number;
  email: string;
  name: string;
  reasonForInterest: string;
  featurePriorities?: string[];
  dietaryGoals?: string[];
  dietaryRestrictions?: string[];
  cookingExperience?: string;
  householdSize?: number;
  status: string;
  priorityScore?: number;
  createdAt: string;
}

interface FeaturePriority {
  feature: string;
  count: number;
}

interface DietaryGoal {
  goal: string;
  count: number;
}

export default function AdminWaitlistPage() {
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [featurePriorities, setFeaturePriorities] = useState<FeaturePriority[]>(
    [],
  );
  const [dietaryGoals, setDietaryGoals] = useState<DietaryGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchData = async () => {
    if (!apiKey) return;

    setLoading(true);
    try {
      const response = await fetch('/api/waitlist/admin', {
        headers: {
          'x-api-key': apiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
        setEntries(data.data.entries);
        setFeaturePriorities(data.data.featurePriorities);
        setDietaryGoals(data.data.dietaryGoals);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to fetch waitlist data:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      void fetchData();
    }
  }, [apiKey]);

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary p-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-8'>
            <Link href='/'>
              <Button variant='outline' className='mb-4'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Home
              </Button>
            </Link>
            <h1 className='text-3xl font-bold text-foreground'>
              Waitlist Admin Dashboard
            </h1>
            <p className='text-muted-foreground'>
              View and manage waitlist entries
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Enter your admin API key to access the waitlist dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='api-key'>Admin API Key</Label>
                  <Input
                    id='api-key'
                    type='password'
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder='Enter your admin API key'
                  />
                </div>
                <Button onClick={() => void fetchData()} disabled={!apiKey}>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Load Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary p-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-8'>
          <Link href='/'>
            <Button variant='outline' className='mb-4'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Home
            </Button>
          </Link>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-foreground'>
                Waitlist Admin Dashboard
              </h1>
              <p className='text-muted-foreground'>
                Manage and analyze waitlist entries
              </p>
            </div>
            <Button onClick={() => void fetchData()} disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className='text-center py-12'>
            <RefreshCw className='h-8 w-8 animate-spin mx-auto mb-4' />
            <p>Loading waitlist data...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className='grid md:grid-cols-4 gap-6 mb-8'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Entries
                  </CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{stats?.total || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Waiting</CardTitle>
                  <Clock className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-blue-600'>
                    {stats?.waiting || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Invited</CardTitle>
                  <Sparkles className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-yellow-600'>
                    {stats?.invited || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Joined</CardTitle>
                  <Heart className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-green-600'>
                    {stats?.joined || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='grid lg:grid-cols-2 gap-8'>
              {/* Feature Priorities */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <ChefHat className='h-5 w-5 mr-2' />
                    Top Feature Priorities
                  </CardTitle>
                  <CardDescription>
                    Most requested features by waitlist members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {featurePriorities.slice(0, 10).map((priority, _index) => (
                      <div
                        key={priority.feature}
                        className='flex items-center justify-between'
                      >
                        <span className='text-sm font-medium'>
                          {priority.feature}
                        </span>
                        <Badge variant='secondary'>{priority.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dietary Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <TrendingUp className='h-5 w-5 mr-2' />
                    Popular Dietary Goals
                  </CardTitle>
                  <CardDescription>
                    Most common health and nutrition goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {dietaryGoals.slice(0, 10).map((goal, _index) => (
                      <div
                        key={goal.goal}
                        className='flex items-center justify-between'
                      >
                        <span className='text-sm font-medium'>
                          {goal.goal
                            .replace('_', ' ')
                            .replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <Badge variant='secondary'>{goal.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Entries */}
            <Card className='mt-8'>
              <CardHeader>
                <CardTitle>Recent Waitlist Entries</CardTitle>
                <CardDescription>
                  Latest submissions to the waitlist
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {entries.slice(0, 20).map(entry => (
                    <div key={entry.id} className='border rounded-lg p-4'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-2 mb-2'>
                            <h3 className='font-semibold'>{entry.name}</h3>
                            <Badge
                              variant={
                                entry.status === 'waiting'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {entry.status}
                            </Badge>
                            {entry.priorityScore && (
                              <Badge variant='outline'>
                                <Star className='h-3 w-3 mr-1' />
                                {entry.priorityScore}
                              </Badge>
                            )}
                          </div>
                          <p className='text-sm text-muted-foreground mb-2'>
                            {entry.email}
                          </p>
                          <p className='text-sm mb-2'>
                            {entry.reasonForInterest}
                          </p>
                          <div className='flex flex-wrap gap-1'>
                            {entry.featurePriorities
                              ?.slice(0, 3)
                              .map(priority => (
                                <Badge
                                  key={priority}
                                  variant='outline'
                                  className='text-xs'
                                >
                                  {priority}
                                </Badge>
                              ))}
                          </div>
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
