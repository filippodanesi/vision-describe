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
import { ArrowLeft, ArrowRight, RefreshCw, Download } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    setFileData(data);
    
    // For Partoo, auto-select all relevant columns (processor will filter what's needed)
    if (useCase === 'partoo') {
      const partooColumns = data.columns.filter(col => {
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
      
      // Auto-create column mappings for Partoo based on detected columns
      const findColumn = (patterns: RegExp[]): string | undefined => {
        return data.columns.find(col => 
          col && patterns.some(pattern => pattern.test(col))
        );
      };
      
      const partooMapping = {
        mapping: {
          businessId: findColumn([/^Business identification$/i]),
          name: findColumn([/^Name$/i]),
          address: findColumn([/^Address$/i]),
          city: findColumn([/^City$/i]),
          zipcode: findColumn([/^Zipcode$/i]),
          country: findColumn([/^Country$/i]),
          status: findColumn([/^Status$/i]),
          shortDescription: findColumn([/^Short description/i]),
          longDescription: findColumn([/^Long description/i]),
          businessOpeningDate: findColumn([/^business.?opening.?date$/i]),
        }
      };
      
      setColumnMappings(partooMapping);
      setCurrentStep(ProcessingStep.SELECT_MODEL); // Skip column selection and confirmation
    } else {
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Copy Assistant</h1>
              <p className="text-sm text-gray-600">
                Generate optimized content for products, stores, and marketplace platforms using AI
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

            <ModelSelector onModelSelected={handleModelSelected} useCase={useCase} />
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

            {/* Processing Summary - Unified */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Processing Summary
              </h4>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {/* Left Column */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rows Processed</span>
                    <span className="font-mono font-semibold text-gray-900">{processedData?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Model</span>
                    <span className="font-mono text-gray-900">{getModelById(selectedModel)?.name || selectedModel}</span>
                  </div>
                  {getProcessingTime() && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Time</span>
                      <span className="font-mono text-gray-900">{getProcessingTime()}</span>
                    </div>
                  )}
                </div>

                {/* Right Column - Cost */}
                {costTracker && (
                  <div className="space-y-3 border-l border-gray-300 pl-8">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Cost</span>
                      <span className="font-mono font-semibold text-gray-900">
                        ${costTracker.getSessionStats().totalActualCost.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Tokens</span>
                      <span className="font-mono text-gray-900">
                        {costTracker.getSessionStats().totalTokens.toLocaleString()}
                      </span>
                    </div>
                    {processedData && processedData.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg Cost/Row</span>
                        <span className="font-mono text-gray-900">
                          ${(costTracker.getSessionStats().totalActualCost / processedData.length).toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>


            {/* Results Preview - First 10 rows */}
            {processedData && processedData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Preview (first 10 rows)</h4>
                  <span className="text-xs text-gray-500">
                    Showing {Math.min(10, processedData.length)} of {processedData.length} rows
                  </span>
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          {useCase === 'partoo' ? (
                            <>
                              <TableHead className="font-semibold text-gray-700 text-xs">Business ID</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-xs">Name</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-xs">City</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-xs w-[200px]">Short Description</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-xs w-[300px]">Long Description</TableHead>
                            </>
                          ) : (
                            <>
                              <TableHead className="font-semibold text-gray-700 text-xs">SKU</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-xs">Product Name</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-xs w-[300px]">Optimized Text</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedData.slice(0, 10).map((row: any, index: number) => {
                          // For Partoo, use column mappings to access data
                          if (useCase === 'partoo' && columnMappings?.mapping) {
                            const mapping = columnMappings.mapping;
                            const businessId = row[mapping.businessId] || '-';
                            const name = row[mapping.name] || '-';
                            const city = row[mapping.city] || '-';
                            const shortDesc = row[mapping.shortDescription] || '';
                            const longDesc = row[mapping.longDescription] || '';
                            
                            return (
                              <TableRow key={index} className="hover:bg-gray-50/50">
                                <TableCell className="font-mono text-xs text-gray-600">{businessId}</TableCell>
                                <TableCell className="text-xs text-gray-900">{name}</TableCell>
                                <TableCell className="text-xs text-gray-700">{city}</TableCell>
                                <TableCell className="text-xs text-gray-600 max-w-[200px]">
                                  <div className="truncate" title={shortDesc}>
                                    {shortDesc ? shortDesc.substring(0, 60) + (shortDesc.length > 60 ? '...' : '') : '-'}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-gray-600 max-w-[300px]">
                                  <div className="truncate" title={longDesc}>
                                    {longDesc ? longDesc.substring(0, 100) + (longDesc.length > 100 ? '...' : '') : '-'}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          // For other use cases
                          return (
                            <TableRow key={index} className="hover:bg-gray-50/50">
                              <TableCell className="font-mono text-xs text-gray-600">{row.sku || row.asin || '-'}</TableCell>
                              <TableCell className="text-xs text-gray-900">{row.productName || row.title || '-'}</TableCell>
                              <TableCell className="text-xs text-gray-600 max-w-[300px]">
                                <div className="line-clamp-2" title={row.optimizedLongDescription || row.optimizedText}>
                                  {row.optimizedLongDescription || row.optimizedText || '-'}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <ExportResults results={processedData} isDisabled={!processedData || processedData.length === 0} originalMeta={fileData?.meta} useCase={useCase === 'amazon' ? 'amazon' : useCase === 'partoo' ? 'partoo' : 'ecommerce'} />
              <Button variant="outline" onClick={reloadFile}>
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
