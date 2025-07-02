'use client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className='flex-1 overflow-y-auto p-0 lg:p-4'>{children}</main>;
}
