"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
type RatingCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  weight: number;
  display_order: number;
};
  
type Props = {
  courseId: string;
  categories: RatingCategory[];
};
function getVisitorId() {
  const storageKey = "golf-guide-visitor-id";

  let visitorId = localStorage.getItem(storageKey);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(storageKey, visitorId);
  }

  return visitorId;
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
  


export default function RatingForm({ courseId, categories }: Props) {
 const router = useRouter(); 
  const [scores, setScores] = useState<Record<string, number>>({});
const [datePlayed, setDatePlayed] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [successMessage, setSuccessMessage] = useState("");
  const weightedScore = useMemo(() => {
    const completed = categories.every(
      (category) => scores[category.id] !== undefined
    );

    if (!completed || categories.length === 0) {
      return null;
    }

    const total = categories.reduce((sum, category) => {
      const score = scores[category.id] ?? 0;
      return sum + score * Number(category.weight);
    }, 0);

    return total;
  }, [categories, scores]);
    async function handleSubmit() {
  if (!datePlayed) {
    alert("Please choose the date you played.");
    return;
  }

  if (weightedScore === null) {
    alert("Please score all eight categories.");
    return;
  }
  const visitorId = getVisitorId();
  setIsSubmitting(true);
const { data: currentVersion, error: versionError } = await supabase
  .from("course_versions")
  .select("id")
  .eq("course_id", courseId)
  .lte("effective_from", datePlayed)
  .or(`effective_to.is.null,effective_to.gte.${datePlayed}`)
  .order("effective_from", { ascending: false })
  .limit(1)
  .maybeSingle();
 if (versionError || !currentVersion) {
  console.error(versionError);
  alert("Could not load the current course version. Please try again.");
  setIsSubmitting(false);
  return;
}
  const { data: review, error } = await supabase
  .from("reviews")
  .insert({
    course_id: courseId,
  course_version_id: currentVersion.id,
    date_played: datePlayed,
    overall_weighted_score: weightedScore,
  visitor_id: visitorId,
  })
  .select("id")
  .single();

if (error) {
  console.error(error);
  alert(`Could not save review: ${error.message}`);
   setIsSubmitting(false);
  return;
}
const scoreRows = categories.map((category) => ({
  review_id: review.id,
  category_id: category.id,
  score: scores[category.id],
}));

const { error: scoresError } = await supabase
  .from("review_scores")
  .insert(scoreRows);

if (scoresError) {
  console.error(scoresError);
  alert(`Review saved, but scores failed: ${scoresError.message}`);
 setIsSubmitting(false); 
  return;
}
setSuccessMessage("Rating submitted — thank you!");
setScores({});
setDatePlayed("");
setIsSubmitting(false);
router.refresh();
}
  return (
    <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
          Rate this course
        </p>

        <h2 className="mt-2 text-3xl font-bold text-[#173b2c]">
          Your course rating
        </h2>
      {successMessage && (
  <div className="mt-4 rounded-xl bg-green-50 p-4 font-semibold text-green-800">
    {successMessage}
  </div>
)}
        <p className="mt-3 max-w-2xl text-gray-600">
          Score each category from 1 to 10. Your weighted overall score will
          update automatically.
        </p>
      </div>

      <div className="mb-8">
  <label
    htmlFor="datePlayed"
    className="block text-sm font-bold text-[#173b2c]"
  >
    Date played
  </label>

  <input
    id="datePlayed"
    type="date"
    value={datePlayed}
    onChange={(e) => setDatePlayed(e.target.value)}
    className="mt-2 rounded-xl border border-gray-300 px-4 py-3 text-[#173b2c]"
  />
</div>

      <div className="space-y-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="rounded-2xl border border-[#173b2c]/10 p-5"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-bold text-[#173b2c]">
                  {category.name}
                </h3>

                {category.description ? (
                  <p className="mt-1 text-sm text-gray-600">
                    {category.description}
                  </p>
                ) : null}
              </div>

              <span className="text-sm font-bold text-gray-500">
                {Math.round(Number(category.weight) * 100)}%
              </span>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
              {Array.from({ length: 10 }, (_, index) => {
                const score = index + 1;
                const selected = scores[category.id] === score;

                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() =>
                      setScores((current) => ({
                        ...current,
                        [category.id]: score,
                      }))
                    }
                    className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                      selected
                        ? "border-[#173b2c] bg-[#173b2c] text-white"
                        : "border-[#173b2c]/20 bg-white text-[#173b2c] hover:border-[#173b2c]"
                    }`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-[#f7f5ed] p-6">
        <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
          Weighted score
        </p>

        {weightedScore !== null ? (
          <p className="mt-2 text-4xl font-bold text-[#173b2c]">
            {weightedScore.toFixed(1)} / 10
          </p>
        ) : (
          <p className="mt-2 text-lg font-bold text-[#173b2c]">
            Complete all eight categories
          </p>
        )}
      </div>
      <button
  type="button"
  onClick={handleSubmit}
  disabled={isSubmitting}
  className="mt-6 w-full rounded-xl bg-[#173b2c] px-6 py-4 text-lg font-bold text-white hover:opacity-90"
>
  {isSubmitting ? "Saving..." : "Submit rating"}

</button>
    </section>
  );
}