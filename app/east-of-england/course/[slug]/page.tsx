import Link from "next/link";import * as React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import RatingForm from "./RatingForm";
import TeeSelector from "./TeeSelector";
type Course = {
  course_id: string;
  name: string;
  slug: string;
  county: string;
  town: string | null;
  course_type: string | null;
  description: string | null;
  opened_year: number | null;
designer: string | null;
  holes: number;
  current_rating: number | null;
  baseline_rating: number | null;
baseline_rating_date: string | null;
baseline_rating_notes: string | null;

  rating_count: number;
  last_rated_date: string | null;

};

type Tee = {

  id: string;
  name: string;
  colour: string | null;
  total_yardage: number | null;
  par: number | null;
  course_rating: number | null;
  slope_rating: number | null;
};

type Hole = {
  id: string;
  hole_number: number;
  par: number | null;
  stroke_index: number | null;
  hole_name: string | null;
  yardage: number | null;
};

type RatingCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  weight: number;
  display_order: number;
};

type CategoryAverage = {
  category_id: string;
  average_score: number;
};

async function getCourse(slug: string): Promise<Course | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
  .from("course_current_ratings")
  .select(
    "course_id, name, slug, county, town, course_type, holes, current_rating, rating_count, last_rated_date,baseline_rating, baseline_rating_date, baseline_rating_notes"
  )
 .eq("slug", slug)
.maybeSingle(); 
const { data: courseDetails, error: courseDetailsError } = await supabase
  .from("courses")
  .select("description, opened_year, designer")
  .eq("slug", slug)
  .maybeSingle();


  if (error) {
    console.error(error);
    throw new Error("Could not load this golf se.");
  }

  return data
  ? ({
    ...data,
    description: courseDetails?.description ?? null,
    opened_year: courseDetails?.opened_year ?? null,
    designer: courseDetails?.designer ?? null,
  } as Course)
  : null;
}
async function getTees(courseId: string): Promise<Tee[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: version, error: versionError } = await supabase
    .from("course_versions")
    .select("id")
    .eq("course_id", courseId)
    .is("effective_to", null)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError) {
    console.error(versionError);
    throw new Error("Could not load course version.");
  }

  if (!version) {
    return [];
  }

  const { data, error } = await supabase
    .from("tees")
    .select(
      "id, name, colour, total_yardage, par, course_rating, slope_rating"
    )
    .eq("course_version_id", version.id)
    .order("total_yardage", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("Could not load tees.");
  }

  return (data ?? []) as Tee[];
}

async function getHoles(courseId: string, teeId: string): Promise<Hole[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: version, error: versionError } = await supabase
    .from("course_versions")
    .select("id")
    .eq("course_id", courseId)
    .is("effective_to", null)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError) {
    console.error(versionError);
    throw new Error("Could not load course version.");
  }

  if (!version) {
    return [];
  }

  const { data: holeData, error: holeError } = await supabase
    .from("holes")
    .select("id, hole_number, par, stroke_index, hole_name")
    .eq("course_version_id", version.id)
    .order("hole_number", { ascending: true });

  if (holeError) {
    console.error(holeError);
    throw new Error("Could not load holes.");
  }

  const { data: yardageData, error: yardageError } = await supabase
    .from("hole_tees")
    .select("hole_id, yardage, par, stroke_index")
    .eq("tee_id", teeId);

  if (yardageError) {
    console.error(yardageError);
    throw new Error("Could not load hole yardages.");
  }

  const teeDataByHole = new Map(
    (yardageData ?? []).map((row) => [
      row.hole_id,
      {
        yardage: row.yardage,
        par: row.par,
        stroke_index: row.stroke_index,
      },
    ])
  );

  return (holeData ?? []).map((hole) => {
    const teeHole = teeDataByHole.get(hole.id);

    return {
      ...hole,
      // Tee-specific scorecard values are authoritative when present.
      // Falling back keeps older courses that only use generic hole data working.
      par: teeHole?.par ?? hole.par ?? null,
      stroke_index: teeHole?.stroke_index ?? hole.stroke_index ?? null,
      yardage: teeHole?.yardage ?? null,
    };
  }) as Hole[];
}
async function getRatingCategories(): Promise<RatingCategory[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("rating_categories")
    .select("id, name, slug, description, weight, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Could not load rating categories.");
  }

  return (data ?? []) as RatingCategory[];
}
async function getCategoryAverages(
  courseId: string
): Promise<CategoryAverage[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("course_category_averages")
    .select("category_id, average_score")
    .eq("course_id", courseId);

  if (error) {
    console.error(error);
    throw new Error("Could not load category averages.");
  }

  return (data ?? []) as CategoryAverage[];
}
export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tee?: string }>;
}) {
  const { slug } = await params;
  const { tee } = await searchParams;

  const [course, ratingCategories] = await Promise.all([
    getCourse(slug),
    getRatingCategories(),
  ]);

  if (!course) {
    notFound();
  }
const tees = await getTees(course.course_id);
const scorecardTee =
  tees.find((item) => item.id === tee) ??
  tees.find((item) => item.name === "Purple") ??
  tees[0];

const holes =
  scorecardTee != null
    ? await getHoles(course.course_id, scorecardTee.id)
    : [];
  const categoryAverages = await getCategoryAverages(course.course_id);

  return (
    <main className="min-h-screen bg-[#f7f5ed] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/east-of-england"
          className="text-sm font-bold text-[#173b2c]"
        >
          ← Back to all courses
        </Link>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
            {course.county}
          </p>

          <h1 className="mt-3 text-4xl font-bold text-[#173b2c]">
            {course.name}
          </h1>

          <div className="mt-4 flex flex-wrap gap-3 text-lg text-gray-600">
            {course.town && <span>{course.town}</span>}
            {course.town && <span>•</span>}
            <span>{course.course_type ?? "Course"}</span>
            <span>•</span>
            <span>{course.holes} holes</span>
          </div>
          {course.description && (
  <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-700">
    {course.description}
  </p>
)}

{(course.opened_year || course.designer) && (
  <div className="mt-6 rounded-xl bg-gray-50 p-5">
    <div className="grid gap-3 sm:grid-cols-2">
      {course.opened_year && (
        <div>
          <span className="font-semibold text-[#173b2c]">Opened:</span>{" "}
          {course.opened_year}
        </div>
      )}

      {course.designer && (
        <div>
          <span className="font-semibold text-[#173b2c]">Design:</span>{" "}
          {course.designer}
        </div>
      )}
    </div>
  </div>
)}

          <div className="mt-8 border-t pt-6">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
              {course.rating_count >= 25
  ? "Established Guide Rating"
  : course.rating_count >= 10
    ? "Guide Rating"
    : course.rating_count >= 5
      ? "Provisional Guide Rating"
      : "Guide Rating"}
            </p>

            {course.rating_count >= 5 && course.current_rating !== null ? (
              <>
                <p className="mt-2 text-4xl font-bold text-[#173b2c]">
                  {Number(course.current_rating).toFixed(1)}
                </p>

                <p className="mt-1 text-gray-600">
                  Based on {course.rating_count} rating
                  {course.rating_count === 1 ? "" : "s"}
                </p>
              </>
            ) : course.baseline_rating !== null ? (
  <>
    <p className="mt-2 text-4xl font-bold text-[#173b2c]">
      {Number(course.baseline_rating).toFixed(1)}
    </p>

    <p className="mt-1 text-gray-600">
    Baseline Guide Rating — {course.rating_count} of 5 golfer ratings received
    </p>
  </>
) : (
  <p className="mt-2 text-xl font-bold text-[#173b2c]">
    Not yet rated
  </p>
)}
          
              
              

          </div>




        </div>
        {categoryAverages.length > 0 && (
  <section className="mt-8">
    <div className="mb-5">
      <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
        Category scores
      </p>

      <h2 className="mt-2 text-3xl font-bold text-[#173b2c]">
        How golfers rate this course
      </h2>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      {ratingCategories.map((category) => {
        const average = categoryAverages.find(
          (item) => item.category_id === category.id
        );

        if (!average) return null;

        return (
          <div
            key={category.id}
            className="rounded-2xl bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold text-[#173b2c]">
                {category.name}
              </h3>

              <span className="text-2xl font-bold text-[#173b2c]">
                {Number(average.average_score).toFixed(1)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </section>
)}
        <section className="mt-8">
          <div className="mb-5">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
              Rating methodology
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#173b2c]">
              What golfers rate
            </h2>

            <p className="mt-3 max-w-2xl text-gray-600">
  Each course is assessed 
  

 eight weighted categories. Recent ratings
  have more influence on the Guide Rating, while older ratings gradually
  carry less weight. If a course undergoes a major change such as new
  ownership, redevelopment or a redesign, older ratings are reduced further
  so the score better reflects the course as it is today.
</p>
              
              
              
            
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {ratingCategories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border border-[#173b2c]/10 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold text-[#173b2c]">
                    {category.name}
                  </h3>

                  <span className="rounded-full bg-[#173b2c]/10 px-3 py-1 text-sm font-bold text-[#173b2c]">
                    {Math.round(Number(category.weight) * 100)}%
                  </span>
                </div>
             {category.description ? (
  <p className="mt-3 leading-6 text-gray-600">
    {category.description}
  </p>
) : null}
                
              </div>
            ))}
          </div>
        </section>

     <section className="mt-12">
  <h2 className="text-3xl font-bold text-[#173b2c]">
    Course Information
  </h2>
  <TeeSelector
  tees={tees}
  selectedTeeId={scorecardTee?.id ?? ""}
  
/>
{scorecardTee && [scorecardTee].map((tee) => (
  <div
    key={tee.id}
    className="mt-4 rounded-xl border border-gray-200 bg-white p-5"
  >
    <div className="text-xl font-semibold text-[#173b2c]">
      {tee.name} Tee
    </div>

    <div className="mt-2 text-gray-700">
      {tee.total_yardage != null
  ? `${tee.total_yardage.toLocaleString()} yards`
  : "Yardage not yet verified"}
      {tee.par != null ? ` • Par ${tee.par}` : ""}
      <br />
{tee.course_rating != null ? `Course Rating ${tee.course_rating}` : ""}
{tee.slope_rating != null ? ` • Slope ${tee.slope_rating}` : ""}
    </div>
  </div>
))}
{holes.length > 0 && (
  <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
    <table className="w-full text-left">
      <thead className="border-b border-gray-200 bg-gray-50">
        <tr>
          <th className="px-4 py-3">Hole</th>
          <th className="px-4 py-3">Par</th>
          <th className="px-4 py-3">Yards</th>
          <th className="px-4 py-3">SI</th>
        </tr>
      </thead>
      <tbody>
       {holes.map((hole) => (
  <React.Fragment key={hole.id}>
    <tr key={hole.id} className="border-b border-gray-100">
      <td className="px-4 py-3">{hole.hole_number}</td>
      <td className="px-4 py-3">{hole.par ?? "-"}</td>
      <td className="px-4 py-3">{hole.yardage ?? "-"}</td>
      <td className="px-4 py-3">{hole.stroke_index ?? "-"}</td>
    </tr>

    {hole.hole_number === 9 && (
      <tr className="border-b border-gray-200 bg-gray-50 font-semibold">
      <td className="px-4 py-3">{holes.length === 9 ? "TOTAL" : "OUT"}</td>
        <td className="px-4 py-3">
          {holes
            .filter((h) => h.hole_number <= 9)
            .reduce((sum, h) => sum + (h.par ?? 0), 0)}
        </td>
        <td className="px-4 py-3">
          {holes
            .filter((h) => h.hole_number <= 9)
            .reduce((sum, h) => sum + (h.yardage ?? 0), 0)}
        </td>
        <td className="px-4 py-3">-</td>
      </tr>
    )}
    {hole.hole_number === 18 && (
  <>
    <tr className="border-b border-gray-200 bg-gray-50 font-semibold">
      <td className="px-4 py-3">IN</td>
      <td className="px-4 py-3">
        {holes
          .filter((h) => h.hole_number >= 10)
          .reduce((sum, h) => sum + (h.par ?? 0), 0)}
      </td>
      <td className="px-4 py-3">
        {holes
          .filter((h) => h.hole_number >= 10)
          .reduce((sum, h) => sum + (h.yardage ?? 0), 0)}
      </td>
      <td className="px-4 py-3">-</td>
    </tr>

    <tr className="bg-gray-100 font-bold">
      <td className="px-4 py-3">TOTAL</td>
      <td className="px-4 py-3">
        {holes.reduce((sum, h) => sum + (h.par ?? 0), 0)}
      </td>
      <td className="px-4 py-3">
        {holes.reduce((sum, h) => sum + (h.yardage ?? 0), 0)}
      </td>
      <td className="px-4 py-3">-</td>
    </tr>
  </>
)}
  </React.Fragment>
))}
      </tbody>
    </table>
  </div>
)}
</section>   

    <RatingForm
  courseId={course.course_id}
  categories={ratingCategories}
/>
      </div>
    </main>
  );
}