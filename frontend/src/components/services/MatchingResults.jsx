import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Users } from 'lucide-react'
import ProviderMatchCard from './ProviderMatchCard'
import { Spinner } from '@components/ui'
import api from '@lib/axios'

const MatchingResults = ({ requestId, requestTitle, onProviderSelected }) => {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProviders()
  }, [requestId])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/services/requests/${requestId}/match_providers/`)
      setProviders(res.data.providers || [])
    } catch (err) {
      setError('خطا در دریافت پیمانکاران')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto text-white/20 mb-4" size={64} />
        <h3 className="text-xl font-bold text-white mb-2">پیمانکاری یافت نشد</h3>
        <p className="text-white/50 mb-4">هنوز پیمانکاری با تخصص مرتبط ثبت‌نام نکرده است</p>
        <Link to="/services" className="text-blue-400 hover:underline">
          مشاهده همه خدمات‌دهندگان
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 rounded-full text-blue-300 text-sm mb-4">
          <Zap size={16} />
          <span>{providers.length} پیمانکار برتر برای درخواست شما</span>
        </div>
        <h2 className="text-2xl font-bold text-white">بهترین متخصصان برای "{requestTitle}"</h2>
        <p className="text-white/50 mt-2">بر اساس امتیاز، تخصص، موقعیت و سرعت پاسخگویی</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.map((provider, index) => (
          <ProviderMatchCard
            key={provider.user_id}
            provider={provider}
            rank={index + 1}
            onSelect={onProviderSelected}
          />
        ))}
      </div>

      <div className="text-center mt-6">
        <Link
          to="/services"
          className="text-blue-400 hover:underline text-sm"
        >
          📋 مشاهده همه خدمات‌دهندگان ({providers.length}+ نفر)
        </Link>
      </div>
    </div>
  )
}

export default MatchingResults