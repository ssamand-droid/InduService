import React, { useState, useEffect, useCallback } from 'react'
import {
  Play, Pause, SkipForward, SkipBack,
  Package, AlertTriangle, Wrench, Activity, Zap,
  TrendingUp, Shield, CheckCircle, Factory,
  Gauge, Thermometer, Droplets, Home
} from 'lucide-react'
import { Link } from 'react-router-dom'

const BRAND_GRADIENT = 'linear-gradient(106deg, #0099d6, #052a68)'

const demoSteps = [
  // اسلایدهای شما دقیقاً همان‌طور که فرستادید، فقط تغییری در آنها نیست
  {
    icon: '',
    title: 'دستگاه Blow Molding — Krones Contiform 3',
    subtitle: 'تولید پریفرم PET — ۴۸,۰۰۰ بطری در ساعت',
    description: 'بادکن بطری 0.5 لیتری دهانه 30 شورت نک',
    color: 'from-[#0099d6] to-[#052a68]',
    image: '/assets/images/demo/blow-molding.jpg',
    stats: [
      { label: 'سرعت تولید', value: '۴۸,۰۰۰', icon: Zap, unit: 'بطری/ساعت' },
      { label: 'فشار دمش', value: '۳۵', icon: Gauge, unit: 'bar' },
      { label: 'دمای پریفرم', value: '۱۰۵', icon: Thermometer, unit: '°C' },
      { label: 'تعداد قالب', value: '۲۰', icon: Factory },
    ],
    features: [
      'پریفرم‌های PET از سیلو وارد کوره مادون قرمز می‌شوند',
      'دمای کوره: ۱۰۵°C — پریفرم‌ها نرم و آماده دمش',
      'فشار دمش: ۳۵ bar — بطری‌های ۱.۵L در ۰.۸ ثانیه شکل می‌گیرند',
      'خنک‌کاری: آب ۱۲°C — بطری‌ها تثبیت و به خط پرکن منتقل می‌شوند',
      'مانیتورینگ: سنسور ضخامت دیواره — ±۰.۱mm دقت',
    ],
    time: '⚠️ هر ۰.۸ ثانیه = ۱ بطری — کوچکترین توقف = ۱۳ بطری در ثانیه از دست رفته',
    alert: false,
  },
  {
    icon: '',
    title: 'خط تولید کامل کرونز ۴۸,۰۰۰ بطری',
    subtitle: 'کارخانه نوشابه‌سازی — از Blow Molding تا پالت',
    description: 'نمایش زنده وضعیت تمام تجهیزات: Blow Molding، پرکن، لیبل‌زن، شیرینگ، پالتایزر و سیستم CIP. هرگونه توقف = ۸۰۰ بطری در دقیقه ضرر.',
    color: 'from-[#0099d6] to-[#052a68]',
    image: '/assets/images/demo/krones-line.jpg.avif',
    stats: [
      { label: 'ظرفیت خط', value: '۴۸,۰۰۰', icon: Zap, unit: 'بطری/ساعت' },
      { label: 'تجهیزات فعال', value: '۱۳', icon: Factory },
      { label: 'وضعیت خط', value: 'در حال تولید', icon: Activity },
      { label: 'راندمان (OEE)', value: '۸۷٪', icon: Gauge },
    ],
    features: [
      'Blow Molding: 🟢 ۴۸,۰۰۰ bph — ضخامت دیواره ۰.۳mm',
      'پرکن (Filler): 🟢 ۴۸,۰۰۰ bph — دمای نوشابه: ۴.۲°C',
      'لیبل‌زن (Labeler): 🟢 ۴۷,۸۰۰ bph — هماهنگ با پرکن',
      'شیرینگ (Shrink): 🟡 ۴۶,۲۰۰ bph — ۳.۷٪ زیر ظرفیت',
      'پالتایزر (Palletizer): 🟢 ۴۸,۰۰۰ bph — بدون خطا',
    ],
    time: '💰 هر دقیقه توقف = ۸۰۰ بطری = ۴۰ میلیون ریال ضرر',
    alert: true,
    alertText: '🟡 شیرینگ ۳.۷٪ زیر ظرفیت — بررسی بخار و فیلم',
  },
  {
    icon: '',
    title: 'پمپ سیرکولاسیون CIP — KSB Etanorm 150-315',
    subtitle: 'نگهداری پیش‌بینانه بر اساس ارتعاش',
    description: 'پمپ KSB Etanorm با دبی ۴۰۰ m³/h مسئول شستشوی کل خط تولید. خرابی این پمپ = توقف کامل تولید تا ۸ ساعت.',
    color: 'from-red-600 to-orange-500',
    image: '/assets/images/demo/ksb-125-400.jpg',
    stats: [
      { label: 'ارتعاش فعلی', value: '۸.۷', icon: Activity, unit: 'mm/s' },
      { label: 'آستانه هشدار', value: '۷.۰', icon: AlertTriangle, unit: 'mm/s' },
      { label: 'آستانه بحرانی', value: '۱۱.۰', icon: AlertTriangle, unit: 'mm/s' },
      { label: 'هزینه توقف', value: '۳۲۰', icon: TrendingUp, unit: 'میلیون/ساعت' },
    ],
    features: [
      'روند ارتعاش: ۳.۱ → ۵.۲ → ۷.۱ → ۸.۷ mm/s (صعودی)',
      'پیش‌بینی: رسیدن به آستانه بحرانی تا ۳ روز آینده',
      'قطعه بحرانی: بیرینگ ۶۳۱۲ — موجودی انبار: ۲ عدد',
      'برنامه تعمیر: جمعه ۳ صبح (پنجره توقف هفتگی)',
      'صرفه‌جویی با تعمیر برنامه‌ریزی: ۲.۵ میلیارد ریال',
    ],
    time: '⏱ تعمیر برنامه‌ریزی شده: ۲ ساعت — اضطراری: ۸ ساعت',
    alert: true,
    alertText: '🔴 هشدار: ارتعاش پمپ CIP از حد مجاز عبور کرده است',
  },
  {
    icon: '',
    title: 'کمپرسور آمونیاک — Mycom N8WA',
    subtitle: 'سیستم سرمایش نوشابه — دمای خروجی ۴°C',
    description: 'کمپرسور اسکرو Mycom N8WA با توان ۴۵۰ kW قلب سیستم سرمایش است. خرابی = توقف خط + از بین رفتن ۲۰,۰۰۰ لیتر نوشابه.',
    color: 'from-cyan-600 to-blue-500',
    image: '/assets/images/demo/mycom-compressor.jpeg',
    stats: [
      { label: 'دمای تخلیه', value: '۸۲', icon: Thermometer, unit: '°C' },
      { label: 'فشار مکش', value: '۳.۲', icon: Gauge, unit: 'bar' },
      { label: 'فشار رانش', value: '۱۲.۵', icon: Gauge, unit: 'bar' },
      { label: 'ساعت کارکرد', value: '۲۴,۵۰۰', icon: Activity, unit: 'ساعت' },
    ],
    features: [
      'موعد تعویض روغن: ۲۵,۰۰۰ ساعت (۵۰۰ ساعت دیگر)',
      'آنالیز روغن: ذرات فلزی ۱۵ ppm — نرمال',
      'ارتعاش: ۴.۲ mm/s — نرمال (زیر ۷.۰)',
      'قطعات یدکی بحرانی: فیلتر روغن (۵ عدد)، گسکت (۱۰ عدد)',
      'سرویس دوره‌ای بعدی: ۱۵ روز دیگر',
    ],
    time: '⚠️ موعد تعویض روغن تا ۵۰۰ ساعت دیگر — برنامه‌ریزی شود',
    alert: false,
  },
  {
    icon: '',
    title: 'پالتایزر Krones Robogrip',
    subtitle: 'چیدمان رباتیک بطری روی پالت',
    description: 'ربات ۴ محوره Krones با سرعت ۴۸,۰۰۰ بطری/ساعت. هرگونه خرابی = توقف بسته‌بندی و انباشت بطری در خط.',
    color: 'from-purple-600 to-indigo-500',
    image: '/assets/images/demo/krones palletizer.webp',
    stats: [
      { label: 'سرعت فعلی', value: '۴۸,۰۰۰', icon: Zap, unit: 'bph' },
      { label: 'سرویس گریپر', value: '۱۲۰', icon: Wrench, unit: 'روز دیگر' },
      { label: 'خطای گریپ', value: '۰.۰۲', icon: AlertTriangle, unit: '٪' },
      { label: 'عمر مفید', value: '۸۵٪', icon: TrendingUp, unit: 'باقی‌مانده' },
    ],
    features: [
      'برنامه نگهداری: سرویس گریپر هر ۶ ماه',
      'قطعات یدکی: گریپر (۳ عدد)، سنسور (۲ عدد)، بلبرینگ (۴ عدد)',
      'آخرین سرویس: ۱۴۰۳/۰۹/۱۵ — ۱۶۰ روز پیش',
      'نرم‌افزار: نسخه ۴.۲.۱ — به‌روزرسانی موجود است',
      'میانگین خطای گریپ: ۰.۰۲٪ (استاندارد: <۰.۱٪)',
    ],
    time: '✅ تمام شاخص‌ها در محدوده نرمال — بدون اقدام فوری',
    alert: false,
  },
  {
    icon: '',
    title: 'سیستم تصفیه آب — اسمز معکوس (RO)',
    subtitle: 'ظرفیت ۵۰ m³/h — کیفیت آب ورودی نوشابه',
    description: 'سیستم اسمز معکوس با ۱۲ ممبران Filmtec. آب خروجی با TDS < 10 ppm شرط اصلی کیفیت نوشابه است.',
    color: 'from-blue-500 to-indigo-600',
    image: '/assets/images/demo/RO system.jpg',
    stats: [
      { label: 'TDS ورودی', value: '۴۵۰', icon: Droplets, unit: 'ppm' },
      { label: 'TDS خروجی', value: '۷.۲', icon: Droplets, unit: 'ppm' },
      { label: 'فشار RO', value: '۱۲.۵', icon: Gauge, unit: 'bar' },
      { label: 'عمر ممبران', value: '۶۵٪', icon: TrendingUp, unit: 'باقی‌مانده' },
    ],
    features: [
      'کیفیت آب: TDS خروجی ۷.۲ ppm (استاندارد: <۱۰)',
      'ممبران شماره ۴ و ۷: کاهش ۱۵٪ دبی — نیاز به شستشوی شیمیایی',
      'برنامه CIP ممبران: یکشنبه هفته آینده',
      'مواد شیمیایی: اسید سیتریک (۵۰ kg)، NaOH (۳۰ kg) — موجود',
      'هشدار: ممبران‌ها ۳۵٪ عمر مفید باقی‌مانده — بودجه تعویض ۶ ماه آینده',
    ],
    time: '🟡 ممبران ۴ و ۷ کاهش دبی — شستشوی شیمیایی برنامه‌ریزی شود',
    alert: true,
    alertText: '🟡 ممبران RO کاهش دبی — شستشو یکشنبه',
  },
  {
    icon: '',
    title: 'گزارش هفتگی نگهداری و تعمیرات',
    subtitle: 'کارخانه نوشابه‌سازی — هفته ۲۱',
    description: 'خلاصه عملکرد، هزینه‌ها و برنامه‌ریزی هفته آینده. هدف OEE: ۹۰٪ — فعلی: ۸۷٪ (شکاف ۳٪ = ۱۴,۴۰۰ بطری در روز).',
    color: 'from-emerald-600 to-green-500',
    stats: [
      { label: 'OEE', value: '۸۷٪', icon: Gauge, unit: 'هدف: ۹۰٪' },
      { label: 'توقف کل', value: '۴.۵', icon: AlertTriangle, unit: 'ساعت/هفته' },
      { label: 'هزینه نت', value: '۱۸۰', icon: TrendingUp, unit: 'میلیون' },
      { label: 'MTBF', value: '۱۲۴', icon: Activity, unit: 'ساعت' },
    ],
    features: [
      'توقف‌ها: Blow Molding (۰.۵h)، شیرینگ (۲.۱h)، پرکن (۱.۴h)',
      'اقدامات هفته آینده: تعویض روغن کمپرسور، شستشوی ممبران',
      'قطعات مصرفی: سفارش ۲۰ عدد گریپر پالتایزر',
      'بودجه پیشنهادی هفته بعد: ۲۵۰ میلیون ریال',
      'روند OEE: ۸۴٪ → ۸۵٪ → ۸۷٪ (صعودی ✅)',
    ],
    time: '📈 OEE صعودی — هدف ۹۰٪ تا پایان ماه',
    alert: false,
  },
]

const DemoPage = () => {
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [imageError, setImageError] = useState(false)

  const goToStep = useCallback((newStep) => {
    setIsTransitioning(true)
    setImageError(false)
    setTimeout(() => {
      setStep(newStep)
      setIsTransitioning(false)
    }, 400)
  }, [])

  useEffect(() => {
    let interval
    if (isPlaying) {
      interval = setInterval(() => {
        setStep(prev => (prev < demoSteps.length - 1 ? prev + 1 : 0))
      }, 6000)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case ' ': e.preventDefault(); setIsPlaying(p => !p); break
        case 'ArrowRight': goToStep(prev => Math.min(demoSteps.length - 1, prev + 1)); break
        case 'ArrowLeft': goToStep(prev => Math.max(0, prev - 1)); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToStep])

  const current = demoSteps[step]

  return (
    <div className="min-h-screen text-white" style={{ background: BRAND_GRADIENT }}>
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Top Bar - fixed and hides platform header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
              <Factory size={18} className="text-cyan-400" />
              <span className="font-bold text-cyan-300">Krones Line 48K</span>
            </div>
            <div className="hidden md:flex items-center gap-3 text-xs text-white/60">
              <span>🟢 بادکن</span>
              <span>🟢 پرکن</span>
              <span>🟢 لیبل</span>
              <span>🟡 شیرینگ</span>
              <span>🟢 پالت</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-white/50">OEE</div>
              <div className="text-lg font-bold text-green-400">۸۷٪</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/50">تولید امروز</div>
              <div className="text-lg font-bold text-white">۳۸۴,۰۰۰</div>
            </div>
            {/* 🆕 لینک بازگشت به پلتفرم */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition border border-white/20"
            >
              <Home size={16} />
              <span className="hidden md:inline">بازگشت به پلتفرم</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-20 pb-12 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Progress */}
          {/* <div className="flex gap-1 mb-8">
            {demoSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                  i === step ? 'bg-cyan-400 shadow-lg shadow-cyan-500/50' :
                  i < step ? 'bg-cyan-600/50' : 'bg-white/20 hover:bg-white/30'
                }`}
              />
            ))}
          </div>

          <div className="text-center mb-6">
            <span className="text-xs text-white/40 font-mono">
              {String(step + 1).padStart(2, '0')} / {String(demoSteps.length).padStart(2, '0')}
            </span>
          </div> */}

          {/* Alert Banner */}
          {current.alert && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center gap-3 animate-pulse backdrop-blur-sm">
              <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
              <span className="text-red-200 font-medium">{current.alertText}</span>
            </div>
          )}

          {/* Main Card */}
          <div className={`bg-white/10 backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/20 shadow-2xl transition-all duration-400 ${
            isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}>

            {/* Image Section */}
            {current.image && (
              <div className="mb-8 -mx-8 md:-mx-10 -mt-8 md:-mt-10 rounded-t-3xl overflow-hidden h-48 md:h-64 bg-black/30">
                {!imageError ? (
                  <img
                    src={current.image}
                    alt={current.title}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Factory size={64} className="text-white/20" />
                  </div>
                )}
              </div>
            )}

            <div className="text-center mb-8">
              <div className="text-5xl md:text-6xl mb-4">{current.icon}</div>
              <div className={`inline-block bg-gradient-to-r ${current.color} text-white px-4 py-1.5 rounded-full text-sm font-medium mb-3`}>
                {current.subtitle}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">{current.title}</h2>
              <p className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Stats Grid */}
            {current.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {current.stats.map((stat, i) => {
                  const StatIcon = stat.icon
                  return (
                    <div key={i} className="bg-white/5 rounded-2xl p-4 text-center border border-white/10 hover:bg-white/10 transition group backdrop-blur-sm">
                      <StatIcon className="mx-auto text-cyan-400 mb-2 group-hover:scale-110 transition" size={22} />
                      <p className="text-2xl md:text-3xl font-bold mb-1">
                        {stat.value}
                        {stat.unit && <span className="text-sm font-normal text-white/40 mr-1">{stat.unit}</span>}
                      </p>
                      <p className="text-xs text-white/50">{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {current.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition">
                  <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-white/70 text-sm leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>

            {/* Time */}
            <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-cyan-300 font-medium">{current.time}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-5 mt-8">
            <button onClick={() => goToStep(Math.max(0, step - 1))}
              className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition border border-white/20">
              <SkipForward size={22} />
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)}
              className="p-5 rounded-2xl bg-white/20 hover:bg-white/30 transition shadow-xl shadow-cyan-500/20 border border-white/20">
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button onClick={() => goToStep(Math.min(demoSteps.length - 1, step + 1))}
              className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition border border-white/20">
              <SkipBack size={22} />
            </button>
          </div>

          <div className="flex justify-center gap-2.5 mt-6">
            {demoSteps.map((_, i) => (
              <button key={i} onClick={() => goToStep(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === step ? 'bg-cyan-400 scale-125 shadow-lg shadow-cyan-500/50' : 'bg-white/30 hover:bg-white/50'
                }`} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA with Banner */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 pb-16 text-center">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20
                  h-64 md:h-80">
          {/* 🆕 بنر کرونز جایگزین ستاره */}
          <img
            src="/assets/images/demo/Krones-banner_3200x900.jpg"
            alt="Krones Banner"
            className="w-full h-full object-cover absolute inset-0"
          />
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">مدیریت هوشمند خط تولید نوشابه</h2>
            <p className="text-white/80 mb-6">کاهش توقف، افزایش OEE، صرفه‌جویی میلیاردی</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3">
              <button className="px-8 py-3.5 bg-white text-[#052a68] rounded-xl font-bold hover:bg-gray-100 transition shadow-xl">
                🚀 شروع رایگان
              </button>
              <button className="px-8 py-3.5 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition border border-white/20">
                📞 دموی اختصاصی کارخانه
              </button>
            </div>
            <p className="text-white/50 mt-3 text-xs">راه‌اندازی در ۵ دقیقه • بدون کارت اعتباری</p>
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="fixed bottom-4 right-4 text-white/20 text-xs z-50">
        ⌨️ Space: پخش/توقف • ← →: حرکت
      </div>
    </div>
  )
}

export default DemoPage