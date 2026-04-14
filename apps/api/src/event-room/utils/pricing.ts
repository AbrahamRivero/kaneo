import { eq, inArray } from "drizzle-orm";
import type db from "../../database";
import { serviceTable, roomTariffTable } from "../../database/schema";

export type PricingInput = {
  totalRoomPrice: number;
  totalServicePrice: number;
  roomTariffId?: string | null;
  services: Array<{
    serviceId: string;
    unitPrice: number;
    pax: number;
    totalPrice: number;
  }>;
};

export type PricingOutput = {
  totalRoomPrice: number;
  totalServicePrice: number;
  roomChargeAmount: number;
  serviceChargeAmount: number;
  grandTotal: number;
};

export async function calculateReservationPricing(
  input: PricingInput,
  database: typeof db,
): Promise<PricingOutput> {
  const { totalRoomPrice, totalServicePrice, roomTariffId, services } = input;

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
    totalRoomPrice * (roomChargePercent / 100),
  );
  const grandTotal =
    totalRoomPrice + totalServicePrice + roomChargeAmount + serviceChargeAmount;

  return {
    totalRoomPrice,
    totalServicePrice,
    roomChargeAmount,
    serviceChargeAmount,
    grandTotal,
  };
}