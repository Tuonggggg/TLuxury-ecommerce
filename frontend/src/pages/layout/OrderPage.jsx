/* eslint-disable no-unused-vars */
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
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { ChevronRight, Trash2, Plus, Minus, Loader2 } from "lucide-react";

// Redux
import { useSelector, useDispatch } from "react-redux";
import {
  updateGuestCartQty,
  removeGuestCartItem,
  clearCartAfterOrder,
} from "@/store/slices/cartSlice";

// Auth hook
import { useAuth } from "@/hooks/useAuth";

// Schema
const schema = z.object({
  name: z.string().min(3, "Họ tên ít nhất 3 ký tự"),
  phone: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ"),
  address: z.string().min(5, "Vui lòng nhập số nhà, tên đường"),
  district: z.string().min(2, "Vui lòng nhập quận/huyện"),
  city: z.string().min(2, "Vui lòng nhập tỉnh/thành phố"),
  note: z.string().optional(),
  paymentMethod: z.enum(["cod", "bank"], {
    required_error: "Vui lòng chọn phương thức thanh toán.",
  }),
});

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { cartItems } = useSelector((state) => state.cart);

  const [loading, setLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [showDiscountInput, setShowDiscountInput] = useState(false);
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
    defaultValues: {
      paymentMethod: "cod",
      name: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    },
  });

  // --- Tính toán tổng đơn ---
  const subTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const vatAmount = Math.round(subTotal * 0.08);
  const discountAmount = discountInfo.isValid ? discountInfo.amount : 0;
  const total = Math.max(0, subTotal + vatAmount - discountAmount);

  // --- Áp dụng mã giảm giá ---
  const handleApplyDiscount = async () => {
    if (!discountCode) {
      toast.warning("Vui lòng nhập mã giảm giá.");
      return;
    }
    try {
      setDiscountInfo((prev) => ({ ...prev, loading: true }));
      const res = await api.post("/discounts/apply", { code: discountCode, subTotal });
      setDiscountInfo({
        code: res.data.code,
        amount: res.data.discountAmount,
        isValid: true,
        loading: false,
      });
      toast.success(res.data.message);
    } catch (error) {
      setDiscountInfo({ code: null, amount: 0, isValid: false, loading: false });
      toast.error(error.response?.data?.message || "Áp dụng mã giảm giá thất bại");
    }
  };

  const removeDiscount = () => {
    setDiscountInfo({ code: null, amount: 0, isValid: false, loading: false });
    setDiscountCode("");
  };

  // --- Cập nhật số lượng sản phẩm ---
  const updateQty = (id, newQty) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    const MAX_QTY_PER_ITEM = 5;
    if (newQty < 1) return removeItem(id);
    if (newQty > MAX_QTY_PER_ITEM) {
      toast.warning(`Bạn chỉ có thể mua tối đa ${MAX_QTY_PER_ITEM} sản phẩm này.`);
      return;
    }
    if (newQty > (item.stock || 999)) {
      toast.warning("Vượt quá tồn kho.");
      return;
    }
    setUpdatingItemId(id);
    dispatch(updateGuestCartQty({ id, newQty }));
    setUpdatingItemId(null);
  };

  const removeItem = (id) => dispatch(removeGuestCartItem(id));

  // --- Xử lý đặt hàng ---
  const onSubmit = async (data) => {
    if (cartItems.length === 0) {
      toast.warning("Giỏ hàng trống.");
      return;
    }
    setIsSubmitting(true);

    try {
      const paymentMethodToSend = data.paymentMethod === "bank" ? "VNPAY" : "COD";
      const orderPayload = {
        orderItems: cartItems.map((item) => ({
          product: item.id || item.productId,
          name: item.name,
          qty: item.quantity,
          price: item.price,
        })),
        shippingAddress: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: `${data.district}, ${data.city}`,
        },
        paymentMethod: paymentMethodToSend,
        note: data.note || "",
        voucherCode: discountInfo.isValid ? discountInfo.code : null,
        discountAmount: discountInfo.isValid ? discountInfo.amount : 0,
        itemsPrice: subTotal,
        taxPrice: vatAmount,
        totalPrice: total, // ✅ sửa ở đây: tổng sau giảm voucher
        finalTotal: total, // vẫn giữ nếu backend cần
      };


      const res = await api.post("/orders", orderPayload);

      dispatch(clearCartAfterOrder());

      if (res.data.payUrl) {
        window.location.href = res.data.payUrl;
        return;
      }

      toast.success("Đặt hàng thành công!");
      navigate(`/order-success/${res.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
    } finally {
      setIsSubmitting(false);
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
              {!user && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Đăng nhập để mua hàng tiện lợi và nhận nhiều ưu đãi hơn nữa
                  </p>
                  <Button asChild variant="outline" size="sm" className="ml-4">
                    <Link to="/account/login">Đăng nhập</Link>
                  </Button>
                </div>
              )}

              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Shipping Info */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>
                  <div className="space-y-3">
                    <Input placeholder="Nhập họ và tên" {...register("name")} className="h-11" />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}

                    <Input placeholder="Nhập số điện thoại" {...register("phone")} className="h-11" />
                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}

                    <Input placeholder="Nhập email" {...register("email")} className="h-11" />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}

                    <Input placeholder="Tỉnh/Thành phố" defaultValue="Việt Nam" disabled {...register("city")} className="h-11" />
                    {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}

                    <Input placeholder="Quận/Huyện, Phường/Xã" {...register("district")} className="h-11" />
                    {errors.district && <p className="text-red-500 text-xs">{errors.district.message}</p>}

                    <Input placeholder="Số nhà, tên đường" {...register("address")} className="h-11" />
                    {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                  </div>
                </div>

                {/* Shipping Method */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Phương thức giao hàng</h2>
                  <div className="border border-gray-300 rounded-md p-4">
                    <Input value="Giao hàng tiêu chuẩn (Miễn phí)" disabled className="h-11 bg-gray-50" />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
                  <RadioGroup defaultValue="cod" onValueChange={(val) => setValue("paymentMethod", val)} className="space-y-3">
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
                  </RadioGroup>
                  {errors.paymentMethod && <p className="text-red-500 text-xs mt-2">{errors.paymentMethod.message}</p>}
                </div>

                {/* Note */}
                <div>
                  <h2 className="text-lg font-semibold mb-3">Ghi chú</h2>
                  <Input placeholder="Ghi chú cho đơn hàng (không bắt buộc)" className="h-11 mt-3" {...register("note")} />
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Summary */}
          <div className="bg-gray-50 p-6 lg:p-12 border-l border-gray-200">
            <div className="max-w-xl mx-auto sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Giỏ hàng ({cartItems.length})</h2>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative flex-shrink-0 mt-2">
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                      <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">{item.quantity}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium line-clamp-2 mb-1">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => updateQty(item.id, item.quantity - 1)} disabled={updatingItemId === item.id}>
                          <Minus className="w-3 h-3" />
                        </Button>

                        <span className="text-sm w-8 text-center">{item.quantity}</span>

                        <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => updateQty(item.id, item.quantity + 1)} disabled={updatingItemId === item.id}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">{(item.price * item.quantity).toLocaleString()}₫</p>
                      <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700 p-0 h-auto mt-2" onClick={() => removeItem(item.id)} disabled={updatingItemId === item.id}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Discount */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Mã khuyến mãi</h2>
                {!showDiscountInput ? (
                  <button type="button" onClick={() => setShowDiscountInput(true)} className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-lg">🎟️</span>
                      <span className="text-sm">Chọn hoặc nhập mã</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="Nhập mã khuyến mãi" value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} disabled={discountInfo.isValid} className="h-11" />
                      {!discountInfo.isValid ? (
                        <Button type="button" onClick={handleApplyDiscount} disabled={discountInfo.loading} className="bg-black hover:bg-gray-800 text-white px-6">
                          {discountInfo.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Áp dụng"}
                        </Button>
                      ) : (
                        <Button type="button" onClick={removeDiscount} variant="outline" className="px-6">
                          Xóa
                        </Button>
                      )}
                    </div>
                    {discountInfo.isValid && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">✓ Đã áp dụng mã {discountInfo.code}</div>}
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* Order Summary */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Tổng tiền hàng</span><span className="font-medium">{subTotal.toLocaleString()}₫</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Phí vận chuyển</span><span className="font-medium">Miễn phí</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">VAT (8%)</span><span className="font-medium">{vatAmount.toLocaleString()}₫</span></div>
                  {discountInfo.isValid && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span className="font-medium">-{discountAmount.toLocaleString()}₫</span></div>}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-red-600">{total.toLocaleString()}₫</span>
              </div>

              {/* Submit */}
              <Button type="submit" form="checkout-form" disabled={isSubmitting || cartItems.length === 0} className="w-full h-12 bg-black hover:bg-gray-800 text-white text-base font-medium">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Đặt hàng"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
