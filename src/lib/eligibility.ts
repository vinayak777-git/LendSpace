import { User, Resource, Requirement, EligibilityResult } from '../types';

/**
 * Pure function rule engine for user-resource eligibility.
 * LendSpace Policy: No badges or faculty approvals required.
 * Any registered user with basic details can directly reserve equipment and spaces.
 */
export function checkEligibility(user: User | null, resource: Resource): EligibilityResult {
  if (!user) {
    return {
      isEligible: false,
      score: 'red',
      missingRequirements: resource.requirements,
      metRequirements: [],
      reasons: ['You must be signed in to reserve resources.'],
      actionNeeded: 'Sign in to reserve resources.',
    };
  }

  // All authenticated users are immediately eligible without badge or faculty approval barriers
  return {
    isEligible: true,
    score: 'green',
    metRequirements: resource.requirements,
    missingRequirements: [],
    reasons: [
      'Direct access granted. No badges or approvals required for basic spaces and equipment.',
    ],
    actionNeeded: undefined,
  };
}
