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
  // ===== فیلدهای جدید برای سئوی پیشرفته =====
  schemaType = 'WebPage', // 'Product' | 'Service' | 'Article' | 'WebPage'
  productData = null, // برای محصولات
  serviceData = null, // برای خدمات
  breadcrumbItems = [], // [{name, url}] برای بردکرامب
}) => {
  const siteUrl = 'https://induservice.pro';
  const fullUrl = url || siteUrl;
  const fullImage = image?.startsWith('http') ? image : `${siteUrl}${image}`;

  // ===== ساخت JSON-LD برای Schema.org =====
  const buildSchema = () => {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": schemaType,
      "name": title,
      "description": description,
      "url": fullUrl,
      "image": fullImage,
    };

    // ===== Schema برای محصول =====
    if (schemaType === 'Product' && productData) {
      return {
        ...baseSchema,
        "sku": productData.sku || '',
        "brand": productData.brand ? {
          "@type": "Brand",
          "name": productData.brand.name
        } : undefined,
        "offers": {
          "@type": "Offer",
          "price": productData.final_price || productData.price,
          "priceCurrency": "IRR",
          "availability": productData.is_in_stock 
            ? "https://schema.org/InStock" 
            : "https://schema.org/OutOfStock",
          "url": fullUrl,
          "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        "aggregateRating": productData.average_rating ? {
          "@type": "AggregateRating",
          "ratingValue": productData.average_rating,
          "reviewCount": productData.review_count || 1
        } : undefined,
      };
    }

    // ===== Schema برای خدمات =====
    if (schemaType === 'Service' && serviceData) {
      return {
        ...baseSchema,
        "serviceType": serviceData.service_type || 'MRO',
        "provider": serviceData.provider_name ? {
          "@type": "Organization",
          "name": serviceData.provider_name
        } : undefined,
        "offers": {
          "@type": "Offer",
          "price": serviceData.base_price || serviceData.hourly_rate || 0,
          "priceCurrency": "IRR",
          "availability": "https://schema.org/InStock"
        },
        "areaServed": serviceData.service_area || 'IR',
      };
    }

    // ===== Schema برای مقاله =====
    if (schemaType === 'Article' && article) {
      return {
        ...baseSchema,
        "@type": "Article",
        "author": {
          "@type": "Person",
          "name": author
        },
        "datePublished": publishedTime || new Date().toISOString(),
        "dateModified": modifiedTime || publishedTime || new Date().toISOString(),
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": fullUrl
        }
      };
    }

    // ===== Schema برای بردکرامب =====
    if (breadcrumbItems.length > 0) {
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url || siteUrl
        }))
      };
    }

    return baseSchema;
  };

  return (
    <Helmet>
      {/* ===== متا تگ‌های اصلی ===== */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* ===== Open Graph ===== */}
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="InduService" />
      <meta property="og:locale" content="fa_IR" />

      {/* ===== توییتر ===== */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* ===== تگ‌های مقاله ===== */}
      {article && publishedTime && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          <meta property="article:author" content={author} />
          <meta property="article:section" content="Blog" />
          {keywords && keywords.split(',').map((tag, index) => (
            <meta key={index} property="article:tag" content={tag.trim()} />
          ))}
        </>
      )}

      {/* ===== JSON-LD Schema ===== */}
      <script type="application/ld+json">
        {JSON.stringify(buildSchema())}
      </script>
    </Helmet>
  );
};