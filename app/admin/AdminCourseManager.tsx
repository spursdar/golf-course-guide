"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Course = {
  id: string;
  name: string;
  county: string;
};

type CourseVersion = {
  id: string;
  version_name: string;
  effective_from: string;
  effective_to: string | null;
  major_change: boolean;
};

type Props = {
  courses: Course[];
};

export default function AdminCourseManager({ courses }: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [currentVersion, setCurrentVersion] =
    useState<CourseVersion | null>(null);

  const [loadingVersion, setLoadingVersion] = useState(false);
  const [versionError, setVersionError] = useState("");

  const [newVersionName, setNewVersionName] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [majorChange, setMajorChange] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");

  const [savingVersion, setSavingVersion] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const selectedCourse =
    courses.find((course) => course.id === selectedCourseId) ?? null;

  function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    return createClient(supabaseUrl, supabaseKey);
  }

  async function loadCurrentVersion(courseId: string) {
    setCurrentVersion(null);
    setVersionError("");
    setLoadingVersion(true);

    const supabase = getSupabase();

    if (!supabase) {
      setVersionError("Supabase environment variables are missing.");
      setLoadingVersion(false);
      return;
    }

    const { data, error } = await supabase
      .from("course_versions")
      .select(
        "id, version_name, effective_from, effective_to, major_change"
      )
      .eq("course_id", courseId)
      .is("effective_to", null)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      setVersionError("Could not load the current course version.");
      setLoadingVersion(false);
      return;
    }

    setCurrentVersion(data as CourseVersion | null);
    setLoadingVersion(false);
  }

  async function handleCourseChange(courseId: string) {
    setSelectedCourseId(courseId);

    setNewVersionName("");
    setEffectiveFrom("");
    setMajorChange(false);
    setChangeNotes("");
    setSaveMessage("");

    if (!courseId) {
      setCurrentVersion(null);
      setVersionError("");
      return;
    }

    await loadCurrentVersion(courseId);
  }

  async function handleCreateVersion() {
    setSaveMessage("");

    if (!selectedCourse || !selectedCourseId) {
      alert("Please select a course.");
      return;
    }

    if (!currentVersion) {
      alert("No current course version was found.");
      return;
    }

    if (!newVersionName.trim()) {
      alert("Please enter a version name.");
      return;
    }

    if (!effectiveFrom) {
      alert("Please choose the effective date.");
      return;
    }

    if (effectiveFrom <= currentVersion.effective_from) {
      alert(
        `The new version must start after ${currentVersion.effective_from}.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Create a new version for ${selectedCourse.name}?\n\n` +
        `New version: ${newVersionName.trim()}\n` +
        `Effective from: ${effectiveFrom}\n` +
        `Major change: ${majorChange ? "Yes" : "No"}\n\n` +
        `The current version will be closed automatically.`
    );

    if (!confirmed) {
      return;
    }

    setSavingVersion(true);

    try {
      const response = await fetch("/admin/api/course-version", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          currentVersionId: currentVersion.id,
          newVersionName: newVersionName.trim(),
          effectiveFrom,
          majorChange,
          changeNotes: changeNotes.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error ?? "Could not create the new version.");
        setSavingVersion(false);
        return;
      }

      setNewVersionName("");
      setEffectiveFrom("");
      setMajorChange(false);
      setChangeNotes("");

      setSaveMessage("New course version created successfully.");

      await loadCurrentVersion(selectedCourseId);
    } catch (error) {
      console.error(error);
      alert("Could not contact the server.");
    }

    setSavingVersion(false);
  }

  return (
    <div>
      <label className="block text-sm font-bold text-[#173b2c]">
        Select course
      </label>

      <select
        value={selectedCourseId}
        onChange={(event) =>
          handleCourseChange(event.target.value)
        }
        className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
      >
        <option value="">Choose a course...</option>

        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name} — {course.county}
          </option>
        ))}
      </select>

      <p className="mt-3 text-sm text-gray-500">
        {courses.length} active courses loaded.
      </p>

      {selectedCourse && (
        <div className="mt-6 rounded-xl bg-[#f7f5ed] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Selected course
          </p>

          <h2 className="mt-1 text-2xl font-bold text-[#173b2c]">
            {selectedCourse.name}
          </h2>

          <p className="mt-1 text-gray-600">
            {selectedCourse.county}
          </p>

          <div className="mt-6 border-t border-gray-300 pt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Current version
            </p>

            {loadingVersion && (
              <p className="mt-3 text-gray-600">
                Loading current version...
              </p>
            )}

            {versionError && (
              <p className="mt-3 font-semibold text-red-700">
                {versionError}
              </p>
            )}

            {!loadingVersion &&
              !versionError &&
              currentVersion && (
                <div className="mt-3">
                  <h3 className="text-xl font-bold text-[#173b2c]">
                    {currentVersion.version_name}
                  </h3>

                  <p className="mt-2 text-gray-600">
                    Effective from:{" "}
                    {currentVersion.effective_from}
                  </p>

                  <p className="mt-1 text-gray-600">
                    Effective to:{" "}
                    {currentVersion.effective_to ?? "Current"}
                  </p>

                  <p className="mt-1 text-gray-600">
                    Major change:{" "}
                    {currentVersion.major_change
                      ? "Yes"
                      : "No"}
                  </p>
                </div>
              )}

            {!loadingVersion &&
              !versionError &&
              !currentVersion && (
                <p className="mt-3 text-gray-600">
                  No current version found.
                </p>
              )}
          </div>

          <div className="mt-6 border-t border-gray-300 pt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Create new version
            </p>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="block text-sm font-bold text-[#173b2c]">
                  Version name
                </label>

                <input
                  type="text"
                  value={newVersionName}
                  onChange={(event) =>
                    setNewVersionName(event.target.value)
                  }
                  placeholder="e.g. New ownership 2027"
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#173b2c]">
                  Effective from
                </label>

                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(event) =>
                    setEffectiveFrom(event.target.value)
                  }
                  className="mt-2 rounded-xl border border-gray-300 bg-white px-4 py-3"
                />
              </div>

              <label className="flex items-center gap-3 text-sm font-bold text-[#173b2c]">
                <input
                  type="checkbox"
                  checked={majorChange}
                  onChange={(event) =>
                    setMajorChange(event.target.checked)
                  }
                />
                Major change
              </label>

              <div>
                <label className="block text-sm font-bold text-[#173b2c]">
                  Change notes
                </label>

                <textarea
                  value={changeNotes}
                  onChange={(event) =>
                    setChangeNotes(event.target.value)
                  }
                  placeholder="Describe what changed..."
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateVersion}
                disabled={savingVersion}
                className="rounded-xl bg-[#173b2c] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingVersion
                  ? "Creating version..."
                  : "Create version"}
              </button>

              {saveMessage && (
                <p className="font-semibold text-green-700">
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}