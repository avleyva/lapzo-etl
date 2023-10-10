export type LXPClient = {
  id: string;
};

export type LXPCompetency = {
  id: number;
  created_at: string;
  updated_at: string;
  competencies_fb: string;
  client_id: string;
  image_url: string;
  name: string;
  voldemort_id: string;
};

export type VoldemortCompetency = {
  id?: string;
  client_id: string;
  name: string;
  description: string;
  dynamic: boolean;
  deleted: boolean;
  updated: boolean;
  custom_levels: boolean;
  max_level: number;
  created_at: string;
  updated_at: string;
  general_evaluation: boolean;
};
