import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Percent } from "lucide-react";

// ------------------ Validation Schema ------------------
const schema = z.object({
  name: z.string().min(3, "Họ tên ít nhất 3 ký tự"),
  phone: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ"),
  address: z.string().min(5, "Địa chỉ quá ngắn"),
  paymentMethod: z.enum(["cod", "bank", "momo"], {
    required_error: "Vui lòng chọn phương thức thanh toán.",
  }),
});

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho Giảm giá
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState({
    code: null,
    amount: 0,
    isValid: false,
    loading: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "cod" },
  });

  // ------------------ Lấy giỏ hàng từ backend ------------------
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const { data } = await api.get("/cart");

        const rawCart = (data && data.items) ? data : { items: [] };

        const mappedItems = rawCart.items.map(item => ({
          id: item.product._id,
          name: item.product.name,
          price: item.price,
          qty: item.qty,
          img: item.product.images && item.product.images.length > 0 ? item.product.images[0] : "/images/no-image.jpg",
          productId: item.product._id,
        }));

        setCartItems(mappedItems);
      } catch (err) {
        console.error("Lỗi khi tải giỏ hàng:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error("Vui lòng đăng nhập để thanh toán.");
          navigate('/login');
        } else {
          toast.error("Không thể tải giỏ hàng!");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [navigate]);

  // ------------------ Tính tổng tiền ------------------
  const shippingFee = "Miễn phí";
  const subTotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const discountAmount = discountInfo.isValid ? discountInfo.amount : 0;
  const finalSubTotal = subTotal - discountAmount;
  const total = finalSubTotal;


  // ------------------ Xử lý Áp dụng Mã giảm giá ------------------
  const handleApplyDiscount = async () => {
    if (!discountCode) {
      toast.warning("Vui lòng nhập mã giảm giá.");
      return;
    }
    setDiscountInfo(prev => ({ ...prev, loading: true }));
    try {
      // Gọi API giảm giá đã tạo ở Backend
      const res = await api.post('/discounts/apply', { code: discountCode, subTotal });

      if (res.data.amount > 0) {
        setDiscountInfo({
          code: discountCode,
          amount: res.data.amount,
          isValid: true,
          loading: false,
        });
        toast.success(`Áp dụng mã ${discountCode} thành công!`, {
          description: `Giảm ${res.data.amount.toLocaleString()}₫.`,
        });
      } else {
        setDiscountInfo({ code: null, amount: 0, isValid: false, loading: false });
        toast.error("Mã giảm giá không hợp lệ hoặc không áp dụng được.");
      }

    } catch (error) {
      console.error("Discount error:", error);
      setDiscountInfo({ code: null, amount: 0, isValid: false, loading: false });
      toast.error(error.response?.data?.message || "Không thể kiểm tra mã giảm giá.");
    }
  };

  // ------------------ Gửi đơn hàng lên backend ------------------
  const onSubmit = async (data) => {
    if (cartItems.length === 0) {
      toast.warning("Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm.");
      return;
    }

    try {
      const order = {
        customer: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
        },
        paymentMethod: data.paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.qty,
          price: item.price,
        })),
        total,
        subTotal: finalSubTotal,
        shippingFee,
        discountCode: discountInfo.code,
        discountAmount: discountAmount,
      };

      const res = await api.post("/orders", order); // Gọi POST /api/orders

      toast.success("Đặt hàng thành công!");
      navigate(`/order-success/${res.data._id}`);
    } catch (error) {
      console.error("Order error:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi đặt hàng! Vui lòng thử lại.");
    }
  };

  if (loading) return <p className="text-center mt-10">Đang tải dữ liệu giỏ hàng...</p>;

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-lg max-w-lg mx-auto mt-10">
        <h2 className="text-2xl font-bold mb-4">Giỏ hàng của bạn đang trống!</h2>
        <p className="text-gray-600">Không có sản phẩm nào để tiến hành thanh toán.</p>
        <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/')}>Tiếp tục mua sắm</Button>
      </div>
    );
  }

  // ------------------ JSX giao diện ------------------
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-[1250px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Thông tin giao hàng */}
      <Card className="lg:col-span-2 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Thông tin giao hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Họ và tên" {...register("name")} />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}

          <Input placeholder="Số điện thoại" {...register("phone")} />
          {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}

          <Input placeholder="Email" {...register("email")} />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

          <Input placeholder="Địa chỉ giao hàng" {...register("address")} />
          {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}

          <Separator className="my-4" />

          {/* Mục nhập Mã giảm giá */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Percent className="w-5 h-5 text-green-600" /> Mã giảm giá
            </h2>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập mã giảm giá"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                disabled={discountInfo.isValid || discountInfo.loading}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleApplyDiscount}
                disabled={discountInfo.loading || discountInfo.isValid}
                className="w-[120px]"
              >
                {discountInfo.loading ? 'Đang áp dụng...' : 'Áp dụng'}
              </Button>
            </div>
            {discountInfo.isValid && (
              <p className="text-green-600 text-sm font-medium flex justify-between items-center bg-green-50 p-2 rounded-md">
                Mã **{discountInfo.code}** đã được áp dụng. Giảm {discountInfo.amount.toLocaleString()}₫.
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-transparent"
                  onClick={() => setDiscountInfo({ code: null, amount: 0, isValid: false, loading: false })}
                >
                  Xóa
                </Button>
              </p>
            )}
          </div>

          <Separator className="my-4" />

          <div>
            <h2 className="text-lg font-semibold mb-3">Phương thức thanh toán</h2>
            <RadioGroup
              defaultValue="cod"
              onValueChange={(val) => setValue("paymentMethod", val)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cod" id="cod" />
                <Label htmlFor="cod">Thanh toán khi nhận hàng (COD)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank">Chuyển khoản ngân hàng</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="momo" id="momo" />
                <Label htmlFor="momo">Ví MoMo / ZaloPay</Label>
              </div>
            </RadioGroup>
            {errors.paymentMethod && (
              <p className="text-red-500 text-sm mt-2">{errors.paymentMethod.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tóm tắt đơn hàng */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Đơn hàng của bạn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartItems.length === 0 ? (
            <p>Giỏ hàng trống.</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border-b pb-2">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-16 h-16 rounded object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-600">x{item.qty}</p>
                </div>
                <p className="font-semibold">{item.price.toLocaleString()}₫</p>
              </div>
            ))
          )}
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span>{subTotal.toLocaleString()}₫</span>
          </div>

          {/* Dòng Giảm giá */}
          {discountInfo.isValid && (
            <div className="flex justify-between text-green-600 font-medium">
              <span>Giảm giá ({discountInfo.code})</span>
              <span>- {discountInfo.amount.toLocaleString()}₫</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Phí vận chuyển</span>
            <span>{shippingFee.toLocaleString()} </span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Tổng cộng</span>
            <span className="text-red-600">{total.toLocaleString()}₫</span>
          </div>
          <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700" disabled={cartItems.length === 0}>
            Xác nhận đặt hàng
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

export default CheckoutPage;