'use client'

import { useEffect, useRef, useState } from 'react'
import { useAdminContext, sections } from '@/contexts/AdminContext'
import Icon from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'

const categories = [
  {
    label: 'Stream Player',
    sections: sections.filter((sec) => sec.category === 1)
  },
  {
    label: 'Miscellaneous',
    sections: sections.filter((sec) => sec.category === 2)
  },
  {
    label: 'Advanced',
    sections: sections.filter((sec) => sec.category === 3)
  }
]

// Admin modal navbar
export default function Navbar() {
  const { section, setSection, streamInfo } = useAdminContext()

  const navbarRef = useRef<HTMLDivElement>(null)

  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const [mobileNavHeight, setMobileNavHeight] = useState<number>(0)

  useEffect(() => {
    if (!navbarRef.current) return
    setMobileNavHeight(navbarRef.current.clientHeight)
  }, [navbarRef])

  return (
    <>
      <div
        className={twMerge(
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          'fixed left-0 z-10 h-full w-full bg-[rgba(63,63,70,0.4)] transition-opacity duration-300 ease-in-out lg:hidden'
        )}
      />
      <nav
        ref={navbarRef}
        className={twMerge(
          'relative flex h-full w-[56px] shrink-0 flex-col justify-between overflow-y-auto overflow-x-hidden lg:w-[200px]'
        )}>
        <div
          className={twMerge(
            mobileOpen ? 'w-[clamp(300px,80vw,200px)]' : 'w-[56px]',
            'fixed z-10 flex flex-col justify-between overflow-y-auto overflow-x-hidden bg-bg1 transition-[width] duration-300 ease-in-out lg:static lg:w-[200px]'
          )}
          style={{ height: mobileNavHeight ? `${mobileNavHeight}px` : '100%' }}>
          <div className="flex flex-col">
            <div className="m-2 mb-0 flex items-center gap-2 lg:hidden">
              <button
                className={twMerge(
                  'rounded-full bg-bg2 p-2 text-2xl duration-1000 active:bg-bg4 active:duration-0',
                  mobileOpen && 'bg-bg3'
                )}
                onClick={() => setMobileOpen(!mobileOpen)}>
                <Icon name="menu" />
              </button>
              <span
                className={twMerge(
                  'cursor-default whitespace-nowrap text-text3',
                  mobileOpen ? 'opacity-100' : 'opacity-0'
                )}>
                Choose a section
              </span>
            </div>
            <div className="h-2" />
            {categories.map((category) => (
              <div key={category.label} className="flex flex-col">
                <h3
                  className={twMerge(
                    'mb-2 cursor-default whitespace-nowrap px-2 font-bold text-white transition-opacity duration-300 lg:opacity-100',
                    mobileOpen ? 'opacity-100' : 'opacity-0'
                  )}>
                  {category.label}
                </h3>
                {category.sections.map((sec) => {
                  const isActive = sec.name === section.name
                  return (
                    <button
                      key={sec.name}
                      className={twMerge(
                        'flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap bg-transparent pl-3 text-lg text-text2',
                        isActive && sec.accentColor,
                        isActive
                          ? 'bg-bg2 font-bold text-white duration-500'
                          : 'transition-[background-color] duration-500 hover:text-white hover:underline active:bg-bg3 active:duration-0'
                      )}
                      onClick={() => {
                        setSection(sec.name)
                        setMobileOpen(false)
                      }}>
                      <Icon
                        name={sec.icon}
                        className={twMerge(
                          'shrink-0 rounded-md bg-blue-500 p-1 text-2xl transition-colors',
                          sec.accentColor,
                          isActive ? 'bg-opacity-100 text-white' : 'bg-opacity-50'
                        )}
                      />
                      <span
                        className={twMerge(
                          'w-full text-left transition-opacity duration-300 lg:opacity-100',
                          mobileOpen ? 'opacity-100' : 'opacity-0'
                        )}>
                        {sec.name}
                      </span>
                      <div
                        className={twMerge(
                          `${sec.accentColor} w-1 duration-300`,
                          isActive ? 'h-10 opacity-100' : 'h-0 opacity-50 duration-0'
                        )}
                      />
                    </button>
                  )
                })}
                <hr className="m-2 border-t border-border1" />
              </div>
            ))}
          </div>
          <p
            className={twMerge(
              'mb-2 whitespace-nowrap py-2 text-center text-text3 transition-opacity duration-300 lg:opacity-100',
              mobileOpen ? 'opacity-100' : 'opacity-0'
            )}>
            SlopToob &bull; v{streamInfo.appVersion}
          </p>
        </div>
      </nav>
    </>
  )
}
