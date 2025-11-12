import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/axios';
import { Loader2, User, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        // API này cần lấy bài viết theo SLUG và tăng lượt xem (views)
        const { data } = await api.get(`/blogs/slug/${slug}`);
        setPost(data);
      } catch (error) {
        console.error("Lỗi khi tải bài viết:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!post) {
    return <div className="text-center py-20">Không tìm thấy bài viết.</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto max-w-4xl py-12 px-4">
        {/* Ảnh đại diện */}
        <img
          src={post.featuredImage?.url || "/placeholder.jpg"}
          alt={post.title}
          className="w-full h-110 object-cover"
        />


        {/* Tiêu đề */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{post.title}</h1>

        {/* Thông tin (Tác giả, Ngày đăng) */}
        <div className="flex items-center text-gray-500 text-sm mb-6 space-x-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{post.author?.username || 'Admin'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Nội dung HTML (Từ Rich Text Editor) */}
        <div
          className="prose lg:prose-xl max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <Separator className="mt-12 mb-8" />

        {/* Nút quay lại */}
        <Link to="/blog" className="text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Quay lại trang tin tức
        </Link>
      </div>
    </div>
  );
};

export default BlogDetailPage;