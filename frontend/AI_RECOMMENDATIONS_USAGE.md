# How to Use AI Recommendations in Frontend

## ✅ Already Implemented

The AI recommendations are **already integrated** into your student dashboard! When you visit `/student/dashboard`, you'll see an "AI Recommendations for You" section.

## 📝 How It Works

### 1. Service Method (Already Available)

The `BookService` already has the method:

```typescript
// In: frontend/src/app/core/services/book.service.ts
getAiAgentRecommendationsForMe(limit?: number): Observable<AiRecommendedBook[]>
```

### 2. Usage Example

Here's how to use it in any component:

```typescript
import { BookService, AiRecommendedBook } from '../../core/services/book.service';

export class MyComponent {
  aiBooks: AiRecommendedBook[] = [];
  loading = false;

  constructor(private bookService: BookService) {}

  loadRecommendations() {
    this.loading = true;
    this.bookService.getAiAgentRecommendationsForMe(10).subscribe({
      next: (books) => {
        this.aiBooks = books;
        this.loading = false;
        
        // Each book has an 'aiReason' property with the AI's explanation
        books.forEach(book => {
          console.log(`${book.title}: ${book.aiReason}`);
        });
      },
      error: (err) => {
        console.error('Failed to load AI recommendations:', err);
        this.loading = false;
      }
    });
  }
}
```

### 3. Response Structure

Each book in the response includes:

```typescript
interface AiRecommendedBook {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  coverImage: string | null;
  availableCopies: number;
  aiReason?: string;  // ← AI's explanation for why this book was recommended
}
```

## 🎨 Where It's Currently Used

### Student Dashboard (`/student/dashboard`)
- Shows 6 AI recommendations in a dedicated section
- Displays the AI's reasoning for each book
- Automatically loads when the dashboard opens
- Has a "Refresh" button to get new recommendations

### Recommendations Dialog
- When you borrow a book, the recommendations dialog now shows AI reasons if available
- The AI explanation appears in a highlighted box

## 🔧 Adding to Other Components

### Example: Add to Student Books Page

```typescript
// In student-books.component.ts
import { BookService, AiRecommendedBook } from '../../../../core/services/book.service';

export class StudentBooksComponent {
  aiRecommendations: AiRecommendedBook[] = [];

  constructor(
    private bookService: BookService,
    // ... other services
  ) {}

  ngOnInit() {
    // ... existing code
    
    // Load AI recommendations
    this.loadAiRecommendations();
  }

  loadAiRecommendations() {
    this.bookService.getAiAgentRecommendationsForMe(8).subscribe({
      next: (books) => {
        this.aiRecommendations = books;
      },
      error: (err) => {
        // Silently fail - AI recommendations are optional
        console.error('AI recommendations failed:', err);
      }
    });
  }
}
```

Then in the template:

```html
<!-- AI Recommendations Section -->
<div *ngIf="aiRecommendations.length > 0" class="mt-6">
  <h3 class="text-xl font-bold mb-4">🤖 AI Recommendations</h3>
  <div class="grid grid-cols-4 gap-4">
    <div *ngFor="let book of aiRecommendations" class="book-card">
      <h4>{{ book.title }}</h4>
      <p class="text-sm">{{ book.author }}</p>
      <p *ngIf="book.aiReason" class="text-xs italic text-gray-600 mt-2">
        {{ book.aiReason }}
      </p>
    </div>
  </div>
</div>
```

## 🔑 Important Notes

1. **Authentication Required**: The endpoint requires a valid JWT token. The `BookService` automatically includes it via your HTTP interceptor.

2. **Error Handling**: If the AI service is not configured or fails, the request will return an error. Always handle errors gracefully.

3. **Optional Feature**: AI recommendations are optional - your app should work fine even if the AI service is down.

4. **Rate Limiting**: Be mindful of API costs. Don't call this endpoint too frequently (e.g., on every keystroke).

## 🧪 Testing

1. Make sure your backend has `OPENAI_API_KEY` set in `.env`
2. Log in as a student
3. Visit `/student/dashboard`
4. You should see the "AI Recommendations for You" section
5. If you've borrowed books before, you'll see personalized recommendations with AI explanations

## 📊 API Endpoint Details

- **URL**: `GET /api/books/ai-agent/me`
- **Auth**: Required (Bearer token)
- **Query Params**: 
  - `limit` (optional): Number of recommendations (default: 10, max: 20)
- **Response**: Array of `AiRecommendedBook` objects

## 🎯 Next Steps

You can:
1. ✅ Use it in the dashboard (already done)
2. Add a dedicated "AI Recommendations" page
3. Show AI recommendations in the book detail view
4. Add a button to refresh recommendations
5. Cache recommendations to reduce API calls

---

**Need help?** Check `backend/AI_RECOMMENDER_SETUP.md` for backend configuration.

