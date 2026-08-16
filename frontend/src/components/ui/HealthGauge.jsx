import React from 'react'

const HealthGauge = ({ value = 100, size = 'md', showLabel = true, animated = true }) => {
  const sizes = {
    sm: { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 160, height: 160, strokeWidth: 10, fontSize: 'text-3xl' },
  }

  const { width, height, strokeWidth, fontSize } = sizes[size] || sizes.md
  const radius = (width - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference

  const getColor = (val) => {
    if (val >= 80) return '#10b981' // green
    if (val >= 60) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const getBgColor = (val) => {
    if (val >= 80) return '#d1fae5' // green bg
    if (val >= 60) return '#fef3c7' // yellow bg
    return '#fee2e2' // red bg
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={width} height={height} className={`transform -rotate-90 ${animated ? 'transition-all duration-1000' : ''}`}>
        {/* پس‌زمینه */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke={getBgColor(value)}
          strokeWidth={strokeWidth}
        />
        {/* نوار پیشرفت */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-bold`} style={{ color: getColor(value) }}>
            {Math.round(value)}%
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">سلامت</span>
        </div>
      )}
    </div>
  )
}

export default HealthGauge