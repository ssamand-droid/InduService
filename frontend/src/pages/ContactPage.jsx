// src/pages/ContactPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMail, FiPhone, FiMapPin, FiSend, FiClock, 
  FiMessageSquare, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import { Button } from '@components/ui';

const contactInfo = [
  { icon: FiPhone, title: 'تلفن تماس', value: '۰۲۱-۸۸۳۰۹۲۳۱', detail: 'پشتیبانی ۲۴ ساعته', link: 'tel:02188309231' },
  { icon: FiMail, title: 'ایمیل', value: 'info@induservice.pro', detail: 'پاسخگویی در کمتر از ۲۴ ساعت', link: 'mailto:info@induservice.pro' },
  { icon: FiMapPin, title: 'آدرس', value: 'تهران، خیابان مطهری، خیابان سلیمان خاطر، پلاک ۱۵', detail: 'ساختمان مرکزی InduService', link: null },
  { icon: FiClock, title: 'ساعت کاری', value: 'شنبه تا چهارشنبه', detail: '۹ صبح تا ۱۷ عصر', link: null },
];

const faqs = [
  { q: 'چگونه می‌توانم ثبت‌نام کنم؟', a: 'با کلیک روی دکمه "ثبت‌نام" در صفحه اصلی می‌توانید ثبت‌نام خود را انجام دهید.' },
  { q: 'هزینه خدمات چقدر است؟', a: 'هزینه خدمات بر اساس نوع درخواست و توافق با متخصص تعیین می‌شود.' },
  { q: 'آیا گارانتی دارید؟', a: 'بله، کلیه خدمات و محصولات دارای گارانتی معتبر هستند.' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // شبیه‌سازی ارسال
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_0.8px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="container-custom relative z-10 py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-400/30 bg-blue-950/60 backdrop-blur-md mb-6">
              <FiMessageSquare className="text-blue-400" />
              <span className="text-sm font-medium tracking-[2px] text-blue-300">تماس با ما • ۲۴/۷</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6">
              در ارتباط <span className="text-blue-400">باشید</span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
              تیم پشتیبانی ما آماده پاسخگویی به سوالات و درخواست‌های شماست
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="container-custom -mt-12 relative z-20 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactInfo.map((info, idx) => {
            const Icon = info.icon;
            const Wrapper = info.link ? Link : 'div';
            return (
              <Wrapper
                key={idx}
                to={info.link || '#'}
                className="bg-white rounded-2xl shadow-xl p-5 text-center border border-slate-100 hover:border-blue-500 hover:shadow-2xl transition-all group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 mb-4 group-hover:bg-blue-600 transition-colors">
                  <Icon className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{info.title}</h3>
                <p className="text-sm text-slate-700 font-medium">{info.value}</p>
                <p className="text-xs text-slate-400 mt-1">{info.detail}</p>
              </Wrapper>
            );
          })}
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="container-custom py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* فرم تماس */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">ارسال پیام</h2>
              <p className="text-slate-500">ما در اسرع وقت با شما تماس می‌گیریم</p>
            </div>

            {isSubmitted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <FiCheckCircle className="text-green-600 flex-shrink-0" size={20} />
                <p className="text-green-700 text-sm">پیام شما با موفقیت ارسال شد. سپاسگزاریم!</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">نام و نام خانوادگی</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="نام خود را وارد کنید"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ایمیل</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="example@domain.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">شماره تماس</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="۰۹۱۲ XXX XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">موضوع</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="موضوع پیام"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">متن پیام</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                  placeholder="پیام خود را بنویسید..."
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                variant="primary"
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 font-semibold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>در حال ارسال...</>
                ) : (
                  <>
                    <FiSend size={18} />
                    ارسال پیام
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* نقشه و اطلاعات جانبی */}
          <div className="space-y-6">
            {/* نقشه گوگل */}
            <div className="bg-slate-100 rounded-2xl overflow-hidden h-64 md:h-80 border border-slate-200">
              <iframe
                title="Google Maps - Tehran, Motahari Street"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3239.123456789!2d51.432!3d35.715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f8e014c0c0c0c0c%3A0x0!2zMzXCsDQyJzU0LjAiTiA1McKwMjUnNTUuMiJF!5e0!3m2!1sen!2sir!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* سوالات متداول */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">سوالات متداول</h3>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                    <p className="font-semibold text-slate-700 mb-1">❓ {faq.q}</p>
                    <p className="text-sm text-slate-500">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* شبکه‌های اجتماعی */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 text-center">
              <h3 className="font-bold text-slate-800 mb-3">ما را در شبکه‌های اجتماعی دنبال کنید</h3>
              <p className="text-sm text-slate-500 mb-4">با ما همراه باشید تا از آخرین اخبار و تخفیف‌ها باخبر شوید</p>
              <div className="flex justify-center gap-3">
                <a href="#" className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition">ل</a>
                <a href="#" className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition">ت</a>
                <a href="#" className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition">ی</a>
                <a href="#" className="w-10 h-10 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition">گ</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}