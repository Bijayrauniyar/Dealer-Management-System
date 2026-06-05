import { Link } from "react-router-dom";
import { MARKETING_HOME_PATH } from "@/lib/marketingRoutes";
import { MarketingShell } from "@/pages/marketing/MarketingShell";
import { marketingContainer, marketingCard, marketingSectionY } from "@/pages/marketing/marketingUi";

type Section = { title: string; body: string };

type Props = {
  title: string;
  updated: string;
  sections: Section[];
};

export function LegalDocumentPage({ title, updated, sections }: Props) {
  return (
    <MarketingShell>
      <article className={`${marketingSectionY} border-b border-slate-200 bg-white`}>
        <div className={`${marketingContainer} mx-auto max-w-3xl`}>
          <Link
            to={MARKETING_HOME_PATH}
            className="inline-flex text-sm font-medium text-teal-700 hover:underline"
          >
            ← Website
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: {updated}</p>
          <div className={`mt-10 space-y-8 ${marketingCard} p-6 sm:p-8 lg:p-10`}>
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="text-lg font-semibold text-teal-800">{s.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{s.body}</p>
              </section>
            ))}
          </div>
        </div>
      </article>
    </MarketingShell>
  );
}
