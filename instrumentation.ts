import { registerOTel } from "@vercel/otel";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

export function register() {
  const honeycombApiKey = process.env.HONEYCOMB_API_KEY;

  if (!honeycombApiKey) {
    const errorMessage =
      "HONEYCOMB_API_KEY is missing. Telemetry will be disabled.";
    if (process.env.NODE_ENV === "production") {
      console.warn(errorMessage);
      return;
    }
    // In development/local, fail fast to ensure configuration is correct
    throw new Error(errorMessage);
  }

  // Configure OTLP exporter for Honeycomb
  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
      : "https://api.honeycomb.io/v1/traces",
    headers: {
      "x-honeycomb-team": honeycombApiKey,
    },
  });

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || "ums-pos",
    traceExporter: exporter,
  });
}
