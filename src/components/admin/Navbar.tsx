'use client'

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

  return (
    <nav className="flex w-[200px] shrink-0 flex-row justify-between overflow-x-auto overflow-y-hidden border-b border-r-0 border-border1 md:flex-col md:overflow-y-auto md:overflow-x-hidden md:border-b md:border-r">
      <div className="flex flex-col">
        {categories.map((category) => (
          <div key={category.label} className="flex flex-col">
            <h3 className="mb-2 cursor-default px-2 font-bold text-white">{category.label}</h3>
            {category.sections.map((sec) => {
              const isActive = sec.name === section.name
              return (
                <button
                  key={sec.name}
                  className={twMerge(
                    'flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap bg-transparent pl-4 text-lg text-text2',
                    isActive && sec.accentColor,
                    isActive
                      ? 'bg-bg2 font-bold text-white duration-500'
                      : 'transition-[background-color] duration-500 hover:text-white hover:underline active:bg-bg3 active:duration-0'
                  )}
                  onClick={() => setSection(sec.name)}>
                  <Icon
                    name={sec.icon}
                    className={twMerge(
                      'rounded-md bg-blue-500 p-1 text-2xl transition-colors',
                      sec.accentColor,
                      isActive ? 'bg-opacity-100 text-white' : 'bg-opacity-50'
                    )}
                  />
                  <span className="w-full text-left">{sec.name}</span>
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
      <p className="py-2 text-center text-text3">SlopToob &bull; v{streamInfo.appVersion}</p>
    </nav>
  )
}
