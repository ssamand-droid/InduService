// src/pages/BlogDetailPage.jsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  FiCalendar, FiUser, FiClock, FiTag, FiArrowRight,
  FiEye, FiShare2, FiBookOpen, FiChevronLeft,
  FiMessageCircle, FiHeart, FiPrinter, FiArrowUp,
  FiCopy, FiCheck, FiMail, FiTwitter,
  FiLink, FiArrowLeft, FiHome
} from 'react-icons/fi';
// ✅ استفاده از lucide-react برای آیکون‌های مشکل‌دار
import {
  FaTelegramPlane,
  FaWhatsapp,
  FaLinkedinIn
} from 'react-icons/fa';
import { blogApi } from '@features/blog/services/blogApi';
// ✅ استفاده از SEO
import { SEO } from '@components/SEO';
import toast from 'react-hot-toast';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => blogApi.getPost(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  // فرمت تاریخ فارسی
  const formatPersianDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // فرمت زمان مطالعه فارسی
  const formatReadTime = (minutes) => {
    if (!minutes) return '';
    if (minutes < 60) {
      return `${minutes} دقیقه مطالعه`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours} ساعت و ${remainingMinutes} دقیقه مطالعه`
      : `${hours} ساعت مطالعه`;
  };

  // اشتراک‌گذاری
  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post?.title || '';
    const text = `📄 ${title}\n\n${post?.excerpt || ''}\n\n${url}`;
    let shareUrl = '';

    switch(platform) {
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          toast.success('لینک کپی شد!');
          setTimeout(() => setCopied(false), 3000);
        });
        return;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=500,menubar=no,toolbar=no');
    }
    setShowShareMenu(false);
  };

  // اسکرول به بالا
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // لایک کردن
  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'لایک حذف شد' : 'لایک شد!');
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500">در حال بارگذاری مقاله...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-700 mb-2">خطا در دریافت مقاله</h3>
          <p className="text-red-600 text-sm mb-6">مشکلی در بارگذاری مقاله به وجود آمده است.</p>
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            <FiChevronLeft className="h-5 w-5" />
            بازگشت به وبلاگ
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center max-w-md">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-amber-700 mb-2">مقاله یافت نشد</h3>
          <p className="text-amber-600 text-sm mb-6">مقاله مورد نظر شما وجود ندارد یا حذف شده است.</p>
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            <FiChevronLeft className="h-5 w-5" />
            بازگشت به وبلاگ
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ استفاده از SEO */}
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        keywords={post.meta_keywords}
        image={post.og_image || post.featured_image}
        url={window.location.href}
        article={true}
        publishedTime={post.published_at}
        modifiedTime={post.updated_at}
        author={post.author_name || 'InduService'}
      />

      <article className="bg-white">
        {/* Hero Section - برای مقاله */}
        <section className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white py-12 md:py-16">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px]" />

          {/* دکمه برگشت به بالا */}
          <button
            onClick={scrollToTop}
            className="absolute bottom-4 left-4 z-10 p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition border border-white/20 text-white"
            title="برگشت به بالا"
          >
            <FiArrowUp className="w-5 h-5" />
          </button>

          <div className="container-custom relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* مسیر بازگشت و breadcrumbs */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition text-sm"
                >
                  <FiChevronLeft className="h-4 w-4" />
                  بازگشت به وبلاگ
                </Link>
                <div className="flex items-center gap-2 text-xs text-blue-300/70">
                  <Link to="/" className="hover:text-blue-200 transition">
                    <FiHome className="h-3.5 w-3.5" />
                  </Link>
                  <span>/</span>
                  <Link to="/blog" className="hover:text-blue-200 transition">
                    وبلاگ
                  </Link>
                  <span>/</span>
                  <span className="text-blue-200 truncate max-w-[150px]">
                    {post.title}
                  </span>
                </div>
              </div>

              {/* دسته‌بندی */}
              {post.category_name && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 backdrop-blur-sm rounded-full text-sm text-blue-200 border border-blue-400/30">
                    <FiTag className="h-3.5 w-3.5" />
                    {post.category_name}
                  </span>
                </div>
              )}

              {/* عنوان */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                {post.title}
              </h1>

              {/* متا اطلاعات */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <FiUser className="h-4 w-4" />
                  {post.author_name || 'مدیریت'}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="h-4 w-4" />
                  {formatPersianDate(post.published_at)}
                </span>
                {post.read_time && (
                  <span className="flex items-center gap-1.5">
                    <FiClock className="h-4 w-4" />
                    {formatReadTime(post.read_time)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <FiEye className="h-4 w-4" />
                  {post.view_count?.toLocaleString('fa-IR') || 0} بازدید
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* محتوای اصلی */}
        <div className="container-custom py-10 md:py-16">
          <div className="max-w-4xl mx-auto">
            {/* تصویر شاخص */}
            {post.featured_image && (
              <div className="mb-10 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full object-cover max-h-[500px]"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* محتوای مقاله */}
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* برچسب‌ها */}
            {post.tags?.length > 0 && (
              <div className="mt-10 pt-6 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                    <FiTag className="h-4 w-4" />
                    برچسب‌ها:
                  </span>
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id || tag.slug}
                      to={`/blog?tag=${tag.slug}`}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-full hover:bg-blue-100 hover:text-blue-700 transition"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* دکمه‌های اشتراک‌گذاری و تعامل */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                    <FiShare2 className="h-4 w-4" />
                    اشتراک‌گذاری:
                  </span>

                  {/* دکمه‌های اشتراک‌گذاری */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShare('telegram')}
                      className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-1.5 text-sm"
                      title="اشتراک در تلگرام"
                    >
                      <FaTelegramPlane className="w-4 h-4" />
                      <span className="hidden sm:inline">تلگرام</span>
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center gap-1.5 text-sm"
                      title="اشتراک در واتساپ"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      <span className="hidden sm:inline">واتساپ</span>
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="p-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition flex items-center gap-1.5 text-sm"
                      title="اشتراک در لینکدین"
                    >
                      <FaLinkedinIn className="w-4 h-4" />
                      <span className="hidden sm:inline">لینکدین</span>
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition flex items-center gap-1.5 text-sm"
                      title="کپی لینک"
                    >
                      {copied ? <FiCheck className="w-4 h-4 text-green-600" /> : <FiLink className="w-4 h-4" />}
                      <span className="hidden sm:inline">{copied ? 'کپی شد' : 'کپی لینک'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium ${
                      isLiked
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FiHeart className={`w-4 h-4 ${isLiked ? 'fill-red-600 text-red-600' : ''}`} />
                    {isLiked ? 'لایک شده' : 'لایک'}
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition text-sm font-medium"
                    title="چاپ مقاله"
                  >
                    <FiPrinter className="w-4 h-4" />
                    <span className="hidden sm:inline">چاپ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* مقالات مرتبط */}
        {post.related_posts?.length > 0 && (
          <section className="bg-slate-50 py-12 md:py-16 border-t border-slate-200">
            <div className="container-custom">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                  📚 مقالات مرتبط
                </h2>
                <p className="text-slate-500">مطالب مشابه که ممکن است برای شما مفید باشد</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {post.related_posts.map((related) => (
                  <Link
                    key={related.id}
                    to={`/blog/${related.slug}`}
                    className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-500 hover:shadow-xl transition-all duration-300 block"
                  >
                    {related.featured_image && (
                      <div className="h-40 rounded-xl overflow-hidden mb-4 bg-slate-100">
                        <img
                          src={related.featured_image}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-700 transition">
                      {related.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2">{related.excerpt}</p>
                    <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <FiCalendar className="h-3 w-3" />
                        {formatPersianDate(related.published_at)}
                      </span>
                      {related.read_time && (
                        <span className="flex items-center gap-1">
                          <FiClock className="h-3 w-3" />
                          {related.read_time} دقیقه
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA پایین */}
        <section className="bg-gradient-to-br from-blue-700 to-slate-900 py-12 md:py-16 text-white">
          <div className="container-custom text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">🚀 نیاز به مشاوره دارید؟</h2>
            <p className="text-blue-100 max-w-2xl mx-auto mb-6">
              تیم متخصص ما آماده پاسخگویی به سوالات شما و ارائه راهکارهای تخصصی است
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <button className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition shadow-lg">
                  تماس با ما
                </button>
              </Link>
              <Link to="/request-service">
                <button className="border-2 border-white text-white hover:bg-white/10 px-6 py-3 rounded-xl font-semibold transition">
                  ثبت درخواست خدمت
                </button>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </>
  );
}