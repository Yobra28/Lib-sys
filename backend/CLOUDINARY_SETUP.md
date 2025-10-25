# Cloudinary Setup

This project uses Cloudinary for image storage and management. To set up Cloudinary:

## 1. Create a Cloudinary Account
- Go to [cloudinary.com](https://cloudinary.com)
- Sign up for a free account
- Get your credentials from the dashboard

## 2. Environment Variables
Add these environment variables to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 3. Features
- **Automatic Image Optimization**: Images are automatically optimized for web delivery
- **Responsive Images**: Cloudinary provides responsive image URLs
- **Transformations**: Images are resized to 300x400 with auto-crop and quality optimization
- **Secure URLs**: All images are served over HTTPS

## 4. Usage
- Admins can upload book cover images through the admin interface
- Images are stored in the `library/book-covers` folder on Cloudinary
- Students see actual book covers with fallback to default icon when no image is available

## 5. Image Specifications
- **Supported Formats**: JPEG, PNG, WebP
- **Maximum Size**: 5MB
- **Output Size**: 300x400 pixels (auto-cropped)
- **Quality**: Auto-optimized for web delivery
