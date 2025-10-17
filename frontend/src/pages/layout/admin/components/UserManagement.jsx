import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Trash2, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/lib/axios'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages] = useState(1);

    // ------------------------- API DATA FETCHING -------------------------
    
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm, // Giả định Backend hỗ trợ tìm kiếm trên GET /users
            };
            
            // Gọi route Admin GET /api/users
            const res = await api.get('/users', { params }); 

            // Giả định Backend trả về danh sách users và thông tin phân trang (tổng số trang)
            setUsers(res.data.users || res.data || []); 
            // Nếu Backend có pagination:
            // setTotalPages(res.data.totalPages || 1); 
            
        } catch (error) {
            console.error('Lỗi tải người dùng:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                 toast.error("Truy cập bị từ chối.", { description: "Bạn không có quyền truy cập trang quản lý này." });
            } else {
                 toast.error('Không thể tải dữ liệu người dùng.');
            }
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm]); // Phụ thuộc vào phân trang và tìm kiếm

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);


    // ------------------------- ADMIN ACTIONS -------------------------

    const handleDeleteUser = async (userId, userName) => {
        const userToDelete = users.find(u => u._id === userId);
        if (userToDelete && userToDelete.role === 'admin') {
            toast.error("Thao tác bị cấm.", { description: "Không thể xóa tài khoản Admin." });
            return;
        }

        if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng: ${userName}?`)) {
            try {
                // Gọi route DELETE /api/users/:id
                await api.delete(`/users/${userId}`); 
                toast.success(`Đã xóa người dùng: ${userName}`);
                fetchUsers(); // Tải lại danh sách sau khi xóa
            } catch (error) {
                console.error('Lỗi khi xóa người dùng:', error);
                toast.error(error.response?.data?.message || 'Xóa người dùng thất bại.');
            }
        }
    };
    
    // ------------------------- RENDER UTILITIES -------------------------

    const renderRole = (role) => {
        const baseClass = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
        if (role === 'admin') {
            return <span className={`${baseClass} bg-red-100 text-red-800`}>ADMIN</span>;
        }
        return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Người dùng</span>;
    };
    
    // Reset về trang 1 khi tìm kiếm thay đổi
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };


    // ------------------------- RENDER UI -------------------------

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" /> Quản lý Người dùng
            </h2>

            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                <div className="flex justify-between items-center">
                    <Input
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        className="w-full max-w-xs"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center p-12">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-center text-gray-500 p-12">Không có người dùng nào để hiển thị.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Vai trò</TableHead>
                                    <TableHead>Ngày đăng ký</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>{user._id.slice(0, 8)}...</TableCell>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{renderRole(user.role)}</TableCell>
                                        <TableCell>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                                        <TableCell className="text-right">
                                            {/* Ngăn chặn xóa tài khoản Admin */}
                                            {user.role === 'admin' ? (
                                                <Button variant="outline" size="icon" disabled title="Không thể xóa tài khoản Admin">
                                                    <AlertTriangle className='w-4 h-4 text-red-500'/>
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user._id, user.name)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-end items-center space-x-2">
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 mục</SelectItem>
                            <SelectItem value="10">10 mục</SelectItem>
                            <SelectItem value="20">20 mục</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Trước
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Sau
                    </Button>
                </div>
            )}
        </div>
    );
};

export default UserManagement;