
import React from 'react';
import XlsxExportButton from './XlsxExportButton';

interface ExportResultsProps {
  results: any;
  isDisabled: boolean;
  originalMeta?: any;
  useCase?: 'ecommerce' | 'sloggi-ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next' | 'partoo';
}

const ExportResults: React.FC<ExportResultsProps> = ({ results, isDisabled, originalMeta, useCase = 'ecommerce' }) => {
  return (
    <XlsxExportButton results={results} isDisabled={isDisabled} originalMeta={originalMeta} useCase={useCase} />
  );
};

export default ExportResults;
