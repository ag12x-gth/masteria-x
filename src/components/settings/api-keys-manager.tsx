

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { MoreHorizontal, PlusCircle, Trash2, Copy, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { ApiKey } from '@/lib/types';

export function ApiKeysManager() {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const fetchKeys = async () => {
    try {
        setLoading(true);
        const res = await fetch('/api/v1/api-keys');
        if (!res.ok) throw new Error('Falha ao carregar chaves de API.');
        const data = await res.json();
        setKeys(data);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    fetchKeys();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const response = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar a chave.');
      }

      const newKeyData: ApiKey = await response.json();
      setGeneratedKey(newKeyData.key);
      await fetchKeys();

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error instanceof Error ? error.message : 'Não foi possível gerar a chave.' });
    }
  };
  
  const handleRevokeKey = async (keyId: string) => {
    try {
        const response = await fetch(`/api/v1/api-keys/${keyId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Falha ao revogar a chave.');

        toast({ title: 'Chave Revogada', description: 'A chave de API foi revogada com sucesso.'});
        setKeys(prev => prev.filter(k => k.id !== keyId));
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error instanceof Error ? error.message : 'Não foi possível revogar a chave.' });
    }
  }


  const handleCloseGenerateModal = () => {
    setIsModalOpen(false);
    setNewKeyName('');
    setGeneratedKey(null);
    setIsKeyVisible(false);
    setIsCopied(false);
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setIsCopied(true);
    toast({ title: 'Copiado!', description: 'A chave de API foi copiada para a área de transferência.' });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Chaves de API / Personal Tokens</CardTitle>
            <CardDescription>
              Gere e gerencie chaves de API para integrar seus sistemas externos (como Windsurf, VSCode, ou outras ferramentas) com o Master IA Oficial.
            </CardDescription>
          </div>
          <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseGenerateModal()}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
                    <PlusCircle className="mr-2" />
                    Gerar Nova Chave
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{generatedKey ? 'Chave de API Gerada com Sucesso' : 'Gerar Nova Chave de API'}</DialogTitle>
                    <DialogDescription>
                        {generatedKey 
                            ? 'Copie a chave de API abaixo. Esta é a única vez que ela será exibida. Guarde-a em um lugar seguro.'
                            : 'Dê um nome para a sua nova chave para ajudar a identificá-la (ex: "Windsurf", "Integração CRM").'
                        }
                    </DialogDescription>
                </DialogHeader>
                {generatedKey ? (
                    <div className="space-y-4 py-4">
                         <div className="relative">
                            <Input 
                                readOnly 
                                type={isKeyVisible ? 'text' : 'password'}
                                value={generatedKey} 
                                className="pr-20 font-mono text-xs" 
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsKeyVisible(!isKeyVisible)}>
                                    {isKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyKey}>
                                    {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="bg-muted p-3 rounded-md">
                            <p className="font-semibold mb-2">Como usar esta chave:</p>
                            <ul className="list-disc list-inside space-y-1.5 ml-2 text-muted-foreground">
                              <li>Adicione no header HTTP: <code className="bg-background px-1.5 py-0.5 rounded text-xs">Authorization: Bearer {'{'}sua_chave{'}'}</code></li>
                              <li>Para Windsurf/VSCode: Configure nas extensões que se conectam à API</li>
                              <li>Para scripts/integrações: Use em requisições HTTP com o header acima</li>
                              <li>Nunca compartilhe sua chave ou a commit em repositórios públicos</li>
                            </ul>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Exemplo de uso (curl):</p>
                            <code className="block text-xs text-blue-800 dark:text-blue-200 font-mono bg-blue-100 dark:bg-blue-900 p-2 rounded overflow-x-auto">
                              curl -H &quot;Authorization: Bearer {generatedKey.substring(0, 20)}...&quot; https://sua-api.com/api/v1/contacts
                            </code>
                          </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleGenerateKey}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="key-name">Nome da Chave</Label>
                                <Input 
                                    id="key-name"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="Ex: Integração com CRM" 
                                    required 
                                />
                            </div>
                        </div>
                        <DialogFooter>
                             <Button type="button" variant="secondary" onClick={handleCloseGenerateModal}>Cancelar</Button>
                             <Button type="submit">Gerar Chave</Button>
                        </DialogFooter>
                    </form>
                )}
                 {generatedKey && (
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseGenerateModal}>Fechar</Button>
                    </DialogFooter>
                )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : keys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhuma chave de API encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell className="font-mono text-xs">{key.key}</TableCell>
                      <TableCell>{key.createdAt ? new Date(key.createdAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell className="text-right">
                         <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4"/>
                                            Revogar Chave
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Revogar esta Chave de API?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza de que deseja revogar a chave &quot;{key.name}&quot;? Qualquer aplicação que a utilize perderá o acesso imediatamente. Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRevokeKey(key.id)}>Sim, Revogar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
