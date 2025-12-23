import { registerOTel } from '@vercel/otel';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

export function register() {
    // ⚠️ ONLY ENABLE THIS FOR DEV/DEBUGGING
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    }

    registerOTel({
        serviceName: 'dit-ui-app',
    });
}