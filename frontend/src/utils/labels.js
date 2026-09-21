const ROLE_LABELS = {
  software_engineer: 'Software Engineer',
  frontend_developer: 'Frontend Developer',
  backend_developer: 'Backend Developer',
  full_stack_developer: 'Full Stack Developer',
  data_scientist: 'Data Scientist',
  ml_engineer: 'Machine Learning Engineer',
  devops_engineer: 'DevOps Engineer',
  product_manager: 'Product Manager'
};

export function roleLabel(config) {
  if (config.role === 'custom') return config.customRole || 'Custom role';
  return ROLE_LABELS[config.role] || config.role;
}

export const TYPE_LABELS = {
  behavioral: 'Behavioral',
  technical: 'Technical',
  mixed: 'Mixed',
  system_design: 'System design'
};

export const LEVEL_LABELS = {
  entry: 'Entry level',
  mid: 'Mid level',
  senior: 'Senior',
  lead: 'Lead / Principal'
};

export const STATE_LABELS = {
  idle: 'Not connected',
  connecting: 'Connecting',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking'
};
