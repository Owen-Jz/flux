import Link from 'next/link';

export function PageFooter() {
  const footerLinks = {
    Product: [
      { label: 'Features', href: '/features' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Changelog', href: '/changelog' },
    ],
    Resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Community', href: '/community' },
      { label: 'Blog', href: '/blog' },
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
    Legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Licenses', href: '/licenses' },
    ],
  };

  return (
    <footer className="bg-white dark:bg-slate-950 pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <svg width="32" height="32" viewBox="0 0 94 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <rect y="30" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.3"/>
                <rect x="14" y="15" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.6"/>
                <rect x="28" width="66" height="66" rx="5" fill="#7E3BE9"/>
              </svg>
              <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white">flux</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
              The all-in-one workspace for high-performing engineering teams to ship faster.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2026 Flux Technologies Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/security" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}