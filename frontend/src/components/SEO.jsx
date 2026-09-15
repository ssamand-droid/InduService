// src/components/SEO.jsx
import { Helmet } from 'react-helmet-async';

export const SEO = ({
  title = 'InduService | ایندوس پلتفرم خدمات صنعتی',
  description = 'پلتفرم تخصصی خدمات صنعتی، تعمیرات، نگهداری و اورهال تجهیزات صنعتی',
  keywords = 'خدمات صنعتی, تعمیرات, نگهداری, اورهال, تجهیزات صنعتی',
  image = '/logo.png',
  url = '',
  canonical = '',
  noindex = false,
  author = 'InduService',
  publishedTime = '',
  modifiedTime = '',
  article = false,
}) => {
  const siteUrl = 'https://induservice.pro';
  const fullUrl = url || siteUrl;
  const fullImage = image?.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* ===== متا تگ‌های اصلی ===== */}
      {/* عنوان صفحه در مرورگر و نتایج جستجو */}
      <title>{title}</title>

      {/* توضیحات صفحه که در نتایج جستجو نمایش داده می‌شود */}
      <meta name="description" content={description} />

      {/* کلمات کلیدی برای موتورهای جستجو */}
      {keywords && <meta name="keywords" content={keywords} />}

      {/* نام نویسنده یا تولیدکننده محتوا */}
      <meta name="author" content={author} />

      {/* جلوگیری از ایندکس شدن صفحه توسط موتورهای جستجو */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* آدرس اصلی صفحه برای جلوگیری از محتوای تکراری */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* ===== Open Graph (برای شبکه‌های اجتماعی) ===== */}
      {/* نوع محتوا: مقاله یا وبسایت */}
      <meta property="og:type" content={article ? 'article' : 'website'} />

      {/* آدرس صفحه */}
      <meta property="og:url" content={fullUrl} />

      {/* عنوان مقاله/صفحه */}
      <meta property="og:title" content={title} />

      {/* توضیحات مقاله/صفحه */}
      <meta property="og:description" content={description} />

      {/* تصویر شاخص برای اشتراک‌گذاری */}
      <meta property="og:image" content={fullImage} />

      {/* نام سایت */}
      <meta property="og:site_name" content="InduService" />

      {/* زبان محتوا */}
      <meta property="og:locale" content="fa_IR" />

      {/* ===== لینکدین (بجای توییتر و فیسبوک) ===== */}
      {/* این تگ‌ها مخصوص لینکدین هستند */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />

      {/* برای لینکدین، نوع محتوا را مشخص می‌کند */}
      <meta property="og:type" content="article" />

      {/* ===== تگ‌های مخصوص مقاله ===== */}
      {article && publishedTime && (
        <>
          {/* تاریخ انتشار مقاله */}
          <meta property="article:published_time" content={publishedTime} />

          {/* تاریخ بروزرسانی مقاله */}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

          {/* نویسنده مقاله */}
          <meta property="article:author" content={author} />

          {/* بخش‌های مقاله (اختیاری) */}
          <meta property="article:section" content="Blog" />

          {/* تگ‌های مقاله (اختیاری) */}
          {keywords && keywords.split(',').map((tag, index) => (
            <meta key={index} property="article:tag" content={tag.trim()} />
          ))}
        </>
      )}
    </Helmet>
  );
};