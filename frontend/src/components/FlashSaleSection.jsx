import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import api from "@/lib/axios"

const formatPrice = (price) =>
  typeof price === "number" ? price.toLocaleString("vi-VN") + "₫" : "N/A"

const FlashSaleSection = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const res = await api.get("/products/flashsale")
        setProducts(res.data.products || [])
      } catch (error) {
        console.log(error)
        toast.error("Không thể tải flash sale.")
      } finally {
        setLoading(false)
      }
    }
    fetchFlashSale()
  }, [])

  if (loading) return <p className="text-center py-10">Đang tải Flash Sale...</p>

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <h2 className="text-2xl font-bold mb-6 text-red-600 flex items-center gap-2">
        🔥 FLASH SALE HÔM NAY
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {products.map((p) => {
          const hasDiscount = p.discount > 0
          const finalPrice = hasDiscount
            ? Math.round(p.price * (1 - p.discount / 100))
            : p.price

          return (
            <Card key={p._id} className="overflow-hidden hover:shadow-xl transition">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-gray-100">
                  {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      -{p.discount}%
                    </div>
                  )}
                  <img
                    src={p.images?.[0] || "/placeholder.png"}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="font-semibold text-sm line-clamp-2">{p.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-bold text-base">
                      {formatPrice(finalPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-gray-400 line-through text-sm">
                        {formatPrice(p.price)}
                      </span>
                    )}
                  </div>
                  <Button size="sm" className="w-full mt-2 bg-blue-600 hover:bg-blue-700">
                    Mua ngay
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

export default FlashSaleSection
