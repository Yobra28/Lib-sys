# AI Book Recommender - How It Works & Setup Guide

## 🧠 How the AI Recommender Works

The AI recommender is a **real AI agent** that uses a Large Language Model (LLM) to intelligently select books for users based on their reading history. Unlike rule-based systems, it **learns patterns** from user behavior and makes recommendations accordingly.

### Workflow Overview

```
1. User calls GET /books/ai-agent/me
   ↓
2. Backend fetches:
   - Current user profile (name, email, role)
   - User's borrow history (up to 50 most recent books)
   - Candidate pool (up to 200 available books not yet borrowed)
   ↓
3. All this data is sent to OpenAI's LLM with a prompt:
   "Based on this user's history, pick the best books from the candidate list"
   ↓
4. LLM analyzes patterns (topics, genres, authors, difficulty, style) and returns:
   - Selected book IDs (in order of preference)
   - Reasoning for each recommendation
   ↓
5. Backend fetches full book details and returns them with AI explanations
```

### Key Features

- **No hard-coded rules**: The LLM decides which books to recommend, not your code
- **Pattern recognition**: Learns from user's past borrows (topics, genres, authors, reading level)
- **Intelligent reasoning**: Each recommendation includes an explanation
- **Safe constraints**: Only suggests books that are:
  - Available (availableCopies > 0)
  - Not already borrowed by the user
  - From the candidate pool

### What Makes It "Real AI"

1. **Learning from data**: The model infers preferences from reading history
2. **Contextual understanding**: Understands book descriptions, categories, and relationships
3. **Adaptive recommendations**: Different users get different suggestions based on their unique history
4. **Natural language reasoning**: Provides human-readable explanations for each recommendation

---

## ⚙️ Configuration Setup

### Step 1: Get an OpenAI API Key

1. Go to [https://platform.openai.com/](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API Keys** section: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. Click **"Create new secret key"**
5. Copy the key (it starts with `sk-...`)
   - ⚠️ **Save it immediately** - you won't be able to see it again!

### Step 2: Create/Update `.env` File

In your `backend/` directory, create or update the `.env` file:

```env
# Required: Your OpenAI API Key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Optional: Which OpenAI model to use (defaults to gpt-4.1-mini)
# Options: gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo
OPENAI_MODEL=gpt-4o-mini

# Your existing environment variables (keep these)
DATABASE_URL=postgresql://...
JWT_SECRET=...
# ... other vars
```

### Step 3: Restart Your Backend

After adding the environment variables:

```bash
# Stop the current backend (Ctrl+C)
# Then restart it
cd backend
npm run start:dev
```

You should see a log message confirming the AI agent is initialized (or a warning if the key is missing).

---

## 📡 API Endpoint

### Get AI Recommendations for Current User

**Endpoint:** `GET /books/ai-agent/me`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `limit` (optional): Number of recommendations (default: 10, max: 20)

**Response:**
```json
[
  {
    "id": "book-uuid",
    "title": "Book Title",
    "author": "Author Name",
    "category": "Fiction",
    "description": "Book description...",
    "coverImage": "https://...",
    "availableCopies": 5,
    "aiReason": "Recommended because you've shown interest in similar themes..."
  },
  ...
]
```

**Example Request (from frontend):**
```typescript
this.bookService.getAiAgentRecommendationsForMe(10).subscribe({
  next: (books) => {
    books.forEach(book => {
      console.log(`${book.title}: ${book.aiReason}`);
    });
  }
});
```

---

## 🔧 Configuration Options

### Model Selection

Different OpenAI models have different capabilities and costs:

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| `gpt-4o-mini` | Fast | Good | Low | **Recommended** - Good balance |
| `gpt-4o` | Medium | Excellent | Medium | Higher quality needed |
| `gpt-4-turbo` | Slower | Excellent | High | Maximum quality |
| `gpt-3.5-turbo` | Fast | Basic | Very Low | Budget option |

**Recommendation:** Start with `gpt-4o-mini` for best balance of cost and quality.

### Adjusting Recommendation Limits

In `backend/src/ai/ai-agent.service.ts`, you can modify:

- **History size** (line 81): How many past borrows to consider (default: 50)
- **Candidate pool** (line 102): How many books to send to LLM (default: 200)
- **Default limit** (line 43): Default number of recommendations (default: 10)

---

## 🧪 Testing the Recommender

### 1. Test via API (using Postman/curl)

```bash
# First, get a JWT token by logging in
# Then use it in the Authorization header:

curl -X GET "http://localhost:3000/books/ai-agent/me?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Test from Frontend

Add a button in your Angular component:

```typescript
loadAiRecommendations() {
  this.bookService.getAiAgentRecommendationsForMe(10).subscribe({
    next: (books) => {
      console.log('AI Recommendations:', books);
      // Display in UI
    },
    error: (err) => {
      console.error('AI recommendations failed:', err);
    }
  });
}
```

### 3. Check Backend Logs

When the AI agent runs, you'll see logs like:
```
[AiAgentService] Fetching recommendations for user: user-id
[AiAgentService] Found 15 borrows in history, 150 candidates
[AiAgentService] LLM returned 10 recommendations
```

---

## 🐛 Troubleshooting

### Error: "AI agent is not configured"

**Solution:** Make sure `OPENAI_API_KEY` is set in your `.env` file and restart the backend.

### Error: "Failed to get AI recommendations"

**Possible causes:**
1. **Invalid API key**: Check that your key is correct and active
2. **API quota exceeded**: Check your OpenAI account billing/usage
3. **Network issues**: Check your internet connection
4. **Model not available**: Try a different model in `OPENAI_MODEL`

### Recommendations seem random or poor quality

**Solutions:**
1. **More user history**: Users with more borrows get better recommendations
2. **Better book descriptions**: Ensure books have detailed descriptions in the database
3. **Try a better model**: Switch from `gpt-4o-mini` to `gpt-4o` for better quality
4. **Adjust temperature**: Lower temperature (0.3-0.5) = more consistent, higher (0.7-1.0) = more creative

### API costs are too high

**Solutions:**
1. Use `gpt-4o-mini` instead of `gpt-4o` or `gpt-4-turbo`
2. Reduce candidate pool size (line 102 in `ai-agent.service.ts`)
3. Reduce default limit (line 43)
4. Cache recommendations for a period (not implemented yet)

---

## 💡 Best Practices

1. **Start with defaults**: The current settings work well for most cases
2. **Monitor API usage**: Check your OpenAI dashboard regularly
3. **User feedback**: Consider adding a "thumbs up/down" feature to improve recommendations
4. **Caching**: For production, consider caching recommendations per user for 1-24 hours
5. **Fallback**: The system gracefully falls back to simple candidate selection if LLM fails

---

## 📊 How It Differs from Rule-Based Recommendations

| Feature | Rule-Based (Old) | AI Agent (New) |
|---------|------------------|----------------|
| **Selection logic** | Hard-coded filters (category, author) | LLM learns from patterns |
| **Personalization** | Limited (same category) | Deep (understands preferences) |
| **Reasoning** | None | Explains why each book is recommended |
| **Adaptability** | Static rules | Adapts to each user's unique history |
| **Complex patterns** | Can't detect | Can detect themes, difficulty, style |

---

## 🚀 Next Steps

1. ✅ Set up your OpenAI API key
2. ✅ Test the endpoint
3. ✅ Integrate into your frontend UI
4. (Optional) Add caching for better performance
5. (Optional) Add user feedback to improve recommendations over time

---

## 📝 Example: What the LLM Sees

When a user requests recommendations, the LLM receives JSON like this:

```json
{
  "user": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "STUDENT"
  },
  "history": [
    {
      "id": "book-1",
      "title": "Introduction to Machine Learning",
      "author": "John Smith",
      "category": "Computer Science",
      "description": "A comprehensive guide to ML algorithms..."
    },
    // ... more books
  ],
  "candidates": [
    {
      "id": "book-100",
      "title": "Deep Learning Fundamentals",
      "author": "Jane Doe",
      "category": "Computer Science",
      "description": "Advanced deep learning techniques..."
    },
    // ... up to 200 candidates
  ],
  "limit": 10
}
```

The LLM analyzes this and returns:
```json
{
  "recommendations": [
    {
      "bookId": "book-100",
      "reason": "You've been exploring machine learning topics, and this book builds on those concepts with advanced deep learning techniques."
    },
    // ... more recommendations
  ]
}
```

---

**Need help?** Check the backend logs or review the `AiAgentService` code in `backend/src/ai/ai-agent.service.ts`.

