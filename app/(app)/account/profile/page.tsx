import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";
import { CUSTOMER_BY_USER_ID_QUERY } from "@/lib/sanity/queries/customers";
import { ALL_ACTIVE_DELIVERY_AREAS_QUERY } from "@/lib/sanity/queries/delivery";
import { ProfileClient } from "./ProfileClient";

export const metadata = {
  title: "My Profile | Accessories by Ashley",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [customer, areas] = await Promise.all([
    client.fetch(CUSTOMER_BY_USER_ID_QUERY, { userId: session.user.id }),
    client.fetch(ALL_ACTIVE_DELIVERY_AREAS_QUERY),
  ]);

  return (
    <ProfileClient
      customer={customer}
      areas={areas ?? []}
      userEmail={session.user.email ?? ""}
    />
  );
}
