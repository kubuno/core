// One audience: what it is, who is in it, and where it is offered.
//
// Three cards, in the order the questions get asked — an operator opens an
// audience to check its membership before applying it, and to check where it is
// applied before changing that membership.
//
// The first card is also the editor. "Modifier" used to open the creation form
// again, as a window over the sheet, with the name and the description the sheet
// was already showing right underneath; the two were one edit away from
// disagreeing. `AudienceDialog` is now what its name says — the way an audience
// is *created* — and nothing else.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Globe, MapPin, Plus, Trash2, Users, User as UserIcon } from 'lucide-react'
import { Button, Callout, Card, EmptyState } from '@ui'
import { useConfirm } from '../../../hooks/useConfirm'
import ConfirmDialog from '@ui/ConfirmDialog'
import { confirmLeave } from '../../inline-edit/unsaved'
import { useAudience, useAudienceMutations, type AudienceMember } from './api'
import IdentityCard from './IdentityCard'
import MemberPicker from './MemberPicker'

function errMessage(err: unknown): string | undefined {
  const e = err as { message?: string; response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? e?.message
}

function MemberRow({
  m, canManage, onRemove,
}: {
  m: AudienceMember; canManage: boolean; onRemove: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="group flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
      {m.member_type === 'group'
        ? <Users size={14} className="shrink-0 text-text-tertiary" />
        : <UserIcon size={14} className="shrink-0 text-text-tertiary" />}
      <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
        {m.is_dangling
          ? t('admin.aud_member_gone', { defaultValue: 'Membre supprimé' })
          : m.label}
      </span>
      {m.email && <span className="truncate text-xs text-text-tertiary">{m.email}</span>}
      {m.group_reach !== null && (
        <span className="shrink-0 text-xs text-text-secondary">
          {t('admin.aud_group_reach', {
            defaultValue_one: '{{count}} compte',
            defaultValue: '{{count}} comptes',
            count: m.group_reach,
          })}
        </span>
      )}
      {canManage && (
        <button onClick={onRemove}
                aria-label={t('admin.aud_remove_member', { defaultValue: 'Retirer ce membre' })}
                className="shrink-0 rounded-full p-1 opacity-0 transition-opacity hover:bg-surface-2 group-hover:opacity-100">
          <Trash2 size={13} className="text-text-secondary" />
        </button>
      )}
    </div>
  )
}

export default function AudienceSheet({
  id, canManage, onBack,
}: {
  id: string; canManage: boolean; onBack: () => void
}) {
  const { t } = useTranslation()
  const { data, isLoading } = useAudience(id)
  const { addMembers, removeMembers } = useAudienceMutations(id)
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const [adding, setAdding] = useState(false)

  // Leaving with the identity card half-edited must not drop the field.
  const leave = async () => { if (await confirmLeave(confirm, t)) onBack() }

  if (isLoading || !data) {
    return <p className="p-6 text-sm text-text-tertiary">{t('common.loading', { defaultValue: 'Chargement…' })}</p>
  }
  const a = data.audience

  const removeOne = async (m: AudienceMember) => {
    const ok = await confirm({
      title: t('admin.aud_remove_member_q', { defaultValue: 'Retirer « {{name}} » ?', name: m.label }),
      message: t('admin.aud_remove_member_msg', {
        defaultValue: 'Cette audience cessera d’être proposée à ces personnes. Aucun partage déjà effectué n’est retiré.',
      }),
      confirmLabel: t('common.remove', { defaultValue: 'Retirer' }),
      variant: 'danger',
    })
    if (ok) removeMembers.mutate({ id, members: [{ member_type: m.member_type, member_id: m.member_id }] })
  }

  return (
    <div className="min-w-0">
      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={15} />} onClick={() => void leave()}>
          {t('admin.aud_back', { defaultValue: 'Toutes les audiences' })}
        </Button>
      </div>

      <div className="mb-4 flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2">
        {a.is_everyone
          ? <Globe size={18} className="mt-1 shrink-0 text-text-tertiary" />
          : <Users size={18} className="mt-1 shrink-0 text-text-tertiary" />}
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {a.name}
        </h1>
        {!a.is_everyone && (
          <span className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.aud_reach_of', {
              defaultValue_one: '{{count}} entrée · comptes atteints : {{reach}}',
              defaultValue: '{{count}} entrées · comptes atteints : {{reach}}',
              count: a.member_count, reach: a.reach,
            })}
          </span>
        )}
      </div>

      <IdentityCard audience={a} canManage={canManage} />

      {/* The seeded audience has no member list to show, and saying so beats an
          empty table that reads as a loading failure. */}
      {a.is_everyone && (
        <Callout variant="info" className="mb-4">
          {t('admin.aud_everyone_note', {
            defaultValue: 'Cette audience désigne tous les comptes actifs de l’instance. Elle n’a pas de membres explicites et ne peut pas être supprimée — une instance doit toujours pouvoir proposer au moins une audience.',
          })}
        </Callout>
      )}

      {!a.is_everyone && (
        <Card
          className="mb-4"
          title={t('admin.aud_members', { defaultValue: 'Membres' })}
          icon={<Users size={16} />}
          actions={canManage ? (
            <Button variant="secondary" onClick={() => setAdding(true)}>
              <Plus size={14} /> {t('common.add', { defaultValue: 'Ajouter' })}
            </Button>
          ) : undefined}
        >
          {data.members.length === 0 ? (
            <EmptyState
              icon={<Users size={22} />}
              title={t('admin.aud_no_member', { defaultValue: 'Aucun membre' })}
              description={t('admin.aud_no_member_desc', {
                defaultValue: 'Une audience sans membre ne propose personne. Ajoutez un groupe avant de l’appliquer.',
              })}
            />
          ) : (
            <div className="rounded-lg border border-border">
              {data.members.map(m => (
                <MemberRow key={`${m.member_type}:${m.member_id}`} m={m} canManage={canManage}
                           onRemove={() => void removeOne(m)} />
              ))}
            </div>
          )}
        </Card>
      )}

      <Card
        title={t('admin.aud_applied_where', { defaultValue: 'Proposée dans' })}
        icon={<MapPin size={16} />}
      >
        {data.applied.length === 0 ? (
          <p className="text-sm text-text-tertiary">
            {t('admin.aud_applied_nowhere', {
              defaultValue: 'Nulle part pour l’instant : une audience définie mais non appliquée n’est proposée à personne.',
            })}
          </p>
        ) : (
          <ul className="space-y-1 text-sm text-text-primary">
            {data.applied.map(p => (
              <li key={`${p.module_id}:${p.org_unit_id}`} className="flex items-center gap-2">
                <span className="text-text-secondary">{p.org_unit_name}</span>
                <span className="text-text-tertiary">·</span>
                <span>{p.module_id}</span>
                {p.position === 0 && (
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs text-primary">
                    {t('admin.aud_primary', { defaultValue: 'principale' })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {adding && (
        <MemberPicker
          already={data.members}
          busy={addMembers.isPending}
          error={errMessage(addMembers.error)}
          onCancel={() => setAdding(false)}
          onAdd={members => addMembers.mutate({ id, members }, { onSuccess: () => setAdding(false) })}
        />
      )}
      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
