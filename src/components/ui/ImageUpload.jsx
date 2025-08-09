import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { supabaseHelpers } from '@/lib/supabase';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function ImageUpload({ 
  onImageUploaded, 
  currentImages = [], 
  maxImages = 5,
  folder = 'parts',
  accept = 'image/*',
  className = ''
}) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState(currentImages);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    try {
      const uploadResults = await supabaseHelpers.storage.uploadMultipleImages(files, folder);
      
      const newImages = uploadResults.map(result => ({
        path: result.path,
        url: supabaseHelpers.storage.getPublicUrl(result.path)
      }));

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      
      // Notify parent component
      if (onImageUploaded) {
        onImageUploaded(updatedImages);
      }

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index) => {
    const imageToRemove = images[index];
    
    try {
      // Delete from storage
      await supabaseHelpers.storage.deleteImage(imageToRemove.path);
      
      // Remove from local state
      const updatedImages = images.filter((_, i) => i !== index);
      setImages(updatedImages);
      
      // Notify parent component
      if (onImageUploaded) {
        onImageUploaded(updatedImages);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : 'Upload Images'}
        </Button>
        
        <span className="text-sm text-gray-500">
          {images.length}/{maxImages} images
        </span>
      </div>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                <img
                  src={image.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png'; // Fallback image
                  }}
                />
              </div>
              
              {/* Remove Button */}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No images uploaded yet</p>
          <p className="text-sm text-gray-400">
            Click "Upload Images" to add up to {maxImages} images
          </p>
        </div>
      )}
    </div>
  );
}
