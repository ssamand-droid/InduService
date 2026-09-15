// src/pages/HomePage.jsx
import { Link } from 'react-router-dom';
import {
  FiArrowLeft, FiSearch, FiPackage, FiTool, FiShield,
  FiUsers, FiAward, FiClock, FiStar,
  FiChevronLeft, FiChevronRight, FiZap,
  FiDroplet, FiSettings, FiTarget, FiCpu, FiBarChart2,
  FiUpload, FiActivity, FiAlertTriangle, FiCalendar
} from 'react-icons/fi';
import { Button } from '@components/ui';
import { SEO } from '@components/SEO';
import { useState, useEffect, useCallback } from 'react';

// ======================== Data ========================
const heroSlides = [
  {
    title: 'بازار تخصصی خدمات صنعتی و MRO',
    subtitle: 'تعمیرات تخصصی، اورهال تجهیزات صنعتی و تامین قطعات یدکی',
    cta1: { label: 'درخواست خدمت', link: '/services' },
    cta2: { label: 'مشاهده محصولات', link: '/products' },
  },
  {
    title: 'مدیریت هوشمند ماشین آلات و نگهداری پیشگیرانه',
    subtitle: 'از آپلود اکسل تا پیش‌بینی خرابی — تمام ابزارهای مدرن مدیریت کارخانه در یک پلتفرم',
    cta1: { label: 'مدیریت دستگاه‌ها', link: '/assets' },
    cta2: { label: 'ثبت درخواست', link: '/request-service' },
  },
  {
    title: 'شبکه ۱۵۰۰+ متخصص صنعتی ایران',
    subtitle: 'متخصصان مجرب در سراسر کشور با ضمانت کیفیت و تعهد زمانی',
    cta1: { label: 'ثبت‌نام متخصصان', link: '/register' },
    cta2: { label: 'درباره ما', link: '/about' },
  },
];

const stats = [
  { icon: FiUsers, value: '۵۰۰+', label: 'مشتری صنعتی فعال' },
  { icon: FiAward, value: '۱,۵۰۰+', label: 'پروژه موفق' },
  { icon: FiClock, value: '۹۸٪', label: 'رضایت مشتریان' },
  { icon: FiStar, value: '۴.۸', label: 'امتیاز میانگین' },
];

const smartFeatures = [
  {
    icon: FiUpload,
    title: 'بارگذاری آسان دستگاه‌ها',
    desc: 'آپلود مشخصات کامل ماشین آلات از طریق فایل اکسل با یک کلیک',
    highlight: 'Excel Import'
  },
  {
    icon: FiActivity,
    title: 'نظارت آنلاین وضعیت دستگاه‌ها',
    desc: 'اتصال مستقیم به تجهیزات و نمایش وضعیت زنده کارخانه',
    highlight: 'Real-time Monitoring'
  },
  {
    icon: FiAlertTriangle,
    title: 'پیش‌بینی خرابی هوشمند',
    desc: 'تحلیل داده‌ها و هشدار پیش از وقوع خرابی',
    highlight: 'Predictive Analytics'
  },
  {
    icon: FiCalendar,
    title: 'نگهداری پیشگیرانه هوشمند',
    desc: 'برنامه‌ریزی خودکار تعمیرات و کاهش توقفات تولید',
    highlight: 'Preventive Maintenance'
  },
];

const features = [
  {
    icon: FiPackage,
    title: 'قطعات یدکی اصلی',
    description: 'تامین مستقیم از برندهای معتبر جهانی با ضمانت اصالت',
    color: 'from-blue-700 to-slate-700',
  },
  {
    icon: FiTool,
    title: 'خدمات تخصصی MRO',
    description: 'تعمیر، نگهداری و اورهال تجهیزات توسط متخصصان مجرب',
    color: 'from-slate-700 to-blue-800',
  },
  {
    icon: FiShield,
    title: 'امنیت و تضمین کامل',
    description: 'پرداخت امن، گارانتی کیفیت و پشتیبانی ۲۴ ساعته',
    color: 'from-blue-800 to-slate-800',
  },
];

const categories = [
  { name: 'PLC و اتوماسیون', icon: FiCpu, count: '۴۵۰+', color: 'from-cyan-700 to-blue-700' },
  { name: 'ابزار دقیق', icon: FiBarChart2, count: '۹۳۰+', color: 'from-slate-600 to-blue-600' },
  { name: 'الکتروموتور', icon: FiZap, count: '۱,۲۴۰+', color: 'from-blue-600 to-cyan-700' },
  { name: 'پمپ صنعتی', icon: FiDroplet, count: '۸۵۰+', color: 'from-slate-600 to-blue-700' },
  { name: 'گیربکس', icon: FiSettings, count: '۶۲۰+', color: 'from-slate-700 to-gray-700' },
  { name: 'بیرینگ', icon: FiTarget, count: '۲,۱۰۰+', color: 'from-blue-700 to-indigo-700' },
];

const testimonials = [
  {
    name: 'شرکت فولاد مبارکه',
    text: 'کیفیت خدمات و سرعت پاسخگویی InduService واقعاً قابل تحسینه. تعمیرات الکتروموتورهای ما در کمتر از 72 ساعت انجام شد.',
    rating: 5,
  },
  {
    name: 'پتروشیمی بندر امام',
    text: 'پلتفرم حرفه‌ای و قابل اعتماد. تمام نیازهای MRO و مدیریت دستگاه ما را پوشش می‌دهد.',
    rating: 5,
  },
];

// ======================== Sub Components ========================

const HeroSection = ({ slides }) => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((prev) => (prev + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:80px_80px]" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_0.8px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="container-custom relative z-10 py-20 md:py-32">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-400/30 bg-blue-950/60 backdrop-blur-md mb-6">
            <FiCpu className="text-blue-400" />
            <span className="text-sm font-medium tracking-[2px] text-blue-300">IIoT • PREDICTIVE MAINTENANCE • ASSET MANAGEMENT</span>
          </div>

          <div className="transition-all duration-700" key={current}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tighter mb-6">
              {slides[current].title}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl leading-relaxed">
              {slides[current].subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to={slides[current].cta1.link}>
              <Button
                variant="primary"
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white text-lg px-10 py-7 rounded-2xl font-semibold shadow-xl shadow-blue-900/60 transition-all"
              >
                {slides[current].cta1.label}
                <FiArrowLeft className="mr-3 h-6 w-6" />
              </Button>
            </Link>
            <Link to={slides[current].cta2.link}>
              <Button
                variant="outline"
                size="lg"
                className="border-blue-400 text-white hover:bg-blue-900/50 text-lg px-8 py-7 rounded-2xl"
              >
                {slides[current].cta2.label}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-3 rounded-full transition-all duration-300 ${i === current ? 'w-12 bg-blue-400' : 'w-3 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button onClick={prev} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition hidden md:block">
        <FiChevronLeft className="h-7 w-7" />
      </button>
      <button onClick={next} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition hidden md:block">
        <FiChevronRight className="h-7 w-7" />
      </button>
    </section>
  );
};

const SearchBar = () => (
  <section className="container-custom -mt-8 md:-mt-12 relative z-30 px-4">
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 h-6 w-6" />
          <input
            type="text"
            placeholder="جستجوی محصول، قطعه، دستگاه یا خدمت..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-6 pr-14 py-5 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
          />
        </div>
        <Button
          variant="primary"
          size="lg"
          className="rounded-2xl px-12 text-lg font-semibold bg-blue-600 hover:bg-blue-500"
        >
          جستجو
        </Button>
      </div>
    </div>
  </section>
);

const StatsSection = () => (
  <section className="container-custom py-16 bg-white dark:bg-slate-900">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="text-center p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 hover:shadow-lg transition-all group">
            <Icon className="h-10 w-10 mx-auto text-blue-600 mb-4 group-hover:scale-110 transition" />
            <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
            <div className="text-slate-600 dark:text-slate-400">{stat.label}</div>
          </div>
        );
      })}
    </div>
  </section>
);

const SmartCapabilitiesSection = () => (
  <section className="container-custom py-20 bg-slate-50 dark:bg-slate-950">
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">مدیریت هوشمند دستگاه و نگهداری</h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        از ثبت دستگاه‌ها تا پیش‌بینی خرابی — پلتفرم کامل مدیریت نگهداری کارخانه
      </p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {smartFeatures.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div key={index} className="group p-8 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 hover:shadow-2xl transition-all">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Icon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-5">{feature.desc}</p>
            <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
              {feature.highlight}
            </span>
          </div>
        );
      })}
    </div>

    {/* Dashboard Preview */}
    <div className="mt-16 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-950">
      <div className="bg-slate-900 px-6 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm text-slate-400 font-medium">داشبورد مدیریت دستگاه • وضعیت زنده</span>
        </div>
      </div>
      <div className="p-12 text-center text-slate-500 bg-[linear-gradient(45deg,#1e2937_25%,#0f172a_25%,#0f172a_50%,#1e2937_50%)] bg-[size:40px_40px]">
        <p className="text-lg mb-2">پیش‌نمایش داشبورد هوشمند</p>
        <p className="text-sm">نمودارهای وضعیت دستگاه‌ها • آلارم‌های پیش‌بینی خرابی • برنامه نگهداری</p>
      </div>
    </div>
  </section>
);

const CategoriesSection = () => (
  <section className="container-custom py-20 bg-white dark:bg-slate-900">
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">دسته‌بندی محصولات و تجهیزات</h2>
      <p className="text-slate-600 dark:text-slate-400">محصولات صنعتی را بر اساس نیاز خود پیدا کنید</p>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.name}
            to={`/products?category=${cat.name}`}
            className="group relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-xl transition-all hover:-translate-y-1 text-center"
          >
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cat.color} rounded-t-3xl`} />

            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-6 group-hover:bg-blue-50 dark:group-hover:bg-slate-700 transition-colors">
              <Icon className="h-12 w-12 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors" />
            </div>

            <h3 className="font-semibold text-xl text-slate-900 dark:text-white mb-2">{cat.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{cat.count} محصول</p>
          </Link>
        );
      })}
    </div>
  </section>
);

const FeaturesSection = () => (
  <section className="container-custom py-20 bg-slate-50 dark:bg-slate-950">
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">چرا InduService؟</h2>
      <p className="text-slate-600 dark:text-slate-400">پلتفرم جامع با تمرکز بر مهندسی و دقت صنعتی</p>
    </div>

    <div className="grid md:grid-cols-3 gap-8">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div key={index} className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 hover:border-blue-500/30 transition-all group">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.color} mb-8 text-white group-hover:scale-110 transition-transform`}>
              <Icon className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">{feature.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
          </div>
        );
      })}
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section className="bg-slate-900 py-20 text-white">
    <div className="container-custom">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-3">اعتماد بزرگترین برندهای صنعتی</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {testimonials.map((t, index) => (
          <div key={index} className="p-8 rounded-3xl bg-slate-800 border border-slate-700">
            <div className="flex mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <FiStar key={i} className="h-6 w-6 text-amber-400 fill-current" />
              ))}
            </div>
            <p className="text-lg text-slate-200 leading-relaxed mb-8">«{t.text}»</p>
            <p className="font-semibold text-blue-400">{t.name}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <section className="bg-gradient-to-br from-blue-700 to-slate-900 py-20 text-white">
    <div className="container-custom text-center">
      <h2 className="text-4xl md:text-5xl font-bold mb-6">همین امروز کارخانه خود را هوشمند کنید</h2>
      <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
        مدیریت دستگاه، نگهداری پیشگیرانه و دسترسی به شبکه متخصصان صنعتی در یک پلتفرم واحد
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/register">
          <Button variant="primary" size="lg" className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-10 py-7 rounded-2xl font-semibold">
            ثبت‌نام رایگان
          </Button>
        </Link>
        <Link to="/assets">
          <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-10 py-7 rounded-2xl">
            شروع مدیریت دستگاه‌ها
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

// ======================== Main Component ========================
export const HomePage = () => {
  return (
    <>
      <SEO
        title="InduService | بازار تخصصی خدمات صنعتی و MRO"
        description="مدیریت هوشمند دستگاه، نگهداری پیشگیرانه، تامین قطعات یدکی و خدمات تخصصی صنعتی"
        keywords="خدمات صنعتی, MRO, نگهداری پیشگیرانه, پیش بینی خرابی, مدیریت دستگاه, IIoT"
      />

      <HeroSection slides={heroSlides} />
      <SearchBar />
      <StatsSection />
      <SmartCapabilitiesSection />
      <CategoriesSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
};

export default HomePage;