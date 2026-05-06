'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const path = usePathname()
  const hiddenPaths = ['/', '/login', '/register', '/onboarding']

  if (hiddenPaths.includes(path)) return null

  const items = [
    { href: '/dashboard', icon: '🏠', label: 'Главная' },
    { href: '/submit-match', icon: '⚽', label: 'Матч' },
    { href: '/scout', icon: '🔍', label: 'Поиск' },
    { href: '/profile/edit', icon: '👤', label: 'Профиль' },
  ]

  return (
    <nav className="mobile-nav">
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-center"
        >
          <span className="text-xl">{item.icon}</span>
          <span className={`text-[10px] font-medium ${path === item.href ? 'text-[#AAFF00]' : 'text-[#666]'}`}>
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  )
}
