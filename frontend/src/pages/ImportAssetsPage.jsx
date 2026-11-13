import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Upload, FileSpreadsheet, Download, CheckCircle,
  AlertTriangle, ArrowRight, Info
} from 'lucide-react'
import assetService from '@services/assetService'
import { Spinner } from '@components/ui'

const ImportAssetsPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(1) // 1=آپلود, 2=پیش‌نمایش, 3=نتیجه
  const [file, setFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
      setError(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError('لطفاً یک فایل انتخاب کنید')
      return
    }

    setImporting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await assetService.bulkImport(formData)
      setResult(response.data)
      setStep(3)
    } catch (err) {
      console.error('Import error:', err)
      setError(err.response?.data?.error || err.userMessage || 'خطا در واردات فایل')
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await assetService.downloadTemplate()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'asset_import_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const resetImport = () => {
    setStep(1)
    setFile(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* هدر */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">واردات انبوه ماشین‌آلات و تجهیزات</h1>
        <p className="text-gray-500 mt-1">
          با آپلود فایل Excel، چندین دستگاه را یکجا ثبت کنید
        </p>
      </div>

      {/* راهنما */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">راهنمای سریع:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>قالب نمونه Excel را دانلود کنید</li>
              <li>اطلاعات دستگاه‌های خود را در فایل وارد کنید</li>
              <li>فایل را آپلود و تأیید کنید</li>
              <li>ستون‌های الزامی: نام دستگاه و شماره پلاک</li>
            </ol>
          </div>
        </div>
      </div>

      {/* مرحله ۱: آپلود */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
              file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div>
                <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
                <p className="text-lg font-bold text-green-700">{file.name}</p>
                <p className="text-sm text-green-600 mt-1">
                  {(file.size / 1024).toFixed(1)} کیلوبایت
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-3 text-sm text-red-500 hover:text-red-600 underline"
                >
                  حذف و انتخاب فایل دیگر
                </button>
              </div>
            ) : (
              <div>
                <FileSpreadsheet className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-lg font-bold text-gray-600 mb-2">
                  فایل Excel خود را اینجا بکشید و رها کنید
                </p>
                <p className="text-gray-400 mb-4">
                  یا کلیک کنید تا فایل را انتخاب کنید
                </p>
                <p className="text-xs text-gray-400">
                  فرمت‌های مجاز: xlsx. , xls. , csv.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Download size={18} />
              دانلود قالب نمونه Excel
            </button>

            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
            >
              {importing ? (
                <>
                  <Spinner size="sm" />
                  در حال واردات...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  شروع واردات
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* مرحله ۲: در حال انجام */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-lg font-bold text-gray-600">در حال پردازش فایل...</p>
          <p className="text-gray-400 mt-2">لطفاً شکیبا باشید</p>
        </div>
      )}

      {/* مرحله ۳: نتیجه */}
      {step === 3 && result && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-scale-in">
          <div className="text-center mb-8">
            {result.errors === 0 ? (
              <>
                <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-green-700">واردات با موفقیت انجام شد!</h2>
              </>
            ) : (
              <>
                <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-yellow-700">واردات با هشدار انجام شد</h2>
              </>
            )}
          </div>

          {/* آمار */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-gray-700">{result.total}</p>
              <p className="text-sm text-gray-500 mt-1">کل ردیف‌ها</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{result.success}</p>
              <p className="text-sm text-green-500 mt-1">موفق</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${result.errors > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className={`text-3xl font-bold ${result.errors > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {result.errors}
              </p>
              <p className="text-sm text-gray-500 mt-1">خطا</p>
            </div>
          </div>

          {/* دکمه‌ها */}
          <div className="flex justify-center gap-3">
            <button
              onClick={resetImport}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              واردات فایل دیگر
            </button>
            <Link
              to="/dashboard/assets"
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              مشاهده ماشین‌آلات و تجهیزات
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportAssetsPage
