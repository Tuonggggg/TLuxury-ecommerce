import { ShoppingCart, User, Menu, Search, X, Phone, LogOut, Settings, Heart, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from '@/hooks/useAuth';

// Component con: SearchInput (Không export)
const SearchInput = ({ searchQuery, setSearchQuery, handleSearch, handleClearSearch, isMobile = false }) => (
    <div className={`flex-1 relative ${isMobile ? "mt-3 w-full" : "max-w-xl mx-4 lg:mx-6"}`}>
        <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Tìm kiếm sản phẩm, danh mục..."
            className={`w-full pl-4 pr-12 border-gray-300 focus:border-primary focus:ring-primary bg-white rounded-lg transition-all ${isMobile ? "py-2.5 text-sm" : "py-2 text-base"}`}
        />
        {searchQuery && (
            <button
                onClick={handleClearSearch}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
                <X size={18} />
            </button>
        )}
        <button
            onClick={() => handleSearch({ key: "Enter" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition p-1"
        >
            <Search size={20} />
        </button>
    </div>
);

// Component con: UserDropdown (Đã sửa đường dẫn)
const UserDropdown = ({ user, handleLogout, PRIMARY_COLOR_HOVER }) => {
    const userName = user.username || user.email.split('@')[0] || "Tài khoản";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`hidden md:flex flex-col items-center p-2 rounded-lg transition-colors text-gray-700 ${PRIMARY_COLOR_HOVER} group h-auto`}>
                    <User className="w-7 h-7 text-primary" />
                    <span className="text-xs font-medium text-gray-600 group-hover:text-primary transition-colors mt-0.5">
                        {userName}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-bold text-primary truncate">
                    Xin chào, {userName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Đã sửa: Link hồ sơ người dùng */}
                <Link to="/account/profile"><DropdownMenuItem><Settings className="mr-2 h-4 w-4" /><span>Thông tin cá nhân</span></DropdownMenuItem></Link>
                {/* Đã sửa: Link lịch sử đơn hàng */}
                <Link to="/my-orders"><DropdownMenuItem><History className="mr-2 h-4 w-4" /><span>Lịch sử đơn hàng</span></DropdownMenuItem></Link>
                <Link to="/favorites"><DropdownMenuItem><Heart className="mr-2 h-4 w-4" /><span>Sản phẩm yêu thích</span></DropdownMenuItem></Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

// === COMPONENT CHÍNH CỦA FILE ===
const Header = () => {
    const [openMenu, setOpenMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const PRIMARY_COLOR_HOVER = "hover:text-primary";

    const handleClearSearch = () => setSearchQuery("");

    const handleSearch = (e) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
            if (openMenu) setOpenMenu(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/account/login");
    };

    return (
        <header className="w-full sticky top-0 z-50 border-gray-100 bg-white shadow-md">
            <div className="max-w-[1250px] mx-auto flex flex-wrap items-center justify-between py-2.5 px-4 md:py-3">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                    <img src="/logo.png" alt="TLuxury Logo" className="h-8 w-auto md:h-10 lg:h-12" />
                </Link>

                {/* Search Bar (Desktop) */}
                <div className="hidden md:flex flex-1 justify-center">
                    <SearchInput searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} handleClearSearch={handleClearSearch} />
                </div>

                {/* Icons */}
                <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                    <a href="tel:0919999999" className="hidden sm:flex items-center gap-1.5 text-gray-700 text-sm md:text-base font-medium hover:text-primary transition">
                        <Phone className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        <span>Gọi đặt hàng: <span className="font-semibold text-red-500 whitespace-nowrap">0919999999</span></span>
                    </a>
                    <Link to="/cart" className={`hidden md:flex flex-col items-center p-2 rounded-lg transition-colors text-gray-700 ${PRIMARY_COLOR_HOVER} group`}>
                        <ShoppingCart className="w-7 h-7" />
                        <span className="text-xs font-medium text-gray-600 group-hover:text-primary transition-colors mt-0.5">Giỏ hàng</span>
                    </Link>
                    {user ? (
                        <UserDropdown user={user} handleLogout={handleLogout} PRIMARY_COLOR_HOVER={PRIMARY_COLOR_HOVER} />
                    ) : (
                        <Link to="/account/login" className={`hidden md:flex flex-col items-center p-2 rounded-lg transition-colors text-gray-700 ${PRIMARY_COLOR_HOVER} group`}>
                            <User className="w-7 h-7" />
                            <span className="text-xs font-medium text-gray-600 group-hover:text-primary transition-colors mt-0.5">Tài khoản</span>
                        </Link>
                    )}
                    <Button variant="ghost" size="icon" className={`md:hidden text-gray-700 ${PRIMARY_COLOR_HOVER}`} onClick={() => setOpenMenu(!openMenu)}>
                        {openMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </Button>
                </div>
            </div>
            {/* Search bar (Mobile) */}
            <div className="px-4 pb-3 border-b border-gray-100 md:hidden">
                <SearchInput isMobile={true} searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} handleClearSearch={handleClearSearch} />
            </div>
            {/* Navbar */}
            <Navbar openMenu={openMenu} setOpenMenu={setOpenMenu} />
        </header>
    );
};

export default Header;