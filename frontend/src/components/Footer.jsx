import React from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              TLuxury
            </h3>
            <p className="text-sm mb-4 leading-relaxed text-muted-foreground">
              Chuyên cung cấp các sản phẩm cao cấp, chính hãng với chất lượng tuyệt hảo.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">Về TLuxury</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Giới thiệu
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Hệ thống cửa hàng
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Tuyển dụng
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Tin tức
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Support */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Chính sách đổi trả
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Chính sách bảo hành
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Hướng dẫn mua hàng
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Câu hỏi thường gặp
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Vận chuyển
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start text-muted-foreground">
                <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-primary" />
                <span>123 Đường ABC, Quận 1, TP. HCM</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <Phone size={16} className="mr-2 flex-shrink-0 text-primary" />
                <span>1900 xxxx</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <Mail size={16} className="mr-2 flex-shrink-0 text-primary" />
                <span>support@tluxury.vn</span>
              </li>
            </ul>
            
            {/* Newsletter */}
            <div className="mt-6">
              <h5 className="text-foreground text-sm font-semibold mb-2">Nhận tin khuyến mãi</h5>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Email của bạn"
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-l focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-r hover:opacity-90 transition-opacity">
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm">
            <div className="mb-4 md:mb-0">
              <span className="text-muted-foreground mr-4">Phương thức thanh toán:</span>
              <div className="inline-flex space-x-3 mt-2 md:mt-0">
                <div className="bg-background border border-border rounded px-3 py-1 text-xs font-semibold text-foreground">
                  VISA
                </div>
                <div className="bg-background border border-border rounded px-3 py-1 text-xs font-semibold text-foreground">
                  MASTERCARD
                </div>
                <div className="bg-background border border-border rounded px-3 py-1 text-xs font-semibold text-foreground">
                  MOMO
                </div>
                <div className="bg-background border border-border rounded px-3 py-1 text-xs font-semibold text-foreground">
                  VNPAY
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} TLuxury. All rights reserved.</p>
            <div className="flex space-x-6 mt-2 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">
                Điều khoản sử dụng
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Chính sách bảo mật
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;