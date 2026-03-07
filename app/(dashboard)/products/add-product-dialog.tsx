"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface AddProductDialogProps {
  orgId: string
}

export default function AddProductDialog({ orgId }: AddProductDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ name: "", price: "", description: "" })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, organizationId: orgId }),
    })
    setLoading(false)
    if (res.ok) {
      setOpen(false)
      setForm({ name: "", price: "", description: "" })
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to add product.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Product / Offer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Product Name</Label>
            <Input name="name" value={form.name} onChange={handleChange} placeholder="12-Week Coaching Program" required />
          </div>
          <div className="space-y-1">
            <Label>Price ($)</Label>
            <Input name="price" type="number" value={form.price} onChange={handleChange} placeholder="5000" step="0.01" required />
          </div>
          <div className="space-y-1">
            <Label>Description (optional)</Label>
            <Textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your offer..." rows={3} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
