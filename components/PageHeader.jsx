
import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function PageHeader({ title, subtitle, showBackButton = true }) {
  return (
    <div className="page-header">
      <div className="dashboard-container">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {showBackButton && (
            <Link href="/" className="back-button">
              <ArrowRightIcon className="icon-sm" />
              بازگشت به صفحه اصلی
            </Link>
          )}
          
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && (
              <p className="section-subtitle" style={{ marginTop: '4px' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
