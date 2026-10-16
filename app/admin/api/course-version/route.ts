import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      courseId,
      currentVersionId,
      newVersionName,
      effectiveFrom,
      majorChange,
      changeNotes,
    } = body;

    if (
      !courseId ||
      !currentVersionId ||
      !newVersionName ||
      !effectiveFrom
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server Supabase configuration is missing." },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: currentVersion,
      error: currentVersionError,
    } = await supabase
      .from("course_versions")
      .select("effective_from")
      .eq("id", currentVersionId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (currentVersionError || !currentVersion) {
      return NextResponse.json(
        { error: "Could not load the current course version." },
        { status: 500 }
      );
    }

    if (effectiveFrom <= currentVersion.effective_from) {
      return NextResponse.json(
        {
          error: `The new version must start after ${currentVersion.effective_from}.`,
        },
        { status: 400 }
      );
    }

    const currentDate = new Date(
      `${effectiveFrom}T12:00:00`
    );

    currentDate.setDate(
      currentDate.getDate() - 1
    );

    const oldVersionEndDate = currentDate
      .toISOString()
      .slice(0, 10);

    let priorGuideRating: number | null = null;

    if (majorChange) {
      const {
        data: ratingData,
        error: ratingError,
      } = await supabase.rpc(
        "calculate_course_rating",
        {
          p_course_id: courseId,
          p_as_of_date: oldVersionEndDate,
        }
      );

      if (ratingError) {
        return NextResponse.json(
          {
            error: `Could not capture prior Guide Rating: ${ratingError.message}`,
          },
          { status: 500 }
        );
      }

      priorGuideRating =
        ratingData === null
          ? null
          : Number(ratingData);
    }

    const { error: closeError } =
      await supabase
        .from("course_versions")
        .update({
          effective_to: oldVersionEndDate,
        })
        .eq("id", currentVersionId)
        .eq("course_id", courseId)
        .is("effective_to", null);

    if (closeError) {
      return NextResponse.json(
        {
          error: `Could not close current version: ${closeError.message}`,
        },
        { status: 500 }
      );
    }

    const {
      data: newVersion,
      error: insertError,
    } = await supabase
      .from("course_versions")
      .insert({
        course_id: courseId,
        version_name: newVersionName.trim(),
        effective_from: effectiveFrom,
        effective_to: null,
        change_type: majorChange
          ? "major_change"
          : "version_update",
        change_notes:
          changeNotes?.trim() || null,
        major_change: Boolean(majorChange),
        prior_guide_rating: priorGuideRating,
      })
      .select(
        "id, version_name, effective_from, effective_to, major_change, prior_guide_rating"
      )
      .single();

    if (insertError) {
      await supabase
        .from("course_versions")
        .update({
          effective_to: null,
        })
        .eq("id", currentVersionId);

      return NextResponse.json(
        {
          error: `Could not create new version: ${insertError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      version: newVersion,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}