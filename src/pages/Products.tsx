
import React, { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { FormatCurrency } from "@/components/FormatCurrency";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit, Trash } from "lucide-react";
import { toast } from "sonner";

const Products = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useAppContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentProduct, setCurrentProduct] = useState<{
    id?: string;
    name: string;
    costPrice: number;
    salePrice: number;
    stock: number;
    description: string;
  }>({
    name: "",
    costPrice: 0,
    salePrice: 0,
    stock: 0,
    description: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpenAddDialog = () => {
    setDialogMode("add");
    setCurrentProduct({
      name: "",
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      description: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (product: any) => {
    setDialogMode("edit");
    setCurrentProduct({
      id: product.id,
      name: product.name,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      stock: product.stock,
      description: product.description,
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Convert to number if field is costPrice, salePrice or stock
    if (name === "costPrice" || name === "salePrice" || name === "stock") {
      setCurrentProduct({
        ...currentProduct,
        [name]: Number(value),
      });
    } else {
      setCurrentProduct({
        ...currentProduct,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!currentProduct.name) {
      toast.error("Por favor, informe o nome do produto");
      return;
    }
    
    if (currentProduct.costPrice < 0 || currentProduct.salePrice < 0 || currentProduct.stock < 0) {
      toast.error("Os valores não podem ser negativos");
      return;
    }

    if (dialogMode === "add") {
      addProduct(currentProduct);
    } else {
      updateProduct(currentProduct as any);
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = (product: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
      deleteProduct(product.id);
    }
  };

  // Filter products by search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Produtos</h1>
          <p className="text-gray-500">Gerencie o catálogo de produtos</p>
        </div>
        <Button onClick={handleOpenAddDialog} className="h-9 gap-2 bg-primary-400 hover:bg-primary-500">
          <Plus size={16} />
          <span>Novo Produto</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar produtos..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Descrição</TableHead>
              <TableHead className="text-right">Preço de Custo</TableHead>
              <TableHead className="text-right">Preço de Venda</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="hidden max-w-xs truncate md:table-cell">
                    {product.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <FormatCurrency value={product.costPrice} />
                  </TableCell>
                  <TableCell className="text-right">
                    <FormatCurrency value={product.salePrice} />
                  </TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditDialog(product)}
                      >
                        <Edit size={16} />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash size={16} />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm
                    ? "Nenhum produto encontrado"
                    : "Nenhum produto cadastrado"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Adicionar Produto" : "Editar Produto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="name"
                  name="name"
                  value={currentProduct.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={currentProduct.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <label htmlFor="costPrice" className="text-sm font-medium">
                    Preço de Custo
                  </label>
                  <Input
                    id="costPrice"
                    name="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentProduct.costPrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="salePrice" className="text-sm font-medium">
                    Preço de Venda
                  </label>
                  <Input
                    id="salePrice"
                    name="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentProduct.salePrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="stock" className="text-sm font-medium">
                    Estoque
                  </label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={currentProduct.stock}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary-400 hover:bg-primary-500">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
