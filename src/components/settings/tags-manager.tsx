

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Loader2, ChevronsLeft, ChevronsRight, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import type { Tag } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function TagsManager() {
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');

  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#4ade80');
  
  const colors = [
    '#4ade80', // green
    '#60a5fa', // blue
    '#facc15', // yellow
    '#f87171', // red
    '#c084fc', // purple
    '#fb923c', // orange
  ];

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (search) params.set('search', search);

        const res = await fetch(`/api/v1/tags?${params.toString()}`);
        if (!res.ok) throw new Error('Falha ao buscar tags.');
        const data = await res.json();
        setTags(data.data || []);
        setTotalPages(data.totalPages || 1);
    } catch(error) {
         toast({ variant: 'destructive', title: 'Erro', description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' });
    } finally {
        setLoading(false);
    }
  }, [page, limit, search, toast]);

  useEffect(() => {
    const debounce = setTimeout(() => {
        fetchTags();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchTags]);


  const handleOpenModal = (tag: Tag | null) => {
    setEditingTag(tag);
    setTagName(tag ? tag.name : '');
    setTagColor(tag ? tag.color : '#4ade80');
    setIsModalOpen(true);
  }

  const handleSaveTag = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tagName.trim()) {
        toast({ variant: 'destructive', title: 'Erro de Validação', description: 'O nome da tag não pode estar vazio.'});
        return;
    }
    
    const tagData = { name: tagName, color: tagColor };
    const isEditing = !!editingTag;
    const url = isEditing ? `/api/v1/tags/${editingTag.id}` : '/api/v1/tags';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tagData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao salvar a tag.');
        }

        toast({ title: `Tag ${isEditing ? 'Atualizada' : 'Criada'}!`, description: `A tag "${tagName}" foi salva.`});
        await fetchTags(); // Re-fetch all tags

    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao Salvar', description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' });
    } finally {
        setIsModalOpen(false);
        setEditingTag(null);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
        const response = await fetch(`/api/v1/tags/${tagId}`, {
            method: 'DELETE',
        });
        if (response.status !== 204) throw new Error('Falha ao excluir a tag.');

        toast({ title: 'Tag Excluída!' });
        await fetchTags();
    } catch(error) {
         toast({ variant: 'destructive', title: 'Erro ao Excluir', description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' });
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
           <div className="relative w-full sm:w-auto sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-9 w-full sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          <Button className="w-full sm:w-auto" onClick={() => handleOpenModal(null)}>
            <PlusCircle className="mr-2" />
            Criar Nova Tag
          </Button>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : tags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhuma tag encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  tags.map((tag) => (
                    <TableRow key={tag.id}>
                        <TableCell>
                            <Badge style={{ backgroundColor: tag.color, color: '#fff' }}>{tag.name}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{tag.name}</TableCell>
                        <TableCell className="font-mono text-xs">{tag.color}</TableCell>
                        <TableCell>{tag.createdAt ? new Date(tag.createdAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => handleOpenModal(tag)}>
                                    <Edit className="mr-2 h-4 w-4"/>
                                    Editar
                                </DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4"/>
                                            Excluir
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Tem certeza que deseja excluir a tag &quot;{tag.name}&quot;? Esta ação removerá a tag de todos os contatos e conversas.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteTag(tag.id)}>Sim, Excluir</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Página {page} de {totalPages}.
                    </div>
                    <div className="flex items-center gap-2">
                         <Select value={limit.toString()} onValueChange={(value) => {setLimit(parseInt(value, 10)); setPage(1);}}>
                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50].map(val => <SelectItem key={val} value={val.toString()}>{val} por página</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
      
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingTag ? 'Editar Tag' : 'Criar Nova Tag'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveTag}>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="tag-name">Nome da Tag</Label>
                        <Input id="tag-name" name="name" placeholder="Ex: VIP" value={tagName} onChange={(e) => setTagName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Cor</Label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={cn("h-8 w-8 rounded-full border-2", tagColor === color ? 'border-primary ring-2 ring-primary' : 'border-transparent')}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setTagColor(color)}
                                />
                            ))}
                            <Input type="color" value={tagColor} onChange={(e) => setTagColor(e.target.value)} className="h-8 w-10 p-1"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Preview</Label>
                        <div>
                             <Badge style={{ backgroundColor: tagColor, color: '#fff' }}>{tagName || 'Nova Tag'}</Badge>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="secondary" type="button">Cancelar</Button></DialogClose>
                    <Button type="submit">Salvar</Button>
                </DialogFooter>
                </form>
            </DialogContent>
          </Dialog>
    </>
  );
}
