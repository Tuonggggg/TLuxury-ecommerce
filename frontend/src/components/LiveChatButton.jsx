// src/components/LiveChatButton.jsx
import React from 'react';
import { MessageSquare, Zap, Facebook, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

const LiveChatButton = () => {
    // ⚠️ THAY THẾ CÁC URL VÀ SỐ ĐIỆN THOẠI NÀY VỚI THÔNG TIN THỰC TẾ CỦA BẠN
    const ZALO_URL = "https://zalo.me/ZALO_PHONE_NUMBER"; // Ví dụ: zalo.me/0919999999
    const FACEBOOK_PAGE_NAME = "YOUR_FACEBOOK_PAGE_NAME"; 
    const PHONE_NUMBER = "0919999999"; 

    const facebookUrl = `https://m.me/${FACEBOOK_PAGE_NAME}`;
    const zaloUrl = ZALO_URL; 
    
    return (
        <div className="fixed bottom-6 right-6 z-50">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {/* Nút chính */}
                    <Button
                        className="flex items-center justify-center w-14 h-14 rounded-full shadow-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-transform transform hover:scale-110 ring-4 ring-indigo-300/50"
                        title="Hỗ trợ Chat"
                        aria-label="Hỗ trợ Chat"
                    >
                        <MessageCircle className="w-7 h-7 animate-pulse" />
                    </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent className="w-56 p-2 rounded-lg shadow-xl" align="end">
                    
                    {/* Zalo Chat */}
                    <DropdownMenuItem asChild className="p-3 cursor-pointer hover:bg-green-50 text-green-700 font-medium">
                        <a href={zaloUrl} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                            <MessageSquare className="w-5 h-5 mr-3" />
                            Chat qua Zalo
                        </a>
                    </DropdownMenuItem>

                    {/* Facebook Messenger */}
                    <DropdownMenuItem asChild className="p-3 cursor-pointer hover:bg-blue-50 text-blue-700 font-medium">
                        <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                            <Facebook className="w-5 h-5 mr-3" />
                            Chat Messenger
                        </a>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />

                    {/* Gọi Ngay */}
                    <DropdownMenuItem asChild className="p-3 cursor-pointer hover:bg-red-50 text-red-600 font-medium">
                        <a href={`tel:${PHONE_NUMBER}`} className="flex items-center w-full">
                            <Zap className="w-5 h-5 mr-3" />
                            Gọi đặt hàng ({PHONE_NUMBER})
                        </a>
                    </DropdownMenuItem>

                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default LiveChatButton;