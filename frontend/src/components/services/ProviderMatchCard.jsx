import React from 'react'
import { Star, MapPin, Clock, Wrench, Award, Zap } from 'lucide-react'
import { Badge } from '@components/ui/Badge'

const ProviderMatchCard = ({ provider, rank, onSelect, loading }) => {
  const rankColors = {
    1: 'from-yellow-400 to-amber-500',
    2: 'from-gray-300 to-gray-400',
    3: 'from-orange-400 to-orange-600',
  }

  const rankEmojis = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <div className={`relative rounded-2xl border-2 transition-all ${
      rank === 1 ? 'border-yellow-400/50 shadow-xl shadow-yellow-400/10' : 'border-white/10 hover:border-white/20'
    } bg-white/5 backdrop-blur-xl p-6`}>

      {/* Rank Badge */}
      <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br ${rankColors[rank]} flex items-center justify-center text-xl shadow-lg`}>
        {rankEmojis[rank]}
      </div>

      {/* Provider Info */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">{provider.name}</h3>
            {provider.is_new && (
              <Badge variant="info" size="sm">جدید</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Star className="text-yellow-400 fill-current" size={14} />
            <span className="text-yellow-400 font-bold">{provider.rating}</span>
            <span className="text-white/40 text-xs">({provider.rating_count} نظر)</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">{provider.score}%</div>
          <div className="text-xs text-white/40">امتیاز تطابق</div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <MapPin size={14} className="text-blue-400" />
          <span>{provider.city}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Clock size={14} className="text-blue-400" />
          <span>{provider.avg_response_time_hours > 0 ? `${provider.avg_response_time_hours}h` : 'نامشخص'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Award size={14} className="text-blue-400" />
          <span>{provider.completed_orders} پروژه</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Wrench size={14} className="text-blue-400" />
          <span>{provider.years_of_experience} سال تجربه</span>
        </div>
      </div>

      {/* Specializations */}
      <div className="mb-4">
        <p className="text-xs text-white/40 mb-1">تخصص‌ها:</p>
        <p className="text-sm text-white/70">{provider.specializations}</p>
      </div>

      {/* Score Breakdown */}
      <div className="mb-4 space-y-1.5">
        {[
          { label: 'امتیاز', value: provider.score_breakdown.rating_score, max: 40 },
          { label: 'تخصص', value: provider.score_breakdown.specialization_score, max: 30 },
          { label: 'موقعیت', value: provider.score_breakdown.location_score, max: 20 },
          { label: 'زمان پاسخ', value: provider.score_breakdown.response_time_score, max: 10 },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-xs text-white/40 w-16">{item.label}</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(item.value / item.max) * 100}%` }}
              />
            </div>
            <span className="text-xs text-white/60">{item.value}/{item.max}</span>
          </div>
        ))}
      </div>

      {/* Select Button */}
      <button
        onClick={() => onSelect(provider)}
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 text-white rounded-xl font-bold transition"
      >
        {loading ? 'در حال ثبت...' : 'انتخاب این متخصص'}
      </button>
    </div>
  )
}

export default ProviderMatchCard