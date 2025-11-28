/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
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
  private readonly client: OpenAI | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set – AI agent will be disabled.');
      this.client = null;
    } else {
      this.client = new OpenAI({ apiKey });
    }
  }

  /**
   * Main entrypoint: ask the LLM to pick books for a given user.
   * This method deliberately avoids hard-coded rules and lets the model choose,
   * beyond basic sanity constraints (availability, not already borrowed).
   */
  async recommendForUser(userId: string, limit = 10) {
    if (!this.client) {
      throw new InternalServerErrorException(
        'AI agent is not configured. Please set OPENAI_API_KEY on the backend.',
      );
    }

    // 1) Fetch user and history
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
      throw new InternalServerErrorException('User not found for AI agent.');
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

    // 2) Candidate pool (keep bounded so prompt size is safe)
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    if (candidates.length === 0) {
      return [];
    }

    // 3) Build LLM prompt
    const historyForPrompt = borrows.map((b) => {
      const book = b.book;
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        category: book.category,
        description: book.description ?? '',
      };
    });

    const promptPayload = {
      user,
      history: historyForPrompt,
      candidates,
      limit,
    };

    const systemPrompt =
      'You are an intelligent library recommendation agent. ' +
      'Your task is to choose books from a candidate list for a given user, ' +
      'based on patterns in their reading history and general knowledge about books. ' +
      'Do not use hard-coded rules like filtering by a single category only; ' +
      'instead infer preferences such as favorite topics, difficulty level, and style. ' +
      'Return STRICT JSON only, no explanations outside JSON, in the exact format: ' +
      '{"recommendations":[{"bookId":"<id>","reason":"<short reason>"}]}. ' +
      'The bookId MUST be one of the candidate ids. Include at most `limit` books.';

    const userMessage = `Here is the input as JSON. Select the best books for this user and respond with the specified JSON schema only:\n${JSON.stringify(
      promptPayload,
    )}`;

    let raw: any;
    try {
      raw = await this.client.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4.1-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
      });
    } catch (error) {
      this.logger.error('Error calling OpenAI for recommendations', error as any);
      throw new InternalServerErrorException('Failed to get AI recommendations');
    }

    const content =
      raw.choices?.[0]?.message?.content ||
      '{"recommendations":[]}';

    let parsed: LlmResponseShape;
    try {
      parsed = JSON.parse(content) as LlmResponseShape;
    } catch (e) {
      this.logger.error('Failed to parse LLM JSON response', e as any);
      parsed = { recommendations: [] };
    }

    const chosenIds = (parsed.recommendations || [])
      .map((r) => r.bookId)
      .filter((id) => typeof id === 'string');

    if (!chosenIds.length) {
      // Fallback: just return some candidates (still no hand-crafted ranking rules here,
      // just a simple truncation of candidate list).
      return candidates.slice(0, limit);
    }

    // Keep LLM-chosen order
    const uniqueChosenIds = Array.from(new Set(chosenIds)).slice(0, limit);

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
        .filter((r) => typeof r.bookId === 'string')
        .map((r) => [r.bookId, r.reason ?? 'Recommended by AI agent']),
    );

    const ordered = uniqueChosenIds
      .map((id) => bookMap.get(id))
      .filter(
        (b): b is (typeof books)[number] =>
          Boolean(b),
      )
      .map((b) => ({
        ...b,
        aiReason: reasonMap.get(b.id) ?? 'Recommended by AI agent',
      }));

    return ordered;
  }
}


