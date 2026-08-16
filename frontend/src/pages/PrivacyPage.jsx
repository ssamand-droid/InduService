import { Card } from '@components/ui'

export default function PrivacyPage() {
  return (
    <div className="container-custom py-8">
      <Card className="max-w-4xl mx-auto p-8">
        <h1 className="heading-1 mb-6 text-center">حریم خصوصی</h1>
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">۱. جمع‌آوری اطلاعات</h2>
            <p>InduService متعهد به حفاظت از اطلاعات شخصی و تجاری کاربران خود می‌باشد.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">۲. استفاده از اطلاعات</h2>
            <p>اطلاعات شما صرفاً برای ارائه خدمات بهتر و با رضایت شما استفاده خواهد شد.</p>
          </section>
        </div>
      </Card>
    </div>
  )
}