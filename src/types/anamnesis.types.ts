export interface Phase1Question {
  question_id: string
  question: string
  options: { label: string; value: string }[]
  order_index: number
}
