export type Program = {
  id: number;
  name: string;
  description: string;
  price: string;
  modality: string;
  schedule: string;
  duration: string;
};

export type Advisor = {
  id: number;
  name: string;
  email: string;
  available: boolean;
};

export type Message = {
  id: number;
  direction: "incoming" | "outgoing";
  content: string;
  created_at: string;
};

export type FollowUp = {
  id: number;
  status: string;
  notes: string;
  scheduled_at: string;
};

export type Lead = {
  id: number;
  name: string;
  phone: string;
  source: string;
  status: string;
  consent: boolean;
  chat_state: string;
  program_id: number | null;
  advisor_id: number | null;
  last_interaction_at: string;
  created_at: string;
  program: Program | null;
  advisor: Advisor | null;
  messages?: Message[];
  follow_ups?: FollowUp[];
};

export type Summary = {
  total: number;
  new: number;
  interested: number;
  pending_advisor: number;
  contacted: number;
  enrolled: number;
  pending_follow_ups: number;
};

export type ChatResult = {
  lead: Lead;
  reply: string;
  state: string;
  duplicate: boolean;
};
