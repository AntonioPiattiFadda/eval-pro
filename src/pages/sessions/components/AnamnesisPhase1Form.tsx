import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { updateSessionFields } from '@/service/sessions'
import { upsertPhase1Answer } from '@/service/anamnesis'
import { SaveIndicator, type SaveStatus } from './SaveIndicator'
import type { Phase1Question } from '@/types/anamnesis.types'
import type { Domain } from '@/types/domain.types'
import type { Region } from '@/types/region.types'

interface Props {
  sessionId: string
  organizationId: string
  questions: Phase1Question[]
  domains: Domain[]
  regions: Region[]
  initialRegionId: string | null
  initialDomainId: string | null
  initialAnswers: Record<string, string>
}

export function AnamnesisPhase1Form({
  sessionId,
  organizationId,
  questions,
  domains,
  regions,
  initialRegionId,
  initialDomainId,
  initialAnswers,
}: Props) {
  const navigate = useNavigate()
  const [regionId, setRegionId] = useState<string>(initialRegionId ?? '')
  const [domainId, setDomainId] = useState<string>(initialDomainId ?? '')
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const sessionMutation = useMutation({
    mutationFn: (fields: { region_id?: string; domain_id?: string }) =>
      updateSessionFields(sessionId, fields),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => setSaveStatus('saved'),
    onError: () => setSaveStatus('error'),
  })

  const answerMutation = useMutation({
    mutationFn: (vars: { questionId: string; answer: string }) =>
      upsertPhase1Answer({
        sessionId,
        questionId: vars.questionId,
        answer: vars.answer,
        organizationId,
      }),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => setSaveStatus('saved'),
    onError: () => setSaveStatus('error'),
  })

  function handleRegionChange(value: string) {
    setRegionId(value)
    sessionMutation.mutate({ region_id: value })
  }

  function handleDomainChange(value: string) {
    setDomainId(value)
    sessionMutation.mutate({ domain_id: value })
  }

  function handleAnswerChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    answerMutation.mutate({ questionId, answer: value })
  }

  const allAnswered =
    regionId !== '' &&
    domainId !== '' &&
    questions.every((q) => answers[q.question_id] !== undefined)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-2 gap-4 flex-1 max-w-sm">
          <div className="space-y-1.5">
            <Label>Región corporal</Label>
            <Select value={regionId} onValueChange={handleRegionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.region_id} value={r.region_id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Dominio</Label>
            <Select value={domainId} onValueChange={handleDomainChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d.domain_id} value={d.domain_id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SaveIndicator status={saveStatus} />
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.question_id} className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              {i + 1}. {q.question}
            </p>
            <RadioGroup
              value={answers[q.question_id] ?? ''}
              onValueChange={(value) => handleAnswerChange(q.question_id, value)}
              className="space-y-1.5"
            >
              {q.options.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem
                    value={opt.value}
                    id={`${q.question_id}-${opt.value}`}
                  />
                  <Label
                    htmlFor={`${q.question_id}-${opt.value}`}
                    className="font-normal cursor-pointer text-sm"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
        <Button
          variant="outline"
          onClick={() => navigate(`/professional/sessions/${sessionId}`)}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          disabled={!allAnswered}
          onClick={() => navigate(`/professional/sessions/${sessionId}`)}
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
