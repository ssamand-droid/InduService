// src/pages/AboutPage.jsx
import { FiShield, FiUsers, FiAward, FiTarget, FiTrendingUp, FiGlobe, FiCheckCircle, FiClock, FiPhoneCall } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Button } from '@components/ui';

const stats = [
  { icon: FiUsers, value: '۵۰۰+', label: 'مشتری صنعتی فعال' },
  { icon: FiAward, value: '۱,۵۰۰+', label: 'پروژه موفق' },
  { icon: FiTrendingUp, value: '۸ سال', label: 'سابقه فعالیت حرفه‌ای' },
  { icon: FiGlobe, value: '۲۰۰+', label: 'متخصص صنعتی' },
];

const values = [
  {
    icon: FiTarget,
    title: 'تخصص و کیفیت',
    description: 'تمامی خدمات توسط متخصصان مجرب و با استفاده از تجهیزات پیشرفته انجام می‌شود.',
  },
  {
    icon: FiShield,
    title: 'تضمین و گارانتی',
    description: 'کلیه خدمات و محصولات دارای گارانتی معتبر و پشتیبانی پس از انجام کار می‌باشند.',
  },
  {
    icon: FiTrendingUp,
    title: 'نوآوری مستمر',
    description: 'با بهره‌گیری از جدیدترین فناوری‌ها، راهکارهای بهینه صنعتی ارائه می‌دهیم.',
  },
];

const teamFeatures = [
  { icon: FiClock, title: 'پاسخگویی سریع', desc: 'پاسخ به درخواست‌ها در کمتر از ۲ ساعت کاری' },
  { icon: FiCheckCircle, title: 'کیفیت تضمینی', desc: 'ضمانت نامحدود کیفیت خدمات' },
  { icon: FiPhoneCall, title: 'پشتیبانی ۲۴/۷', desc: 'تیم پشتیبانی آماده پاسخگویی در تمام ساعات' },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section - مشابه صفحه اصلی */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_0.8px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="container-custom relative z-10 py-20 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-400/30 bg-blue-950/60 backdrop-blur-md mb-6">
              <FiTarget className="text-blue-400" />
              <span className="text-sm font-medium tracking-[2px] text-blue-300">درباره ما • INDUSTRY 4.0</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6">
              درباره <span className="text-blue-400">InduService</span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
              پیشرو در ارائه خدمات تخصصی نگهداری، تعمیر و اورهال تجهیزات صنعتی در ایران
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container-custom -mt-12 relative z-20 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl shadow-xl p-6 text-center border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 mb-4">
                  <Icon className="h-7 w-7 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container-custom py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <div className="group bg-white rounded-2xl border border-slate-200 p-6 md:p-8 hover:border-blue-500 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">ماموریت ما</h3>
            <p className="text-slate-600 leading-relaxed">
              ایجاد بستری مطمئن و کارآمد برای اتصال صنایع کشور به شبکه‌ای از متخصصان و تامین‌کنندگان
              معتبر، با هدف کاهش توقفات تولید، افزایش بهره‌وری و توسعه پایدار صنعت ایران.
            </p>
          </div>

          <div className="group bg-white rounded-2xl border border-slate-200 p-6 md:p-8 hover:border-blue-500 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <span className="text-3xl">🔭</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">چشم‌انداز ما</h3>
            <p className="text-slate-600 leading-relaxed">
              تبدیل شدن به مرجع اول و اصلی خدمات MRO در خاورمیانه تا سال ۱۴۱۰، با پوشش کامل
              زنجیره تامین، تعمیرات و نگهداری صنایع نفت، گاز، پتروشیمی، فولاد و نیروگاهی.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">ارزش‌های بنیادین ما</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">اصولی که هر روز با آنها کار می‌کنیم</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="bg-white rounded-2xl border border-slate-200 p-8 text-center hover:border-blue-500 hover:shadow-xl transition-all duration-300 group">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-700 mb-6 group-hover:scale-110 transition">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{value.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Features */}
      <section className="container-custom py-16 md:py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {teamFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="flex items-start gap-4 p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-700 to-slate-900 py-16 md:py-20 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">همین امروز به ما بپیوندید</h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
            چه کارخانه‌دار، چه متخصص تعمیرات و چه تامین‌کننده قطعات صنعتی هستید،
            InduService بهترین پلتفرم برای رشد کسب‌و‌کار شماست.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="primary" size="lg" className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-4 rounded-2xl font-semibold shadow-xl">
                ثبت‌نام در پلتفرم
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4 rounded-2xl">
                تماس با ما
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}