import type { ProductDeps } from '../app/product-service';
import { HttpProductService } from '../infra/http-product-service';
import { initialiseAppInsights } from './app-insights';

export function initialiseInstrumentation(): void {
  const apiBaseUrl = resolveProductApiBaseUrl();
  initialiseAppInsights({
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING,
    allowedApiHosts: [apiBaseUrl.host],
  });
}

export function createProductDeps(): ProductDeps {
  const baseUrl = resolveProductApiBaseUrl();
  return {
    productService: new HttpProductService({ baseUrl: baseUrl.toString() }),
  };
}

function resolveProductApiBaseUrl(): URL {
  let baseUrl: URL;
  try {
    // Default to the local Functions host when the setting is absent.
    baseUrl = new URL(
      import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7071/api/',
    );
  } catch {
    throw new Error('VITE_API_BASE_URL must be an absolute HTTP(S) URL.');
  }

  if (
    (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') ||
    baseUrl.username !== '' ||
    baseUrl.password !== '' ||
    baseUrl.search !== '' ||
    baseUrl.hash !== ''
  ) {
    throw new Error(
      'VITE_API_BASE_URL must be an HTTP(S) URL without credentials, query or fragment.',
    );
  }

  // Append products to the base path even if the setting omits a final slash.
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/`;
  return baseUrl;
}
