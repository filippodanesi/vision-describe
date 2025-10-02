/**
 * AI Copy Assistant - Main Component
 * 
 * @author Filippo Danesi
 * @email filippo.danesi93@gmail.com
 * @website https://www.filippodanesi.com
 * @created 2025
 * @copyright Copyright (c) 2025 Filippo Danesi. All rights reserved.
 * @license Dual-licensed: CC BY-NC-SA 4.0 (non-commercial) | Commercial l              <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Copy Assistant</h1>
              <p className="text-gray-600">
                Generate optimized content for products, stores, and marketplace platforms using AI
              </p>se required
 * 
 * @description Main orchestrator component for the AI-powered content generation assistant.
 *              Handles file upload, column mapping, model selection, processing, and results export
 *              for multiple use cases: E-commerce products, Amazon listings, Partoo store descriptions.
 * 
 * Key Features:
 * - Multi-format file support (Excel, CSV)
 * - Automatic column detection and mapping
 * - AI model selection (OpenAI, Anthropic)
 * - Real-time cost tracking and token counting
 * - Multi-language content generation
 * - Export to optimized Excel format
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { Link } from 'react-router-dom';
import { useOptimizationConfig } from './hooks/optimization/useOptimizationConfig';
import { optimizeTextWithAI } from './utils/optimizationUtils';
import { toast } from 'sonner';
import { useHybridProcessing } from './hooks/useHybridProcessing';
import { useCostTracker } from './hooks/useCostTracker';
import { models } from '@/lib/models';
import { ProcessingStep } from './types';
import { UseCase, AVAILABLE_USE_CASES } from './usecases';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, RefreshCw, Download, Copy } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { validateEnv, OPENAI_API_KEY, ANTHROPIC_API_KEY } from '@/config/env';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import FileUpload from './components/FileUpload';
import TokenCounter from './components/TokenCounter';
import ColumnSelector from './components/ColumnSelector';
import ColumnConfirmation from './components/ColumnConfirmation';
import ModelSelector from './components/ModelSelector';
import ProcessingView from './components/ProcessingView';
import ExportResults from './components/ExportResults';
import { getModelById } from '@/lib/models';
import { Button } from '@/components/ui/button';

const WatsonAnalyzer: React.FC = () => {
  // Current step
  const [currentStep, setCurrentStep] = useState<ProcessingStep>(ProcessingStep.UPLOAD);
  
  // File data
  const [fileData, setFileData] = useState<{
    rows: any[];
    columns: string[];
    meta?: any;
  } | null>(null);
  
  // Selected columns
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  
  // Column mappings (for confirmation step)
  const [columnMappings, setColumnMappings] = useState<any[]>([]);
  
  // Selected model
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  // Budget UI removed
  
  // Processing state
  const {
    isProcessing,
    progress,
    totalRows,
    processedRows,
    logs,
    estimatedTimeRemaining,
    processingMode,
    costTracker,
    processFile,
    cancelProcessing
  } = useHybridProcessing();

  const [processedData, setProcessedData] = useState<any[] | null>(null);
  const [processingStartTime, setProcessingStartTime] = useState<Date | null>(null);
  const [processingEndTime, setProcessingEndTime] = useState<Date | null>(null);
  const [showMoreResults, setShowMoreResults] = useState(false);

  // Use case selection (E-commerce default)
  const [useCase, setUseCase] = useState<UseCase>('ecommerce');

  // Validate environment variables on component mount
  useEffect(() => {
    if (!validateEnv()) {
      toast('Configuration Error', {
        description: 'Please check your .env.local file and ensure all required API keys are set.',
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
    }
  }, []);

  // Handle file upload
  const handleFileUploaded = (data: { rows: any[]; columns: string[]; meta?: any }) => {
    // For Partoo, check if we need to fix column headers
    // Partoo exports have sample data in row 1 and real headers in row 2
    if (useCase === 'partoo') {
      // Check if first row looks like sample data instead of headers
      const firstRow = data.rows[0];
      const hasRealHeaders = data.columns.some(col => 
        /^Business identification$/i.test(col) || 
        /^Name$/i.test(col) ||
        /^Short description$/i.test(col) ||
        /^Long description$/i.test(col)
      );

      // If headers look wrong, use first data row as headers
      if (!hasRealHeaders && firstRow) {
        const newColumns = Object.values(firstRow) as string[];
        const newRows = data.rows.slice(1); // Skip the row we used as headers
        
        // Reconstruct rows with new column names
        const reconstructedRows = newRows.map(row => {
          const newRow: any = {};
          Object.keys(row).forEach((oldKey, index) => {
            const newKey = newColumns[index] || oldKey;
            newRow[newKey] = row[oldKey];
          });
          return newRow;
        });

        setFileData({
          rows: reconstructedRows,
          columns: newColumns.filter(col => col && col.trim() !== ''),
          meta: data.meta
        });
      } else {
        setFileData(data);
      }
      
      // Auto-select all relevant columns for Partoo (processor will filter what's needed)
      const columns = hasRealHeaders ? data.columns : Object.values(firstRow || {}) as string[];
      const partooColumns = columns.filter(col => {
        if (!col || typeof col !== 'string') return false;
        const colLower = col.toLowerCase().trim();
        // Include all columns that are NOT in the skip list
        return !(
          /^business.?id$/i.test(col) ||
          /^code$/i.test(col) ||
          /^siret$/i.test(col) ||
          /^unnamed/i.test(col) ||
          /local.?or.?global/i.test(col) ||
          /creation.?date/i.test(col) ||
          /closed.?date/i.test(col) ||
          /address.?complement/i.test(col) ||
          colLower === '' ||
          colLower.startsWith('business default')
        );
      });
      
      setSelectedColumns(partooColumns);
      setCurrentStep(ProcessingStep.SELECT_MODEL); // Skip column selection and confirmation
    } else {
      setFileData(data);
      setCurrentStep(ProcessingStep.SELECT_COLUMNS);
    }
  };

  // Handle column selection
  const handleColumnsSelected = (columns: string[]) => {
    setSelectedColumns(columns);
    setCurrentStep(ProcessingStep.CONFIRM_COLUMNS);
  };

  // Handle column confirmation
  const handleColumnConfirmation = (mappings: any) => {
    setColumnMappings(mappings);
    setCurrentStep(ProcessingStep.SELECT_MODEL);
  };

  // Handle back from confirmation
  const handleBackToColumnSelection = () => {
    setCurrentStep(ProcessingStep.SELECT_COLUMNS);
  };

  /**
   * Handles model selection and initiates the processing workflow
   * @param model - Selected AI model ID (e.g., 'o4-mini', 'claude-sonnet-4')
   * @param options - Processing options including dry run and target language
   */
  const handleModelSelected = async (model: string, options?: { dryRun?: boolean; targetLanguage?: string }) => {
    // Determine API key based on model/provider
    const isAnthropic = model.startsWith('claude');
    const apiKey = isAnthropic ? ANTHROPIC_API_KEY : OPENAI_API_KEY;

    if (!apiKey) {
      toast('API Key Missing', {
        description: `Missing ${isAnthropic ? 'VITE_ANTHROPIC_API_KEY' : 'VITE_OPENAI_API_KEY'} in your environment.`,
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      return;
    }

    setSelectedModel(model);
    setCurrentStep(ProcessingStep.PROCESSING);
    setProcessingStartTime(new Date());
    
    if (!fileData) return;

    try {
      const modelConfig = getModelById(model);
      if (!modelConfig) {
        throw new Error('Invalid model selected');
      }

      const processedRowsData = await processFile(
        fileData.rows,
        selectedColumns,
        modelConfig,
        apiKey as string,
        { useCase: useCase === 'amazon' ? 'amazon' : useCase === 'partoo' ? 'partoo' : 'ecommerce', mappings: columnMappings, dryRun: options?.dryRun, lang: options?.targetLanguage },
        costTracker
      );
      
      setProcessedData(processedRowsData);
      setProcessingEndTime(new Date());
      setCurrentStep(ProcessingStep.COMPLETE);
      toast('File processed successfully!', {
        description: 'Your file has been optimized successfully.',
      });
    } catch (error) {
      console.error('Error optimizing text:', error);
      toast('Error processing file', {
        description: error instanceof Error ? error.message : 'Please try again.',
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
      setCurrentStep(ProcessingStep.SELECT_MODEL);
    }
  };

  const downloadProcessedFile = async () => {
    if (!processedData) return;

    try {
      // Create a new workbook using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Optimized Descriptions");
      
      // Add headers
      if (processedData.length > 0) {
        const headers = Object.keys(processedData[0]);
        worksheet.addRow(headers);
        
        // Add data rows
        processedData.forEach(row => {
          const values = headers.map(header => row[header] || '');
          worksheet.addRow(values);
        });
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `optimized_descriptions_${timestamp}.xlsx`;
      
      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      toast('Error generating file', {
        description: 'Please try again.',
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
    }
  };

  const copyResultsToClipboard = () => {
    if (!processedData) return;

    const text = processedData
      .slice(0, showMoreResults ? processedData.length : 3)
      .map((row, index) => {
        const productCode = row.MaterialSAPMaterialNo || row.ColorSAPMaterialNo || `Row ${index + 1}`;
        const rowText = selectedColumns
          .map(column => `${column}: ${row[column]}`)
          .join('\n');
        return `Product: ${productCode}\n${rowText}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(text).then(() => {
      toast('Copied to clipboard', {
        description: 'Results have been copied to your clipboard.',
      });
    }).catch(() => {
      toast('Failed to copy', {
        description: 'Please try again.',
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
    });
  };

  const getProcessingTime = () => {
    if (!processingStartTime || !processingEndTime) return null;
    const diff = processingEndTime.getTime() - processingStartTime.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const goBack = () => {
    switch (currentStep) {
      case ProcessingStep.SELECT_COLUMNS:
        setCurrentStep(ProcessingStep.UPLOAD);
        setFileData(null);
        setSelectedColumns([]);
        break;
      case ProcessingStep.CONFIRM_COLUMNS:
        setCurrentStep(ProcessingStep.SELECT_COLUMNS);
        setColumnMappings([]);
        break;
      case ProcessingStep.SELECT_MODEL:
        setCurrentStep(ProcessingStep.CONFIRM_COLUMNS);
        setSelectedModel('');
        break;
      case ProcessingStep.PROCESSING:
        // Do not allow going back during processing
        break;
      case ProcessingStep.COMPLETE:
        reloadFile();
        break;
    }
  };

  const goForward = () => {
    switch (currentStep) {
      case ProcessingStep.UPLOAD:
        if (fileData) {
          setCurrentStep(ProcessingStep.SELECT_COLUMNS);
        }
        break;
      case ProcessingStep.SELECT_COLUMNS:
        if (selectedColumns.length > 0) {
          setCurrentStep(ProcessingStep.CONFIRM_COLUMNS);
        }
        break;
      case ProcessingStep.CONFIRM_COLUMNS:
        if (columnMappings.length > 0) {
          setCurrentStep(ProcessingStep.SELECT_MODEL);
        }
        break;
      case ProcessingStep.SELECT_MODEL:
        if (selectedModel) {
          // This will be handled by the onModelSelected callback
        }
        break;
    }
  };

  const reloadFile = () => {
    setFileData(null);
    setSelectedColumns([]);
    setSelectedModel('');
    setProcessedData(null);
    setProcessingStartTime(null);
    setProcessingEndTime(null);
    setCurrentStep(ProcessingStep.UPLOAD);
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case ProcessingStep.UPLOAD:
        return (
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Welcome Section */}
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Product Description Optimizer</h1>
              <p className="text-sm text-gray-600">
                Optimize product descriptions using AI-powered automation
              </p>
            </div>

            {/* Budget UI removed */}

            {/* Upload Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-medium mb-2">Upload Inriver Export</h2>
              <p className="text-sm text-gray-600 mb-3">
                Upload your Inriver file with product data (.xlsx, .xls, .csv)
              </p>

              {/* Use Case Selector */}
              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Use Case</label>
                <Select value={useCase} onValueChange={(v) => setUseCase(v as UseCase)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select use case" />
                  </SelectTrigger>
                  <SelectContent>
                    {([...AVAILABLE_USE_CASES].sort((a, b) => {
                      const order: Record<string, number> = { ecommerce: 0, amazon: 1, partoo: 2, zalando: 3, aboutyou: 4, next: 5 };
                      const ao = order[a.value] ?? 99;
                      const bo = order[b.value] ?? 99;
                      if (ao !== bo) return ao - bo;
                      return a.label.localeCompare(b.label);
                    })).map((uc) => {
                      const isDisabled = uc.value !== 'amazon' && uc.value !== 'ecommerce' && uc.value !== 'partoo';
                      return (
                        <SelectItem 
                          key={uc.value} 
                          value={uc.value} 
                          disabled={isDisabled}
                          className={isDisabled ? 'text-gray-400 cursor-not-allowed' : ''}
                        >
                          {uc.label}{isDisabled ? ' (Coming soon)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <FileUpload onFileUploaded={handleFileUploaded} useCase={useCase} />
            </div>
          </div>
        );

      case ProcessingStep.SELECT_COLUMNS:
        return (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-4">
              {useCase === 'amazon' ? (
                <>
                  <h2 className="text-lg font-medium mb-2">Select Columns (Amazon)</h2>
                  <p className="text-sm text-gray-600">Choose input columns such as rtip_product_description#1.value and bullet_point#*.value</p>
                </>
              ) : useCase === 'partoo' ? (
                <>
                  <h2 className="text-lg font-medium mb-2">Select Store Data Columns (Partoo)</h2>
                  <p className="text-sm text-gray-600">Select columns like Name, City, Country, Short description, Long description</p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-medium mb-2">Select Language Variants</h2>
                  <p className="text-sm text-gray-600">Choose MaterialLongDescriptionEcom columns to optimize (with or without Color prefix)</p>
                </>
              )}
            </div>

            <ColumnSelector 
              useCase={useCase}
              columns={(() => {
                const cols = fileData?.columns || [];
                if (useCase === 'amazon' || useCase === 'partoo') return cols;
                return cols.filter((col) => {
                  const colLower = col.toLowerCase();
                  return colLower.startsWith('colormateriallongdescriptionecom') || 
                         colLower.startsWith('materiallongdescriptionecom');
                });
              })()}
              onColumnsSelected={handleColumnsSelected}
            />
          </div>
        );

      case ProcessingStep.CONFIRM_COLUMNS:
        return (
          <ColumnConfirmation
            fileData={fileData!}
            selectedColumns={selectedColumns}
            useCase={useCase}
            onConfirm={handleColumnConfirmation}
            onBack={handleBackToColumnSelection}
          />
        );

      case ProcessingStep.SELECT_MODEL:
        return (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-lg font-medium mb-2">Choose AI Model</h2>
              <p className="text-sm text-gray-600">
                Select the model for content optimization
              </p>
            </div>

            <ModelSelector onModelSelected={handleModelSelected} />
          </div>
        );

      case ProcessingStep.PROCESSING:
        const modelConfig = getModelById(selectedModel);
        const modelDisplayName = modelConfig ? modelConfig.name : selectedModel;
        
        return (
          <div className="max-w-3xl mx-auto">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Processing File...</h2>
              <p className="text-sm text-gray-600 mt-1">Using {modelDisplayName} for optimization</p>
            </div>
            
            <ProcessingView
              progress={progress}
              totalRows={totalRows}
              processedRows={processedRows}
              logs={logs}
              estimatedTimeRemaining={estimatedTimeRemaining}
              processingMode={processingMode}
              onCancel={cancelProcessing}
            />
            
          </div>
        );

      case ProcessingStep.COMPLETE:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Complete!</h3>
              <p className="text-gray-600 mb-4">Your file has been processed successfully.</p>
            </div>

            {/* Results Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Results Summary</h4>
              <div className="space-y-2 text-sm">
                <p>Total rows processed: {processedData?.length || 0}</p>
                <p>Model used: {selectedModel}</p>
                {getProcessingTime() && (
                  <p>Processing time: {getProcessingTime()}</p>
                )}
              </div>
            </div>

            {/* Cost Summary */}
            {costTracker && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Cost Summary</h4>
                <div className="space-y-2 text-sm">
                  <p>Total cost: ${costTracker.getSessionStats().totalActualCost.toFixed(4)}</p>
                  <p>Total tokens: {costTracker.getSessionStats().totalTokens.toLocaleString()}</p>
                  <p>Remaining budget: ${typeof costTracker.remainingBudget === 'number' ? costTracker.remainingBudget.toFixed(2) : 'N/A'}</p>
                </div>
              </div>
            )}


            {/* Sample Results removed as requested */}

            {/* Export */}
            <div className="flex items-center justify-center">
              <ExportResults results={processedData} isDisabled={!processedData || processedData.length === 0} originalMeta={fileData?.meta} useCase={useCase === 'amazon' ? 'amazon' : useCase === 'partoo' ? 'partoo' : 'ecommerce'} />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              {/* XLSX export (augment original workbook) */}
              <Button variant="outline" onClick={copyResultsToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </Button>
              <Button variant="secondary" onClick={reloadFile}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Process Another File
              </Button>
            </div>
          </div>
        );
    }
  };

  const canGoBack = currentStep !== ProcessingStep.UPLOAD && !isProcessing;
  const canGoForward = 
    (currentStep === ProcessingStep.UPLOAD && fileData) ||
    (currentStep === ProcessingStep.SELECT_COLUMNS && selectedColumns.length > 0) ||
    (currentStep === ProcessingStep.SELECT_MODEL && selectedModel);

  return (
    <ThemeProvider defaultTheme="light">
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container max-w-7xl mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {renderStep()}

              <div className="mt-6 flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  {canGoBack && (
                    <Button variant="ghost" onClick={goBack}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  )}
                  {currentStep !== ProcessingStep.PROCESSING && currentStep !== ProcessingStep.COMPLETE && (
                    <Button variant="ghost" onClick={reloadFile}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reload File
                    </Button>
                  )}
                </div>
                {canGoForward && (
                  <Button onClick={goForward}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default WatsonAnalyzer;
