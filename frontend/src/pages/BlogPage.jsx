// src/pages/BlogPage.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FiCalendar, FiUser, FiClock, FiSearch, FiArrowLeft, 
  FiBookOpen, FiTag, FiStar, FiTrendingUp, FiGrid,
  FiList, FiFilter, FiX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { useBlogPosts, useBlogCategories } from '@features/blog/hooks/useBlog';
import { SEO } from '@components/SEO';
// ✅ اصلاح: از import default استفاده کنید
import SkeletonCard from '@components/ui/SkeletonCard';
import EmptyState from '@components/ui/EmptyState';

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page')) || 1,
  });
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showFilters, setShowFilters] = useState(false);

  // استفاده از React Query
  const { 
    data: postsData, 
    isLoading, 
    error,
    isFetching,
    refetch 
  } = useBlogPosts(filters);
  
  const { 
    data: categoriesData,
    isLoading: categoriesLoading 
  } = useBlogCategories();

  const posts = postsData?.results || [];
  const categories = categoriesData?.results || [];
  const totalCount = postsData?.count || 0;
  const nextPage = postsData?.next;
  const previousPage = postsData?.previous;

  // به‌روزرسانی URL هنگام تغییر فیلترها
  useEffect(() => {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
    if (filters.page > 1) params.page = filters.page;
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // تنظیم فیلترها از URL در ابتدای بارگذاری
  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    
    setFilters(prev => ({
      ...prev,
      category: category || '',
      search: search || '',
      page: page,
    }));
    
    if (search) setSearchQuery(search);
  }, []);

  const handleCategoryFilter = (slug) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === slug ? '' : slug,
      page: 1,
    }));
    setShowFilters(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setFilters(prev => ({
        ...prev,
        search: searchQuery.trim(),
        page: 1,
      }));
    } else {
      // اگر جستجو خالی بود، فیلتر جستجو را حذف کن
      setFilters(prev => ({
        ...prev,
        search: '',
        page: 1,
      }));
    }
  };

  const clearFilters = () => {
    setFilters({ category: '', search: '', page: 1 });
    setSearchQuery('');
    setShowFilters(false);
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // تولید skeleton برای بارگذاری
  const renderSkeletons = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <SkeletonCard key={index} type="blog" />
    ));
  };

  // تولید کارت مقاله
  const renderPostCard = (post) => (
    <article
      key={post.id}
      className={`group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-500 hover:shadow-xl transition-all duration-300 ${
        viewMode === 'list' ? 'flex flex-col md:flex-row' : 'flex flex-col'
      }`}
    >
      <Link 
        to={`/blog/${post.slug}`} 
        className={`block overflow-hidden bg-slate-100 ${viewMode === 'list' ? 'md:w-72 md:shrink-0' : ''}`}
      >
        <div className={`${viewMode === 'list' ? 'h-52 md:h-full' : 'h-52'} bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden`}>
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
              className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
              loading="lazy"
            />
          ) : (
            <span className="text-7xl opacity-40">📄</span>
          )}
        </div>
      </Link>
      
      <div className={`p-6 flex-1 flex flex-col ${viewMode === 'list' ? 'md:p-8' : ''}`}>
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {post.category_name && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
              <FiTag className="h-3 w-3" />
              {post.category_name}
            </span>
          )}
          {post.is_featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
              <FiStar className="h-3 w-3" />
              ویژه
            </span>
          )}
          {post.read_time && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
              <FiClock className="h-3 w-3" />
              {post.read_time} دقیقه
            </span>
          )}
        </div>
        
        <Link to={`/blog/${post.slug}`}>
          <h3 className={`font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition ${
            viewMode === 'list' ? 'text-2xl' : 'text-xl'
          }`}>
            {post.title}
          </h3>
        </Link>
        
        <p className="text-slate-500 text-sm mb-4 line-clamp-3 leading-relaxed flex-1">
          {post.excerpt}
        </p>
        
        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <FiUser className="h-3.5 w-3.5" />
            <span>{post.author_name || 'مدیریت'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <FiCalendar className="h-3.5 w-3.5" />
            <span>{formatPersianDate(post.published_at)}</span>
          </span>
        </div>
      </div>
    </article>
  );

  return (
    <>
      <SEO
        title="وبلاگ تخصصی InduService | مقالات صنعتی، تعمیرات و نگهداری"
        description="مقالات تخصصی در زمینه خدمات صنعتی، تعمیرات، نگهداری و اورهال تجهیزات - InduService"
        keywords="وبلاگ صنعتی, مقالات تخصصی, تعمیرات صنعتی, نگهداری, اورهال, الکتروموتور, PLC, MRO"
      />

      {/* Hero Section - مشابه صفحه اصلی */}
      <section className="relative min-h-[45vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_0.8px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="container-custom relative z-10 py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-400/30 bg-blue-950/60 backdrop-blur-md mb-6">
              <FiBookOpen className="text-blue-400" />
              <span className="text-sm font-medium tracking-[2px] text-blue-300">وبلاگ تخصصی • KNOWLEDGE BASE</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-4">
              دانشنامه <span className="text-blue-400">صنعتی</span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto mb-8">
              مقالات تخصصی در زمینه تعمیرات، نگهداری و اورهال تجهیزات صنعتی
            </p>
            
            {/* Search Bar - مشابه صفحه اصلی */}
            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="جستجوی مقاله..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border-0 bg-white/10 backdrop-blur-md pl-4 pr-12 py-3 text-white placeholder:text-white/60 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition shadow-lg shadow-blue-900/40"
                >
                  جستجو
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="bg-white">
        <div className="container-custom py-8 md:py-12">
          
          {/* Header with filters and view options */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition md:hidden"
              >
                <FiFilter />
                فیلترها
                {(filters.category || filters.search) && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
              </button>
              
              {/* Desktop categories */}
              <div className="hidden md:flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, category: '', page: 1 }));
                    setShowFilters(false);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 ${
                    !filters.category
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  همه
                  {totalCount > 0 && (
                    <span className="mr-1 text-xs opacity-70">({totalCount})</span>
                  )}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryFilter(cat.slug)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 flex items-center gap-1.5 ${
                      filters.category === cat.slug
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {cat.icon && <span className="text-base">{cat.icon}</span>}
                    {cat.name}
                    {cat.post_count > 0 && (
                      <span className="text-xs opacity-70">({cat.post_count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  title="نمایش شبکه‌ای"
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  title="نمایش لیستی"
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>

              {/* Clear filters */}
              {(filters.category || filters.search) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                >
                  <FiX className="w-4 h-4" />
                  پاک کردن فیلترها
                </button>
              )}

              {/* Refresh button */}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className={`p-2 text-slate-400 hover:text-slate-600 rounded-lg transition ${isFetching ? 'animate-spin' : ''}`}
                title="بروزرسانی"
              >
                <FiTrendingUp className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile filters dropdown */}
          {showFilters && (
            <div className="md:hidden mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, category: '', page: 1 }));
                    setShowFilters(false);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition ${
                    !filters.category
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  همه
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryFilter(cat.slug)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition flex items-center gap-1 ${
                      filters.category === cat.slug
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results count */}
          {!isLoading && !error && posts.length > 0 && (
            <div className="text-sm text-slate-500 mb-6">
              {totalCount.toLocaleString('fa-IR')} مقاله یافت شد
              {filters.category && ` در دسته "${categories.find(c => c.slug === filters.category)?.name}"`}
              {filters.search && ` برای "${filters.search}"`}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className={`grid ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
              {renderSkeletons()}
            </div>
          )}

          {/* Error State */}
          {error && (
            <EmptyState
              icon={null}
              title="خطا در دریافت مقالات"
              description={error.userMessage || 'لطفاً دوباره تلاش کنید.'}
              action={() => refetch()}
              actionLabel="تلاش مجدد"
            />
          )}

          {/* Blog Grid/List */}
          {!isLoading && !error && (
            <>
              {posts.length === 0 ? (
                <EmptyState
                  icon={null}
                  title="مقاله‌ای یافت نشد"
                  description={
                    filters.category 
                      ? 'در این دسته‌بندی مقاله‌ای وجود ندارد.' 
                      : filters.search 
                        ? `نتیجه‌ای برای "${filters.search}" یافت نشد.`
                        : 'به زودی مقالات جدید منتشر می‌شود.'
                  }
                  action={clearFilters}
                  actionLabel="مشاهده همه مقالات"
                />
              ) : (
                <div className={`grid ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                  {posts.map(renderPostCard)}
                </div>
              )}

              {/* Pagination */}
              {(nextPage || previousPage) && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <button
                    onClick={() => {
                      if (previousPage) {
                        const prevPage = new URL(previousPage).searchParams.get('page');
                        handlePageChange(parseInt(prevPage));
                      }
                    }}
                    disabled={!previousPage}
                    className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:border-blue-600 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FiChevronRight className="h-4 w-4" />
                    قبلی
                  </button>
                  
                  <span className="text-sm text-slate-500">
                    صفحه {filters.page} از {Math.ceil(totalCount / (postsData?.page_size || 10))}
                  </span>
                  
                  <button
                    onClick={() => {
                      if (nextPage) {
                        const nextPageNum = new URL(nextPage).searchParams.get('page');
                        handlePageChange(parseInt(nextPageNum));
                      }
                    }}
                    disabled={!nextPage}
                    className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:border-blue-600 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    بعدی
                    <FiChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CTA Section - مشابه صفحه اصلی */}
      <section className="bg-gradient-to-br from-blue-700 to-slate-900 py-16 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">آماده همکاری با ما هستید؟</h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
            برای دریافت مشاوره تخصصی و یا ثبت درخواست خدمات، با ما تماس بگیرید
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <button className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-xl font-semibold text-lg shadow-xl transition">
                تماس با ما
              </button>
            </Link>
            <Link to="/request-service">
              <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-xl font-semibold text-lg transition">
                ثبت درخواست خدمت
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}