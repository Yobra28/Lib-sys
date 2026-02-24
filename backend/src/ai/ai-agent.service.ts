/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';

type LlmRecommendation = {
  bookId: string;
  reason?: string;
};

type LlmResponseShape = {
  recommendations: LlmRecommendation[];
};

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private readonly client: GoogleGenAI | null;
  private readonly modelName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set – AI agent disabled.');
      this.client = null;
      this.modelName = '';
    } else {
      this.client = new GoogleGenAI({ apiKey });

      // ✅ Supported model (fixes 404 error)
      this.modelName =
        this.configService.get<string>('GEMINI_MODEL') ??
        'gemini-1.5-flash';
    }
  }

  async recommendForUser(userId: string, limit = 10) {
    if (!this.client) {
      throw new InternalServerErrorException(
        'AI agent is not configured. Set GEMINI_API_KEY.',
      );
    }

    // 1️⃣ Fetch user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        regno: true,
      },
    });

    if (!user) {
      throw new InternalServerErrorException('User not found.');
    }

    // 2️⃣ Fetch borrow history
    const borrows = await this.prisma.borrow.findMany({
      where: { userId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            category: true,
            description: true,
          },
        },
      },
      orderBy: { borrowDate: 'desc' },
      take: 50,
    });

    const alreadyBorrowedIds = borrows.map((b) => b.book.id);

    // 3️⃣ Candidate pool
    const candidates = await this.prisma.book.findMany({
      where: {
        id: { notIn: alreadyBorrowedIds },
        availableCopies: { gt: 0 },
      },
      select: {
        id: true,
        title: true,
        author: true,
        category: true,
        description: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    if (!candidates.length) {
      return [];
    }

    // 4️⃣ Build prompt
    const historyForPrompt = borrows.map((b) => ({
      id: b.book.id,
      title: b.book.title,
      author: b.book.author,
      category: b.book.category,
      description: b.book.description ?? '',
    }));

    const promptPayload = {
      user,
      history: historyForPrompt,
      candidates,
      limit,
    };

    const systemPrompt = `
You are an intelligent library recommendation agent.

Select books from the provided candidate list based on:
- User reading history patterns
- Topics
- Difficulty level
- Writing style
- General knowledge

STRICT RULES:
- Return ONLY valid JSON
- No explanations outside JSON
- Format EXACTLY:

{
  "recommendations": [
    {
      "bookId": "<candidate_id>",
      "reason": "<short explanation>"
    }
  ]
}

- bookId MUST exist in the candidate list
- Maximum results = provided limit
`;

    const userMessage = `
Input data:
${JSON.stringify(promptPayload)}
`;

    let content = '{"recommendations":[]}';

try {
  const response = await this.client!.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `${systemPrompt}\n\n${userMessage}`,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  });

  content = response.text ?? '{"recommendations":[]}';
} catch (error) {
  this.logger.error('Gemini call failed', error as any);
  throw new InternalServerErrorException(
    'Failed to get AI recommendations',
  );
}

    let parsed: LlmResponseShape = { recommendations: [] };

    try {
      parsed = JSON.parse(content);
    } catch {
      this.logger.warn('Invalid JSON from LLM. Using fallback.');
    }

    // 5️⃣ Validate IDs
    const candidateIdSet = new Set(candidates.map((c) => c.id));

    const validIds = (parsed.recommendations || [])
      .map((r) => r.bookId)
      .filter((id) => typeof id === 'string' && candidateIdSet.has(id));

    if (!validIds.length) {
      return candidates.slice(0, limit);
    }

    const uniqueChosenIds = Array.from(new Set(validIds)).slice(0, limit);

    const books = await this.prisma.book.findMany({
      where: { id: { in: uniqueChosenIds } },
      select: {
        id: true,
        title: true,
        author: true,
        category: true,
        description: true,
        coverImage: true,
        availableCopies: true,
      },
    });

    const bookMap = new Map(books.map((b) => [b.id, b]));
    const reasonMap = new Map(
      (parsed.recommendations || [])
        .filter((r) => candidateIdSet.has(r.bookId))
        .map((r) => [r.bookId, r.reason ?? 'Recommended by AI agent']),
    );

    return uniqueChosenIds
      .map((id) => bookMap.get(id))
      .filter((b): b is (typeof books)[number] => Boolean(b))
      .map((b) => ({
        ...b,
        aiReason: reasonMap.get(b.id) ?? 'Recommended by AI agent',
      }));
  }
}