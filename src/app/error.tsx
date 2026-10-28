'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <main className="mx-auto max-w-xl px-6 py-24 text-center"><h1 className="mb-4 text-2xl">We couldn’t load this page</h1><p className="mb-6">Please try again in a moment.</p><button className="bg-primary px-6 py-3 text-white" onClick={reset}>Try again</button><p className="mt-6"><Link href="/">Return home</Link></p></main>;
}
