import { Suspense } from 'react';
import { AccidentReportSummaryPage } from '@tts/pages';

export default function SummaryReport() {
    return (
        <Suspense fallback={<div>Đang tải...</div>}>
            <AccidentReportSummaryPage />
        </Suspense>
    );
}
