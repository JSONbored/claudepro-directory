'use client';

/**
 * CompanySelector - Search or create companies (database-first via RPC)
 */

import type { Database } from '@heyclaude/database-types';
import {
  createCompany,
  getCompanyByIdAction,
  searchCompaniesAction,
} from '@heyclaude/web-runtime/actions';
import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { Building2, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useId, useState, useTransition } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@heyclaude/web-runtime/ui';

type Company = Pick<
  Database['public']['Tables']['companies']['Row'],
  'id' | 'name' | 'slug' | 'website' | 'description' | 'logo'
>;

interface CompanySelectorProps {
  value?: string | null; // company_id
  onChange: (companyId: string | null, companyName: string) => void;
  defaultCompanyName?: string | undefined; // For legacy text field migration
}

const DEFAULT_DEBOUNCE_MS = 300;

export function CompanySelector({ value, onChange, defaultCompanyName }: CompanySelectorProps) {
  const buttonId = useId();
  const nameInputId = useId();
  const websiteInputId = useId();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [debounceMs, setDebounceMs] = useState(DEFAULT_DEBOUNCE_MS);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [, startTransition] = useTransition();

  // Load selected company on mount
  useEffect(() => {
    if (!value) {
      setSelectedCompany(null);
      return;
    }

    let cancelled = false;
    getCompanyByIdAction({ companyId: value })
      .then((result) => {
        if (!cancelled && result?.data) {
          setSelectedCompany(result.data as Company);
        }
        if (result?.serverError) {
          // Error already logged by safe-action middleware
          logger.error(
            'CompanySelector: failed to load selected company',
            new Error(result.serverError),
            { companyId: value }
          );
        }
      })
      .catch((error) => {
        logger.error(
          'CompanySelector: failed to load selected company',
          normalizeError(error, 'Failed to load company'),
          { companyId: value }
        );
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  // Debounced search
  const searchCompanies = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setCompanies([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchCompaniesAction({ query: trimmed, limit: 10 });
      const payload = result?.data as { companies?: Company[]; debounceMs?: number } | undefined;
      const companies = payload?.companies ?? [];
      setCompanies(
        companies.map(
          (company): Company => ({
            id: company.id,
            name: company.name,
            slug: company.slug ?? '',
            description: company.description ?? null,
            website: null,
            logo: null,
          })
        )
      );

      if (typeof payload?.debounceMs === 'number' && payload.debounceMs > 0) {
        setDebounceMs(payload.debounceMs);
      }
    } catch (error) {
      logger.error('CompanySelector: unified search failed', normalizeError(error), {
        query: trimmed,
      });
      setCompanies([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setCompanies([]);
      setIsSearching(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      searchCompanies(searchQuery).catch((error) => {
        logger.error('CompanySelector: search execution failed', normalizeError(error), {
          query: searchQuery,
        });
      });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [debounceMs, searchCompanies, searchQuery]);

  const handleSelect = (company: Company) => {
    setSelectedCompany(company);
    onChange(company.id, company.name);
    setOpen(false);
    setSearchQuery('');
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string) || '';
    const website = (formData.get('website') as string) || '';

    if (!name.trim()) return;

    startTransition(async () => {
      try {
        const result = await createCompany({
          name: name.trim(),
          website: website.trim() || null,
          logo: null,
          description: null,
          size: null,
          industry: null,
          using_cursor_since: null,
        });

        if (result?.data?.company) {
          const newCompany: Company = {
            id: result.data.company.id,
            name: result.data.company.name,
            slug: result.data.company.slug ?? '',
            description: null,
            website: website.trim() || null,
            logo: null,
          };
          handleSelect(newCompany);
          setShowCreateForm(false);
        }
      } catch (error) {
        logger.error(
          'CompanySelector: failed to create company',
          normalizeError(error, 'Failed to create company'),
          { name }
        );
      }
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={buttonId}>
        Company <span className="text-destructive">*</span>
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild={true}>
          <Button
            id={buttonId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCompany ? (
              <span className="flex items-center gap-2">
                <Building2 className={UI_CLASSES.ICON_SM} />
                {selectedCompany.name}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {defaultCompanyName || 'Select or create company...'}
              </span>
            )}
            <Search className={`${UI_CLASSES.ICON_SM} opacity-50`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          {showCreateForm ? (
            <form onSubmit={handleCreate} className="space-y-3 p-4">
              <div className="space-y-2">
                <Label htmlFor={nameInputId}>Company Name</Label>
                <Input
                  id={nameInputId}
                  name="name"
                  placeholder="e.g., Acme Corp"
                  required={true}
                  defaultValue={searchQuery}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={websiteInputId}>Website (Optional)</Label>
                <Input
                  id={websiteInputId}
                  name="website"
                  type="url"
                  placeholder="https://company.com"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">
                  Create
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSearchQuery('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 p-2">
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
              {isSearching ? (
                <p className={`${UI_CLASSES.TEXT_SM_MUTED} px-2 py-4`}>Searching...</p>
              ) : companies.length > 0 ? (
                <div className="max-h-[200px] space-y-1 overflow-y-auto">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => handleSelect(company)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                    >
                      <Building2 className={UI_CLASSES.ICON_SM} />
                      <span>{company.name}</span>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <p className={`${UI_CLASSES.TEXT_SM_MUTED} px-2 py-4`}>No companies found</p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className={UI_CLASSES.ICON_SM} />
                Create new company
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <input type="hidden" name="company_id" value={value || ''} />
      <input
        type="hidden"
        name="company"
        value={selectedCompany?.name || defaultCompanyName || ''}
      />
    </div>
  );
}
