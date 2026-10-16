"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

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

type Props = {
  courses: Course[];
};

const counties = [
  "All",
  "Bedfordshire",
  "Cambridgeshire",
  "Essex",
  "Hertfordshire",
  "Norfolk",
  "Suffolk",
];

export default function CourseDirectory({ courses }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("All");

  const filteredCourses = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return courses
  .filter((course) => {
      const matchesCounty =
        selectedCounty === "All" ||
        course.county === selectedCounty;

      const matchesSearch =
        searchTerm === "" ||
        course.name.toLowerCase().includes(searchTerm) ||
        course.town?.toLowerCase().includes(searchTerm) ||
        course.county.toLowerCase().includes(searchTerm);

      return matchesCounty && matchesSearch;
       })
    .sort((a, b) => {
      const aRated = a.rating_count >= 5 && a.current_rating != null;
      const bRated = b.rating_count >= 5 && b.current_rating != null;

      if (aRated && !bRated) return -1;
      if (!aRated && bRated) return 1;

      if (aRated && bRated) {
        return Number(b.current_rating) - Number(a.current_rating);
      }

      return a.name.localeCompare(b.name);
    });
}, [courses, search, selectedCounty]);

  return (
    <>
      <section className="mx-auto max-w-6xl px-6">
        <div className="rounded-2xl border border-[#173b2c]/10 bg-white p-5 shadow-sm">
          <label
            htmlFor="course-search"
            className="mb-2 block text-sm font-semibold"
          >
            Find a golf course
          </label>

          <input
            id="course-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by course name, town or county..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#173b2c]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-8">
        <p className="mb-3 text-sm font-semibold">
          Browse by county
        </p>

        <div className="flex flex-wrap gap-2">
          {counties.map((county) => {
            const isSelected = selectedCounty === county;

            return (
              <button
                key={county}
                type="button"
                onClick={() => setSelectedCounty(county)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isSelected
                    ? "border-[#173b2c] bg-[#173b2c] text-white"
                    : "border-[#173b2c]/20 bg-white hover:border-[#173b2c]"
                }`}
              >
                {county}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">
              Live from the Golf Course Guide database
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {selectedCounty === "All"
                ? "All courses"
                : `${selectedCounty} courses`}
            </h2>
          </div>

          <span className="text-sm text-gray-500">
            {filteredCourses.length} course
            {filteredCourses.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid gap-5">
          {filteredCourses.map((course) => (
            <article
              key={course.course_id}
              className="rounded-2xl border border-[#173b2c]/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                    {course.county}
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    {course.name}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
                    {course.town && <span>{course.town}</span>}

                    {course.town && <span>•</span>}

                    <span>
                      {course.course_type ?? "Course"}
                    </span>

                    <span>•</span>

                    <span>{course.holes} holes</span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {course.rating_count >= 25
  ? "Established Guide Rating"
  : course.rating_count >= 10
    ? "Guide Rating"
    : course.rating_count >= 5
      ? "Provisional Guide Rating"
      : "Guide Rating"}
                  </p>

                  {course.current_rating !== null ? (
                    <>
                      <p className="mt-1 text-2xl font-bold">
                        {Number(course.current_rating).toFixed(1)}
                        <span className="text-sm font-medium text-gray-500">
                          {" "}
                          / 10
                        </span>
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {course.rating_count} review
                        {course.rating_count === 1 ? "" : "s"}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 font-bold">
                      Not yet rated
                    </p>
                  )}

                <Link
  href={`/east-of-england/course/${course.slug}`}
  className="mt-4 inline-block rounded-full border border-[#173b2c]/20 px-5 py-3 font-bold hover:bg-[#173b2c] hover:text-white"
>
  View course
  </Link>
        
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="rounded-2xl border bg-white p-8 text-center">
            <p className="font-bold">
              No courses found.
            </p>

            <p className="mt-2 text-gray-600">
              Try a different search or county.
            </p>
          </div>
        )}
      </section>
    </>
  );
}