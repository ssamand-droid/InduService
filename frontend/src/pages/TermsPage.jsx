import { Card } from '@components/ui'

export default function TermsPage() {
  return (
    <div className="container-custom py-8">
      <Card className="max-w-4xl mx-auto p-8">
        <h1 className="heading-1 mb-6 text-center">قوانین و مقررات استفاده از InduService</h1>
        
        <div className="prose dark:prose-invert max-w-none space-y-6 text-secondary-700 dark:text-secondary-300">
          <section>
            <h2 className="text-xl font-bold mb-3">۱. مقدمه</h2>
            <p>
              پلتفرم InduService به عنوان یک بازار آنلاین تخصصی در حوزه خدمات صنعتی و MRO 
              (تعمیرات، نگهداری و اورهال) فعالیت می‌کند. استفاده از خدمات این پلتفرم به منزله 
              پذیرش کامل قوانین و مقررات زیر می‌باشد.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">۲. تعاریف</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>کاربر:</strong> هر شخص حقیقی یا حقوقی که در پلتفرم ثبت‌نام می‌کند.</li>
              <li><strong>خریدار/کارفرما:</strong> کاربری که سفارش خرید محصول یا درخواست خدمت ثبت می‌کند.</li>
              <li><strong>فروشنده/ارائه‌دهنده خدمت:</strong> کاربری که محصول یا خدمت خود را عرضه می‌کند.</li>
              <li><strong>پلتفرم:</strong> وب‌سایت و زیرساخت‌های نرم‌افزاری InduService.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">۳. شرایط عضویت</h2>
            <p>
              ثبت‌نام در پلتفرم برای اشخاص حقوقی (شرکت‌ها، کارخانه‌ها) الزامی است. 
              کاربران باید اطلاعات هویتی و تجاری خود را به صورت کامل و صحیح وارد نمایند. 
              پلتفرم حق تعلیق حساب‌های کاربری متخلف را دارد.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">۴. تعهدات طرفین</h2>
            <h3 className="font-semibold mt-2">۴.۱ تعهدات خریدار:</h3>
            <ul className="list-disc list-inside">
              <li>ارائه اطلاعات دقیق از تجهیز و نیاز خود</li>
              <li>پرداخت به موقع هزینه‌های خدمات و کالا</li>
              <li>فراهم‌سازی دسترسی لازم برای ارائه خدمت در محل</li>
            </ul>
            <h3 className="font-semibold mt-2">۴.۲ تعهدات فروشنده/ارائه‌دهنده خدمت:</h3>
            <ul className="list-disc list-inside">
              <li>انجام خدمت مطابق با استانداردهای صنعتی</li>
              <li>ارائه گارانتی معتبر برای خدمات انجام شده</li>
              <li>رعایت زمان‌بندی توافق شده</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">۵. کمیسیون و کارمزد</h2>
            <p>
              پلتفرم از هر معامله موفق (محصول یا خدمت) درصدی را به عنوان کارمزد دریافت می‌کند 
              که در زمان تسویه حساب از مبلغ فاکتور کسر می‌گردد. نرخ کارمزد در بخش تعرفه‌ها 
              قابل مشاهده است.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">۶. حل اختلاف</h2>
            <p>
              در صورت بروز اختلاف بین خریدار و فروشنده، پلتفرم به عنوان میانجی وارد عمل شده 
              و تلاش می‌کند موضوع را حل و فصل نماید. در صورت عدم توافق، مراجع قضایی 
              تهران صالح به رسیدگی می‌باشند.
            </p>
          </section>
        </div>
      </Card>
    </div>
  )
}