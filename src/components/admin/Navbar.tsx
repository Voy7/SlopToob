'use client'

import { useAdminContext, sections } from '@/contexts/AdminContext'
import Icon from '@/components/ui/Icon'
import { twMerge } from 'tailwind-merge'

const categories = [
  {
    label: 'Stream Settings',
    sections: sections.filter((sec) => sec.category === 1)
  },
  {
    label: 'Misc Elements',
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
    <nav className="flex w-[200px] flex-shrink-0 flex-row justify-between overflow-x-auto overflow-y-hidden border-b border-r-0 border-border1 md:flex-col md:overflow-y-auto md:overflow-x-hidden md:border-b md:border-r">
      <div className="flex flex-col">
        {categories.map((category) => (
          <div key={category.label} className="flex flex-col">
            <hr className="m-2 border-t border-border1" />
            <h3 className="mb-2 cursor-default px-2 font-bold text-white">{category.label}</h3>
            {category.sections.map((sec) => {
              const isActive = sec.name === section.name
              return (
                <button
                  key={sec.name}
                  className={twMerge(
                    'flex cursor-pointer items-center gap-2 whitespace-nowrap border-0 border-r-[0.25rem] border-transparent bg-transparent p-2 pl-4 pr-3 text-lg text-text3',
                    isActive
                      ? 'border-blue-500 bg-bg2 font-bold text-white duration-500'
                      : 'transition-[background-color] duration-500 hover:text-white hover:underline active:bg-bg3 active:duration-0'
                  )}
                  onClick={() => setSection(sec.name)}>
                  <Icon name={sec.icon} className="text-xl" />
                  <span>{sec.name}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <p className="py-2 text-center text-text3">{streamInfo.version}</p>
    </nav>
  )
}
