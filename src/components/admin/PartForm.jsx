
import React, { useState, useEffect } from "react";
import { supabaseHelpers } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import ImageUpload from "@/components/ui/ImageUpload";
import { Loader2 } from "lucide-react";

const categories = ["engine", "transmission", "brakes", "suspension", "electrical", "body", "interior", "exhaust", "cooling", "fuel_system", "accessory"];
const MAX_IMAGES = 5;

export default function PartForm({ initialData, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    part_number: '',
    description: '',
    category: '',
    brand: '',
    price: 0,
    stock_quantity: 0,
    image_urls: [],
    compatibility: '',
    weight: 0,
    dimensions: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, image_urls: initialData.image_urls || [] });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (images) => {
    // Convert image objects to URLs for the form data
    const imageUrls = images.map(img => img.url);
    setFormData(prev => ({ ...prev, image_urls: imageUrls }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity, 10),
        weight: parseFloat(formData.weight),
      };

      if (initialData) {
        await supabaseHelpers.parts.update(initialData.id, dataToSubmit);
        toast({ title: "Success", description: "Part updated successfully." });
      } else {
        await supabaseHelpers.parts.create(dataToSubmit);
        toast({ title: "Success", description: "Part created successfully." });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving part:", error);
      toast({ title: "Error", description: "Could not save part.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Part Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="part_number">Part Number</Label>
          <Input id="part_number" name="part_number" value={formData.part_number} onChange={handleChange} required />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <Label>Images (up to 5)</Label>
        <ImageUpload
          onImageUploaded={handleImageUpload}
          currentImages={formData.image_urls.map(url => ({ url, path: url }))}
          maxImages={MAX_IMAGES}
          folder="parts"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" onValueChange={(v) => handleSelectChange('category', v)} value={formData.category}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" value={formData.brand} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (AED)</Label>
          <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stock Quantity</Label>
          <Input id="stock_quantity" name="stock_quantity" type="number" value={formData.stock_quantity} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            step="0.01"
            min="0"
            value={formData.weight}
            onChange={handleChange}
            placeholder="e.g., 2.5"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimensions">Dimensions</Label>
          <Input id="dimensions" name="dimensions" value={formData.dimensions} onChange={handleChange} placeholder="e.g., 12 x 8 x 2 inches" />
        </div>
      </div>



      <div className="space-y-2">
        <Label htmlFor="compatibility">Compatibility</Label>
        <Input
          id="compatibility"
          name="compatibility"
          value={formData.compatibility}
          onChange={handleChange}
          placeholder="e.g., Honda Civic 2018-2024"
        />
      </div>



      <div className="flex items-center space-x-2">
        <Switch id="is_active" name="is_active" checked={formData.is_active} onCheckedChange={(c) => handleSelectChange('is_active', c)} />
        <Label htmlFor="is_active">Part is Active for Sale</Label>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {initialData ? 'Save Changes' : 'Create Part'}
        </Button>
      </div>
    </form>
  );
}
