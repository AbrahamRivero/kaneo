import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import type db from "../../database/index.js";
import {
  ageGroupTariffTable,
  roomTariffTable,
  serviceTable,
} from "../../database/schema.js";

export type AgeBreakdown = {
  adults: number;
  children: number;
  infants: number;
};

export type AgeGroupPricingLineItem = {
  ageGroupTariffId: string | null;
  groupName: string;
  minAge: number;
  maxAge: number | null;
  count: number;
  unitPrice: number;
  totalPrice: number;
};

export type PricingInput = {
  roomTariffId?: string | null;
  eventRoomId?: string;
  ageBreakdown?: AgeBreakdown;
  dateRange?: {
    from: string;
    to?: string;
  };
  services: Array<{
    serviceId: string;
    unitPrice: number;
    pax: number;
    totalPrice: number;
  }>;
  dayTariffs?: Array<{
    date: string;
    roomTariffId?: string;
    price: number;
  }>;
};

export type PricingOutput = {
  totalRoomPrice: number;
  totalServicePrice: number;
  roomChargeAmount: number;
  serviceChargeAmount: number;
  grandTotal: number;
  ageGroupPricingLineItems?: AgeGroupPricingLineItem[];
};

function deriveAgeGroupName(minAge: number, maxAge: number | null): string {
  if (minAge >= 13) {
    return "Adult";
  }
  if (minAge >= 5 && (maxAge === null || maxAge <= 12)) {
    return "Child";
  }
  if (minAge >= 0 && (maxAge === null || maxAge <= 4)) {
    return "Infant";
  }
  if (maxAge !== null) {
    return `${minAge}-${maxAge}`;
  }
  return `${minAge}+`;
}

async function getActiveAgeGroupTariffs(
  database: typeof db,
  eventRoomId: string,
  effectiveDate: string,
) {
  // This function selects age-group tariffs that are valid for the given effectiveDate.
  // Tariffs are considered valid if:
  // - validFrom <= effectiveDate
  // - validTo is null (no end date) OR validTo >= effectiveDate
  // This ensures that future tariff changes don't retroactively affect existing reservations,
  // but new reservations use the correct tariff for their event date.
  return database
    .select({
      id: ageGroupTariffTable.id,
      minAge: ageGroupTariffTable.minAge,
      maxAge: ageGroupTariffTable.maxAge,
      price: ageGroupTariffTable.price,
    })
    .from(ageGroupTariffTable)
    .where(
      and(
        eq(ageGroupTariffTable.eventRoomId, eventRoomId),
        sql`${ageGroupTariffTable.validFrom} <= ${effectiveDate}`,
        or(
          isNull(ageGroupTariffTable.validTo),
          sql`${ageGroupTariffTable.validTo} >= ${effectiveDate}`,
        ),
      ),
    )
    .orderBy(ageGroupTariffTable.minAge);
}

function calculateDaysInRange(from: string, to?: string): number {
  const start = new Date(from);
  const end = to ? new Date(to) : start;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

async function calculateAgeGroupPricing(
  database: typeof db,
  eventRoomId: string,
  ageBreakdown: AgeBreakdown,
  dateRange: { from: string; to?: string },
) {
  const days = calculateDaysInRange(dateRange.from, dateRange.to);
  const effectivePricingDate = dateRange.from;

  const tariffs = await getActiveAgeGroupTariffs(
    database,
    eventRoomId,
    effectivePricingDate,
  );

  const ageGroups = [
    {
      groupName: "Adult",
      minAge: 13,
      maxAge: null,
      count: ageBreakdown.adults,
    },
    { groupName: "Child", minAge: 5, maxAge: 12, count: ageBreakdown.children },
    { groupName: "Infant", minAge: 0, maxAge: 4, count: ageBreakdown.infants },
  ];

  const lineItems: AgeGroupPricingLineItem[] = [];
  let totalRoomPrice = 0;

  for (const group of ageGroups) {
    if (group.count <= 0) {
      continue;
    }

    const tariff = tariffs.find(
      (t) => deriveAgeGroupName(t.minAge, t.maxAge) === group.groupName,
    );

    if (!tariff) {
      throw new Error(
        `No active age-group tariff defined for ${group.groupName}`,
      );
    }

    const pricePerDay = tariff.price * group.count;
    const totalPrice = Math.round(pricePerDay * days);
    totalRoomPrice += totalPrice;

    lineItems.push({
      ageGroupTariffId: tariff.id,
      groupName: group.groupName,
      minAge: tariff.minAge,
      maxAge: tariff.maxAge,
      count: group.count,
      unitPrice: tariff.price,
      totalPrice,
    });
  }

  return { totalRoomPrice, lineItems, days };
}

export async function calculateReservationPricing(
  input: PricingInput,
  database: typeof db,
): Promise<PricingOutput> {
  const {
    roomTariffId,
    eventRoomId,
    ageBreakdown,
    dateRange,
    services,
    dayTariffs,
  } = input;

  const effectiveDateRange = dateRange ?? {
    from: new Date().toISOString().slice(0, 10),
  };
  const days = calculateDaysInRange(
    effectiveDateRange.from,
    effectiveDateRange.to,
  );

  let totalServicePrice = 0;
  if (services.length > 0) {
    totalServicePrice = services.reduce(
      (sum, s) => sum + s.unitPrice * s.pax,
      0,
    );
  }

  let effectiveRoomPrice = 0;
  let ageGroupPricingLineItems: AgeGroupPricingLineItem[] | undefined;

  const hasValidAgeBreakdown =
    ageBreakdown &&
    (ageBreakdown.adults > 0 ||
      ageBreakdown.children > 0 ||
      ageBreakdown.infants > 0);

  if (dayTariffs && dayTariffs?.length > 0) {
    effectiveRoomPrice = dayTariffs.reduce((sum, dt) => sum + dt.price, 0);
  } else if (eventRoomId && hasValidAgeBreakdown) {
    const priced = await calculateAgeGroupPricing(
      database,
      eventRoomId,
      ageBreakdown,
      effectiveDateRange,
    );
    effectiveRoomPrice = priced.totalRoomPrice;
    ageGroupPricingLineItems = priced.lineItems;
  } else if (roomTariffId) {
    const [tariff] = await database
      .select({
        price: roomTariffTable.price,
      })
      .from(roomTariffTable)
      .where(eq(roomTariffTable.id, roomTariffId))
      .limit(1);

    if (tariff && tariff.price !== null) {
      effectiveRoomPrice = tariff.price * days;
    }
  }

  let roomChargePercent = 0;

  if (roomTariffId) {
    const [tariff] = await database
      .select({ serviceChargePercent: roomTariffTable.serviceChargePercent })
      .from(roomTariffTable)
      .where(eq(roomTariffTable.id, roomTariffId))
      .limit(1);

    if (tariff) {
      roomChargePercent = tariff.serviceChargePercent;
    }
  }

  let serviceChargeAmount = 0;
  if (services.length > 0) {
    const serviceIds = services.map((s) => s.serviceId);
    const servicesData = await database
      .select({
        id: serviceTable.id,
        serviceChargePercent: serviceTable.serviceChargePercent,
      })
      .from(serviceTable)
      .where(inArray(serviceTable.id, serviceIds));

    const serviceMap = new Map(
      servicesData.map((s) => [s.id, s.serviceChargePercent]),
    );

    serviceChargeAmount = services.reduce((sum, s) => {
      const percent = serviceMap.get(s.serviceId) ?? 0;
      const serviceTotal = s.unitPrice * s.pax;
      return sum + Math.round(serviceTotal * (percent / 100));
    }, 0);
  }

  const roomChargeAmount = Math.round(
    effectiveRoomPrice * (roomChargePercent / 100),
  );
  const grandTotal =
    effectiveRoomPrice +
    totalServicePrice +
    roomChargeAmount +
    serviceChargeAmount;

  return {
    totalRoomPrice: effectiveRoomPrice,
    totalServicePrice,
    roomChargeAmount,
    serviceChargeAmount,
    grandTotal,
    ageGroupPricingLineItems,
  };
}
