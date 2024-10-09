import Button from '@/components/ui/Button'

export default function NotFound404() {
  return (
    <div className="flex min-h-[100vh] w-full flex-col items-center justify-center gap-6">
      <img src="/logo.png" alt="" className="h-[100px] grayscale" />
      <p className="flex items-center gap-2 text-lg text-text2">404 - Page Not Found</p>
      <a href="/">
        <Button variant="main">Back to Stream</Button>
      </a>
    </div>
  )
}
