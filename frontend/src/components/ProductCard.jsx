import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

const ProductCard = ({ product }) => {
  if (!product) return null

  return (
    <Card className="shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-200">
      <CardContent className="p-4">
        <Link to={`/product/${product._id || product.id || product.slug}`}>
          <img
            src={product.image || "/placeholder.png"}
            alt={product.name || "Sản phẩm"}
            title={product.name}
            className="w-full h-48 object-cover rounded-md mb-2"
          />
        </Link>
        <h3 className="text-sm font-semibold truncate">{product.name}</h3>
        <p className="text-red-600 font-bold">
          {new Intl.NumberFormat('vi-VN').format(product.price)}đ
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/product/${product._id || product.id || product.slug}`}>Xem chi tiết</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ProductCard
