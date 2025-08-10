
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

const MAX_IMAGES = 5;

export default function PartForm({ initialData, onSuccess, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    part_number: '',
    description: '',
    category: '',
    brand: '',
    price: 0,
    original_price: 0,
    discount_percentage: 0,
    is_on_sale: false,
    sale_start_date: '',
    sale_end_date: '',
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

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await supabaseHelpers.categories.getActive();
        setCategories(data);
      } catch (error) {
        console.error("Error loading categories:", error);
        toast({
          title: "Error",
          description: "Could not load categories.",
          variant: "destructive",
        });
      }
      setLoadingCategories(false);
    };
    loadCategories();
  }, [toast]);

  // Auto-calculate price when discount changes
  useEffect(() => {
    if (formData.is_on_sale && formData.original_price > 0 && formData.discount_percentage > 0) {
      const discountedPrice = formData.original_price * (1 - formData.discount_percentage / 100);
      setFormData(prev => ({ ...prev, price: discountedPrice }));
    } else if (!formData.is_on_sale && formData.original_price > 0) {
      setFormData(prev => ({ ...prev, price: formData.original_price }));
    }
  }, [formData.is_on_sale, formData.original_price, formData.discount_percentage]);

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
          <Select name="category" onValueChange={(v) => handleSelectChange('category', v)} value={formData.category} disabled={loadingCategories}>
            <SelectTrigger>
              <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name.replace(/_/g, ' ')}
                </SelectItem>
              ))}
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

      {/* Pricing Section */}
      <div className="col-span-full border-t pt-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">💰 Pricing Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="original_price">Original Price (AED) *</Label>
            <Input
              id="original_price"
              name="original_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.original_price}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Final Price (AED)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              disabled={formData.is_on_sale}
              className={formData.is_on_sale ? "bg-slate-100" : ""}
            />
            {formData.is_on_sale && (
              <p className="text-sm text-slate-500">
                ⚡ Auto-calculated based on discount
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sale Configuration */}
      <div className="col-span-full">
        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="is_on_sale"
            checked={formData.is_on_sale}
            onCheckedChange={(checked) => handleSelectChange('is_on_sale', checked)}
          />
          <Label htmlFor="is_on_sale" className="text-base font-medium">
            🏷️ Put this item on sale
          </Label>
        </div>

        {formData.is_on_sale && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-red-50 rounded-lg border border-red-200">
            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Discount Percentage</Label>
              <Input
                id="discount_percentage"
                name="discount_percentage"
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.discount_percentage}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_start_date">Sale Start Date (Optional)</Label>
              <Input
                id="sale_start_date"
                name="sale_start_date"
                type="datetime-local"
                value={formData.sale_start_date}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_end_date">Sale End Date (Optional)</Label>
              <Input
                id="sale_end_date"
                name="sale_end_date"
                type="datetime-local"
                value={formData.sale_end_date}
                onChange={handleChange}
              />
            </div>

            {formData.original_price > 0 && formData.discount_percentage > 0 && (
              <div className="col-span-full p-4 bg-white rounded-lg border border-red-300">
                <p className="text-sm font-medium text-slate-700 mb-2">🎯 Sale Preview:</p>
                <div className="flex items-center gap-4">
                  <span className="text-lg line-through text-slate-500">
                    AED {Number(formData.original_price).toFixed(2)}
                  </span>
                  <span className="text-xl font-bold text-red-600">
                    AED {(formData.original_price * (1 - formData.discount_percentage / 100)).toFixed(2)}
                  </span>
                  <Badge className="bg-red-500 text-white">
                    -{formData.discount_percentage}% OFF
                  </Badge>
                </div>
                <p className="text-sm text-green-600 mt-2 font-medium">
                  💰 Customer saves: AED {(formData.original_price * (formData.discount_percentage / 100)).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}
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
