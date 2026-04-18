import { count, eq, and, isNull, or, sql } from "drizzle-orm";
import db from "../../database/index.js";
import {
  ageGroupTariffTable,
  eventRoomTable,
} from "../../database/schema.js";

export type AgeGroupTariff = typeof ageGroupTariffTable.$inferSelect;
export type NewAgeGroupTariff = typeof ageGroupTariffTable.$inferInsert;

function deriveAgeGroupName(minAge: number, maxAge: number | null): string {
  if (minAge >= 13) {
    return "Adult";
  }
  if (minAge >= 6 && (maxAge === null || maxAge <= 12)) {
    return "Child";
  }
  if (minAge >= 0 && (maxAge === null || maxAge <= 5)) {
    return "Infant";
  }
  if (maxAge !== null) {
    return `${minAge}-${maxAge}`;
  }
  return `${minAge}+`;
}

export async function getActiveAgeGroupTariffs(
  eventRoomId: string,
  effectiveDate: string | Date = new Date().toISOString().slice(0, 10),
) {
  const targetDate =
    effectiveDate instanceof Date
      ? effectiveDate.toISOString().slice(0, 10)
      : effectiveDate;

  return db
    .select({
      id: ageGroupTariffTable.id,
      workspaceId: ageGroupTariffTable.workspaceId,
      eventRoomId: ageGroupTariffTable.eventRoomId,
      minAge: ageGroupTariffTable.minAge,
      maxAge: ageGroupTariffTable.maxAge,
      price: ageGroupTariffTable.price,
      validFrom: ageGroupTariffTable.validFrom,
      validTo: ageGroupTariffTable.validTo,
    })
    .from(ageGroupTariffTable)
    .where(
      and(
        eq(ageGroupTariffTable.eventRoomId, eventRoomId),
        sql`${ageGroupTariffTable.validFrom} <= ${targetDate}`,
        or(
          isNull(ageGroupTariffTable.validTo),
          sql`${ageGroupTariffTable.validTo} >= ${targetDate}`,
        ),
      ),
    )
    .orderBy(ageGroupTariffTable.minAge);
}

export async function getAgeGroupTariffs(
  workspaceId: string,
  eventRoomId?: string,
  page = 1,
  limit = 10,
) {
  const conditions = [eq(ageGroupTariffTable.workspaceId, workspaceId)];
  if (eventRoomId) {
    conditions.push(eq(ageGroupTariffTable.eventRoomId, eventRoomId));
  }

  const offset = (page - 1) * limit;

  const [tariffs, countResult] = await Promise.all([
    db
      .select({
        id: ageGroupTariffTable.id,
        workspaceId: ageGroupTariffTable.workspaceId,
        eventRoomId: ageGroupTariffTable.eventRoomId,
        minAge: ageGroupTariffTable.minAge,
        maxAge: ageGroupTariffTable.maxAge,
        price: ageGroupTariffTable.price,
        validFrom: ageGroupTariffTable.validFrom,
        validTo: ageGroupTariffTable.validTo,
        createdAt: ageGroupTariffTable.createdAt,
        updatedAt: ageGroupTariffTable.updatedAt,
        roomName: eventRoomTable.name,
      })
      .from(ageGroupTariffTable)
      .leftJoin(eventRoomTable, eq(ageGroupTariffTable.eventRoomId, eventRoomTable.id))
      .where(and(...conditions))
      .orderBy(ageGroupTariffTable.minAge)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(ageGroupTariffTable)
      .where(and(...conditions)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  const tariffsWithName = tariffs.map((tariff) => ({
    ...tariff,
    name: deriveAgeGroupName(tariff.minAge, tariff.maxAge),
  }));

  return { data: tariffsWithName, total };
}

export async function getAgeGroupTariffById(id: string) {
  const [tariff] = await db
    .select({
      id: ageGroupTariffTable.id,
      workspaceId: ageGroupTariffTable.workspaceId,
      eventRoomId: ageGroupTariffTable.eventRoomId,
      minAge: ageGroupTariffTable.minAge,
      maxAge: ageGroupTariffTable.maxAge,
      price: ageGroupTariffTable.price,
      validFrom: ageGroupTariffTable.validFrom,
      validTo: ageGroupTariffTable.validTo,
      createdAt: ageGroupTariffTable.createdAt,
      updatedAt: ageGroupTariffTable.updatedAt,
      roomName: eventRoomTable.name,
    })
    .from(ageGroupTariffTable)
    .leftJoin(eventRoomTable, eq(ageGroupTariffTable.eventRoomId, eventRoomTable.id))
    .where(eq(ageGroupTariffTable.id, id))
    .limit(1);

  if (!tariff) {
    throw new Error("Age group tariff not found");
  }

  return { ...tariff, name: deriveAgeGroupName(tariff.minAge, tariff.maxAge) };
}

export async function createAgeGroupTariff(data: {
  workspaceId: string;
  eventRoomId: string;
  minAge: number;
  maxAge: number | null;
  price: number;
  validFrom?: string;
  validTo?: string;
}) {
  const derivedName = deriveAgeGroupName(data.minAge, data.maxAge);

  const [tariff] = await db
    .insert(ageGroupTariffTable)
    .values({
      workspaceId: data.workspaceId,
      eventRoomId: data.eventRoomId,
      minAge: data.minAge,
      maxAge: data.maxAge,
      price: data.price,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validTo: data.validTo ? new Date(data.validTo) : undefined,
    })
    .returning();

  const [room] = await db
    .select({ name: eventRoomTable.name })
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, data.eventRoomId))
    .limit(1);

  return { ...tariff, name: derivedName, roomName: room?.name };
}

export async function updateAgeGroupTariff(
  id: string,
  data: {
    eventRoomId?: string;
    minAge?: number;
    maxAge?: number | null;
    price?: number;
    validFrom?: string;
    validTo?: string;
  },
) {
  const updatedData: {
    eventRoomId?: string;
    minAge?: number;
    maxAge?: number | null;
    price?: number;
    validFrom?: Date;
    validTo?: Date;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (data.eventRoomId !== undefined) {
    updatedData.eventRoomId = data.eventRoomId;
  }
  if (data.minAge !== undefined) {
    updatedData.minAge = data.minAge;
  }
  if (data.maxAge !== undefined) {
    updatedData.maxAge = data.maxAge;
  }
  if (data.price !== undefined) {
    updatedData.price = data.price;
  }
  if (data.validFrom !== undefined) {
    updatedData.validFrom = data.validFrom ? new Date(data.validFrom) : undefined;
  }
  if (data.validTo !== undefined) {
    updatedData.validTo = data.validTo ? new Date(data.validTo) : undefined;
  }

  const [updated] = await db
    .update(ageGroupTariffTable)
    .set(updatedData)
    .where(eq(ageGroupTariffTable.id, id))
    .returning();

  if (!updated) {
    throw new Error("Age group tariff not found");
  }

  const derivedName = deriveAgeGroupName(updated.minAge, updated.maxAge);

  const [room] = await db
    .select({ name: eventRoomTable.name })
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, updated.eventRoomId))
    .limit(1);

  return { ...updated, name: derivedName, roomName: room?.name };
}

export async function deleteAgeGroupTariff(id: string) {
  const [deleted] = await db
    .delete(ageGroupTariffTable)
    .where(eq(ageGroupTariffTable.id, id))
    .returning();

  if (!deleted) {
    throw new Error("Age group tariff not found");
  }

  return { success: true };
}