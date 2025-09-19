/**
 * Utility functions for handling CORS proxies
 */

/**
 * Get CORS proxy URL based on environment and stored settings
 */
export const getCorsProxyUrl = (): string => {
  // First check if a custom CORS proxy URL is stored in sessionStorage
  const storedProxyUrl = sessionStorage.getItem('cors_proxy_url');
  if (storedProxyUrl) {
    return storedProxyUrl;
  }
  
  // Use a proxy that works well in production
  return "https://api.allorigins.win/get?url=";
};

/**
 * Make URL compatible with CORS proxy
 */
export const makeProxiedUrl = (url: string, corsProxyUrl: string): string => {
  // Handle different proxy formats
  if (corsProxyUrl.includes("allorigins.win")) {
    return `${corsProxyUrl}${encodeURIComponent(url)}`;
  } else if (corsProxyUrl.includes("?url=")) {
    return `${corsProxyUrl}${encodeURIComponent(url)}`;
  } else if (corsProxyUrl.includes("corsproxy.io")) {
    return `${corsProxyUrl}${encodeURIComponent(url)}`;
  } else {
    return `${corsProxyUrl}${url}`;
  }
};

/**
 * Get CORS proxy headers needed for the request
 */
export const getCorsProxyHeaders = (corsProxyUrl: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  // Check if we're using cors.sh
  if (corsProxyUrl.includes("cors.sh")) {
    headers["x-cors-api-key"] = "live_0df03e15b7f1bdf27d12ee406841eed5866d880e2dec98dd37db703033e23734";
  }
  
  // Add common headers
  headers["Accept"] = "application/json, text/plain, */*";
  
  return headers;
};

/**
 * Process response from different proxy services
 */
const processProxyResponse = async (response: Response, corsProxyUrl: string): Promise<any> => {
  if (!response.ok) {
    throw new Error(`Proxy returned status: ${response.status}`);
  }

  // Handle allorigins.win response format
  if (corsProxyUrl.includes("allorigins.win")) {
    const data = await response.json();
    if (data.status && data.status.http_code === 200) {
      return JSON.parse(data.contents);
    } else {
      throw new Error(`AllOrigins proxy error: ${data.status?.http_code || 'unknown'}`);
    }
  }
  
  // For other proxies, return response as-is
  return await response.json();
};

/**
 * Creates a fetch function with CORS proxy support and fallbacks
 * @param baseUrl The original API URL to call
 * @param options Fetch options
 * @returns Promise with response
 */
export const fetchWithCorsProxy = async (
  baseUrl: string,
  options: RequestInit = {}
): Promise<Response> => {
  // List of proxy services to try in order - prioritizing those that work in production
  const proxyServices = [
    "https://api.allorigins.win/get?url=",        // Works well with Vercel
    "https://proxy-cors.isomorphic-git.org/",     // GitHub-hosted, reliable
    "https://cors-proxy.htmldriven.com/?url=",   // Reliable for production
    "https://api.codetabs.com/v1/proxy?quest=",  // Production-friendly
    "https://corsproxy.io/?",                    // Backup
    "https://proxy.cors.sh/"                     // Requires API key
  ];

  // Start with the configured proxy
  const configuredProxy = getCorsProxyUrl();
  const proxiesToTry = [configuredProxy, ...proxyServices.filter(p => p !== configuredProxy)];

  let lastError: Error | null = null;

  for (const proxyUrl of proxiesToTry) {
    try {
      console.log(`🔄 Attempting CORS proxy: ${proxyUrl.replace(/\?.*$/, '...')}`);
      
      const proxiedUrl = makeProxiedUrl(baseUrl, proxyUrl);
      const proxyHeaders = getCorsProxyHeaders(proxyUrl);
      
      // Merge headers, giving priority to original headers
      const headers = {
        ...proxyHeaders,
        ...options.headers
      };

      // Remove problematic headers for some proxies
      if (proxyUrl.includes("allorigins.win")) {
        delete headers["x-api-key"];
        delete headers["anthropic-version"];
      }

      console.log(`📡 Making proxied request to: ${proxiedUrl.substring(0, 100)}...`);

      const response = await fetch(proxiedUrl, {
        ...options,
        headers,
        // Add a timeout to prevent hanging requests
        signal: AbortSignal.timeout(20000) // 20 second timeout
      });
      
      if (response.ok) {
        console.log(`✅ Successfully used CORS proxy: ${proxyUrl.replace(/\?.*$/, '...')}`);
        
        // For allorigins.win, we need to process the response differently
        if (proxyUrl.includes("allorigins.win")) {
          try {
            const processedData = await processProxyResponse(response, proxyUrl);
            // Create a new Response object with the processed data
            return new Response(JSON.stringify(processedData), {
              status: 200,
              statusText: 'OK',
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch (processError) {
            console.warn(`❌ Failed to process response from ${proxyUrl}:`, processError);
            lastError = processError as Error;
            continue;
          }
        }
        
        return response;
      } else {
        console.warn(`❌ Proxy ${proxyUrl.replace(/\?.*$/, '...')} returned status: ${response.status}`);
        lastError = new Error(`Proxy returned status: ${response.status}`);
      }
    } catch (error) {
      console.warn(`❌ Proxy ${proxyUrl.replace(/\?.*$/, '...')} failed:`, error);
      lastError = error as Error;
      continue; // Try next proxy
    }
  }

  // If all proxies fail, try direct fetch as last resort
  console.log("🎯 All CORS proxies failed, attempting direct fetch...");
  try {
    const response = await fetch(baseUrl, {
      ...options,
      mode: "cors",
      credentials: "omit"
    });
    
    if (response.ok) {
      console.log("✅ Direct fetch succeeded");
      return response;
    }
  } catch (directError) {
    console.warn("❌ Direct fetch also failed:", directError);
  }

  // If everything fails, throw the last error
  throw new Error(`All CORS proxy attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
};
