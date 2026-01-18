import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

// Minimal OpenTelemetry Tracing bootstrap
// Controlled via env:
//  - ENABLE_TRACING=true
//  - OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318/v1/traces
//  - OTEL_EXPORTER_OTLP_HEADERS=key=value,key2=value2 (optional)
//  - OTEL_SERVICE_NAME=uae-work-hub-api

function parseHeaders(envVal?: string): Record<string, string> | undefined {
  if (!envVal) return undefined
  const headers: Record<string, string> = {}
  for (const pair of envVal.split(',')) {
    const [k, v] = pair.split('=').map(s => s?.trim())
    if (k && v) headers[k] = v
  }
  return Object.keys(headers).length ? headers : undefined
}

const enabled = process.env.ENABLE_TRACING === 'true'
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || ''

if (enabled && endpoint) {
  const serviceName = process.env.OTEL_SERVICE_NAME || 'uae-work-hub-api'
  const headers = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS)

  const exporter = new OTLPTraceExporter({
    url: endpoint,
    headers,
  })

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '0.1.0',
  })

  const sdk = new NodeSDK({
    resource,
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  })

  sdk.start().then(() => {
    console.log(`🔭 OpenTelemetry tracing enabled -> ${endpoint} (service=${serviceName})`)
  }).catch(err => {
    console.error('Failed to start OpenTelemetry SDK:', err)
  })

  const shutdown = async () => {
    try {
      await sdk.shutdown()
      console.log('OpenTelemetry tracing shutdown complete')
    } catch (e) {
      console.error('Error during OpenTelemetry shutdown', e)
    }
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
} else {
  if (process.env.ENABLE_TRACING === 'true') {
    console.warn('ENABLE_TRACING=true but OTEL_EXPORTER_OTLP_ENDPOINT is not set; tracing disabled')
  }
}
