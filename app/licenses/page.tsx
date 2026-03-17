import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageFooter } from '@/components/layout/page-footer';

export const metadata: Metadata = {
  title: 'Open Source Licenses | Flux',
  description: 'Third-party open source licenses used in Flux.',
};

const licenses = [
  { name: 'React', license: 'MIT', url: 'https://reactjs.org' },
  { name: 'Next.js', license: 'MIT', url: 'https://nextjs.org' },
  { name: 'Tailwind CSS', license: 'MIT', url: 'https://tailwindcss.com' },
  { name: 'Framer Motion', license: 'MIT', url: 'https://www.framer.com/motion' },
  { name: 'Lucide React', license: 'ISC', url: 'https://lucide.dev' },
  { name: 'Zod', license: 'MIT', url: 'https://zod.dev' },
  { name: 'Prisma', license: 'Apache 2.0', url: 'https://prisma.io' },
  { name: 'PostgreSQL', license: 'PostgreSQL', url: 'https://postgresql.org' },
];

export default function LicensesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PageHeader />
      <main className="pt-32 pb-20">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
            Open Source Licenses
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
            Flux uses the following open source libraries. We're grateful to the
            maintainers and contributors of these projects.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-4 pr-4 font-bold text-slate-900 dark:text-white">
                    Project
                  </th>
                  <th className="text-left py-4 px-4 font-bold text-slate-900 dark:text-white">
                    License
                  </th>
                  <th className="text-left py-4 pl-4 font-bold text-slate-900 dark:text-white">
                    Website
                  </th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((item) => (
                  <tr
                    key={item.name}
                    className="border-b border-slate-200 dark:border-slate-800"
                  >
                    <td className="py-4 pr-4 text-slate-900 dark:text-white font-medium">
                      {item.name}
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm">
                        {item.license}
                      </span>
                    </td>
                    <td className="py-4 pl-4">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        {item.url.replace('https://', '')}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-12 text-slate-600 dark:text-slate-400">
            If you believe any license information is incorrect, please{' '}
            <a href="/contact" className="text-purple-600 dark:text-purple-400">
              contact us
            </a>.
          </p>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
