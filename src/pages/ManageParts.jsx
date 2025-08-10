
import React, { useState, useEffect, useCallback } from "react";
import { supabaseHelpers } from "@/lib/supabase";
import PartForm from "../components/admin/PartForm";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { formatCurrency } from "@/utils/currency";
import { getSaleStatus } from "@/utils/pricing";
import SaleBadge from "@/components/ui/SaleBadge";

export default function ManageParts() {
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const { toast } = useToast();

  const loadParts = useCallback(async () => {
    setIsLoading(true);
    try {
      const partsData = await supabaseHelpers.parts.getAll({
        sortBy: 'created_date',
        sortOrder: 'desc'
      });
      setParts(partsData);
    } catch (error) {
      console.error("Error loading parts:", error);
      toast({
        title: "Error",
        description: "Could not load parts.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadParts();
  }, [loadParts]);

  const handleEdit = (part) => {
    setEditingPart(part);
    setIsFormOpen(true);
  };

  const handleDelete = async (partId) => {
    if (window.confirm("Are you sure you want to delete this part?")) {
      try {
        await supabaseHelpers.parts.delete(partId);
        toast({ title: "Success", description: "Part deleted successfully." });
        loadParts();
      } catch (error) {
        console.error("Error deleting part:", error);
        toast({
          title: "Error",
          description: "Could not delete part.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingPart(null);
    loadParts();
  };
  
  return (
    <ProtectedRoute requireAdmin={true}>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900">Manage Parts</h1>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" /> Add New Part
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{editingPart ? "Edit Part" : "Add New Part"}</DialogTitle>
                  <DialogDescription>
                    {editingPart
                      ? "Update the part information including pricing and sale details."
                      : "Create a new auto part with pricing and inventory information."
                    }
                  </DialogDescription>
                </DialogHeader>
                <PartForm
                  initialData={editingPart}
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setEditingPart(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Part #</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>
                ) : parts.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center h-48">No parts found.</TableCell></TableRow>
                ) : (
                  parts.map((part) => {
                    const saleStatus = getSaleStatus(part);
                    return (
                    <TableRow key={part.id}>
                      <TableCell>
                        <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center">
                          {part.image_urls && part.image_urls[0] ? (
                            <img src={part.image_urls[0]} alt={part.name} className="w-full h-full object-cover rounded-md" />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell>{part.part_number}</TableCell>
                      <TableCell>{part.category}</TableCell>
                      <TableCell>
                        {saleStatus.isOnSale && saleStatus.isActive ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-red-600">{formatCurrency(part.price)}</span>
                              <SaleBadge discountPercentage={part.discount_percentage} />
                            </div>
                            <div className="text-sm text-slate-500 line-through">
                              {formatCurrency(part.original_price)}
                            </div>
                          </div>
                        ) : (
                          <span className="font-medium">{formatCurrency(part.original_price || part.price)}</span>
                        )}
                      </TableCell>
                      <TableCell>{part.stock_quantity}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={part.is_active ? "default" : "secondary"}>
                            {part.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {saleStatus.isOnSale && saleStatus.isActive && (
                            <Badge variant="destructive" className="text-xs">
                              On Sale
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(part)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDelete(part.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
