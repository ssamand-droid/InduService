// src/pages/RequestServicePage.jsx
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceWizard from '@features/wizard/ServiceWizard';

export default function RequestServicePage() {
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get('type') || null;
  const assetId = searchParams.get('asset_id') || null;

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <ServiceWizard 
          initialServiceType={serviceType}
          initialAssetId={assetId}
        />
      </div>
    </div>
  );
}