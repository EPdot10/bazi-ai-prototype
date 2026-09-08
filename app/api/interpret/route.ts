import { generateInterpretation } from '@/lib/deepseek';
import type { BaziChartFacts } from '@/lib/bazi/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      chart?: BaziChartFacts;
      topic?: 'overview' | 'career' | 'relationships' | 'year-ahead';
    };

    if (!body.chart || !body.topic) {
      return Response.json(
        { error: 'Validated chart facts and topic are required.' },
        { status: 400 },
      );
    }

    // Until authentication and payment entitlements are connected, this public
    // prototype endpoint is deliberately restricted to the free/Flash tier.
    const result = await generateInterpretation(
      { chart: body.chart, topic: body.topic, locale: 'en' },
      'free',
    );
    return Response.json({ result });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to generate interpretation';
    return Response.json(
      { error: message },
      { status: message.includes('not configured') ? 503 : 500 },
    );
  }
}
