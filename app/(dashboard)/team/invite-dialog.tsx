"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { UserPlus } from "lucide-react"

interface InviteTeamMemberDialogProps {
  orgId: string
}

const roles = [
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "ACCOUNT_EXECUTIVE", label: "Account Executive" },
  { value: "SDR", label: "SDR" },
]

export default function InviteTeamMemberDialog({ orgId }: InviteTeamMemberDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ACCOUNT_EXECUTIVE",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, organizationId: orgId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? "Failed to add member")
    } else {
      setOpen(false)
      setForm({ name: "", email: "", password: "", role: "ACCOUNT_EXECUTIVE" })
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-1" /> Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input name="name" value={form.name} onChange={handleChange} placeholder="Jane Smith" required />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@company.com" required />
          </div>
          <div className="space-y-1">
            <Label>Temporary Password</Label>
            <Input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 8 characters" required minLength={8} />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Member"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
