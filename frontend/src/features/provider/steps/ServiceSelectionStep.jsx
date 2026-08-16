// src/features/provider/steps/ServiceSelectionStep.jsx
import React, { useState } from 'react';
import { SERVICE_SCENARIOS, SERVICE_SCENARIO_GROUPS } from '@lib/constants';
import { INDUSTRIES } from '@data/industries';  // ← اگر alias کار می‌کند
// یا
// import { INDUSTRIES } from '../../../data/industries';  // ← مسیر نسبی
import { Search, Check } from 'lucide-react';

export default function ServiceSelectionStep({ form }) {
  const { setValue, watch } = form;
  const selectedServices = watch('service_types_offered') || [];
  const selectedIndustries = watch('industries') || [];
  const [searchTerm, setSearchTerm] = useState('');

  const toggleService = (key) => {
    const current = [...selectedServices];
    const index = current.indexOf(key);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(key);
    }
    setValue('service_types_offered', current);
  };

  const toggleIndustry = (key) => {
    const current = [...selectedIndustries];
    const index = current.indexOf(key);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(key);
    }
    setValue('industries', current);
  };

  const filteredServices = Object.entries(SERVICE_SCENARIOS).filter(([key, label]) =>
    label.includes(searchTerm) || key.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-800 mb-2">
          🔧 خدمات قابل ارائه <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          خدماتی که توانایی ارائه آنها را دارید انتخاب کنید (حداقل یک مورد)
        </p>

        {/* جستجو */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="جستجوی خدمات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* گروه‌بندی خدمات */}
        {!searchTerm ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {SERVICE_SCENARIO_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {group.icon} {group.title}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.items.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleService(key)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-right transition text-sm ${
                        selectedServices.includes(key)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedServices.includes(key)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300'
                      }`}>
                        {selectedServices.includes(key) && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                      <span className="text-sm">{SERVICE_SCENARIOS[key]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {filteredServices.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleService(key)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-right transition text-sm ${
                  selectedServices.includes(key)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedServices.includes(key)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-slate-300'
                }`}>
                  {selectedServices.includes(key) && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        )}

        {selectedServices.length === 0 && (
          <p className="text-xs text-amber-600 mt-2">⚠️ حداقل یک خدمت انتخاب کنید</p>
        )}
        <p className="text-xs text-slate-400 mt-2">
          {selectedServices.length} خدمت انتخاب شده
        </p>
      </div>

      {/* صنایع */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-2">🏭 صنایع تحت پوشش (اختیاری)</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(INDUSTRIES).map(([key, industry]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleIndustry(key)}
              className={`px-4 py-2 rounded-xl border-2 text-sm transition ${
                selectedIndustries.includes(key)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              {industry.icon} {industry.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {selectedIndustries.length} صنعت انتخاب شده
        </p>
      </div>
    </div>
  );
}