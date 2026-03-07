import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DataEntryPage() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role

  if (role === "SDR") redirect("/data-entry/sdr")
  if (role === "ACCOUNT_EXECUTIVE") redirect("/data-entry/ae")
  if (role === "SALES_MANAGER" || role === "COMPANY_ADMIN") redirect("/data-entry/manager")

  redirect("/overview")
}
