import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="84"
          height="84"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-6"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2m16 0h2m-7-1v2m-6-2v2" />
        </svg>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">SQLBots AI Security Platform</h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-300 sm:text-lg">
          An AI-powered cloud platform that automates SQL scanning, intelligent detection, and workflow
          management at scale.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-900">
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
