import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f3ed] text-[#173b2c]">
      <header className="border-b border-[#173b2c]/15 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xl font-bold tracking-tight">
              Golf Course Guide
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Independent course ratings
            </p>
          </div>

          <span className="text-sm font-medium">East of England</span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em]">
            Discover • Plan • Play • Rate
          </p>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Find your next
            <br />
            great round.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-gray-700">
            Discover golf courses across the East of England with
            independent ratings, course information, personalised
            planning and a digital scorecard.
          </p>

          <Link
            href="/east-of-england"
            className="mt-9 inline-block rounded-full bg-[#173b2c] px-7 py-4 font-semibold text-white transition hover:opacity-90"
          >
            Explore courses
          </Link>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          <Feature
            title="Course Ratings"
            text="Independent ratings that change as courses improve or decline."
          />

          <Feature
            title="Course Planner"
            text="Build a personalised strategy using your handicap and club distances."
          />

          <Feature
            title="Digital Scorecard"
            text="Track gross, net and Stableford scores while you play."
          />
        </div>
      </section>

      <footer className="mx-auto max-w-6xl border-t border-[#173b2c]/15 px-6 py-8 text-sm text-gray-500">
        Golf Course Guide • East of England
      </footer>
    </main>
  );
}

function Feature({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[#173b2c]/10 bg-white p-7 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-3 leading-7 text-gray-600">{text}</p>
    </div>
  );
}