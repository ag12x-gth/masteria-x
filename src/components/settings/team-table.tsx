

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Edit,
  PowerOff,
  Loader2,
  Send,
  KeyRound,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { cn } from '@/lib/utils';

function TeamListMobile({ users, onEdit, onDeactivate, onRemove, onResendInvite, onResetPassword, isResending, onMarkAsVerified }: { users: User[], onEdit: (user: User) => void, onDeactivate: (user: User) => void, onRemove: (user: User) => void, onResendInvite: (user: User) => void, onResetPassword: (user: User) => void, isResending: string | null, onMarkAsVerified: (user: User) => void }): JSX.Element {
    return (
        <div className="space-y-4">
            {users.map(user => (
                <Card key={user.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={user.avatarUrl || ''} alt={user.name} data-ai-hint="avatar user" />
                            <AvatarFallback>{user.name?.substring(0, 2) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <p className="font-bold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                             <div className="flex items-center gap-2 pt-1">
                                <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>{user.role}</Badge>
                                <Badge variant={user.emailVerified ? 'default' : 'secondary'} className={user.emailVerified ? 'bg-green-500' : ''}>{user.emailVerified ? 'Ativo' : 'Pendente'}</Badge>
                             </div>
                        </div>
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Cargo
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => onResetPassword(user)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Definir Nova Senha
                            </DropdownMenuItem>
                            {!user.emailVerified && (
                                <>
                                <DropdownMenuItem onClick={() => onMarkAsVerified(user)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Marcar como Verificado
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onResendInvite(user)} disabled={isResending === user.id}>
                                    {isResending === user.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                    Reenviar Convite
                                </DropdownMenuItem>
                                </>
                            )}
                             <DropdownMenuItem onClick={() => onDeactivate(user)}>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Desativar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onRemove(user)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover da Equipe
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

const PasswordStrengthIndicator = ({ checks, className }: { checks: {label: string, valid: boolean}[], className?: string }): JSX.Element => {
    const _strength = checks.filter(c => c.valid).length;
    
    return (
        <div className={cn("pt-2 space-y-1", className)}>
            {checks.map(check => (
                 <div key={check.label} className={cn("flex items-center gap-2 text-xs", check.valid ? 'text-green-600' : 'text-muted-foreground')}>
                    {check.valid ? <CheckCircle className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>}
                    <span>{check.label}</span>
                 </div>
            ))}
        </div>
    )
}

function ResetPasswordDialog({ user, isOpen, setIsOpen }: { user: User | null, isOpen: boolean, setIsOpen: (open: boolean) => void }): JSX.Element {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const passwordChecks = useMemo(() => {
        return [
          { label: 'Pelo menos 8 caracteres', valid: password.length >= 8 },
          { label: 'Pelo menos uma letra maiúscula', valid: /[A-Z]/.test(password) },
          { label: 'Pelo menos uma letra minúscula', valid: /[a-z]/.test(password) },
          { label: 'Pelo menos um número', valid: /[0-9]/.test(password) },
        ];
    }, [password]);

    const isPasswordStrong = passwordChecks.every(c => c.valid);

    const handleResetPassword = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!user) return;
        if (!isPasswordStrong) {
            toast({ variant: 'destructive', title: 'Senha Fraca', description: 'A senha não atende a todos os requisitos de segurança.' });
            return;
        }
        if (password !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Erro', description: 'As senhas não coincidem.' });
            return;
        }
        setIsSaving(true);
        try {
            const response = await fetch(`/api/v1/team/users/${user.id}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            toast({ title: 'Senha Atualizada!', description: `A senha de ${user.name} foi alterada.`});
            setIsOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Definir Nova Senha</DialogTitle>
                    <DialogDescription>
                        Você está a definir uma nova senha para o utilizador <strong>{user?.name}</strong>. Ele será notificado da alteração.
                    </DialogDescription>
                </DialogHeader>
                 <form onSubmit={handleResetPassword}>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nova Senha</Label>
                            <Input id="new-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                            {password.length > 0 && <PasswordStrengthIndicator checks={passwordChecks} />}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                            <Input id="confirm-new-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary" disabled={isSaving}>Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSaving || !isPasswordStrong || password !== confirmPassword}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {isSaving ? 'A Salvar...' : 'Salvar Nova Senha'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


export function TeamTable(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [userToAction, setUserToAction] = useState<User | null>(null);
  const [isDeactivateAlertOpen, setDeactivateAlertOpen] = useState(false);
  const [isRemoveAlertOpen, setRemoveAlertOpen] = useState(false);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [isResetPasswordOpen, setResetPasswordOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const fetchUsers = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
        const response = await fetch('/api/v1/team/users');
        if (!response.ok) {
            throw new Error('Falha ao buscar os utilizadores da equipe.');
        }
        const data = await response.json();
        setUsers(data);
    } catch(error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsInviting(true);
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as User['role'];

    try {
        const response = await fetch('/api/v1/team/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, role })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Falha ao enviar convite.');
        }
        
        toast({
            title: 'Convite Enviado!',
            description: `Um convite foi enviado para ${email}.`,
        });

        fetchUsers();
        setInviteModalOpen(false);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao Convidar',
            description: (error as Error).message,
        });
    } finally {
        setIsInviting(false);
    }
  };
  
  const handleResendInvite = async (user: User): Promise<void> => {
    setIsResending(user.id);
     try {
        const response = await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Falha ao reenviar convite.');
        }
        toast({ title: 'Convite Reenviado!', description: `Um novo convite foi enviado para ${user.email}.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
        setIsResending(null);
    }
  }

  const handleMarkAsVerified = async (user: User): Promise<void> => {
    try {
        const response = await fetch(`/api/v1/team/users/${user.id}/verify`, { method: 'POST' });
        if (!response.ok) {
             const errorData = await response.json();
            throw new Error(errorData.error || "Falha ao verificar o utilizador.");
        }
        toast({ title: "Utilizador Verificado!", description: `${user.name} foi marcado como verificado.`});
        fetchUsers(); // Refresh the list to show new status
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  }

  const handleEditRole = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!editingUser) return;

    const formData = new FormData(event.currentTarget);
    const role = formData.get('role') as User['role'];

    setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, role } : u)));
    toast({
      title: 'Cargo Atualizado!',
      description: `O cargo de ${editingUser.name} foi atualizado para ${role}.`,
    });
    setEditModalOpen(false);
    setEditingUser(null);
  };

  const openEditModal = (user: User): void => {
    setEditingUser(user);
    setEditModalOpen(true);
  };
  
  const openDeactivateAlert = (user: User): void => {
      setUserToAction(user);
      setDeactivateAlertOpen(true);
  }

  const openRemoveAlert = (user: User): void => {
      setUserToAction(user);
      setRemoveAlertOpen(true);
  }
  
  const openResetPasswordDialog = (user: User): void => {
      setUserToAction(user);
      setResetPasswordOpen(true);
  }

  const handleRemove = async (): Promise<void> => {
    if (!userToAction) return;
    
    const userToRemove = userToAction;
    const originalUsers = [...users];

    setUsers(prev => prev.filter(u => u.id !== userToRemove.id));
    setRemoveAlertOpen(false);
    setUserToAction(null);

    try {
        const response = await fetch(`/api/v1/team/users/${userToRemove.id}`, { method: 'DELETE' });
        
        if (response.status !== 204) {
             const errorData = await response.json();
            throw new Error(errorData.error || "Falha ao remover utilizador.");
        }
        
        toast({
            title: "Utilizador Removido!",
            description: `O utilizador ${userToRemove.name} foi removido da equipa.`
        });
        fetchUsers();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao Remover",
            description: (error as Error).message
        });
        setUsers(originalUsers);
    }
  }

  const getStatusVariant = (isVerified: boolean | Date | null): 'default' | 'secondary' => {
    return isVerified ? 'default' : 'secondary';
  };

  const getRoleVariant = (role: User['role']): 'destructive' | 'outline' => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'atendente':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Gerenciamento de Equipe</CardTitle>
          <CardDescription>
            Convide e gerencie os usuários da sua equipe.
          </CardDescription>
        </div>
        <Dialog open={isInviteModalOpen} onOpenChange={setInviteModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuário</DialogTitle>
              <DialogDescription>
                Insira o nome, email e defina o cargo para enviar um convite.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite}>
              <div className="space-y-4 py-4">
                 <div className="space-y-2">
                  <Label htmlFor="name">Nome do Convidado</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nome@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Select name="role" defaultValue="atendente">
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="atendente">Atendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" disabled={isInviting}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isInviting}>
                    {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {isInviting ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="flex justify-center items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>
        ) : isMobile ? (
            <TeamListMobile users={users} onEdit={openEditModal} onDeactivate={openDeactivateAlert} onRemove={openRemoveAlert} onResendInvite={handleResendInvite} onResetPassword={openResetPasswordDialog} isResending={isResending} onMarkAsVerified={handleMarkAsVerified}/>
        ) : (
            <div className="w-full overflow-x-auto border rounded-lg">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                           <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Nenhum usuário na equipe.</TableCell>
                           </TableRow>
                        ) : users.map((user) => (
                            <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage
                                    src={user.avatarUrl || ''}
                                    alt={user.name}
                                    data-ai-hint="avatar user"
                                    />
                                    <AvatarFallback>{user.name?.substring(0, 2) || 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium whitespace-nowrap">{user.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                {user.email}
                            </TableCell>
                            <TableCell>
                                <Badge variant={getRoleVariant(user.role as 'admin' | 'atendente')}>
                                {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge
                                variant={getStatusVariant(!!user.emailVerified)}
                                className={user.emailVerified ? 'bg-green-500' : ''}
                                >
                                {user.emailVerified ? 'Ativo' : 'Pendente'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditModal(user)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar Cargo
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Definir Nova Senha
                                    </DropdownMenuItem>
                                    {!user.emailVerified && (
                                        <>
                                        <DropdownMenuItem onClick={() => handleMarkAsVerified(user)}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Marcar como Verificado
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleResendInvite(user)} disabled={isResending === user.id}>
                                            {isResending === user.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                            Reenviar Convite
                                        </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuItem onClick={() => openDeactivateAlert(user)}>
                                        <PowerOff className="mr-2 h-4 w-4" />
                                        Desativar Usuário
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remover da Equipe
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem certeza que deseja remover o utilizador &quot;{user.name}&quot; da equipa? Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => openRemoveAlert(user)}>Sim, Remover</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}
      </CardContent>

      <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cargo de {editingUser?.name}</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditRole}>
              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <Label>Nome do Usuário</Label>
                  <p className="text-sm text-muted-foreground">
                    {editingUser.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">
                    {editingUser.email}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Cargo</Label>
                  <Select name="role" defaultValue={editingUser.role}>
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="atendente">Atendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeactivateAlertOpen} onOpenChange={setDeactivateAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>
                Desativar {userToAction?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
                O usuário desativado perderá o acesso ao Master IA, mas seus dados e histórico de
                atendimentos serão mantidos. Você poderá
                reativá-lo a qualquer momento. Deseja continuar?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Sim, Desativar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isRemoveAlertOpen} onOpenChange={setRemoveAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>
                Remover {userToAction?.name} da Equipe?
                </AlertDialogTitle>
                <AlertDialogDescription>
                Esta ação é permanente e não pode ser desfeita. O
                usuário será removido da equipe e todos os seus
                atendimentos ficarão sem um responsável. Tem
                certeza que deseja continuar?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemove} variant="destructive">
                    Sim, Remover
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
        <ResetPasswordDialog user={userToAction} isOpen={isResetPasswordOpen} setIsOpen={setResetPasswordOpen} />
    </Card>
    </>
  );
}
