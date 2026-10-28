import Link from 'next/link';
import type { ReactNode } from 'react';
import { HeaderInteractive } from './HeaderInteractive';
import Footer from './Footer';
import '../styles/legal.css';

export function LegalPage({ title, introduction, sections }: { title: string; introduction: ReactNode; sections: { title: string; content: ReactNode }[] }) {
  return <><HeaderInteractive /><main id="main" className="legal-page">
    <nav aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
    <header><h1>{title}</h1><p>Last updated: 25 October 2026</p><div>{introduction}</div></header>
    <div className="legal-layout"><nav className="legal-contents" aria-label={`${title} contents`}><h2>On this page</h2><ol>{sections.map((section, i) => <li key={section.title}><a href={`#section-${i + 1}`}>{section.title}</a></li>)}</ol></nav>
      <div className="legal-sections">{sections.map((section, i) => <section id={`section-${i + 1}`} key={section.title}><h2>{section.title}</h2>{section.content}</section>)}</div>
    </div>
  </main><Footer /></>;
}
