
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PlusCircle,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  Copy,
  Check,
  Loader2,
  Server,
  Phone,
  Webhook,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils';
import type { Connection as ConnectionType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/session-context';
import { toggleConnectionActive, checkConnectionStatus } from '@/app/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type ConnectionStatus = 'Conectado' | 'Falha na Conexão' | 'Não Verificado';
type WebhookStatus = 'CONFIGURADO' | 'DIVERGENTE' | 'NAO_CONFIGURADO' | 'VERIFICANDO' | 'ERRO';
type HealthStatus = 'healthy' | 'expired' | 'error' | 'inactive';

type Connection = ConnectionType & {
    connectionStatus?: ConnectionStatus;
    webhookStatus?: WebhookStatus;
    healthStatus?: HealthStatus;
    healthErrorMessage?: string;
    lastHealthCheck?: Date;
};

const connectionStatusConfig: Record<ConnectionStatus, { icon: React.ElementType, color: string, text: string }> = {
  Conectado: { icon: CheckCircle2, color: 'text-green-500', text: 'Conectado' },
  'Falha na Conexão': { icon: XCircle, color: 'text-destructive', text: 'Falha na Conexão' },
  'Não Verificado': { icon: Loader2, color: 'text-muted-foreground', text: 'Verificando...' },
};

const webhookStatusConfig: Record<WebhookStatus, { icon: React.ElementType, color: string, text: string }> = {
    CONFIGURADO: { icon: CheckCircle2, color: 'text-green-500', text: 'Webhook Configurado' },
    DIVERGENTE: { icon: AlertCircle, color: 'text-yellow-500', text: 'URL do Webhook Divergente' },
    NAO_CONFIGURADO: { icon: XCircle, color: 'text-destructive', text: 'Webhook Não Configurado' },
    ERRO: { icon: XCircle, color: 'text-destructive', text: 'Erro ao Verificar Webhook' },
    VERIFICANDO: { icon: Loader2, color: 'text-muted-foreground', text: 'Verificando Webhook...' },
};

const healthStatusConfig: Record<HealthStatus, { icon: React.ElementType, color: string, text: string, bgColor: string }> = {
    healthy: { icon: CheckCircle2, color: 'text-green-600', text: 'Saudável', bgColor: 'bg-green-50' },
    expired: { icon: AlertTriangle, color: 'text-red-600', text: 'Token Expirado', bgColor: 'bg-red-50' },
    error: { icon: XCircle, color: 'text-red-600', text: 'Erro', bgColor: 'bg-red-50' },
    inactive: { icon: AlertCircle, color: 'text-gray-600', text: 'Inativa', bgColor: 'bg-gray-50' },
};

const WebhookInfoCard = () => {
    const [isUrlCopied, setIsUrlCopied] = useState(false);
    const { session } = useSession();
    const webhookSlug = session?.userData?.company?.webhookSlug || '...';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002');
    const webhookUrl = `${baseUrl}/api/webhooks/meta/${webhookSlug}`;

    const { toast } = useToast();
    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setIsUrlCopied(true);
        toast({ title: 'URL Copiada!', description: 'A URL do webhook foi copiada.' });
        setTimeout(() => setIsUrlCopied(false), 2000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuração do Webhook da Meta</CardTitle>
                <CardDescription>
                    Use as informações abaixo para configurar o webhook no Painel de Desenvolvedores da Meta.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="webhook-url">URL de Callback</Label>
                    <div className="relative mt-1">
                        <Input id="webhook-url" readOnly value={webhookUrl} className="pr-12 font-mono text-xs" />
                        <Button variant="outline" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => handleCopy(webhookUrl)}>
                            {isUrlCopied ? <Check className="h-4 w-4 text-green-500"/> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function ConnectionsManager() {
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [isSyncingWebhook, setIsSyncingWebhook] = useState<string | null>(null);
  const { toast } = useToast();

   const checkWebhookStatus = useCallback(async (connectionId: string): Promise<void> => {
        setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, webhookStatus: 'VERIFICANDO' } : c));
        try {
            const res = await fetch(`/api/v1/connections/${connectionId}/webhook-status`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Falha ao verificar status do webhook.");
            
            setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, webhookStatus: data.status } : c));
        } catch(error) {
            setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, webhookStatus: 'ERRO' } : c));
            console.error(`Erro ao verificar webhook para conexão ${connectionId}:`, error);
        }
   }, []);

   const checkConnectionHealth = useCallback(async (): Promise<void> => {
        try {
            const res = await fetch('/api/v1/connections/health');
            if (!res.ok) throw new Error('Falha ao verificar saúde das conexões.');
            const data = await res.json();
            
            setConnections(prev => prev.map(conn => {
                const healthData = data.connections.find((h: any) => h.id === conn.id);
                if (healthData) {
                    return {
                        ...conn,
                        healthStatus: healthData.status,
                        healthErrorMessage: healthData.errorMessage,
                        lastHealthCheck: new Date(healthData.lastChecked)
                    };
                }
                return conn;
            }));
        } catch (error) {
            console.error('Erro ao verificar saúde das conexões:', error);
        }
   }, []);


   const fetchConnections = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/connections');
            if (!res.ok) throw new Error('Falha ao carregar as conexões.');
            const data: ConnectionType[] = await res.json();
            
            const initialConnections: Connection[] = data.map(c => ({ 
                ...c, 
                connectionStatus: 'Não Verificado',
                webhookStatus: 'VERIFICANDO'
            }));
            setConnections(initialConnections);
            
            // Verificar saúde das conexões primeiro
            await checkConnectionHealth();
            
            await Promise.all(initialConnections.map(async (conn) => {
                const [connStatusRes] = await Promise.all([
                    checkConnectionStatus(conn.id),
                    checkWebhookStatus(conn.id),
                ]);
                setConnections(prev => prev.map(c => c.id === conn.id ? { ...c, connectionStatus: connStatusRes.success ? 'Conectado' : 'Falha na Conexão' } : c));
            }));

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
        } finally {
            setLoading(false);
        }
    }, [toast, checkWebhookStatus, checkConnectionHealth]);

    useEffect(() => {
        fetchConnections();
        
        // Verificação automática de saúde a cada 5 minutos
        const healthCheckInterval = setInterval(() => {
            checkConnectionHealth();
        }, 5 * 60 * 1000);
        
        return () => clearInterval(healthCheckInterval);
    }, [fetchConnections, checkConnectionHealth]);

    const groupedConnections = useMemo(() => {
        const groups = new Map<string, Connection[]>();
        connections.forEach(conn => {
            const group = groups.get(conn.wabaId);
            if (group) {
                group.push(conn);
            } else {
                groups.set(conn.wabaId, [conn]);
            }
        });
        return Array.from(groups.entries());
    }, [connections]);

  const handleToggleActive = async (connectionId: string, newIsActive: boolean): Promise<void> => {
    const originalConnections = [...connections];
    setConnections((prev) =>
        prev.map((conn) =>
            conn.id === connectionId ? { ...conn, isActive: newIsActive } : conn
        )
    );
  
    try {
      await toggleConnectionActive(connectionId, newIsActive);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível alterar o status da conexão.',
      });
      setConnections(originalConnections);
    }
  };
  
  const handleEdit = async (connection: Connection): Promise<void> => {
    try {
      const response = await fetch(`/api/v1/connections/${connection.id}`);
      if (!response.ok) {
        throw new Error('Não foi possível obter os detalhes da conexão.');
      }
      const fullConnectionData = await response.json();
      setEditingConnection(fullConnectionData);
      setIsModalOpen(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Abrir Edição',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
      });
    }
  }

  const handleDelete = async (connectionId: string): Promise<void> => {
    const originalConnections = [...connections];
    setConnections(prev => prev.filter(c => c.id !== connectionId));
    
    try {
        const response = await fetch(`/api/v1/connections/${connectionId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao excluir a conexão.');
        }

        toast({ title: 'Conexão Excluída', description: 'A conexão foi removida com sucesso.' });
    } catch(error) {
        toast({ variant: 'destructive', title: 'Erro ao Excluir', description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' });
        setConnections(originalConnections);
    }
  }
  
  const handleSaveConnection = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const connectionData = {
      configName: formData.get('configName') as string,
      wabaId: formData.get('wabaId') as string,
      phoneNumberId: formData.get('phoneNumberId') as string,
      appId: formData.get('appId') as string,
      accessToken: formData.get('accessToken') as string,
      appSecret: formData.get('appSecret') as string,
    };
    
    const isEditing = !!editingConnection?.id;
    const url = isEditing ? `/api/v1/connections/${editingConnection.id}` : '/api/v1/connections';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(connectionData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao salvar a conexão.');
        }
        
        toast({ title: `Conexão ${isEditing ? 'Atualizada' : 'Salva'}!`, description: `A conexão foi salva com sucesso.`});
        
        setIsModalOpen(false);
        setEditingConnection(null);
        fetchConnections();

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar',
            description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
        });
    }
  };

  const handleSyncWebhook = async (connectionId: string): Promise<void> => {
    setIsSyncingWebhook(connectionId);
    try {
        const response = await fetch(`/api/v1/connections/${connectionId}/configure-webhook`, {
            method: 'POST',
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Falha desconhecida ao configurar o webhook.');
        }
        toast({
            title: 'Webhook Sincronizado!',
            description: 'A configuração do webhook foi enviada para a Meta com sucesso.'
        });
        // Re-check status after sync
        await checkWebhookStatus(connectionId);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro na Sincronização', description: (error as Error).message });
    } finally {
        setIsSyncingWebhook(null);
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={checkConnectionHealth}>
                <AlertCircle className="mr-2 h-4 w-4" />
                Verificar Saúde
            </Button>
            <Dialog
            open={isModalOpen}
            onOpenChange={(isOpen) => {
                setIsModalOpen(isOpen);
                if (!isOpen) setEditingConnection(null);
            }}
            >
            <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Nova Conexão
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>
                    {editingConnection?.id ? 'Editar Conexão' : 'Adicionar Nova Conexão'}
                </DialogTitle>
                <DialogDescription>
                    Insira os detalhes da sua conexão com a API da Meta.
                </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveConnection}>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                    <Label htmlFor="configName">Nome da Conexão</Label>
                    <Input id="configName" name="configName" placeholder="Ex: Minha Empresa Principal" defaultValue={editingConnection?.config_name} required />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="wabaId">ID da Conta do WhatsApp Business (WABA ID)</Label>
                    <Input id="wabaId" name="wabaId" placeholder="Seu WABA ID" defaultValue={editingConnection?.wabaId} required/>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="phoneNumberId">ID do Número de Telefone</Label>
                    <Input id="phoneNumberId" name="phoneNumberId" placeholder="Seu ID do número de telefone" defaultValue={editingConnection?.phoneNumberId} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="appId">ID do Aplicativo (App ID)</Label>
                        <Input id="appId" name="appId" placeholder="Seu App ID da Meta" defaultValue={editingConnection?.appId || ''} required />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="accessToken">Token de Acesso Permanente</Label>
                    <Input id="accessToken" name="accessToken" type="password" placeholder={editingConnection ? 'Deixe em branco para não alterar' : 'Seu token de acesso'} defaultValue="" required={!editingConnection} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="appSecret">Segredo do Aplicativo (App Secret)</Label>
                    <Input id="appSecret" name="appSecret" type="password" placeholder={editingConnection ? 'Deixe em branco para não alterar' : 'Seu App Secret para validação'} defaultValue="" required={!editingConnection}/>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button type="submit">Salvar Conexão</Button>
                </DialogFooter>
                </form>
            </DialogContent>
            </Dialog>
        </div>

        <WebhookInfoCard />

        <div className="space-y-6">
            {loading ? (
                 <Card className="flex items-center justify-center p-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </Card>
            ) : groupedConnections.length === 0 ? (
                <Card className="flex items-center justify-center p-16">
                    <p className="text-muted-foreground">Nenhuma conexão encontrada.</p>
                </Card>
            ) : (
                groupedConnections.map(([wabaId, conns]) => (
                    <Card key={wabaId}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-5 w-5"/>
                                WhatsApp Business Account
                            </CardTitle>
                            <CardDescription>
                                WABA ID: {wabaId}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="divide-y">
                            {conns.map(conn => {
                                const statusInfo = connectionStatusConfig[conn.connectionStatus || 'Não Verificado'];
                                const ConnStatusIcon = statusInfo.icon;
                                
                                const webhookInfo = webhookStatusConfig[conn.webhookStatus || 'VERIFICANDO'];
                                const WebhookStatusIcon = webhookInfo.icon;
                                
                                const healthInfo = conn.healthStatus ? healthStatusConfig[conn.healthStatus] : null;
                                const HealthStatusIcon = healthInfo?.icon;

                                return (
                                    <div key={conn.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 py-4 first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-5 w-5 text-muted-foreground"/>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">{conn.config_name}</p>
                                                    {healthInfo && conn.healthStatus !== 'healthy' && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className={cn('flex items-center px-2 py-1 rounded-full text-xs font-medium', healthInfo.color, healthInfo.bgColor)}>
                                                                        {HealthStatusIcon && React.createElement(HealthStatusIcon, { className: "h-3 w-3 mr-1" })}
                                                                        {healthInfo.text}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{conn.healthErrorMessage || 'Problema detectado na conexão'}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{conn.phoneNumberId}</p>
                                                 <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className={cn('flex items-center text-xs pt-1', statusInfo.color)}>
                                                                <ConnStatusIcon className={cn("h-3 w-3 mr-1.5", conn.connectionStatus === 'Não Verificado' && 'animate-spin')} />
                                                                <span className="font-medium">{statusInfo.text}</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Status da API da Meta</p></TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <div className={cn('flex items-center text-xs pt-1', webhookInfo.color)}>
                                                              <WebhookStatusIcon className={cn("h-3 w-3 mr-1.5", conn.webhookStatus === 'VERIFICANDO' && 'animate-spin')} />
                                                              <span className="font-medium">{webhookInfo.text}</span>
                                                          </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Status do Webhook</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center space-x-2 justify-self-start md:justify-self-center">
                                                <Switch
                                                    id={`active-switch-${conn.id}`}
                                                    checked={conn.isActive}
                                                    onCheckedChange={(checked) => handleToggleActive(conn.id, checked)}
                                                    aria-label="Ativar conexão"
                                                />
                                                <Label htmlFor={`active-switch-${conn.id}`} className="text-sm font-medium">
                                                    Ativa
                                                </Label>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => handleSyncWebhook(conn.id)} disabled={isSyncingWebhook === conn.id}>
                                                {isSyncingWebhook === conn.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Webhook className="mr-2 h-4 w-4" />}
                                                Sincronizar Webhook
                                            </Button>
                                        </div>
                                        <div className="justify-self-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(conn)}>
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
                                                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente a conexão e removerá seus dados de nossos servidores.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(conn.id)}>Excluir</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    </div>
  );
}
