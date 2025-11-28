# Figma Design Prompt for Library Management System

## Project Overview
Design a modern, intuitive, and accessible UI for a comprehensive Library Management System built with Angular and Tailwind CSS. The system serves multiple user roles (Students, Admins) with features including book browsing, borrowing management, fine payment system, and administrative controls.

---

## Design Requirements

### **1. Design System & Branding**

#### **Color Palette**
- **Primary Color**: Choose a professional, trustworthy color (suggested: deep blue #1e40af or forest green #065f46)
- **Secondary Color**: Complementary accent color for CTAs and highlights
- **Neutral Colors**: 
  - Light backgrounds: #f9fafb, #f3f4f6
  - Text colors: #111827 (primary), #6b7280 (secondary), #9ca3af (tertiary)
  - Borders: #e5e7eb
- **Status Colors**:
  - Success: #10b981 (for confirmations, available books)
  - Warning: #f59e0b (for overdue books, pending actions)
  - Error: #ef4444 (for errors, unavailable books)
  - Info: #3b82f6 (for notifications, information)

#### **Typography**
- **Heading Font**: Modern, clean sans-serif (e.g., Inter, Poppins, or system font stack)
- **Body Font**: Highly readable sans-serif (Inter, system-ui)
- **Font Sizes**: 
  - H1: 32-36px (page titles)
  - H2: 24-28px (section headers)
  - H3: 20px (subsection headers)
  - Body: 16px (default text)
  - Small: 14px (labels, captions)
  - XS: 12px (helper text, timestamps)

#### **Spacing & Layout**
- Use consistent 8px base unit for spacing
- Container max-width: 1280px with responsive breakpoints
- Grid system: 12-column responsive grid
- Card padding: 16-24px
- Section spacing: 32-48px between major sections

#### **Components Style**
- **Border Radius**: 8px for cards, 6px for buttons, 4px for inputs
- **Shadows**: Subtle shadows (0 1px 3px rgba(0,0,0,0.1)) for cards, elevated for modals
- **Buttons**: 
  - Primary: Solid background, white text, 40px height
  - Secondary: Outlined border, primary text color, 40px height
  - Ghost: Transparent, text only, hover background
- **Inputs**: 40px height, clear focus states, helpful error messages

---

## **2. Key Pages & Components**

### **A. Authentication Pages**

#### **Login Page**
- Clean, centered layout
- Library-themed background or subtle illustration
- Login form with:
  - Email/Username input
  - Password input with show/hide toggle
  - "Remember me" checkbox
  - "Forgot password?" link
  - Primary "Sign In" button
  - Error message display area
- Responsive design for mobile and desktop

#### **Registration Page** (if applicable)
- Multi-step or single-page form
- User information fields
- Role selection (if multiple roles)
- Terms and conditions checkbox
- Clear CTA button

---

### **B. Student Dashboard & Pages**

#### **1. Dashboard/Home Page**
- **Header**: 
  - Logo/branding on left
  - Search bar (prominent, full-width on mobile)
  - User profile menu (avatar dropdown) on right
  - Navigation menu (responsive hamburger on mobile)
- **Hero Section**:
  - Welcome message with user's name
  - Quick stats cards:
    - Books currently borrowed
    - Pending fines (if any) with warning indicator
    - Available books count
  - Quick actions: "Browse Books", "My Borrows"
- **Recent Activity**:
  - Recently borrowed books carousel/cards
  - Recently returned books
  - Upcoming due dates with countdown
- **Featured Books**:
  - Popular/new arrivals section
  - Book cards in grid layout (3-4 columns on desktop, 2 on tablet, 1 on mobile)

#### **2. Book Browsing/Discovery Page**
- **Filters Sidebar** (collapsible on mobile):
  - Search by title, author, ISBN
  - Category/genre filter (checkboxes or multi-select)
  - Availability filter (All, Available, Unavailable)
  - Sort options (Title A-Z, Author, Date Added, Popularity)
- **Book Grid View**:
  - Book cards displaying:
    - Cover image (aspect ratio 3:4 or 2:3, placeholder if missing)
    - Title (truncated with ellipsis if long)
    - Author name
    - Availability badge (Available/Unavailable)
    - Quick action: "Borrow" button or "View Details"
    - Hover effect: slight elevation, show more details
  - Responsive grid: 4 columns (desktop), 3 (tablet), 2 (mobile), 1 (small mobile)
  - Pagination or infinite scroll
- **Empty State**: Friendly message when no books match filters
- **Loading State**: Skeleton loaders for book cards

#### **3. Book Detail Page**
- **Top Section**:
  - Large book cover image (left or top on mobile)
  - Book information (right or below on mobile):
    - Title (large, bold)
    - Author(s)
    - Publisher, Edition, ISBN
    - Publication year
    - Category/Tags
    - Availability status (prominent badge)
- **Action Section**:
  - "Borrow" button (primary, large) - opens duration selection dialog
  - If unavailable: Show next available date or "Request" option
- **Details Section**:
  - Description/synopsis
  - Additional metadata
  - Borrowing history (if available to user)
- **Related Books**: Suggestions at bottom

#### **4. Borrow Duration Selection Dialog/Modal**
- **Modal Design**:
  - Centered overlay with backdrop blur
  - Modal header: "Select Borrowing Duration"
  - Book preview card (thumbnail, title, author)
- **Duration Options** (large, tappable cards):
  - **3 Days** - Short-term borrowing
  - **5 Days** - Medium-term borrowing
  - **1 Week** - Standard borrowing
  - **2 Weeks** - Extended borrowing
  - Each card shows:
    - Duration label
    - Due date preview ("Due: [Date]")
    - Icon or visual indicator
    - Hover/selected state (highlighted border, background tint)
- **Fine Information Section**:
  - Clear note: "Fine Policy: ₹[amount] per day if overdue"
  - Small, readable text
- **Actions**:
  - "Cancel" (secondary button)
  - "Confirm Borrow" (primary button)
  - Confirmation message after successful borrow

#### **5. My Borrows Page**
- **Page Header**:
  - Title: "My Borrows"
  - Tabs or filters: "Active", "Returned", "All"
- **Active Borrows Section**:
  - Book cards with:
    - Cover image (small thumbnail)
    - Title and author
    - Borrowed date
    - Due date (prominent, with visual indicator if approaching/overdue)
    - Days remaining countdown (color-coded: green >3 days, yellow 1-3 days, red overdue)
    - Status badge (On Time, Due Soon, Overdue)
  - **Actions per book**:
    - "Return Book" button (enabled only if no fines)
    - "View Details" link
    - If overdue: "Pay Fine" button (warning style)
- **Fine Notification Banner** (if applicable):
  - Prominent alert at top if fines are pending
  - Shows total fine amount
  - "Pay All Fines" CTA button
- **Returned Books Section** (collapsed by default):
  - Historical list of returned books
  - Return date, condition notes

#### **6. Fine Payment Page/Modal**
- **Fine Details**:
  - List of fines:
    - Book title and cover
    - Overdue days
    - Fine amount (₹XX.XX)
    - Calculation breakdown
  - Total amount due (large, prominent)
- **Payment Form**:
  - Payment method selection (if applicable)
  - Transaction reference input (optional)
  - Notes/remarks textarea (optional)
  - Terms confirmation checkbox
- **Actions**:
  - "Cancel" button
  - "Pay Now" button (primary, large)
- **Confirmation State**:
  - Success message
  - Payment receipt/details
  - "Return to My Borrows" button

---

### **C. Admin Dashboard & Pages**

#### **1. Admin Dashboard**
- **Header**: Same as student, with admin badge/indicator
- **Statistics Cards** (4-6 cards in grid):
  - Total books
  - Active borrows
  - Overdue books (with warning color)
  - Total fines collected
  - Registered users
  - Available books
- **Quick Actions Panel**:
  - "Add New Book" (primary CTA)
  - "Manage Users"
  - "View Reports"
  - "Fine Configuration"
- **Activity Feed/Recent Actions**:
  - Recent borrows, returns, additions
  - Overdue alerts
- **Charts/Graphs** (optional):
  - Borrowing trends
  - Popular books
  - Fine collection statistics

#### **2. Book Management Page**
- **Page Header**:
  - Title: "Book Management"
  - "Add New Book" button (primary, prominent)
- **Search & Filters**:
  - Search bar
  - Filter by category, availability, status
- **Books Table/Grid**:
  - Table view option with columns:
    - Cover (thumbnail)
    - Title
    - Author
    - ISBN
    - Category
    - Available Copies / Total Copies
    - Status
    - Actions (Edit, Delete, View Details)
  - Or grid view (similar to browsing page)
  - Bulk actions (if applicable): Select multiple, bulk delete/update
- **Empty State**: "No books yet. Add your first book!"

#### **3. Add/Edit Book Form**
- **Form Layout**:
  - Two-column layout on desktop (form fields left, cover upload right)
  - Single column on mobile
- **Form Fields**:
  - Title* (text input, required)
  - Author(s)* (text input or multi-select)
  - ISBN (text input)
  - Publisher (text input)
  - Edition (text input)
  - Publication Year (number input or date picker)
  - Category/Genre (dropdown or multi-select)
  - Description (textarea, rich text optional)
  - Total Copies* (number input)
  - Cover Image (image upload with preview, drag-and-drop zone)
- **Form Actions**:
  - "Cancel" (secondary)
  - "Save Draft" (optional)
  - "Add Book" / "Update Book" (primary)
- **Validation States**:
  - Clear error messages below each field
  - Success confirmation after save

#### **4. User Management Page** (if applicable)
- User table with:
  - Avatar
  - Name
  - Email
  - Role
  - Join date
  - Status (Active, Suspended)
  - Actions (Edit, Suspend, Delete)
- Search and filter functionality

#### **5. Fine Configuration Page**
- **Current Configuration Card**:
  - Current daily fine rate (large, prominent)
  - Effective since date
  - "Edit" button
- **Update Fine Rate Form**:
  - Input field for new rate (₹ per day)
  - Preview: "New rate will be ₹XX per day"
  - Reason/notes field (optional)
  - "Update Fine Rate" button
- **Fine History Table** (optional):
  - Historical rate changes
  - Dates, rates, changed by

#### **6. Reports/Analytics Page** (if applicable)
- Charts and graphs:
  - Borrowing statistics
  - Popular books
  - Fine collection over time
  - User activity
- Export options (PDF, CSV)
- Date range filters

---

## **3. Reusable Components**

### **Navigation**
- **Sidebar Navigation** (desktop admin):
  - Collapsible sidebar with icons and labels
  - Active state highlighting
  - User profile section at bottom
- **Top Navigation Bar**:
  - Logo
  - Search (always accessible)
  - User menu dropdown:
    - Profile
    - Settings
    - Logout
  - Notifications bell icon (badge if unread)

### **Cards**
- **Book Card**: Standardized component used across pages
- **Stat Card**: For dashboard statistics
- **Activity Card**: For recent activity feeds

### **Forms**
- **Input Fields**: Consistent styling, validation states
- **Select Dropdowns**: Accessible, searchable where appropriate
- **Date Pickers**: Clear, easy-to-use date selection
- **File Upload**: Drag-and-drop with preview

### **Feedback Components**
- **Toast Notifications**: Success, error, warning, info
- **Loading Spinners**: Full-page and inline
- **Empty States**: Friendly illustrations and messages
- **Error Pages**: 404, 500, unauthorized

### **Modals/Dialogs**
- Consistent overlay and animation
- Clear header, body, footer structure
- Close button (X) in top-right
- Mobile-friendly (full-screen or bottom sheet on mobile)

---

## **4. Responsive Design**

### **Breakpoints**
- **Mobile**: 320px - 640px (single column, stacked layout)
- **Tablet**: 641px - 1024px (2 columns where applicable)
- **Desktop**: 1025px+ (full multi-column layout)

### **Mobile-First Considerations**
- Touch-friendly buttons (min 44x44px)
- Bottom navigation for mobile (optional)
- Swipe gestures for cards/lists
- Collapsible sections
- Mobile-optimized modals (bottom sheet style)

---

## **5. Accessibility Requirements**

- **WCAG 2.1 AA Compliance**
- Color contrast ratios meet standards
- Keyboard navigation support
- Screen reader friendly (ARIA labels)
- Focus indicators clearly visible
- Alt text for all images
- Form labels properly associated

---

## **6. Micro-interactions & Animations**

- **Subtle Animations**:
  - Page transitions (fade, slide)
  - Button hover states
  - Card hover elevation
  - Modal enter/exit animations
  - Loading skeleton animations
- **Feedback**:
  - Button press states
  - Form validation real-time feedback
  - Success checkmarks
  - Error shake animations

---

## **7. Design Deliverables**

Please provide:
1. **Design System File**: Colors, typography, spacing, components library
2. **Desktop Mockups**: All major pages (1280px width)
3. **Tablet Mockups**: Key pages (768px width)
4. **Mobile Mockups**: All pages (375px and 414px widths)
5. **Component Library**: Reusable components in Figma with variants
6. **Interactive Prototype**: Clickable prototype showing user flows
7. **Design Specifications**: Spacing, colors, font sizes for developers

---

## **8. Design Inspiration & Style**

- **Modern & Clean**: Minimal, uncluttered interfaces
- **Professional**: Trustworthy and institutional feel
- **User-Friendly**: Intuitive navigation, clear hierarchies
- **Consistent**: Unified design language across all pages
- **Visually Appealing**: Use of whitespace, good typography, subtle gradients or shadows

---

## **9. Specific User Flows to Design**

1. **Student Flow**: Login → Browse Books → Select Book → Choose Duration → Confirm Borrow → View My Borrows → Return Book
2. **Overdue Flow**: Student sees overdue book → Pay Fine → Return Book
3. **Admin Flow**: Login → Dashboard → Add New Book → Fill Form → Upload Cover → Save → View in Book List
4. **Fine Management Flow**: Admin → Fine Configuration → Update Rate → Confirm Change

---

## **10. Notes for Designer**

- The system uses **Tailwind CSS**, so consider Tailwind's utility classes when designing
- Ensure designs are pixel-perfect and exportable to code
- Provide dark mode designs if possible (optional but recommended)
- Consider print-friendly views for reports/receipts
- Design with scalability in mind (handling 100s or 1000s of books)
- Include empty states, loading states, and error states for all major components

---

**Thank you for designing a beautiful, functional UI for our Library Management System!**


