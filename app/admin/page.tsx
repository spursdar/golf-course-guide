import AdminCourseManager from "./AdminCourseManager";
import { createClient } from "@supabase/supabase-js";

type Course = {
  id: string;
  name: string;
  county: string;
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
    .from("courses")
    .select("id, name, county")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Could not load courses.");
  }

  return (data ?? []) as Course[];
}

export default async function AdminPage() {
  const courses = await getCourses();

  return (
    <main className="min-h-screen bg-[#f7f5ed] p-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Golf Course Guide
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[#173b2c]">
          Course Administration
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          Manage course versions and major course changes.
        </p>

        <AdminCourseManager courses={courses} />
      </div>
    </main>
  );
}