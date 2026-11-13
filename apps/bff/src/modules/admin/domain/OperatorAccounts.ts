// The Supabase Auth side of an operator: the account they sign in with. Operator accounts are
// created only here, marked with the operator role, and are never learner accounts.
export interface OperatorAccounts {
  // Creates a confirmed account with the operator role. Null when the e-mail already has an
  // account (a learner's or another operator's).
  create(email: string, password: string): Promise<string | null>;
  setPassword(userId: string, password: string): Promise<void>;
  // Undoes `create` when the operator could not be saved.
  delete(userId: string): Promise<void>;
}

// Temporary passwords, shown once to the operator who asked for them. Injected so tests know
// the password.
export interface PasswordGenerator {
  next(): string;
}
