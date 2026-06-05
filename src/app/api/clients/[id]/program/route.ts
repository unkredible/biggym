import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentContext, isStaffRole } from "@/lib/gym";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExerciseInput {
  exerciseName: string;
  targetSets?: number;
  targetReps?: string;
  targetLoad?: string;
  restSeconds?: number;
  notes?: string;
}
interface DayInput {
  title: string;
  notes?: string;
  exercises: ExerciseInput[];
}
interface ProgramInput {
  title: string;
  goal?: string;
  days: DayInput[];
}

async function staffClient(clientId: string) {
  const ctx = await currentContext();
  if (!ctx?.gymId || !isStaffRole(ctx.role)) return null;
  const client = await prisma.client.findFirst({
    where: { id: clientId, gymId: ctx.gymId },
  });
  if (!client) return null;
  return { ctx, client };
}

/** GET current active program (with days + exercises) for a client. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ok = await staffClient(params.id);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const program = await prisma.workoutProgram.findFirst({
    where: { clientId: params.id, status: "active" },
    orderBy: { createdAt: "desc" },
    include: {
      days: {
        orderBy: { dayOrder: "asc" },
        include: { exercises: { orderBy: { exerciseOrder: "asc" } } },
      },
    },
  });
  return NextResponse.json({ program });
}

/** PUT replaces the client's active program with the posted structure. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ok = await staffClient(params.id);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: ProgramInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Program title required." }, { status: 400 });
  }

  const existing = await prisma.workoutProgram.findFirst({
    where: { clientId: params.id, status: "active" },
  });

  const program = existing
    ? await prisma.workoutProgram.update({
        where: { id: existing.id },
        data: { title: body.title.trim(), goal: body.goal?.trim() || null },
      })
    : await prisma.workoutProgram.create({
        data: {
          gymId: ok.client.gymId,
          clientId: params.id,
          title: body.title.trim(),
          goal: body.goal?.trim() || null,
          status: "active",
        },
      });

  // Replace days (cascade removes their exercises) then recreate.
  await prisma.workoutDay.deleteMany({ where: { programId: program.id } });
  let dayOrder = 1;
  for (const d of body.days ?? []) {
    const day = await prisma.workoutDay.create({
      data: {
        programId: program.id,
        title: d.title?.trim() || `Day ${dayOrder}`,
        dayOrder,
        notes: d.notes?.trim() || null,
      },
    });
    let exOrder = 1;
    for (const e of d.exercises ?? []) {
      if (!e.exerciseName?.trim()) continue;
      await prisma.workoutExercise.create({
        data: {
          workoutDayId: day.id,
          exerciseName: e.exerciseName.trim(),
          exerciseOrder: exOrder++,
          targetSets: Number(e.targetSets) || 3,
          targetReps: e.targetReps?.trim() || "8-10",
          targetLoad: e.targetLoad?.trim() || null,
          restSeconds: e.restSeconds != null ? Number(e.restSeconds) : null,
          notes: e.notes?.trim() || null,
        },
      });
    }
    dayOrder++;
  }

  return NextResponse.json({ ok: true, programId: program.id });
}
