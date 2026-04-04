/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import { BooksService } from '../books/books.service';

type LlmRecommendation = {
  bookId: string;
  reason?: string;
};

type LlmResponseShape = {
  recommendations: LlmRecommendation[];
};

export type AiRecommendedBookRow = {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string | null;
  coverImage: string | null;
  availableCopies: number;
  aiReason: string;
};

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private readonly client: GoogleGenAI | null;
  private readonly modelName: string;
  private readonly fallbackReason =
    'Recommended from your library activity (AI unavailable).';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly booksService: BooksService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set – AI agent disabled; using rule-based recommendations.');
      this.client = null;
      this.modelName = '';
    } else {
      this.client = new GoogleGenAI({ apiKey });

      this.modelName =
        this.configService.get<string>('GEMINI_MODEL') ??
        'gemini-1.5-flash';
    }
  }

  /**
   * Rule-based fallback: same author/category as last borrow, then popular in category, then global popular.
   */
  private async ruleBasedRecommendations(
    userId: string,
    limit: number,
  ): Promise<AiRecommendedBookRow[]> {
    const recentBorrow = await this.prisma.borrow.findFirst({
      where: { userId },
      orderBy: { borrowDate: 'desc' },
      include: { book: { select: { id: true, category: true } } },
    });

    const rows: Array<{
      id: string;
      title: string;
      author: string;
      category: string;
      description?: string | null;
      coverImage?: string | null;
      availableCopies: number;
    }> = [];

    if (recentBorrow?.book?.id) {
      const fromBorrow = await this.booksService.recommendForBorrow({
        studentId: userId,
        borrowedBookId: recentBorrow.book.id,
        limit,
      });
      rows.push(...fromBorrow);
    }

    if (rows.length < limit && recentBorrow?.book?.category) {
      try {
        const more = await this.booksService.recommend({
          category: recentBorrow.book.category,
          studentId: userId,
          limit,
        });
        const seen = new Set(rows.map((r) => r.id));
        for (const b of more) {
          if (rows.length >= limit) break;
          if (!seen.has(b.id)) {
            rows.push(b);
            seen.add(b.id);
          }
        }
      } catch {
        // ignore — category may be invalid in edge cases
      }
    }

    if (rows.length === 0) {
      const popular = await this.prisma.book.findMany({
        where: { availableCopies: { gt: 0 } },
        select: {
          id: true,
          title: true,
          author: true,
          category: true,
          description: true,
          coverImage: true,
          availableCopies: true,
          _count: { select: { borrows: true } },
        },
        orderBy: [{ borrows: { _count: 'desc' } }, { createdAt: 'desc' }],
        take: limit,
      });
      rows.push(...popular);
    }

    const sliced = rows.slice(0, limit);
    const ids = sliced.map((r) => r.id);
    const withDesc =
      ids.length > 0
        ? await this.prisma.book.findMany({
            where: { id: { in: ids } },
            select: {
              id: true,
              title: true,
              author: true,
              category: true,
              description: true,
              coverImage: true,
              availableCopies: true,
            },
          })
        : [];
    const byId = new Map(withDesc.map((b) => [b.id, b]));

    return sliced.map((r) => {
      const full = byId.get(r.id) ?? r;
      return {
        id: full.id,
        title: full.title,
        author: full.author,
        category: full.category,
        description: full.description ?? null,
        coverImage: full.coverImage ?? null,
        availableCopies: full.availableCopies,
        aiReason: this.fallbackReason,
      };
    });
  }

  async recommendForUser(userId: string, limit = 10): Promise<AiRecommendedBookRow[]> {
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

    if (!this.client) {
      return this.ruleBasedRecommendations(userId, limit);
    }

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
      const response = await this.client.models.generateContent({
        model: this.modelName || 'gemini-1.5-flash',
        contents: `${systemPrompt}\n\n${userMessage}`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      content = response.text ?? '{"recommendations":[]}';
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Gemini call failed (quota, network, or model error): ${msg}. Using rule-based recommendations.`,
      );
      return this.ruleBasedRecommendations(userId, limit);
    }

    let parsed: LlmResponseShape = { recommendations: [] };

    try {
      parsed = JSON.parse(content);
    } catch {
      this.logger.warn('Invalid JSON from LLM. Using rule-based fallback.');
    }

    const candidateIdSet = new Set(candidates.map((c) => c.id));

    const validIds = (parsed.recommendations || [])
      .map((r) => r.bookId)
      .filter((id) => typeof id === 'string' && candidateIdSet.has(id));

    if (!validIds.length) {
      return this.ruleBasedRecommendations(userId, limit);
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
