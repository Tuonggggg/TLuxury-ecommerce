/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import BlogModal from './BlogModal'; // Import Modal mới
import { Link } from 'react-router-dom';

const BlogManagement = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [currentPost, setCurrentPost] = useState(null);

    // Hàm gọi API lấy danh sách bài viết
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            // ✅ Gọi đúng route dành cho Admin
            const res = await api.get('/blogs/all');
            setPosts(res.data.posts || []);
        } catch (error) {
            console.error("Lỗi tải bài viết:", error.response?.data || error.message);
            toast.error("Không thể tải danh sách bài viết.");
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Mở modal (Tạo mới)
    const handleCreateClick = () => {
        setModalMode('create');
        setCurrentPost(null);
        setShowModal(true);
    };

    // Mở modal (Chỉnh sửa)
    const handleEditClick = (post) => {
        setModalMode('edit');
        setCurrentPost(post);
        setShowModal(true);
    };

    // Xử lý Xóa
    const handleDeleteClick = async (postId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;

        try {
            await api.delete(`/blogs/${postId}`);
            toast.success("Đã xóa bài viết thành công!");
            fetchPosts(); // Tải lại danh sách
        } catch (error) {
            toast.error("Lỗi khi xóa bài viết.");
        }
    };

    // Xử lý Submit (Tạo mới hoặc Cập nhật)
    const handleFormSubmit = async (formData, postId = null) => {
        setIsSubmitting(true);
        try {
            if (modalMode === 'create') {
                // Gọi API POST /api/blogs
                await api.post('/blogs', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success("Tạo bài viết thành công!");
            } else {
                // Gọi API PUT /api/blogs/:id
                await api.put(`/blogs/${postId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success("Cập nhật bài viết thành công!");
            }
            fetchPosts();
            setIsSubmitting(false);
            return true; // Báo hiệu thành công để Modal tự đóng
        } catch (error) {
            toast.error("Thao tác thất bại: " + (error.response?.data?.message || error.message));
            setIsSubmitting(false);
            return false;
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Quản lý Tin tức</h2>
                <Button onClick={handleCreateClick}>
                    <Plus className="w-4 h-4 mr-2" /> Thêm bài viết mới
                </Button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tiêu đề</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Tác giả</TableHead>
                            <TableHead>Lượt xem</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {posts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">Không có bài viết nào.</TableCell>
                            </TableRow>
                        )}
                        {posts.map((post) => (
                            <TableRow key={post._id}>
                                <TableCell className="font-medium">
                                    <Link to={`/blog/${post.slug}`} target="_blank" className="hover:text-blue-600 hover:underline" title={post.title}>
                                        {post.title}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${post.status === 'published'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {post.status === 'published' ? 'Đã đăng' : 'Bản nháp'}
                                    </span>
                                </TableCell>
                                <TableCell>{post.author?.username || 'N/A'}</TableCell>
                                <TableCell>{post.views || 0}</TableCell>
                                <TableCell>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(post)}>
                                        <Edit className="w-4 h-4 text-blue-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(post._id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Modal */}
            <BlogModal
                showModal={showModal}
                setShowModal={setShowModal}
                modalMode={modalMode}
                currentPost={currentPost}
                isSubmitting={isSubmitting}
                onFormSubmit={handleFormSubmit}
            />
        </div>
    );
};

export default BlogManagement;