// Definición del usuaro en LXP
export type LXPUser = {
  id?: number;
  user_fb: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  client_id: string | null;
  bio?: string | null;
  deleted: boolean | null;
  hero_url: string | null;
  image_url: string | null;
  notifications_count?: number | null;
  onboard?: boolean | null;
  tutorial?: boolean | null;
  type: string | null;
  role: string | null;
  ou: string | null;
  created_at: string | null;
  updated_at: string | null;
  topics_json?: string | null;
  ou_json?: string | null;
  tutorial_json?: string | null;
  competecies_json?: string | null;
  additional_info_json?: string | null;
  disabled: boolean | null;
  deleted_at: string | null;
  curp: string | null;
  platformLite: boolean;
  emailPendingToVerify: boolean;
  numero_empleado: string | null;
  ask_change_pwd?: boolean | null;
  birthday?: string | null;
  performance: boolean;
  notification_settings_json?: string;
  dark?: boolean | null;
  business_name_uuid?: string | null;
  token_chg_pwd?: string | null;
};

// Definición de usuarios en el nuevo LMS de Voldemort
export type VdmLMSUser = {
  id?: string;
  client_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  profile: string;
  created_at: string | null;
  updated_at: string | null;
  deleted: boolean | null;
  deleted_at: string | null;
  ext_id: string | null; // ID de Voldemort como referencia para el LMS
  legacy_user_fb: string | null; // ID de LXP como referencia para el LMS
  role: string | null;
  legacy: string | null;
};

// Definición de usuarios en la plataforma de Voldemort
export type VdmUser = {
  id?: string;
  user_auth_id: string; // ID de Firebase
  email: string;
  first_name: string;
  last_name: string | null;
  bio: string | null;
  curp: string | null;
  birthday: string | null;
  hero_url: string | null;
  avatar_url: string | null;
  user_metadata: string | null;
  onboard_completed: boolean;
  updated_at: string;
  created_at: string;
  client_id?: string | null; // Este campo no pertenece a la tabla, pero es para obtener el ID del cliente al que está ligado el usuario en Voldemort
};
