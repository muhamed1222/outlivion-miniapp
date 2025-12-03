'use client';

import Link from 'next/link';

export default function WebFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { href: '/web/dashboard', label: 'Главная' },
      { href: '/web/billing', label: 'Оплата' },
      { href: '/web/faq', label: 'FAQ' },
    ],
    legal: [
      { href: '/web/terms', label: 'Условия использования' },
      { href: '/web/terms#privacy', label: 'Политика конфиденциальности' },
    ],
    social: [
      { href: 'https://t.me/outlivionbot', label: 'Telegram', external: true },
    ],
  };

  return (
    <footer className="border-t border-border-light bg-background-card">
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/web/dashboard" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-main flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-bold text-text-primary">Outlivion</span>
            </Link>
            <p className="text-text-secondary text-sm max-w-md">
              Быстрый и безопасный VPN сервис. Защитите свою приватность в интернете с Outlivion.
            </p>
            <div className="mt-4 flex items-center space-x-4">
              <a
                href="https://t.me/outlivionbot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background-tertiary hover:bg-primary-main/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Продукт</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary-main transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Правовая информация</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary-main transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border-light flex flex-col md:flex-row items-center justify-between">
          <p className="text-text-tertiary text-sm">
            © {currentYear} Outlivion. Все права защищены.
          </p>
          <p className="text-text-tertiary text-sm mt-2 md:mt-0">
            Сделано с ❤️ для вашей безопасности
          </p>
        </div>
      </div>
    </footer>
  );
}

