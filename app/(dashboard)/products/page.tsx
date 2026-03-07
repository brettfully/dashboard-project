import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import AddProductDialog from "./add-product-dialog"

export default async function ProductsPage() {
  const session = await auth()
  const orgId = (session?.user as { organizationId?: string })?.organizationId

  const products = await db.product.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="flex flex-col h-full">
      <Header title="Products" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? "s" : ""}</p>
          <AddProductDialog orgId={orgId!} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Products / Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {product.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "success" : "secondary"}>
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No products yet. Add your first offer.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
