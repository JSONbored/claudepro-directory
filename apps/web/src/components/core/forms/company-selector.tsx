'use client';

/**
 * CompanySelector - Search or create companies (database-first via RPC)
 */

import type { companiesModel } from '@heyclaude/data-layer/prisma';
import { createCompany } from '@heyclaude/web-runtime/actions/companies-crud';
import { getCompanyByIdAction, searchCompaniesAction } from '@heyclaude/web-runtime/actions/companies';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@heyclaude/web-runtime/ui';
import { getFormDataString } from '@heyclaude/shared-runtime';
import { Building2, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, useTransition } from 'react';
import { useBoolean, useDebounceValue } from '@heyclaude/web-runtime/hooks';

type Company = Pick<
  companiesModel,
  'description' | 'id' | 'logo' | 'name' | 'slug' | 'website'
>;

interface CompanySelectorProps {
  defaultCompanyName?: string | undefined; // For legacy text field migration
  onChange: (companyId: null | string, companyName: string) => void;
  value?: null | string; // company_id
}

const DEFAULT_DEBOUNCE_MS = 300;

/**
 * UI control that lets the user search for, select, or create a company and notifies the parent of the selection.
 *
 * Renders a combobox-like button that opens a popover containing a debounced search for companies, a selectable list of results,
 * and a form to create a new company when needed. Maintains internal selection state and synchronizes the selected company id
 * with the provided `value` and `onChange` callback.
 *
 * @param value - Currently selected company id, or `null`/`undefined` when none is selected.
 * @param onChange - Callback invoked when the selection changes: `onChange(companyId, companyName)`.
 * @param defaultCompanyName - Optional legacy display string used when no company is selected.
 * @returns The JSX element representing the company selector control.
 *
 * @see searchCompaniesAction
 * @see getCompanyByIdAction
 * @see createCompany
 */
export function CompanySelector({ value, onChange, defaultCompanyName }: CompanySelectorProps) {
  const buttonId = useId();
  const nameInputId = useId();
  const websiteInputId = useId();
  const { value: open, setValue: setOpen } = useBoolean();
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const { value: isSearching, setTrue: setIsSearchingTrue, setFalse: setIsSearchingFalse } = useBoolean();
  const [debounceMs, setDebounceMs] = useState(DEFAULT_DEBOUNCE_MS);
  const { value: showCreateForm, setValue: setShowCreateForm } = useBoolean();

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
          // Type narrowing: result.data is Company from server action
          if (result.data && typeof result.data === 'object' && 'id' in result.data) {
            setSelectedCompany(result.data satisfies Company);
          }
        }
        if (result?.serverError) {
          // Error already logged by safe-action middleware
          const normalized = normalizeError(result.serverError, 'Failed to load selected company');
          logClientError(
            '[Form] Failed to load selected company',
            normalized,
            'CompanySelector.loadCompany',
            {
              component: 'CompanySelector',
              action: 'load-company',
              category: 'form',
              companyId: value,
            }
          );
        }
      })
      .catch((error) => {
        logClientError(
          '[Form] Failed to load selected company',
          normalizeError(error, 'Failed to load company'),
          'CompanySelector.loadCompany',
          {
            component: 'CompanySelector',
            action: 'load-company',
            category: 'form',
            companyId: value,
          }
        );
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  // Track latest query to prevent stale results
  const latestQueryRef = useRef<string>('');

  // Debounced search
  const searchCompanies = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setCompanies([]);
      setIsSearchingFalse();
      return;
    }

    // Update latest query before making request
    latestQueryRef.current = trimmed;

    setIsSearchingTrue();
    try {
      const result = await searchCompaniesAction({ query: trimmed, limit: 10 });
      
      // Only apply results if this request's query still matches the latest query
      if (latestQueryRef.current !== trimmed) {
        return; // Stale request - ignore results
      }
      
      // Type narrowing: result.data has companies array
      const payload = result?.data && typeof result.data === 'object' && !Array.isArray(result.data) && 'companies' in result.data
        ? (result.data as { companies?: Company[]; debounceMs?: number })
        : undefined;
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
      logClientError(
        '[Form] Unified search failed',
        normalizeError(error, 'Unified search failed'),
        'CompanySelector.searchCompanies',
        {
          component: 'CompanySelector',
          action: 'search-companies',
          category: 'form',
          query: trimmed,
        }
      );
      setCompanies([]);
    } finally {
      setIsSearchingFalse();
    }
  }, [setIsSearchingTrue, setIsSearchingFalse]);

  // Debounced search query
  const [debouncedSearchQuery] = useDebounceValue(searchQuery, debounceMs);

  useEffect(() => {
    const trimmed = debouncedSearchQuery.trim();
    if (trimmed.length < 2) {
      setCompanies([]);
      setIsSearchingFalse();
      return;
    }

    searchCompanies(debouncedSearchQuery).catch((error) => {
      logClientError(
        '[Form] Search execution failed',
        normalizeError(error, 'Search execution failed'),
        'CompanySelector.searchEffect',
        {
          component: 'CompanySelector',
          action: 'search-effect',
          category: 'form',
          query: debouncedSearchQuery,
        }
      );
    });
  }, [debouncedSearchQuery, searchCompanies, setIsSearchingFalse]);

  const handleSelect = (company: Company) => {
    setSelectedCompany(company);
    onChange(company.id, company.name);
    setOpen(false);
    setSearchQuery('');
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // OPTIMIZATION: Use type-safe FormData utilities
    const name = getFormDataString(formData, 'name') || '';
    const website = getFormDataString(formData, 'website') || '';

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
        logClientError(
          '[Form] Failed to create company',
          normalizeError(error, 'Failed to create company'),
          'CompanySelector.createCompany',
          {
            component: 'CompanySelector',
            action: 'create-company',
            category: 'form',
            name,
          }
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
        <PopoverTrigger asChild>
          <Button
            id={buttonId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCompany ? (
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {selectedCompany.name}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {defaultCompanyName || 'Select or create company...'}
              </span>
            )}
            <Search className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-4" align="start">
          {showCreateForm ? (
            <form onSubmit={handleCreate} className="space-y-3 p-4">
              <div className="space-y-2">
                <Label htmlFor={nameInputId}>Company Name</Label>
                <Input
                  id={nameInputId}
                  name="name"
                  placeholder="e.g., Acme Corp"
                  required
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
                <p className="text-muted-foreground text-sm px-2 py-4">Searching...</p>
              ) : companies.length > 0 ? (
                <div className="max-h-[200px] space-y-1 overflow-y-auto">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => handleSelect(company)}
                      className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>{company.name}</span>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <p className="text-muted-foreground text-sm px-2 py-4">No companies found</p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="h-4 w-4" />
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