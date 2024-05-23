import HomePage from '@/app/page'

// Because when accessing (/) page, NextAuth will redirect to /stream if user is logged in
// So this acts the same as home page, but won't redirect, (linked in header)

export default function Home() {
  return <HomePage />
}