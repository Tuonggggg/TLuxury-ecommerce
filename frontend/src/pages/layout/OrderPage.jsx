// src/pages/CheckoutPage.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { ChevronRight, Trash2, Plus, Minus, Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(3, "Họ tên ít nhất 3 ký tự"),
  phone: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")).transform(v => v || ""),
  address: z.string().min(5, "Địa chỉ quá ngắn"),
  district: z.string().min(2, "Vui lòng nhập quận/huyện"),
  city: z.string().min(2, "Vui lòng nhập tỉnh/thành phố"),
  paymentMethod: z.enum(["cod", "bank", "momo"], {
    required_error: "Vui lòng chọn phương thức thanh toán.",
  }),
});

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState("");
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountInfo, setDiscountInfo] = useState({
    code: null,
    amount: 0,
    isValid: false,
    loading: false,
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "cod", city: "Vietnam" },
  });

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
          img: item.product.images?.[0] || "/images/no-image.jpg",
          productId: item.product._id,
        }));
        setCartItems(mappedItems);
      } catch (err) {
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

  const subTotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const vatAmount = Math.round(subTotal * 0.08); // 8% VAT
  const discountAmount = discountInfo.isValid ? discountInfo.amount : 0;
  const total = Math.max(0, subTotal + vatAmount - discountAmount);

  const handleApplyDiscount = async () => {
    if (!discountCode) {
      toast.warning("Vui lòng nhập mã khuyến mãi.");
      return;
    }
    setDiscountInfo(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.post('/discounts/apply', { code: discountCode, subTotal });
      if (res.data.amount > 0) {
        setDiscountInfo({
          code: discountCode,
          amount: res.data.amount,
          isValid: true,
          loading: false,
        });
        toast.success(`Áp dụng mã ${discountCode} thành công!`);
      } else {
        setDiscountInfo({ code: null, amount: 0, isValid: false, loading: false });
        toast.error("Mã khuyến mãi không hợp lệ.");
      }
    } catch (error) {
      setDiscountInfo({ code: null, amount: 0, isValid: false, loading: false });
      toast.error(error.response?.data?.message || "Không thể kiểm tra mã khuyến mãi.");
    }
  };

  // Handlers cho + / - / remove (gọi API cart phù hợp nếu bạn có)
  const updateQty = async (productId, newQty) => {
    try {
      // gọi API update
      await api.put("/cart", { productId, qty: newQty });
      setCartItems(prev => prev.map(it => it.productId === productId ? { ...it, qty: newQty } : it));
    } catch (err) {
      console.log(err)
      toast.error("Không thể cập nhật giỏ hàng");
    }
  };
  const removeItem = async (productId) => {
    try {
      await api.delete(`/cart/${productId}`);
      setCartItems(prev => prev.filter(it => it.productId !== productId));
    } catch (err) {
      console.log(err)
      toast.error("Không thể xoá sản phẩm");
    }
  };

  const onSubmit = async (data) => {
    if (cartItems.length === 0) {
      toast.warning("Giỏ hàng trống.");
      return;
    }

    try {
      // Map phương thức thanh toán từ FE sang BE
      // FE sends "cod" | "bank" | "momo"
      let paymentMethodToSend = "COD";
      if (data.paymentMethod === "bank") paymentMethodToSend = "VNPAY";
      if (data.paymentMethod === "momo") paymentMethodToSend = "Momo";

      const orderPayload = {
        // Accept BE format your controller supports: orderItems OR items
        orderItems: cartItems.map((item) => ({
          product: item.productId,
          qty: item.qty,
          price: item.price,
        })),
        shippingAddress: {
          name: data.name,
          phone: data.phone,
          email: data.email || "",
          address: `${data.address}, ${data.district}, ${data.city}`,
          city: data.city,
          postalCode: "",
          country: "VN",
        },
        paymentMethod: paymentMethodToSend,
      };

      const res = await api.post("/orders", orderPayload);

      // Nếu BE trả payUrl -> redirect (Momo / VNPAY)
      if (res.data.payUrl) {
        // chuyển hướng để người dùng thanh toán
        window.location.href = res.data.payUrl;
        return;
      }

      // COD hoặc order created
      toast.success("Đặt hàng thành công!");
      navigate(`/order-success/${res.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">

          {/* Left Side - Form */}
          <div className="bg-white p-6 lg:p-12">
            <div className="max-w-xl mx-auto">

              {/* Login Notice */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Đăng nhập để mua hàng tiện lợi và nhận nhiều ưu đãi hơn nữa
                </p>
                <Button variant="outline" size="sm" className="ml-4">
                  Đăng nhập
                </Button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Shipping Info */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>
                  <div className="space-y-3">
                    <Input
                      placeholder="Nhập họ và tên"
                      {...register("name")}
                      className="h-11"
                    />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}

                    <Input
                      placeholder="Nhập số điện thoại"
                      {...register("phone")}
                      className="h-11"
                    />
                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}

                    <Input
                      placeholder="Nhập email (không bắt buộc)"
                      {...register("email")}
                      className="h-11"
                    />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}

                    <div className="relative">
                      <select
                        {...register("city")}
                        className="w-full h-11 px-3 border border-gray-300 rounded-md appearance-none bg-white"
                      >
                        <option value="Vietnam">Vietnam</option>
                      </select>
                    </div>

                    <Input
                      placeholder="Địa chỉ, tên đường"
                      {...register("address")}
                      className="h-11"
                    />
                    {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}

                    <Input
                      placeholder="Tỉnh/TP, Quận/Huyện, Phường/Xã"
                      {...register("district")}
                      className="h-11"
                    />
                    {errors.district && <p className="text-red-500 text-xs">{errors.district.message}</p>}
                  </div>
                </div>

                {/* Shipping Method */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Phương thức giao hàng</h2>
                  <div className="border border-gray-300 rounded-md p-4">
                    <Input
                      placeholder="Nhập địa chỉ để xem các phương thức giao hàng"
                      disabled
                      className="h-11 bg-gray-50"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
                  <RadioGroup
                    defaultValue="cod"
                    onValueChange={(val) => setValue("paymentMethod", val)}
                    className="space-y-3"
                  >
                    <div className="flex items-center border border-gray-300 rounded-md p-4">
                      <RadioGroupItem value="cod" id="cod" className="mr-3" />
                      <Label htmlFor="cod" className="flex items-center flex-1 cursor-pointer">
                        <span className="text-2xl mr-3">📦</span>
                        <span>Thanh toán khi giao hàng (COD)</span>
                      </Label>
                    </div>

                    <div className="flex items-center border border-gray-300 rounded-md p-4">
                      <RadioGroupItem value="bank" id="bank" className="mr-3" />
                      <Label htmlFor="bank" className="flex items-center flex-1 cursor-pointer">
                        <span className="text-2xl mr-3">🏦</span>
                        <span>Chuyển khoản qua VNPAY/Ngân hàng</span>
                      </Label>
                    </div>

                    <div className="flex items-center border border-gray-300 rounded-md p-4">
                      <RadioGroupItem value="momo" id="momo" className="mr-3" />
                      <Label htmlFor="momo" className="flex items-center flex-1 cursor-pointer">
                        <span className="text-2xl mr-3">💳</span>
                        <span>Thanh toán MoMo</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.paymentMethod && <p className="text-red-500 text-xs mt-2">{errors.paymentMethod.message}</p>}
                </div>

                {/* Invoice Section */}
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Hoá đơn điện tử</h2>
                    <button type="button" className="text-sm text-blue-600 hover:underline">
                      Yêu cầu xuất →
                    </button>
                  </div>
                  <Input
                    placeholder="Ghi chú đơn hàng"
                    className="h-11 mt-3"
                  />
                </div>

              </form>
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="bg-gray-50 p-6 lg:p-12 border-l border-gray-200">
            <div className="max-w-xl mx-auto sticky top-6">

              {/* Cart Items */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Giỏ hàng</h2>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                        />
                        <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                          {item.qty}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium line-clamp-2 mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-500 mb-2">Ghế</p>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0"
                            onClick={() => updateQty(item.productId, Math.max(1, item.qty - 1))}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{item.qty}</span>
                          <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0"
                            onClick={() => updateQty(item.productId, item.qty + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{(item.price * item.qty).toLocaleString()}₫</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 p-0 h-auto mt-2"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Discount Code */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Mã khuyến mãi</h2>
                {!showDiscountInput ? (
                  <button
                    type="button"
                    onClick={() => setShowDiscountInput(true)}
                    className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-lg">🎟️</span>
                      <span className="text-sm">Chọn mã</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập mã khuyến mãi"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        disabled={discountInfo.isValid}
                        className="h-11"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyDiscount}
                        disabled={discountInfo.loading || discountInfo.isValid}
                        className="bg-black hover:bg-gray-800 text-white px-6"
                      >
                        {discountInfo.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Áp dụng"}
                      </Button>
                    </div>
                    {discountInfo.isValid && (
                      <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                        ✓ Đã áp dụng mã {discountInfo.code}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* Order Summary */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng tiền hàng</span>
                    <span className="font-medium">{subTotal.toLocaleString()}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span className="font-medium">Miễn phí</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT</span>
                    <span className="font-medium">{vatAmount.toLocaleString()}₫</span>
                  </div>
                  {discountInfo.isValid && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá</span>
                      <span className="font-medium">- {discountAmount.toLocaleString()}₫</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-red-600">{total.toLocaleString()}₫</span>
              </div>

              {/* Submit Button */}
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className="w-full h-12 bg-black hover:bg-gray-800 text-white text-base font-medium"
              >
                Đặt hàng
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
