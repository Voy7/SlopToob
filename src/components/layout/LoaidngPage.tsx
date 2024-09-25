import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'

// Generic page loading component
export default function LoadingPage({ text }: { text: string }) {
  return (
    <div className="flex min-h-[100vh] w-full flex-col items-center justify-center gap-6">
      <img src="/logo.png" alt="" className="h-[100px]" />
      <p className="flex items-center gap-2 text-lg text-text2">
        <Icon name="loading" className="text-text3" />
        {text}
      </p>
      {/* This is purely for nice alignment when coming from SocketConnecting page */}
      <div className="pointer-events-none invisible">
        <Button variant="main">Retry</Button>
      </div>
    </div>
  )
}
