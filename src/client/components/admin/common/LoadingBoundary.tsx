'use client'

import { useEffect, useRef, useState } from 'react'
import Icon from '@/components/ui/Icon'

// If any node in the tree has a props.value of null, return true
function containsAnyLoading(node: React.ReactNode): boolean {
  if (typeof node !== 'object') return false

  if (Array.isArray(node)) {
    return node.some(containsAnyLoading)
  }

  if (node === null) return true

  if ('props' in node) return containsAnyLoading(node.props.children)

  return false
}

export default function LoadingBoundary({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState<boolean>(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // If any node in container contains [data-loading], show loading screen
  useEffect(() => {
    if (isReady) return
    if (!containerRef.current) return

    if (!containerRef.current.querySelector('[data-loading]')) {
      setIsReady(true)
    }
  }, [containerRef, children, isReady])

  return (
    <>
      <div ref={containerRef} className={isReady ? 'animate-section' : 'hidden'}>
        {children}
      </div>
      {!isReady && (
        <div className="animate-fade-in flex h-full w-full items-center justify-center py-8 text-[3rem] text-text3">
          <Icon name="loading" />
        </div>
      )}
    </>
  )

  // if (!isReady) {
  //   if (!containsAnyLoading(children)) setIsReady(true)
  //   return (
  //     <>
  //       <div className="hidden">{children}</div>
  //       <div className="flex h-full w-full items-center justify-center py-8 text-[3rem] text-text3">
  //         <Icon name="loading" />
  //       </div>
  //     </>
  //   )
  // }

  // return <div className="animate-section h-full w-full">{children}</div>
}

// 'use client'

// import { useState } from 'react'
// import Icon from '@/components/ui/Icon'

// // If any node in the tree has a props.value of null, return true
// function containsAnyLoading(node: React.ReactNode): boolean {
//   if (typeof node !== 'object') return false

//   if (Array.isArray(node)) {
//     return node.some(containsAnyLoading)
//   }

//   if (node === null) return true

//   if ('props' in node) {
//     if (node.props.value === null) return true
//     return containsAnyLoading(node.props.children)
//   }

//   return false
// }

// export default function LoadingBoundary({ children }: { children: React.ReactNode }) {
//   const [isReady, setIsReady] = useState<boolean>(false)

//   if (!isReady) {
//     if (!containsAnyLoading(children)) setIsReady(true)
//     return (
//       <div className="flex h-full w-full items-center justify-center py-8 text-[3rem] text-text3">
//         <Icon name="loading" />
//       </div>
//     )
//   }

//   return <div className="animate-section h-full w-full">{children}</div>
// }
