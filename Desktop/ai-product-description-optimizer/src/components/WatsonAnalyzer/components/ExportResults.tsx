
import React from 'react';
import JsonExportButton from './JsonExportButton';
import CsvExportButton from './CsvExportButton';

interface ExportResultsProps {
  results: any;
  isDisabled: boolean;
}

const ExportResults: React.FC<ExportResultsProps> = ({ results, isDisabled }) => {
  return (
    <div className="flex space-x-2">
      <JsonExportButton results={results} isDisabled={isDisabled} />
      <CsvExportButton results={results} isDisabled={isDisabled} />
    </div>
  );
};

export default ExportResults;
