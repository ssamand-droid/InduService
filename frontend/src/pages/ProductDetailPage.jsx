// src/pages/ProductDetailPage.jsx
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiShoppingCart, FiMinus, FiPlus, FiArrowRight, FiPackage, FiShield, FiTruck } from 'react-icons/fi'
import { useProduct } from '@features/products/hooks/useProducts'
import { useCartStore } from '@features/cart/store/cartStore'
import { Spinner, Alert, Button, Badge, Card, Tabs, TabList, Tab, TabPanels, TabPanel } from '@components/ui'
import { SEO } from '@components/SEO'
import { formatPrice } from '@lib/utils'
import { PRODUCT_CONDITIONS } from '@lib/constants'
import toast from 'react-hot-toast'

const conditionLabels = {
  [PRODUCT_CONDITIONS.NEW]: 'نو',
  [PRODUCT_CONDITIONS.REFURBISHED]: 'بازسازی شده',
  [PRODUCT_CONDITIONS.USED]: 'کارکرده',
}

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { data: product, isLoading, error } = useProduct(slug)
  const addToCart = useCartStore((state) => state.addItem)
  const [quantity, setQuantity] = useState(1)

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container-custom py-8">
        <Alert variant="error">خطا در دریافت اطلاعات محصول</Alert>
      </div>
    )
  }

  const {
    name,
    description,
    short_description,
    final_price,
    price,
    discount_price,
    condition,
    is_in_stock,
    stock_quantity,
    category,
    brand,
    seller,
    images,
    sku,
    lead_time_days,
    meta_title,
    meta_description,
    meta_keywords,
    created_at,
    updated_at,
    average_rating,
  } = product

  const hasDiscount = discount_price && discount_price < price
  const discountPercent = hasDiscount ? Math.round(((price - discount_price) / price) * 100) : 0
  const handleAddToCart = () => {
    addToCart(product, quantity)
    toast.success(`${name} به سبد خرید اضافه شد`)
  }

  // ===== داده‌های سئو =====
  const seoData = {
    title: meta_title || `${name} | خرید با بهترین قیمت | InduService`,
    description: meta_description || short_description || `خرید ${name} با بهترین قیمت و ضمانت اصالت. مشخصات فنی، قیمت و موجودی ${name} در InduService`,
    keywords: meta_keywords || `${name}, قطعه صنعتی, ${category?.name || ''}, ${brand?.name || ''}`,
    image: images?.[0]?.image || '/logo.png',
    url: `https://induservice.pro/products/${slug}`,
    canonical: `https://induservice.pro/products/${slug}`,
    publishedTime: created_at,
    modifiedTime: updated_at,
    schemaType: 'Product',
    productData: {
      sku,
      price: final_price,
      final_price,
      is_in_stock,
      brand,
      average_rating,
      review_count: 0,
    },
    breadcrumbItems: [
      { name: 'خانه', url: 'https://induservice.pro' },
      { name: 'محصولات', url: 'https://induservice.pro/products' },
      { name: category?.name || 'دسته‌بندی', url: category ? `https://induservice.pro/products?category=${category.slug}` : '' },
      { name: name, url: `https://induservice.pro/products/${slug}` },
    ],
  }

  return (
    <>
      <SEO {...seoData} />
      
      {/* ===== بردکرامب با Schema ===== */}
      <div className="container-custom py-4" itemScope itemType="https://schema.org/BreadcrumbList">
        <div className="flex items-center gap-2 text-sm text-secondary-500">
          <Link to="/" itemProp="item" itemScope itemType="https://schema.org/Thing">
            <span itemProp="name">خانه</span>
            <meta itemProp="position" content="1" />
          </Link>
          <FiArrowRight className="h-4 w-4" />
          <Link to="/products" itemProp="item" itemScope itemType="https://schema.org/Thing">
            <span itemProp="name">محصولات</span>
            <meta itemProp="position" content="2" />
          </Link>
          {category && (
            <>
              <FiArrowRight className="h-4 w-4" />
              <Link to={`/products?category=${category.slug}`} itemProp="item" itemScope itemType="https://schema.org/Thing">
                <span itemProp="name">{category.name}</span>
                <meta itemProp="position" content="3" />
              </Link>
            </>
          )}
        </div>
      </div>
      
      <div className="container-custom py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-secondary-500 mb-6">
        <Link to="/" className="hover:text-primary-600">خانه</Link>
        <FiArrowRight className="h-4 w-4" />
        <Link to="/products" className="hover:text-primary-600">محصولات</Link>
        {category && (
          <>
            <FiArrowRight className="h-4 w-4" />
            <Link to={`/products?category=${category.slug}`} className="hover:text-primary-600">
              {category.name}
            </Link>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-secondary-100 dark:bg-secondary-700 mb-4">
            {images?.[0]?.image ? (
              <img
                src={images[0].image}
                alt={name}
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-8xl">📦</div>
            )}
          </div>
          {/* Thumbnail Gallery */}
          {images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-700 border-2 border-transparent hover:border-primary-500 cursor-pointer"
                >
                  <img src={img.image} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {condition && (
              <Badge variant="secondary">{conditionLabels[condition] || condition}</Badge>
            )}
            {hasDiscount && (
              <Badge variant="danger">{discountPercent}٪ تخفیف</Badge>
            )}
            {!is_in_stock && (
              <Badge variant="danger">ناموجود</Badge>
            )}
            {category && (
              <Badge variant="primary">{category.name}</Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-white mb-4">
            {name}
          </h1>

          {/* SKU & Brand */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-500 mb-4">
            {sku && <span>کد محصول: <strong className="text-secondary-700 dark:text-secondary-300">{sku}</strong></span>}
            {brand && <span>برند: <strong className="text-secondary-700 dark:text-secondary-300">{brand.name}</strong></span>}
            {seller && <span>فروشنده: <strong className="text-secondary-700 dark:text-secondary-300">{seller.full_name || '---'}</strong></span>}
          </div>

          {/* Short Description */}
          {short_description && (
            <p className="text-secondary-600 dark:text-secondary-400 mb-6 leading-relaxed">
              {short_description}
            </p>
          )}

          {/* Price */}
          <div className="bg-secondary-50 dark:bg-secondary-800 rounded-xl p-6 mb-6">
            <div className="flex items-end gap-3 mb-4">
              {hasDiscount && (
                <span className="text-xl text-secondary-400 line-through">
                  {formatPrice(price)}
                </span>
              )}
              <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                {formatPrice(final_price)}
              </span>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 text-sm mb-4">
              {is_in_stock ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-green-600 dark:text-green-400">
                    موجود در انبار ({stock_quantity} عدد)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-red-600 dark:text-red-400">ناموجود</span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            {is_in_stock && (
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm text-secondary-600 dark:text-secondary-400">تعداد:</span>
                <div className="flex items-center border-2 border-secondary-300 dark:border-secondary-600 rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition"
                    disabled={quantity <= 1}
                  >
                    <FiMinus className="h-4 w-4" />
                  </button>
                  <span className="w-14 text-center font-medium text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(stock_quantity, q + 1))}
                    className="p-2.5 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition"
                    disabled={quantity >= stock_quantity}
                  >
                    <FiPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!is_in_stock}
              onClick={handleAddToCart}
              className="text-lg"
            >
              <FiShoppingCart className="ml-2 h-5 w-5" />
              افزودن به سبد خرید
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
              <FiTruck className="h-5 w-5 mx-auto mb-1 text-primary-600" />
              <span>ارسال {lead_time_days ? `${lead_time_days} روزه` : 'سریع'}</span>
            </div>
            <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
              <FiShield className="h-5 w-5 mx-auto mb-1 text-primary-600" />
              <span>گارانتی اصالت</span>
            </div>
            <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
              <FiPackage className="h-5 w-5 mx-auto mb-1 text-primary-600" />
              <span>بسته‌بندی صنعتی</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12">
        <Card>
          <div className="p-6">
            <Tabs defaultIndex={0}>
              <TabList>
                <Tab index={0}>توضیحات کامل</Tab>
                <Tab index={1}>مشخصات فنی</Tab>
                <Tab index={2}>نظرات کاربران</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <div className="prose dark:prose-invert max-w-none py-4">
                    {description ? (
                      <div
                        className="text-secondary-700 dark:text-secondary-300 leading-relaxed whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: description }}
                      />
                    ) : (
                      <p className="text-secondary-500">توضیحاتی برای این محصول ثبت نشده است.</p>
                    )}
                  </div>
                </TabPanel>
                <TabPanel>
                  <div className="py-4">
                    {product.specs?.length > 0 ? (
                      <table className="w-full">
                        <thead className="bg-secondary-50 dark:bg-secondary-800">
                          <tr>
                            <th className="text-right p-3 font-medium">مشخصه</th>
                            <th className="text-right p-3 font-medium">مقدار</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                          {product.specs.map((spec) => (
                            <tr key={spec.id}>
                              <td className="p-3 text-secondary-600">{spec.specification?.name}</td>
                              <td className="p-3 font-medium">{spec.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-secondary-500">مشخصات فنی ثبت نشده است.</p>
                    )}
                  </div>
                </TabPanel>
                <TabPanel>
                  <div className="py-4 text-center text-secondary-500">
                    <p>نظرات کاربران به زودی اضافه خواهد شد.</p>
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </div>
        </Card>
      </div>
      </div>
    </> 
  )
}