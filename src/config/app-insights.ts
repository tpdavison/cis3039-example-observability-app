import {
  ApplicationInsights,
  DistributedTracingModes,
} from '@microsoft/applicationinsights-web';

let initialisationAttempted = false;

export type AppInsightsOptions = {
  readonly connectionString?: string;
  readonly allowedApiHosts: readonly string[];
};

export function initialiseAppInsights(options: AppInsightsOptions): void {
  if (initialisationAttempted) return;
  initialisationAttempted = true;

  const connectionString = options.connectionString?.trim();
  if (!connectionString) {
    console.warn(
      'Browser telemetry is disabled: no Application Insights connection string was provided.',
    );
    return;
  }

  try {
    const appInsights = new ApplicationInsights({
      config: {
        connectionString,
        // The SDK records Fetch dependencies and supplies genuine trace context.
        disableFetchTracking: false,
        disableAjaxTracking: true,
        distributedTracingMode: DistributedTracingModes.W3C,
        enableCorsCorrelation: true,
        correlationHeaderDomains: [...options.allowedApiHosts],
        // Keep the example focused on dependencies without capturing payloads.
        enableRequestHeaderTracking: false,
        enableResponseHeaderTracking: false,
        enableAjaxErrorStatusText: false,
        enableAjaxPerfTracking: false,
        disableExceptionTracking: true,
        enableUnhandledPromiseRejectionTracking: false,
        enableAutoRouteTracking: false,
        autoTrackPageVisitTime: false,
        cookieCfg: { enabled: false },
      },
    });
    appInsights.loadAppInsights();
  } catch {
    console.warn(
      'Browser telemetry could not start. Check the Application Insights configuration.',
    );
  }
}
