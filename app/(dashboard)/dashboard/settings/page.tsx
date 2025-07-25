'use client';

import {
    deleteAccount,
    updateAccount,
    updatePassword,
} from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User as UserType } from '@/lib/db/schema';
import { customerPortalAction } from '@/lib/payments/actions';
import { CreditCard, Loader2, Lock, Shield, Trash2, User } from 'lucide-react';
import { Suspense, useActionState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type AccountState = {
  name?: string;
  error?: string;
  success?: string;
};

type PasswordState = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type DeleteState = {
  password?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: AccountState;
  nameValue?: string;
  emailValue?: string;
};

function AccountForm({
  state,
  nameValue = '',
  emailValue = '',
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor='name' className='mb-2'>
          Name
        </Label>
        <Input
          id='name'
          name='name'
          placeholder='Enter your name'
          defaultValue={state.name || nameValue}
          required
        />
      </div>
      <div>
        <Label htmlFor='email' className='mb-2'>
          Email
        </Label>
        <Input
          id='email'
          name='email'
          type='email'
          placeholder='Enter your email'
          defaultValue={emailValue}
          required
        />
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: AccountState }) {
  const { data: user } = useSWR<UserType>('/api/user', fetcher);
  return (
    <AccountForm
      state={state}
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
    />
  );
}

export default function SettingsPage() {
  const [accountState, accountAction, isAccountPending] = useActionState<
    AccountState,
    FormData
  >(updateAccount, {});

  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    PasswordState,
    FormData
  >(updatePassword, {});

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    DeleteState,
    FormData
  >(deleteAccount, {});

  return (
    <section className='flex-1 px-4 sm:px-6 py-4 lg:py-8'>
      <h1 className='text-lg lg:text-2xl font-medium text-foreground mb-6'>
        Settings
      </h1>

      {/* Subscription Management Section */}
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='mb-4 text-muted-foreground'>
            Manage your subscription, switch plans, or cancel at the end of your
            billing period. You will be redirected to our secure Stripe Billing
            Portal.
          </p>
          {/*
            The form below triggers the customerPortalAction server action, which creates a Stripe Billing Portal session and redirects the user.
            This is the recommended, secure way to let users self-manage their subscription.
          */}
          <form action={customerPortalAction}>
            <Button type='submit' variant='default'>
              Manage Subscription
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Information Section */}
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' action={accountAction}>
            <Suspense fallback={<AccountForm state={accountState} />}>
              <AccountFormWithData state={accountState} />
            </Suspense>
            {accountState.error && (
              <p className='text-destructive text-sm'>{accountState.error}</p>
            )}
            {accountState.success && (
              <p className='text-primary text-sm'>{accountState.success}</p>
            )}
            <Button type='submit' disabled={isAccountPending}>
              {isAccountPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' action={passwordAction}>
            <div>
              <Label htmlFor='current-password' className='mb-2'>
                Current Password
              </Label>
              <Input
                id='current-password'
                name='currentPassword'
                type='password'
                autoComplete='current-password'
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.currentPassword}
              />
            </div>
            <div>
              <Label htmlFor='new-password' className='mb-2'>
                New Password
              </Label>
              <Input
                id='new-password'
                name='newPassword'
                type='password'
                autoComplete='new-password'
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.newPassword}
              />
            </div>
            <div>
              <Label htmlFor='confirm-password' className='mb-2'>
                Confirm New Password
              </Label>
              <Input
                id='confirm-password'
                name='confirmPassword'
                type='password'
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.confirmPassword}
              />
            </div>
            {passwordState.error && (
              <p className='text-destructive text-sm'>{passwordState.error}</p>
            )}
            {passwordState.success && (
              <p className='text-primary text-sm'>{passwordState.success}</p>
            )}
            <Button type='submit' disabled={isPasswordPending}>
              {isPasswordPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className='mr-2 h-4 w-4' />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone - Delete Account Section */}
      <Card>
        <CardHeader>
          <CardTitle className='text-destructive'>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </p>
          <form action={deleteAction} className='space-y-4'>
            <div>
              <Label htmlFor='delete-password' className='mb-2'>
                Confirm Password
              </Label>
              <Input
                id='delete-password'
                name='password'
                type='password'
                required
                minLength={8}
                maxLength={100}
                defaultValue={deleteState.password}
              />
            </div>
            {deleteState.error && (
              <p className='text-destructive text-sm'>{deleteState.error}</p>
            )}
            <Button
              type='submit'
              className='bg-destructive hover:bg-destructive/90'
              disabled={isDeletePending}
            >
              {isDeletePending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
