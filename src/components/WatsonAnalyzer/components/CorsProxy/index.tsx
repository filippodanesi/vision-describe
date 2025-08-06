import React, { useState, useEffect } from 'react';
import { CorsProxyDialog } from './CorsProxyDialog';
import { CorsProxyButton } from './CorsProxyButton';
import { toast } from "@/hooks/use-toast";
import { getCorsProxyUrl } from '../../utils/corsProxyUtils';

interface CorsProxyProps {
  className?: string;
}

const CorsProxy: React.FC<CorsProxyProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [proxyUrl, setProxyUrl] = useState(() => {
    return sessionStorage.getItem('cors_proxy_url') || "";
  });
  const [proxyStatus, setProxyStatus] = useState<'unknown' | 'working' | 'error'>('unknown');
  const [currentProxyUrl, setCurrentProxyUrl] = useState<string>("");

  // Check if proxy is set when component mounts
  useEffect(() => {
    const storedProxy = sessionStorage.getItem('cors_proxy_url');
    if (storedProxy) {
      setProxyUrl(storedProxy);
    }
    
    // Get and display the current active proxy
    setCurrentProxyUrl(getCorsProxyUrl());
    
    // Test the current proxy automatically when component mounts
    handleTestProxy();
    
    // Add event listener for storage changes
    const handleStorageChange = () => {
      setCurrentProxyUrl(getCorsProxyUrl());
      // Re-test the proxy when it changes
      handleTestProxy();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleSave = () => {
    // Ensure the URL ends with a trailing slash or question mark for proper concatenation
    let formattedUrl = proxyUrl.trim();
    
    // Don't save empty URL (will use defaults based on environment)
    if (formattedUrl === "") {
      sessionStorage.removeItem('cors_proxy_url');
      toast({
        title: "CORS proxy settings cleared",
        description: "Default proxy settings will be used.",
      });
      setCurrentProxyUrl(getCorsProxyUrl());
      setIsOpen(false);
      
      // Test the default proxy
      setTimeout(() => handleTestProxy(), 500);
      return;
    }
    
    // Format the URL properly depending on the proxy type
    if (formattedUrl.includes("?url=")) {
      // Format for proxies that use ?url= parameter
      if (!formattedUrl.endsWith("=")) {
        formattedUrl = formattedUrl + "=";
      }
    } else if (!formattedUrl.endsWith("?") && !formattedUrl.endsWith("/")) {
      // For other proxies ensure we have a separator
      formattedUrl = formattedUrl + "/";
    }
    
    sessionStorage.setItem('cors_proxy_url', formattedUrl);
    toast({
      title: "CORS proxy settings saved",
      description: "Your CORS proxy settings have been updated.",
    });
    setCurrentProxyUrl(formattedUrl);
    setIsOpen(false);
    
    // Test the new proxy after saving
    setTimeout(() => handleTestProxy(), 500);
    
    // Dispatch storage event to notify other components
    window.dispatchEvent(new Event('storage'));
  };

  const handleTestProxy = async () => {
    try {
      setProxyStatus('unknown');
      console.log('🧪 Starting CORS proxy test...');
      
      const testProxyUrl = proxyUrl || getCorsProxyUrl();
      console.log(`Testing proxy: ${testProxyUrl}`);
      
      // Use the same logic as our enhanced CORS proxy utility
      let testUrl;
      if (testProxyUrl.includes("allorigins.win")) {
        testUrl = `${testProxyUrl}${encodeURIComponent("https://httpbin.org/get")}`;
      } else if (testProxyUrl.includes("?url=")) {
        testUrl = `${testProxyUrl}${encodeURIComponent("https://httpbin.org/get")}`;
      } else if (testProxyUrl.includes("corsproxy.io")) {
        testUrl = `${testProxyUrl}${encodeURIComponent("https://httpbin.org/get")}`;
      } else {
        testUrl = `${testProxyUrl}https://httpbin.org/get`;
      }
      
      // Add appropriate headers based on proxy type
      const headers: Record<string, string> = {
        "Accept": "application/json, text/plain, */*"
      };
      
      if (testProxyUrl.includes("cors.sh")) {
        headers["x-cors-api-key"] = "live_0df03e15b7f1bdf27d12ee406841eed5866d880e2dec98dd37db703033e23734";
      }
      
      // Try the request with timeout
      const startTime = Date.now();
      console.log(`📡 Making test request to: ${testUrl.substring(0, 100)}...`);
      
      const response = await fetch(testUrl, { 
        headers,
        signal: AbortSignal.timeout(15000) // 15 second timeout for test
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        // Handle different response formats
        let testData;
        try {
          const responseData = await response.json();
          
          // Handle allorigins.win format
          if (testProxyUrl.includes("allorigins.win")) {
            if (responseData.status && responseData.status.http_code === 200) {
              testData = JSON.parse(responseData.contents);
            } else {
              throw new Error(`AllOrigins error: ${responseData.status?.http_code || 'unknown'}`);
            }
          } else {
            testData = responseData;
          }
          
          // Verify we got a valid httpbin.org response
          if (testData && (testData.url || testData.origin)) {
            setProxyStatus('working');
            console.log(`✅ CORS proxy test successful in ${responseTime}ms`);
            
            // Only show toast if dialog is open (avoid spam during auto-tests)
            if (isOpen) {
              toast({
                title: "CORS proxy test successful",
                description: `The proxy is working correctly (${responseTime}ms response time).`,
              });
            }
          } else {
            throw new Error('Invalid response format from test endpoint');
          }
        } catch (parseError) {
          console.error('Failed to parse proxy response:', parseError);
          throw new Error(`Response parsing failed: ${parseError}`);
        }
      } else {
        setProxyStatus('error');
        console.error(`❌ CORS proxy test failed with status: ${response.status}`);
        
        if (isOpen) {
          toast({
            title: "CORS proxy test failed",
            description: `The proxy returned an error: ${response.status} ${response.statusText}`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("❌ CORS proxy test error:", error);
      setProxyStatus('error');
      
      let errorMessage = "Could not connect to the proxy.";
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          errorMessage = "Proxy test timed out after 15 seconds.";
        } else if (error.message.includes('AllOrigins')) {
          errorMessage = `Proxy service error: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      if (isOpen) {
        toast({
          title: "CORS proxy test failed",
          description: errorMessage + " Check the console for details.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <CorsProxyDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      proxyUrl={proxyUrl}
      setProxyUrl={setProxyUrl}
      proxyStatus={proxyStatus}
      currentProxyUrl={currentProxyUrl}
      handleSave={handleSave}
      handleTestProxy={handleTestProxy}
    >
      <CorsProxyButton className={className} proxyStatus={proxyStatus} />
    </CorsProxyDialog>
  );
};

export default CorsProxy;
