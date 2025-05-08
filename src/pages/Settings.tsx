import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/contexts/AppContext";

// Definição das cores disponíveis
const themeColors = [
  { id: 'blue', name: 'Azul Corporativo', hsl: '221 83% 56%', hover: '221 71% 41%', light: '213 96% 93%' },
  { id: 'purple', name: 'Roxo Moderno', hsl: '262 83% 58%', hover: '263 68% 48%', light: '276 100% 97%' },
  { id: 'teal', name: 'Verde Água', hsl: '174 85% 32%', hover: '174 81% 25%', light: '168 80% 90%' },
  { id: 'indigo', name: 'Índigo Profissional', hsl: '243 72% 58%', hover: '245 60% 41%', light: '226 100% 96%' },
  { id: 'emerald', name: 'Esmeralda', hsl: '160 94% 31%', hover: '160 95% 25%', light: '146 76% 90%' },
  { id: 'slate', name: 'Cinza Executivo', hsl: '222 15% 35%', hover: '222 22% 25%', light: '210 20% 97%' }
];

// Função para aplicar variáveis CSS de cor no :root e .dark
function applyPrimaryColorVars(colorId: string) {
  const color = themeColors.find(c => c.id === colorId);
  if (!color) return;
  const root = document.documentElement;
  // Aplica para modo claro
  root.style.setProperty('--primary', color.hsl);
  root.style.setProperty('--primary-hover', color.hover);
  root.style.setProperty('--primary-light', color.light);
  // Aplica para modo escuro (ajuste: use as mesmas cores ou personalize se quiser)
  const dark = document.querySelector('.dark');
  if (dark) {
    dark.style.setProperty('--primary', color.hsl);
    dark.style.setProperty('--primary-hover', color.hover);
    dark.style.setProperty('--primary-light', color.light);
  }
}

export default function Settings() {
  const { toast } = useToast();
  const { settings, updateSettings } = useAppContext();
  const [theme, setTheme] = useState(settings?.theme || 'light');
  const [language, setLanguage] = useState(settings?.language || 'pt-BR');
  const [primaryColor, setPrimaryColor] = useState(settings?.primaryColor || 'blue');

  // Função para atualizar o tema
  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value;
    setTheme(newTheme);
    updateSettings({ ...settings, theme: newTheme });
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    // Reaplica as variáveis de cor ao trocar o tema
    applyPrimaryColorVars(primaryColor);
    toast({
      title: "Tema atualizado",
      description: `O tema foi alterado para ${newTheme === 'light' ? 'claro' : newTheme === 'dark' ? 'escuro' : 'sistema'}.`
    });
  };

  // Função para atualizar o idioma
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    updateSettings({ ...settings, language: newLanguage });
    toast({
      title: "Idioma atualizado",
      description: `O idioma foi alterado para ${newLanguage === 'pt-BR' ? 'Português (Brasil)' : 'English'}.`
    });
  };

  // Função para atualizar a cor
  const handleColorChange = (colorId: string) => {
    setPrimaryColor(colorId);
    document.documentElement.classList.remove(...themeColors.map(color => `theme-${color.id}`));
    document.documentElement.classList.add(`theme-${colorId}`);
    updateSettings({ ...settings, primaryColor: colorId });
    applyPrimaryColorVars(colorId);
    const selectedColor = themeColors.find(color => color.id === colorId);
    if (selectedColor) {
      toast({
        title: "Cor atualizada",
        description: `A cor do sistema foi alterada para ${selectedColor.name}.`
      });
    }
  };

  // Aplicar configurações ao carregar a página
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    // Aplicar cor do tema
    if (primaryColor) {
      document.documentElement.classList.remove(...themeColors.map(color => `theme-${color.id}`));
      document.documentElement.classList.add(`theme-${primaryColor}`);
      applyPrimaryColorVars(primaryColor);
    }
  }, [theme, primaryColor]);

  return (
    <div className="container mx-auto py-6">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="payment">Pagamento</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Gerencie as configurações gerais do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <select 
                  id="theme" 
                  value={theme}
                  onChange={handleThemeChange}
                  className="w-full bg-background dark:bg-card text-foreground dark:text-foreground border border-input dark:border-input rounded-md p-2"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <select 
                  id="language" 
                  value={language}
                  onChange={handleLanguageChange}
                  className="w-full bg-background dark:bg-card text-foreground dark:text-foreground border border-input dark:border-input rounded-md p-2"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="space-y-4">
                <Label>Cor do Sistema</Label>
                <RadioGroup
                  value={primaryColor}
                  onValueChange={handleColorChange}
                  className="grid grid-cols-2 gap-4 sm:grid-cols-3"
                >
                  {themeColors.map((color) => (
                    <div key={color.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={color.id} id={color.id} className="peer sr-only" />
                      <Label
                        htmlFor={color.id}
                        className="flex flex-1 items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-x-2">
                          <div
                            className="h-6 w-6 rounded-full ring-2 ring-offset-2 transition-all duration-200"
                            style={{ 
                              backgroundColor: color.value,
                              boxShadow: primaryColor === color.id ? `0 0 0 2px ${color.value}` : 'none'
                            }}
                          />
                          <span className="text-sm font-medium leading-none">
                            {color.name}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Configure as informações da sua empresa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input id="companyName" placeholder="Nome da sua empresa" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" placeholder="Endereço completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(00) 0000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="contato@empresa.com" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Pagamento</CardTitle>
              <CardDescription>
                Configure as opções de pagamento e parcelas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxInstallments">Número Máximo de Parcelas</Label>
                <Input id="maxInstallments" type="number" min="1" max="12" defaultValue="12" />
              </div>
              <div className="space-y-2">
                <Label>Formas de Pagamento Aceitas</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>Dinheiro</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>Cartão de Crédito</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>Cartão de Débito</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>PIX</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Gerencie os usuários do sistema e suas permissões.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="mb-4">Adicionar Novo Usuário</Button>
              
              <div className="space-y-4">
                <div className="border p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Administrador</h3>
                      <p className="text-sm text-gray-500">admin@vendapro.com</p>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="destructive" size="sm">Remover</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 