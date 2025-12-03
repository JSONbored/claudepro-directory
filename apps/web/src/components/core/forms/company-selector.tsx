'use client';

/**
 * CompanySelector - Search or create companies (database-first via RPC)
 */

import type { Database } from '@heyclaude/database-types';
import {
  alignItems,
  cluster,
  display,
  flexGrow,
  gap,
  hoverBg,
  iconSize,
  justify,
  muted,
  opacityLevel,
  overflow,
  padding,
  radius,
  size,
  spaceY,
  textAlign,
  width,
  textColor,
  maxHeight,
  minWidth,
  height,
} from '@heyclaude/web-runtime/design-system';
import {
  createCompany,
  getCompanyByIdAction,
  searchCompaniesAction,
} from '@heyclaude/web-runtime/actions';
import { logger, normalizeError } from '@heyclaude/web-runtime/core';
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

/**
 * UI control that lets users search for an existing company or create and select a new one.
 *
 * Renders a popover trigger with a searchable list of companies, a debounced remote search, and an inline form to create a company; calls `onChange` when a company is selected.
 *
 * @param value - Currently selected company id (or falsy when none).
 * @param onChange - Callback invoked with the selected company's `(id, name)`.
 * @param defaultCompanyName - Fallback company name shown when no company is selected (used for legacy forms).
 *
 * @see createCompany
 * @see searchCompaniesAction
 * @see getCompanyByIdAction
 */
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
    <div className={spaceY.compact}>
      <Label htmlFor={buttonId}>
        Company <span className={textColor.destructive}>*</span>
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild={true}>
          <Button
            id={buttonId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`${width.full} ${justify.between}`}
          >
            {selectedCompany ? (
              <span className={cluster.compact}>
                <Building2 className={iconSize.sm} />
                {selectedCompany.name}
              </span>
            ) : (
              <span className={muted.sm}>
                {defaultCompanyName || 'Select or create company...'}
              </span>
            )}
            <Search className={`${iconSize.sm} ${opacityLevel[50]}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`${minWidth.popover} ${padding.none}`} align="start">
          {showCreateForm ? (
            <form onSubmit={handleCreate} className={`${spaceY.default} ${padding.default}`}>
              <div className={spaceY.compact}>
                <Label htmlFor={nameInputId}>Company Name</Label>
                <Input
                  id={nameInputId}
                  name="name"
                  placeholder="e.g., Acme Corp"
                  required={true}
                  defaultValue={searchQuery}
                />
              </div>
              <div className={spaceY.compact}>
                <Label htmlFor={websiteInputId}>Website (Optional)</Label>
                <Input
                  id={websiteInputId}
                  name="website"
                  type="url"
                  placeholder="https://company.com"
                />
              </div>
              <div className={`${display.flex} ${gap.compact}`}>
                <Button type="submit" size="sm" className={flexGrow['1']}>
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
            <div className={`${spaceY.compact} ${padding.tight}`}>
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={height.buttonSm}
              />
              {isSearching ? (
                <p className={`${muted.sm} ${padding.xTight} ${padding.yDefault}`}>Searching...</p>
              ) : companies.length > 0 ? (
                <div className={`${maxHeight.dropdown} ${spaceY.tight} ${overflow.yAuto}`}>
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => handleSelect(company)}
                      className={`${display.flex} ${width.full} ${alignItems.center} ${gap.compact} ${radius.md} ${padding.xTight} ${padding.yCompact} ${textAlign.left} ${size.sm} ${hoverBg.accentSolid}`}
                    >
                      <Building2 className={iconSize.sm} />
                      <span>{company.name}</span>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <p className={`${muted.sm} ${padding.xTight} ${padding.yDefault}`}>No companies found</p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className={width.full}
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className={iconSize.sm} />
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