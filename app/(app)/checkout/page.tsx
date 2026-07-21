import { client } from "@/sanity/lib/client";
import {
  ALL_ACTIVE_DELIVERY_AREAS_QUERY,
  ACTIVE_DELIVERY_ZONES_QUERY,
  DELIVERY_SETTINGS_QUERY,
  PICKUP_STATION_QUERY,
} from "@/lib/sanity/queries/delivery";
import { getCustomerProfile } from "@/lib/actions/customer";
import { CheckoutClient } from "./CheckoutClient";

export const metadata = {
  title: "Checkout | Accessories by Ashley",
  description: "Complete your purchase",
};

export default async function CheckoutPage() {
  const [zones, areas, settings, pickupStation, profile] = await Promise.all([
    client.fetch(ACTIVE_DELIVERY_ZONES_QUERY),
    client.fetch(ALL_ACTIVE_DELIVERY_AREAS_QUERY),
    client.fetch(DELIVERY_SETTINGS_QUERY),
    client.fetch(PICKUP_STATION_QUERY),
    getCustomerProfile(),
  ]);

  return (
    <CheckoutClient
      zones={zones ?? []}
      areas={areas ?? []}
      settings={settings}
      pickupStation={pickupStation}
      profile={profile}
    />
  );
}
