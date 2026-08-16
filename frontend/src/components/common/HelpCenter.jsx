// src/components/common/HelpCenter.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, BookOpen, Home, Wrench, FileText,
  ChevronRight, ChevronDown, ChevronLeft,
  HelpCircle, User,
  Settings, Clipboard, Shield, Package,
  ShoppingBag, Monitor, Users, DollarSign, Percent,
  MessageSquare, Grid, Info, Mail, FileCheck, Clock,
  TrendingUp, Zap, Truck, HardDrive, Cpu, Factory,
  Box,
  Briefcase,
  Award,
} from 'lucide-react';
import { SERVICE_SCENARIOS, SERVICE_SCENARIO_GROUPS } from '@lib/constants';
import { useAuthStore } from '@stores/authStore';
import { BUYER_ROLES, PROVIDER_ROLES } from '@lib/constants';

// ============================================================
// داده‌های راهنما - ساختار کامل
// ============================================================
const HELP_DATA = {
  sections: [
    // ======== ۱. شروع سریع (همه کاربران) ========
    {
      id: 'getting-started',
      title: 'شروع سریع',
      icon: Home,
      roles: ['all'],
      items: [
        {
          title: 'آشنایی با پلتفرم',
          content: 'پلتفرم خدمات صنعتی (InduService) یک پل ارتباطی بین کارخانه‌ها (خریداران) و متخصصین تعمیرات و خدمات (خدمات‌دهندگان) است.',
          features: [
            'ثبت درخواست تعمیر و خدمات',
            'دریافت پیشنهاد قیمت از متخصصین',
            'مدیریت دستگاه‌ها و تجهیزات',
            'پیگیری وضعیت درخواست‌ها',
          ],
        },
        {
          title: 'نقش‌های کاربری',
          content: 'پلتفرم دارای نقش‌های مختلف است که هر کدام امکانات خاص خود را دارند:',
          roles: [
            { name: 'خریدار (کارخانه)', desc: 'ثبت درخواست تعمیر، مدیریت دستگاه‌ها، انتخاب بهترین پیشنهاد' },
            { name: 'خدمات‌دهنده', desc: 'اعلام قیمت، انجام تعمیرات، دریافت تسویه' },
            { name: 'فروشنده', desc: 'ثبت و فروش قطعات یدکی و تجهیزات' },
            { name: 'ادمین', desc: 'مدیریت کامل پلتفرم، کاربران، مالی' },
          ],
        },
        {
          title: 'راهنمای استفاده از پلتفرم',
          content: 'برای شروع کار، مراحل زیر را به ترتیب انجام دهید:',
          steps: [
            'ثبت‌نام و ورود به پلتفرم',
            'تکمیل پروفایل کاربری',
            'ثبت دستگاه‌ها (برای خریدار) یا ثبت خدمات (برای خدمات‌دهنده)',
            'ثبت درخواست یا مشاهده درخواست‌های موجود',
          ],
        },
      ],
    },

    // ======== ۲. راهنمای خریدار (فقط خریدار) ========
    {
      id: 'buyer',
      title: 'راهنمای خریدار',
      icon: User,
      roles: ['buyer'],  // ← فقط خریدار
      items: [
        {
          title: 'ثبت دستگاه‌ها و تجهیزات',
          content: 'دستگاه‌ها و تجهیزات خود را در سیستم ثبت کنید تا درخواست‌های تعمیر سریعتر انجام شود.',
          link: '/dashboard/assets/new',
          linkLabel: '➕ ثبت دستگاه جدید',
          steps: [
            'وارد شدن به داشبورد خریدار',
            'کلیک روی "ثبت دستگاه جدید" در بخش اقدامات سریع',
            'پر کردن اطلاعات دستگاه (نام، برند، مدل، سریال، موقعیت)',
            'ذخیره اطلاعات',
          ],
          tips: [
            '💡 هرچه اطلاعات دستگاه دقیق‌تر باشد، تعمیرکاران بهتر می‌توانند مشکل را تشخیص دهند',
            '📸 آپلود عکس از دستگاه به شناسایی بهتر کمک می‌کند',
          ],
        },
        {
          title: 'درخواست خدمت',
          content: 'برای دستگاه‌های خود درخواست تعمیر یا سرویس ثبت کنید.',
          link: '/request-service',
          linkLabel: 'ثبت درخواست جدید',
          steps: [
            'انتخاب دستگاه مورد نظر',
            'شرح کامل مشکل و علائم',
            'تعیین میزان فوریت (کم، متوسط، زیاد، بحرانی)',
            'آپلود عکس‌ها و مستندات (اختیاری)',
            'ارسال درخواست',
          ],
          tips: [
            'توضیحات دقیق = دریافت پیشنهادهای بهتر',
            '📸 عکس‌ها به تعمیرکار کمک می‌کنند تا مشکل را سریعتر تشخیص دهند',
          ],
        },
        {
          title: 'سناریوهای تعمیرات',
          content: 'انواع مختلف درخواست‌های تعمیر که می‌توانید ثبت کنید:',
          scenarios: SERVICE_SCENARIO_GROUPS,
        },
        {
          title: 'پیگیری درخواست‌ها',
          content: 'وضعیت درخواست‌های خود را مشاهده و بهترین پیشنهاد را انتخاب کنید.',
          link: '/dashboard/service-requests',
          linkLabel: 'مشاهده درخواست‌ها',
          statuses: [
            { status: 'pending', label: 'در انتظار بررسی', color: 'yellow' },
            { status: 'reviewed', label: 'بررسی شده', color: 'blue' },
            { status: 'quoted', label: 'قیمت داده شده', color: 'indigo' },
            { status: 'accepted', label: 'پذیرفته شده', color: 'green' },
            { status: 'in_progress', label: 'در حال انجام', color: 'purple' },
            { status: 'completed', label: 'تکمیل شده', color: 'emerald' },
            { status: 'cancelled', label: 'لغو شده', color: 'red' },
          ],
        },
        {
          title: 'انتخاب بهترین پیشنهاد',
          content: 'پس از دریافت پیشنهادهای قیمت از خدمات‌دهندگان، بهترین گزینه را انتخاب کنید.',
          steps: [
            'مشاهده لیست پیشنهادها در صفحه جزئیات درخواست',
            'مقایسه قیمت، زمان، شرایط و گارانتی',
            'انتخاب بهترین پیشنهاد با کلیک روی دکمه "انتخاب این پیشنهاد"',
            'پرداخت پیش‌پرداخت (در صورت نیاز)',
            'شروع فرآیند تعمیر',
          ],
        },
        {
          title: 'سفارش‌های من',
          content: 'مدیریت و پیگیری سفارش‌های قطعات و تجهیزات.',
          link: '/dashboard/orders',
          linkLabel: 'مشاهده سفارش‌ها',
        },
      ],
    },

    // ======== ۳. راهنمای خدمات‌دهنده (فقط خدمات‌دهنده) ========
    {
      id: 'provider',
      title: 'راهنمای خدمات‌دهنده',
      icon: Wrench,
      roles: ['provider'],  // ← فقط خدمات‌دهنده
      items: [
        {
          title: 'تکمیل پروفایل تخصصی',
          content: 'اطلاعات تخصصی خود را کامل کنید تا خریداران شما را پیدا کنند.',
          link: '/profile',
          linkLabel: ' ویرایش پروفایل',
          steps: [
            'ورود به پروفایل کاربری',
            'تکمیل اطلاعات شخصی (نام، موبایل، نوع شخص)',
            'انتخاب خدمات قابل ارائه (چند انتخابی)',
            'تعیین محدوده فعالیت (شهر، استان، حداکثر فاصله)',
            'تنظیم دستمزد پایه (ساعتی و روزانه)',
            'ذخیره تغییرات',
          ],
          tips: [
            '⭐ هرچه پروفایل کامل‌تر باشد، شانس انتخاب شما بیشتر است',
            '📸 آپلود تصویر پروفایل حرفه‌ای اعتماد را افزایش می‌دهد',
          ],
        },
        {
          title: 'ثبت خدمت تخصصی',
          content: 'خدمات خود را به صورت تخصصی ثبت کنید تا خریداران شما را پیدا کنند.',
          link: '/dashboard/services/new',
          linkLabel: '➕ ثبت خدمت جدید',
          steps: [
            'وارد شدن به بخش "خدمات من" در داشبورد',
            'کلیک روی "ثبت خدمت جدید"',
            'انتخاب دسته‌بندی مناسب از سناریوها',
            'عنوان دقیق و تخصصی برای خدمت',
            'توضیحات کامل درباره خدمت',
            'انتخاب قیمت‌گذاری مناسب',
            'انتشار خدمت',
          ],
          tips: [
            'عنوان دقیق و تخصصی = دیده شدن بیشتر',
            'توضیحات کامل = اعتماد بیشتر خریداران',
          ],
        },
        {
          title: 'مشاهده و پاسخ به درخواست‌ها',
          content: 'درخواست‌های موجود را بررسی و برای آنها قیمت اعلام کنید.',
          link: '/dashboard/service-requests',
          linkLabel: 'مشاهده درخواست‌ها',
          steps: [
            'وارد شدن به بخش "درخواست‌های خدمت"',
            'مشاهده لیست درخواست‌های موجود',
            'انتخاب درخواست مناسب با تخصص شما',
            'مشاهده جزئیات کامل درخواست',
            'کلیک روی "اعلام قیمت و شرایط"',
            'پر کردن فرم پیشنهاد (قیمت، زمان، شرایط)',
            'ارسال پیشنهاد',
          ],
        },
        {
          title: 'نمونه کارها و مدارک',
          content: 'نمونه کارهای انجام شده و مدارک تخصصی خود را آپلود کنید.',
          link: '/profile',
          linkLabel: 'مدیریت نمونه کارها',
          steps: [
            'وارد شدن به پروفایل کاربری',
            'رفتن به تب "نمونه کارها و مدارک"',
            'برای نمونه کار: انتخاب تصویر و عنوان',
            'برای مدرک: انتخاب فایل و عنوان',
            'ذخیره و آپلود',
          ],
          tips: [
            'تصاویر باکیفیت از پروژه‌های انجام شده اعتماد را افزایش می‌دهد',
            'مدارک معتبر شانس انتخاب شما را بالا می‌برد',
          ],
        },
        {
          title: 'چرخه کاری خدمات‌دهنده',
          content: 'مراحل کامل از ثبت‌نام تا دریافت تسویه:',
          workflow: [
            { step: '۱', title: 'ثبت‌نام و تکمیل پروفایل', desc: 'اطلاعات تخصصی خود را کامل کنید' },
            { step: '۲', title: 'ثبت خدمت تخصصی', desc: 'خدمات خود را در پلتفرم ثبت کنید' },
            { step: '۳', title: 'مشاهده درخواست‌ها', desc: 'درخواست‌های موجود را بررسی کنید' },
            { step: '۴', title: 'اعلام قیمت', desc: 'برای درخواست‌های مناسب پیشنهاد بدهید' },
            { step: '۵', title: 'شروع کار', desc: 'پس از انتخاب، کار را شروع کنید' },
            { step: '۶', title: 'تکمیل کار', desc: 'پس از اتمام، کار را تکمیل کنید' },
            { step: '۷', title: 'دریافت تسویه', desc: 'مبلغ را دریافت کنید' },
          ],
        },
      ],
    },

    // ======== ۴. راهنمای فروشنده (فقط فروشنده) ========
    {
      id: 'seller',
      title: 'راهنمای فروشنده',
      icon: Package,
      roles: ['seller'],  // ← فقط فروشنده
      items: [
        {
          title: 'ثبت محصول جدید',
          content: 'قطعات یدکی و تجهیزات خود را در پلتفرم ثبت کنید.',
          link: '/dashboard/products/new',
          linkLabel: '➕ ثبت محصول جدید',
          steps: [
            'وارد شدن به بخش "محصولات من"',
            'کلیک روی "ثبت محصول جدید"',
            'پر کردن اطلاعات محصول (نام، قیمت، موجودی)',
            'آپلود تصاویر محصول',
            'انتشار محصول',
          ],
        },
        {
          title: 'مدیریت سفارشات',
          content: 'سفارشات دریافتی را مدیریت و پیگیری کنید.',
          link: '/dashboard/manage-orders',
          linkLabel: 'مدیریت سفارشات',
        },
        {
          title: 'کیف پول و تسویه',
          content: 'موجودی و تسویه حساب‌های خود را مدیریت کنید.',
          link: '/wallet',
          linkLabel: ' کیف پول',
        },
      ],
    },

    // ======== ۵. سناریوهای تعمیرات (همه کاربران) ========
    {
      id: 'scenarios',
      title: 'سناریوهای تعمیرات',
      icon: Clipboard,
      roles: ['all'],
      items: SERVICE_SCENARIO_GROUPS.map(group => ({
        title: group.icon + ' ' + group.title,
        content: 'لیست خدمات موجود در این دسته:',
        isGroup: true,
        groupItems: group.items.map(key => ({
          title: SERVICE_SCENARIOS[key],
          content: 'توضیحات کامل برای ' + SERVICE_SCENARIOS[key],
          icon: group.icon,
        })),
        link: '/request-service',
        linkLabel: ' ثبت درخواست جدید در این دسته',
      })),
    },

    // ======== ۶. قراردادها (همه کاربران) ========
    {
      id: 'contracts',
      title: 'قراردادها',
      icon: FileText,
      roles: ['all'],
      items: [
        {
          title: 'قرارداد نت فراگیر (Total Maintenance)',
          content: 'قرارداد جامع نگهداری و تعمیرات شامل کلیه تجهیزات کارخانه.',
          features: [
            'پوشش کامل کلیه تجهیزات',
            'بازدیدهای دوره‌ای منظم',
            'تعمیرات اضطراری',
            'گزارش‌دهی ماهانه',
          ],
          link: '/contracts',
          linkLabel: 'مشاهده جزئیات',
        },
        {
          title: 'قرارداد PM (نگهداری پیشگیرانه)',
          content: 'قرارداد نگهداری پیشگیرانه برای افزایش عمر تجهیزات.',
          features: [
            'برنامه نگهداری منظم',
            'تعویض قطعات مستهلک',
            'گزارش وضعیت تجهیزات',
          ],
          link: '/contracts',
          linkLabel: 'مشاهده جزئیات',
        },
        {
          title: 'قرارداد مبتنی بر عملکرد (Performance)',
          content: 'قرارداد بر اساس عملکرد و راندمان تجهیزات.',
          features: [
            'پرداخت بر اساس عملکرد',
            'پاداش بهبود راندمان',
            'ضمانت عملکرد',
          ],
          link: '/contracts',
          linkLabel: 'مشاهده جزئیات',
        },
        {
          title: 'انبار امانی (Consignment)',
          content: 'مدیریت انبار قطعات یدکی به صورت امانی در کارخانه.',
          features: [
            'قطعات در محل کارخانه',
            'پرداخت پس از مصرف',
            'مدیریت موجودی توسط تأمین‌کننده',
          ],
          link: '/contracts',
          linkLabel: 'مشاهده جزئیات',
        },
      ],
    },

    // ======== ۷. پرسش‌های متداول (همه کاربران) ========
    {
      id: 'faq',
      title: 'پرسش‌های متداول',
      icon: HelpCircle,
      roles: ['all'],
      items: [
        {
          title: 'چگونه درخواست تعمیر ثبت کنم؟',
          content: 'برای ثبت درخواست تعمیر، مراحل زیر را دنبال کنید:',
          steps: [
            'وارد پلتفرم شوید',
            'روی دکمه "درخواست خدمت" در داشبورد کلیک کنید',
            'دستگاه مورد نظر را انتخاب کنید',
            'شرح مشکل را وارد کنید',
            'ارسال کنید',
          ],
        },
        {
          title: 'چگونه قیمت اعلام کنم؟',
          content: 'برای اعلام قیمت به درخواست‌ها:',
          steps: [
            'وارد بخش "درخواست‌های خدمت" شوید',
            'روی درخواست مورد نظر کلیک کنید',
            'روی دکمه "اعلام قیمت و شرایط" کلیک کنید',
            'مبلغ، زمان، شرایط را وارد کنید',
            'ارسال کنید',
          ],
        },
        {
          title: 'پروفایل من کامل است؟',
          content: 'برای اعلام قیمت و دریافت درخواست، این موارد باید کامل باشند:',
          steps: [
            'خدمات قابل ارائه (حداقل یک مورد)',
            'حداکثر فاصله (کیلومتر)',
            'دستمزد ساعتی (ریال)',
          ],
          link: '/profile',
          linkLabel: '✏️ تکمیل پروفایل',
        },
        {
          title: 'چگونه کار را شروع کنم؟',
          content: 'پس از انتخاب پیشنهاد شما توسط خریدار:',
          steps: [
            'وارد صفحه جزئیات درخواست شوید',
            'روی دکمه "شروع کار" کلیک کنید',
            'پس از اتمام، روی "تکمیل خدمت" کلیک کنید',
            'تصاویر انجام کار را آپلود کنید',
          ],
        },
        {
          title: 'چگونه مدارک و نمونه کارها را آپلود کنم؟',
          content: 'برای آپلود مدارک و نمونه کارها:',
          steps: [
            'وارد پروفایل خود شوید',
            'به تب "نمونه کارها و مدارک" بروید',
            'برای نمونه کار: تصویر و عنوان را وارد کنید',
            'برای مدرک: فایل و عنوان را وارد کنید',
          ],
          link: '/profile',
          linkLabel: ' ویرایش پروفایل',
        },
      ],
    },

    // ======== ۸. ارتباط با پشتیبانی (همه کاربران) ========
    {
      id: 'support',
      title: 'ارتباط با پشتیبانی',
      icon: MessageSquare,
      roles: ['all'],
      items: [
        {
          title: 'تماس با پشتیبانی',
          content: 'برای دریافت کمک و راهنمایی بیشتر، با تیم پشتیبانی تماس بگیرید.',
          contact: {
            email: 'support@induservice.pro',
            phone: '۰۲۱-88309231',
            hours: 'شنبه تا چهارشنبه ۹ الی ۱۷',
          },
          link: '/dashboard/support',
          linkLabel: ' ارسال تیکت پشتیبانی',
        },
        {
          title: 'ارسال تیکت پشتیبانی',
          content: 'برای مشکلات فنی، سوالات و راهنمایی بیشتر، تیکت ارسال کنید.',
          steps: [
            'وارد بخش "پشتیبانی" در داشبورد شوید',
            'روی "تیکت جدید" کلیک کنید',
            'موضوع و توضیحات را وارد کنید',
            'ارسال کنید',
          ],
          link: '/dashboard/support',
          linkLabel: '📩 ارسال تیکت جدید',
        },
      ],
    },
  ],
};

// ============================================================
// کامپوننت اصلی
// ============================================================
export default function HelpCenter({ isOpen, onClose }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [expandedSection, setExpandedSection] = useState('getting-started');
  const [expandedItem, setExpandedItem] = useState(null);

  // ========== تشخیص نقش کاربر ==========
  const isBuyer = BUYER_ROLES.includes(user?.role);
  const isProvider = PROVIDER_ROLES.includes(user?.role);
  const isSeller = user?.role === 'seller' || user?.role === 'company_seller';

  const getUserRole = () => {
    if (isBuyer) return 'buyer';
    if (isProvider) return 'provider';
    if (isSeller) return 'seller';
    return 'all';
  };

  // ========== فیلتر بخش‌ها بر اساس نقش ==========
  const filteredSections = HELP_DATA.sections.filter(section => {
    // اگر نقش کاربر 'all' است، فقط بخش‌های عمومی را نشان بده
    if (getUserRole() === 'all') {
      return section.roles.includes('all');
    }
    // اگر نقش کاربر خاص است، بخش‌های مربوط به نقش + بخش‌های عمومی را نشان بده
    return section.roles.includes('all') || section.roles.includes(getUserRole());
  });

  // ========== ترتیب بخش‌ها بر اساس نقش ==========
  const orderedSections = () => {
    const role = getUserRole();
    const sections = [...filteredSections];
    
    // بخش‌های عمومی را در بالا قرار بده
    const generalSections = sections.filter(s => s.roles.includes('all'));
    const roleSections = sections.filter(s => s.roles.includes(role) && !s.roles.includes('all'));
    
    return [...generalSections, ...roleSections];
  };

  const finalSections = orderedSections();

  if (!isOpen) return null;

  const toggleSection = (sectionId) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
    setExpandedItem(null);
  };

  const toggleItem = (itemIndex) => {
    setExpandedItem(prev => prev === itemIndex ? null : itemIndex);
  };

  const handleNavigate = (path) => {
    if (path && path !== '#') {
      navigate(path);
      onClose();
    }
  };

  const getStatusColor = (color) => {
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-700',
      blue: 'bg-blue-100 text-blue-700',
      indigo: 'bg-indigo-100 text-indigo-700',
      green: 'bg-green-100 text-green-700',
      purple: 'bg-purple-100 text-purple-700',
      emerald: 'bg-emerald-100 text-emerald-700',
      red: 'bg-red-100 text-red-700',
    };
    return colors[color] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-up">
        {/* هدر */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-l from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <BookOpen className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-slate-800"> مرکز راهنمای پلتفرم</h2>
              <p className="text-xs text-slate-500">راهنمای جامع استفاده از پلتفرم خدمات صنعتی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* محتوا */}
        <div className="flex flex-col md:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* سایدبار راهنما */}
          <div className="md:w-72 border-l border-slate-200 bg-slate-50/50 p-3 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
              فهرست مطالب
            </p>
            {finalSections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;
              const itemCount = section.items?.length || 0;
              const isRoleSpecific = section.roles.includes(getUserRole()) && !section.roles.includes('all');
              
              return (
                <div key={section.id} className="mb-1">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-right transition ${
                      isExpanded
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Icon size={18} className={isExpanded ? 'text-blue-600' : ''} />
                      {section.title}
                      {isRoleSpecific && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                          شما
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{itemCount}</span>
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-blue-500" />
                      ) : (
                        <ChevronLeft size={16} className="text-slate-400" />
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mr-4 mt-0.5 space-y-0.5">
                      {section.items.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => toggleItem(index)}
                          className={`w-full text-right px-3 py-1.5 rounded-lg text-sm transition ${
                            expandedItem === index
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate block">{item.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* محتوای اصلی */}
          <div className="flex-1 p-6 overflow-y-auto">
            {expandedSection && (
              <div className="space-y-4">
                {finalSections
                  .find(s => s.id === expandedSection)
                  ?.items.map((item, index) => (
                    <div
                      key={index}
                      className={`bg-white rounded-xl border transition ${
                        expandedItem === index
                          ? 'border-blue-300 shadow-lg shadow-blue-100/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(index)}
                        className="w-full text-right p-4 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-800">{item.title}</span>
                        {expandedItem === index ? (
                          <ChevronDown size={18} className="text-blue-500" />
                        ) : (
                          <ChevronLeft size={18} className="text-slate-400" />
                        )}
                      </button>
                      {expandedItem === index && (
                        <div className="px-4 pb-4 space-y-4">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {item.content}
                          </p>

                          {item.link && (
                            <button
                              onClick={() => handleNavigate(item.link)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition text-sm font-medium"
                            >
                              {item.linkLabel || 'مشاهده و اقدام'}
                            </button>
                          )}

                          {item.steps && (
                            <div className="bg-slate-50 rounded-xl p-4">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                🔹 مراحل انجام:
                              </p>
                              <ol className="space-y-2 text-sm text-slate-700">
                                {item.steps.map((step, i) => (
                                  <li key={i} className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                      {i + 1}
                                    </span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {item.tips && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
                                💡 نکات مفید:
                              </p>
                              <ul className="space-y-1 text-sm text-amber-700">
                                {item.tips.map((tip, i) => (
                                  <li key={i}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {item.features && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {item.features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                                  <span className="text-green-500">✓</span>
                                  {feature}
                                </div>
                              ))}
                            </div>
                          )}

                          {item.scenarios && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {item.scenarios.map((group, i) => (
                                <div key={i} className="bg-slate-50 rounded-xl p-4">
                                  <p className="font-medium text-slate-700 text-sm">{group.icon} {group.title}</p>
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {group.items.map((key) => (
                                      <span key={key} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                        {SERVICE_SCENARIOS[key]}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.statuses && (
                            <div className="flex flex-wrap gap-2">
                              {item.statuses.map((status) => (
                                <span
                                  key={status.status}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status.color)}`}
                                >
                                  {status.label}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.workflow && (
                            <div className="relative">
                              <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-blue-200" />
                              <div className="space-y-3 relative">
                                {item.workflow.map((step, i) => (
                                  <div key={i} className="flex items-start gap-3 pr-8 relative">
                                    <div className="absolute right-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                      {step.step}
                                    </div>
                                    <div>
                                      <p className="font-medium text-slate-800 text-sm">{step.title}</p>
                                      <p className="text-xs text-slate-500">{step.desc}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.isGroup && item.groupItems && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {item.groupItems.map((subItem, i) => (
                                <div key={i} className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg text-sm text-slate-700">
                                  <span>{subItem.icon}</span>
                                  <span>{subItem.title}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.contact && (
                            <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
                              <p className="text-sm text-slate-600"><span className="font-medium">📧 ایمیل:</span> {item.contact.email}</p>
                              <p className="text-sm text-slate-600"><span className="font-medium">📞 تلفن:</span> {item.contact.phone}</p>
                              <p className="text-sm text-slate-600"><span className="font-medium">🕐 ساعات کاری:</span> {item.contact.hours}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}