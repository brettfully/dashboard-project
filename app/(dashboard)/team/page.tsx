import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"
import InviteTeamMemberDialog from "./invite-dialog"

const roleColors: Record<string, "default" | "secondary" | "outline" | "success" | "warning"> = {
  COMPANY_ADMIN: "default",
  SALES_MANAGER: "secondary",
  ACCOUNT_EXECUTIVE: "outline",
  SDR: "warning",
}

const roleLabels: Record<string, string> = {
  COMPANY_ADMIN: "Admin",
  SALES_MANAGER: "Sales Manager",
  ACCOUNT_EXECUTIVE: "Account Executive",
  SDR: "SDR",
}

export default async function TeamPage() {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const members = await db.user.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Team</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{members.length} team member{members.length !== 1 ? "s" : ""}</p>
          <InviteTeamMemberDialog orgId={orgId!} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const initials = (member.name ?? member.email)
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.name ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleColors[member.role] ?? "outline"}>
                          {roleLabels[member.role] ?? member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
