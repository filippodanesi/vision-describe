import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface ApiKeysContextType {
  openaiKey: string;
  anthropicKey: string;
  hasKeys: boolean;
  loading: boolean;
  saveKeys: (openaiKey: string, anthropicKey: string) => Promise<void>;
}

const ApiKeysContext = createContext<ApiKeysContextType | undefined>(undefined);

export const ApiKeysProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOpenaiKey('');
      setAnthropicKey('');
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('user_settings')
      .select('openai_key, anthropic_key')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setOpenaiKey(data.openai_key || '');
          setAnthropicKey(data.anthropic_key || '');
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const saveKeys = useCallback(async (newOpenaiKey: string, newAnthropicKey: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          openai_key: newOpenaiKey || null,
          anthropic_key: newAnthropicKey || null,
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    setOpenaiKey(newOpenaiKey);
    setAnthropicKey(newAnthropicKey);
  }, [user]);

  const hasKeys = Boolean(openaiKey || anthropicKey);

  return (
    <ApiKeysContext.Provider value={{ openaiKey, anthropicKey, hasKeys, loading, saveKeys }}>
      {children}
    </ApiKeysContext.Provider>
  );
};

export const useApiKeys = (): ApiKeysContextType => {
  const context = useContext(ApiKeysContext);
  if (!context) {
    throw new Error('useApiKeys must be used within an ApiKeysProvider');
  }
  return context;
};
