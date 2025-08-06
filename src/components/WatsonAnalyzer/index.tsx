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
import { ArrowLeft, ArrowRight, RefreshCw, Download, Copy } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { validateEnv, OPENAI_API_KEY, ANTHROPIC_API_KEY } from '@/config/env';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import FileUpload from './components/FileUpload';
import ColumnSelector from './components/ColumnSelector';
import ColumnConfirmation from './components/ColumnConfirmation';
import ModelSelector from './components/ModelSelector';
import ProcessingView from './components/ProcessingView';
import { getModelById } from '@/lib/models';
import { Button } from '@/components/ui/button';

const WatsonAnalyzer: React.FC = () => {
  // Current step
  const [currentStep, setCurrentStep] = useState<ProcessingStep>(ProcessingStep.UPLOAD);
  
  // File data
  const [fileData, setFileData] = useState<{
    rows: any[];
    columns: string[];
  } | null>(null);
  
  // Selected columns
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  
  // Column mappings (for confirmation step)
  const [columnMappings, setColumnMappings] = useState<any[]>([]);
  
  // Selected model
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  // Budget update trigger for header refresh
  const [budgetUpdateTrigger, setBudgetUpdateTrigger] = useState(0);
  
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
  const handleFileUploaded = (data: { rows: any[]; columns: string[] }) => {
    setFileData(data);
    setCurrentStep(ProcessingStep.SELECT_COLUMNS);
  };

  // Handle column selection
  const handleColumnsSelected = (columns: string[]) => {
    setSelectedColumns(columns);
    setCurrentStep(ProcessingStep.CONFIRM_COLUMNS);
  };

  // Handle column confirmation
  const handleColumnConfirmation = (mappings: any[]) => {
    setColumnMappings(mappings);
    setCurrentStep(ProcessingStep.SELECT_MODEL);
  };

  // Handle back from confirmation
  const handleBackToColumnSelection = () => {
    setCurrentStep(ProcessingStep.SELECT_COLUMNS);
  };

  // Handle model selection
  const handleModelSelected = async (model: string) => {
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
        apiKey as string
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
        const productCode = row.ColorSAPMaterialNo || `Row ${index + 1}`;
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
                Optimize product descriptions using AI and Inriver export data
              </p>
            </div>

            {/* Compact Budget Management */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Budget</span>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">OpenAI:</span>
                    <input 
                      type="number" 
                      placeholder="500"
                      className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 500;
                        if (costTracker) {
                          costTracker.setBudget('openai', value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = parseFloat((e.target as HTMLInputElement).value) || 500;
                          if (costTracker) {
                            costTracker.setBudget('openai', value);
                            // Force header re-render by triggering budget update
                            setBudgetUpdateTrigger(prev => prev + 1);
                          }
                        }
                      }}
                    />
                    <span className="text-gray-600">$</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Claude:</span>
                    <input 
                      type="number" 
                      placeholder="500"
                      className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 500;
                        if (costTracker) {
                          costTracker.setBudget('anthropic', value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = parseFloat((e.target as HTMLInputElement).value) || 500;
                          if (costTracker) {
                            costTracker.setBudget('anthropic', value);
                            // Force header re-render by triggering budget update
                            setBudgetUpdateTrigger(prev => prev + 1);
                          }
                        }
                      }}
                    />
                    <span className="text-gray-600">$</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-medium mb-2">Upload Inriver Export</h2>
              <p className="text-sm text-gray-600 mb-3">
                Upload your Inriver file with product data (.xlsx, .xls, .csv)
              </p>
              <FileUpload onFileUploaded={handleFileUploaded} />
            </div>
          </div>
        );

      case ProcessingStep.SELECT_COLUMNS:
        return (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-lg font-medium mb-2">Select Language Variants</h2>
              <p className="text-sm text-gray-600">
                Choose MaterialLongDescriptionEcom columns to optimize (with or without Color prefix)
              </p>
            </div>

            <ColumnSelector 
              columns={(fileData?.columns || []).filter((col) => {
                const colLower = col.toLowerCase();
                return colLower.startsWith('colormateriallongdescriptionecom') || 
                       colLower.startsWith('materiallongdescriptionecom');
              })}
              onColumnsSelected={handleColumnsSelected}
            />
          </div>
        );

      case ProcessingStep.CONFIRM_COLUMNS:
        return (
          <ColumnConfirmation
            fileData={fileData!}
            selectedColumns={selectedColumns}
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
          <div className="max-w-4xl mx-auto">
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
                <p>Columns optimized: {selectedColumns.join(', ')}</p>
                <p>Model used: {selectedModel}</p>
                {getProcessingTime() && (
                  <p>Processing time: {getProcessingTime()}</p>
                )}
              </div>
            </div>

            {/* Cost Summary */}
            {costTracker && costTracker.getSessionStats().totalOperations > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  Cost Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white rounded p-3 border border-gray-100">
                    <div className="text-gray-600">Total Operations</div>
                    <div className="font-mono text-lg font-bold text-gray-900">
                      {costTracker.getSessionStats().totalOperations}
                    </div>
                  </div>
                  <div className="bg-white rounded p-3 border border-gray-100">
                    <div className="text-gray-600">Total Cost</div>
                    <div className="font-mono text-lg font-bold text-gray-800">
                      ${costTracker.getSessionStats().totalActualCost.toFixed(5)}
                    </div>
                  </div>
                  <div className="bg-white rounded p-3 border border-gray-100">
                    <div className="text-gray-600">Total Tokens</div>
                    <div className="font-mono text-lg font-bold text-gray-700">
                      {costTracker.getSessionStats().totalTokens.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded p-3 border border-gray-100">
                    <div className="text-gray-600">Avg Cost/Op</div>
                    <div className="font-mono text-lg font-bold text-gray-600">
                      ${(costTracker.getSessionStats().totalActualCost / costTracker.getSessionStats().totalOperations).toFixed(5)}
                    </div>
                  </div>
                </div>
                
                {/* Token Breakdown */}
                <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                  <div className="text-sm text-gray-800 mb-2 font-medium">Token Usage Breakdown:</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Input:</span> 
                      <span className="font-mono ml-2 text-gray-800">{costTracker.getSessionStats().totalTokensInput.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Output:</span> 
                      <span className="font-mono ml-2 text-gray-800">{costTracker.getSessionStats().totalTokensOutput.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Budget Status */}
                <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Budget Remaining:</span>
                    <span className="font-mono font-bold text-gray-800">
                      ${(selectedModel.startsWith('claude') ? costTracker.remainingBudget.anthropic : costTracker.remainingBudget.openai).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sample Results removed as requested */}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button onClick={downloadProcessedFile}>
                <Download className="mr-2 h-4 w-4" />
                Download Results
              </Button>
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
        <Header budgetUpdateTrigger={budgetUpdateTrigger} />

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
