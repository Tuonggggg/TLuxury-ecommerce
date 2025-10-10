import { useEffect, useState } from "react"
import HeroSlider from "@/components/HeroSilder"
import ProductCard from "@/components/ProductCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import api from "@/lib/axios"

const SectionHeader = ({ title, onViewAll }) => (
  <div className="flex justify-between items-center border-b pb-3 mb-6">
    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
    {onViewAll && (
      <Button variant="outline" size="sm" className="rounded-full" onClick={onViewAll}>
        Xem tất cả
      </Button>
    )}
  </div>
)

const HomePage = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])

  // Gọi API backend để lấy sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products") // Backend trả về danh sách sản phẩm
        setProducts(res.data.data || []) // backend nên trả {data: [...]}
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error)
      }
    }
    fetchProducts()
  }, [])

  return (
    <>
      <div className="min-h-screen w-full bg-white relative">
        {/* Nền lưới chéo nhẹ */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%),
              linear-gradient(-45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        <HeroSlider />

        <main className="py-12 relative z-20">
          <div className="max-w-[1250px] mx-auto px-4 space-y-16">

            {/* FLASH SALE */}
            <section className="bg-gradient-to-r from-red-500 to-orange-400 text-white rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">🔥 Flash Sale</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  onClick={() => navigate("/category/flashsale")}
                >
                  Xem tất cả
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map((p) => (
                  <div
                    key={p._id}
                    className="bg-white rounded-lg shadow p-4 text-black relative hover:shadow-lg transition"
                  >
                    <Badge className="absolute top-2 left-2 bg-red-600">-20%</Badge>
                    <img
                      src={p.image || "/placeholder.png"}
                      alt={p.name}
                      className="h-40 w-full object-cover rounded-md mb-3"
                    />
                    <h3 className="font-semibold line-clamp-1">{p.name}</h3>
                    <p className="text-lg font-bold text-red-600">
                      {p.price?.toLocaleString()}₫
                    </p>
                    {p.oldPrice && (
                      <p className="text-sm line-through text-gray-400">
                        {p.oldPrice.toLocaleString()}₫
                      </p>
                    )}
                    <Button size="sm" className="mt-3 w-full">
                      Thêm vào giỏ
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            {/* PHÒNG KHÁCH */}
            <section>
              <SectionHeader title="Phòng khách" onViewAll={() => navigate("/category/phong-khach")} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </section>

            {/* PHÒNG BẾP */}
            <section className="bg-gray-50 rounded-xl p-6">
              <SectionHeader title="Phòng bếp" onViewAll={() => navigate("/category/phong-bep")} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.slice(4, 8).map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </section>

            {/* PHÒNG NGỦ */}
            <section>
              <SectionHeader title="Phòng ngủ" onViewAll={() => navigate("/category/phong-ngu")} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.slice(8, 12).map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </section>

            {/* HOT COMBO */}
            <section>
              <SectionHeader title="Hot Combo" onViewAll={() => navigate("/category/combo")} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.slice(0, 2).map((p) => (
                  <div
                    key={p._id}
                    className="border-2 border-yellow-400 rounded-xl p-6 shadow-md hover:shadow-lg transition"
                  >
                    <img
                      src={p.image || "/placeholder.png"}
                      alt={p.name}
                      className="h-56 w-full object-cover rounded-md mb-4"
                    />
                    <h3 className="text-xl font-bold">{p.name}</h3>
                    <p className="text-lg font-bold text-green-600">
                      {p.price?.toLocaleString()}₫
                    </p>
                    <Button className="mt-3">Mua ngay</Button>
                  </div>
                ))}
              </div>
            </section>

            {/* SÂN VƯỜN - NGOÀI TRỜI */}
            <section className="bg-green-50 rounded-xl p-6">
              <SectionHeader title="Sân vườn - Ngoài trời" onViewAll={() => navigate("/category/san-vuon")} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.slice(12, 16).map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </section>

            {/* NHÀ HÀNG - CAFE */}
            <section>
              <SectionHeader title="Nhà hàng - Cafe" onViewAll={() => navigate("/category/cafe")} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.slice(16, 20).map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </section>

            {/* VĂN PHÒNG */}
            <section className="bg-gray-50 rounded-xl p-6">
              <SectionHeader title="Văn phòng" onViewAll={() => navigate("/category/van-phong")} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.slice(20, 24).map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  )
}

export default HomePage
