// src/pages/AdminBlogPage.jsx
import { useState, useEffect } from 'react';
import api from '@lib/axios';
import toast from 'react-hot-toast';
// ✅ ایمپورت Tiptap Editor
import TiptapEditor from '@components/editor/TiptapEditor';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    status: 'published',
    read_time: 5,
    is_featured: false,
  });
  
  // ✅ State برای محتوای ادیتور
  const [editorContent, setEditorContent] = useState({
    html: '',
    text: '',
  });

  // دریافت لیست مقالات
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/blog/posts/');
      setPosts(response.data.results || response.data);
    } catch (error) {
      console.error('خطا:', error);
      toast.error('خطا در دریافت مقالات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // حذف مقاله
  const handleDelete = async (slug) => {
    if (!confirm('آیا از حذف این مقاله اطمینان دارید؟')) return;
    try {
      await api.delete(`/api/blog/posts/${slug}/`);
      toast.success('مقاله حذف شد');
      fetchPosts();
    } catch (error) {
      toast.error('خطا در حذف مقاله');
    }
  };

  // ویرایش مقاله
  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      excerpt: post.excerpt || '',
      status: post.status || 'published',
      read_time: post.read_time || 5,
      is_featured: post.is_featured || false,
    });
    // ✅ تنظیم محتوای ادیتور
    setEditorContent({
      html: post.content || '',
      text: post.content?.replace(/<[^>]+>/g, '') || '',
    });
    setShowForm(true);
  };

  // ثبت مقاله جدید یا ویرایش
  const handleSubmit = async () => {
    if (!formData.title || !editorContent.html) {
      toast.error('عنوان و محتوا الزامی است');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        title: formData.title,
        content: editorContent.html,
        status: formData.status,
        excerpt: formData.excerpt || editorContent.text.substring(0, 150),
        read_time: formData.read_time || 5,
        is_featured: formData.is_featured || false,
      };

      if (editingPost) {
        await api.patch(`/api/blog/posts/${editingPost.slug}/`, submitData);
        toast.success('مقاله بروزرسانی شد');
      } else {
        await api.post('/api/blog/posts/', submitData);
        toast.success('مقاله جدید ایجاد شد');
      }
      
      setShowForm(false);
      setEditingPost(null);
      setFormData({ title: '', excerpt: '', status: 'published', read_time: 5, is_featured: false });
      setEditorContent({ html: '', text: '' });
      fetchPosts();
    } catch (error) {
      console.error('خطا:', error.response?.data);
      toast.error('خطا در ذخیره مقاله');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری مقالات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* هدر */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">مدیریت وبلاگ</h1>
        <button
          onClick={() => {
            setEditingPost(null);
            setFormData({ title: '', excerpt: '', status: 'published', read_time: 5, is_featured: false });
            setEditorContent({ html: '', text: '' });
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>+</span> مقاله جدید
        </button>
      </div>

      {/* لیست مقالات */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="table-responsive">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b">
              <tr className="text-right">
                <th className="p-3 text-right text-sm">عنوان</th>
                <th className="p-3 text-right text-sm">وضعیت</th>
                <th className="p-3 text-right text-sm hidden md:table-cell">نویسنده</th>
                <th className="p-3 text-right text-sm hidden sm:table-cell">تاریخ انتشار</th>
                <th className="p-3 text-right text-sm">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    هیچ مقاله‌ای یافت نشد
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 text-sm">
                      <div className="max-w-[150px] truncate">{post.title}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        post.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                    </td>
                    <td className="p-3 text-sm hidden md:table-cell">{post.author_name || '-'}</td>
                    <td className="p-3 text-sm text-gray-500 hidden sm:table-cell">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('fa-IR') : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        <a href={`/blog/${post.slug}`} target="_blank" className="text-blue-600 hover:text-blue-800 text-sm" rel="noopener noreferrer">
                          مشاهده
                        </a>
                        <button onClick={() => handleEdit(post)} className="text-green-600 hover:text-green-800 text-sm">
                          ویرایش
                        </button>
                        <button onClick={() => handleDelete(post.slug)} className="text-red-600 hover:text-red-800 text-sm">
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال فرم با Tiptap Editor */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{editingPost ? 'ویرایش مقاله' : 'مقاله جدید'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* عنوان */}
                <div>
                  <label className="block text-sm font-medium mb-1">عنوان *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
                    placeholder="عنوان مقاله"
                  />
                </div>

                {/* وضعیت */}
                <div>
                  <label className="block text-sm font-medium mb-1">وضعیت</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="draft">پیش‌نویس</option>
                    <option value="published">منتشر شده</option>
                  </select>
                </div>

                {/* خلاصه */}
                <div>
                  <label className="block text-sm font-medium mb-1">خلاصه</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
                    placeholder="خلاصه مقاله..."
                  />
                </div>

                {/* ✅ ویرایشگر Tiptap */}
                <div>
                  <label className="block text-sm font-medium mb-2">متن کامل *</label>
                  <TiptapEditor
                    content={editorContent.html}
                    onChange={(content) => {
                      setEditorContent({
                        html: content.html,
                        text: content.text,
                      });
                    }}
                    placeholder="محتوای مقاله را اینجا بنویسید..."
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {editorContent.text.length.toLocaleString('fa-IR')} کاراکتر
                  </div>
                </div>

                {/* زمان مطالعه */}
                <div>
                  <label className="block text-sm font-medium mb-1">زمان مطالعه (دقیقه)</label>
                  <input
                    type="number"
                    value={formData.read_time}
                    onChange={(e) => setFormData({...formData, read_time: parseInt(e.target.value) || 5})}
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
                    min="1"
                    max="60"
                  />
                </div>

                {/* ویژه */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">مقاله ویژه</span>
                </label>

                {/* دکمه‌ها */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'در حال ذخیره...' : (editingPost ? 'بروزرسانی' : 'ایجاد مقاله')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}