import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface ApiKeysContextType {
  anthropicKey: string;
  hasKeys: boolean;
  loading: boolean;
  saveKeys: (anthropicKey: string) => Promise<void>;
}

const ApiKeysContext = createContext<ApiKeysContextType | undefined>(undefined);

export const ApiKeysProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [anthropicKey, setAnthropicKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAnthropicKey('');
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('user_settings')
      .select('anthropic_key')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setAnthropicKey(data.anthropic_key || '');
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const saveKeys = useCallback(async (newAnthropicKey: string) => {
    if (!user) return;

    // Only the anthropic_key column is written; the legacy openai_key column
    // is left untouched (the app is Anthropic-only).
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          anthropic_key: newAnthropicKey || null,
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    setAnthropicKey(newAnthropicKey);
  }, [user]);

  const hasKeys = Boolean(anthropicKey);

  return (
    <ApiKeysContext.Provider value={{ anthropicKey, hasKeys, loading, saveKeys }}>
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
