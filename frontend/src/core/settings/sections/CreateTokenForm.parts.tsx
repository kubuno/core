/**
 * The parts of `CreateTokenForm.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Plus } from "lucide-react"
import { Button, Callout, Card, Input } from "@ui"
import ApiTokenScopePicker from "./ApiTokenScopePicker"
import type { CreateTokenForm } from './CreateTokenForm'

export function Part1({ t, handleSubmit, name, setName, expiresInDays, setExpiresInDays, expiryMandatory, maxTtlDays, scopes, available, setScopes, error, create }: { t: NonNullable<CreateTokenForm['tr']>; handleSubmit: CreateTokenForm['handleSubmit']; name: NonNullable<CreateTokenForm['name']>; setName: NonNullable<CreateTokenForm['setName']>; expiresInDays: NonNullable<CreateTokenForm['expiresInDays']>; setExpiresInDays: NonNullable<CreateTokenForm['setExpiresInDays']>; expiryMandatory: NonNullable<CreateTokenForm['expiryMandatory']>; maxTtlDays: NonNullable<CreateTokenForm['maxTtlDays']>; scopes: NonNullable<CreateTokenForm['scopes']>; available: NonNullable<CreateTokenForm['available']>; setScopes: NonNullable<CreateTokenForm['setScopes']>; error: NonNullable<CreateTokenForm['error']>; create: NonNullable<CreateTokenForm['create']> }) {
  return (
    <Card
          title={t('settings.tok_new')}
          icon={<Plus size={15} />}
          dense
          className="mb-5"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  label={t('settings.tok_name')}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('settings.tok_name_ph')}
                  maxLength={255}
                />
              </div>
              <div className="sm:w-52">
                <Input
                  label={t('settings.tok_expires')}
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder={
                    expiryMandatory
                      ? t('settings.tok_max_ttl', { days: maxTtlDays })
                      : t('settings.tok_no_expiration')
                  }
                  min={1}
                  max={maxTtlDays}
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  {t('settings.tok_max_ttl', { days: maxTtlDays })}
                </p>
              </div>
            </div>
    
            <div>
              <p className="text-xs font-medium text-text-primary mb-1">
                {t('settings.tok_scopes')}
                {scopes.length > 0 && (
                  <span className="ml-2 font-normal text-text-tertiary">
                    {t('settings.tok_scopes_selected', { count: scopes.length })}
                  </span>
                )}
              </p>
              <p className="text-xs text-text-secondary mb-2">{t('settings.tok_scopes_desc')}</p>
              <ApiTokenScopePicker scopes={available} selected={scopes} onChange={setScopes} />
            </div>
    
            {expiryMandatory && (
              <Callout variant="warning" title={t('settings.tok_expiry_required_title')} t={t}>
                {t('settings.tok_expiry_required_desc')}
              </Callout>
            )}
    
            {error && <p className="text-xs text-danger">{error}</p>}
    
            <div className="flex justify-end">
              <Button type="submit" loading={create.isPending} className="whitespace-nowrap">
                {t('settings.create')}
              </Button>
            </div>
          </form>
        </Card>
  )
}
