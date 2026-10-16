import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import CourseDirectory from "./CourseDirectory";

type Course = {
  course_id: string;
  name: string;
  slug: string;
  county: string;
  town: string | null;
  course_type: string | null;
  holes: number;
  current_rating: number | null;
  rating_count: number;
  last_rated_date: string | null;
};

async function getCourses(): Promise<Course[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("course_current_ratings")
    .select("*")
    .order("county", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Could not load golf courses from Supabase.");
  }

  return (data ?? []) as Course[];
}

export default async function EastOfEnglandPage() {
  const courses = await getCourses();

  return (
    <main className="min-h-screen bg-[#f5f3ed] text-[#173b2c]">
      <header className="border-b border-[#173b2c]/15 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-bold tracking-tight">
            Golf Course Guide
          </Link>

          <span className="text-sm font-medium text-gray-600">
            East of England
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-14">
        <Link
          href="/"
          className="mb-8 inline-block text-sm font-semibold text-[#173b2c]/70 hover:text-[#173b2c]"
        >
          ← Back to home
        </Link>

        <p className="text-sm font-bold uppercase tracking-[0.25em]">
          Course Directory
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Golf courses in the
          <br />
          East of England
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">
          Discover courses across Bedfordshire, Cambridgeshire,
          Essex, Hertfordshire, Norfolk and Suffolk.
        </p>
      </section>

      <CourseDirectory courses={courses} />

      <section className="bg-[#173b2c] text-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/70">
            More than a directory
          </p>

          <h2 className="mt-3 max-w-xl text-3xl font-bold">
            Plan the round. Play it. Then rate it.
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Feature
              title="Course Ratings"
              text="Independent ratings that change as courses improve or decline."
            />

            <Feature
              title="Course Planner"
              text="Plan each hole around your handicap and club distances."
            />

            <Feature
              title="Digital Scorecard"
              text="Record gross, net and Stableford scores during your round."
            />
          </div>
        </div>
      </section>

      <footer className="bg-[#173b2c] px-6 pb-8 text-center text-sm text-white/60">
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
    <div className="rounded-2xl bg-white/10 p-6">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 leading-6 text-white/75">
        {text}
      </p>
    </div>
  );
}
