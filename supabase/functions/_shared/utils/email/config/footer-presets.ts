export type SubscriptionFooterPreset = 'newsletterWelcome' | 'weeklyDigest';

export type OnboardingFooterPreset = 'step2' | 'step3' | 'step4' | 'step5';

export interface FooterLineParams {
  email: string;
}

export type FooterLine =
  | {
      type: 'email';
      label?: string;
      icon?: string;
      email: string;
    }
  | {
      type: 'text';
      text: string;
    };

export function buildSubscriptionFooter(
  preset: SubscriptionFooterPreset,
  params: FooterLineParams
): FooterLine[] {
  const baseLine: FooterLine = {
    type: 'email',
    label: 'Subscribed with:',
    icon: '📧',
    email: params.email,
  };

  switch (preset) {
    case 'newsletterWelcome':
      return [
        baseLine,
        {
          type: 'text',
          text: 'You can update your email preferences or unsubscribe anytime using the links at the bottom of this email.',
        },
      ];
    case 'weeklyDigest':
      return [
        baseLine,
        {
          type: 'text',
          text: "You're receiving this because you subscribed to weekly updates from ClaudePro Directory. You can unsubscribe anytime using the links at the bottom of this email.",
        },
      ];
  }
}

export function buildOnboardingFooter(
  preset: OnboardingFooterPreset,
  params: FooterLineParams
): FooterLine[] {
  const baseLine: FooterLine = {
    type: 'email',
    icon: '📧',
    email: params.email,
  };

  const messages: Record<OnboardingFooterPreset, string> = {
    step2: 'This is part 2 of your 5-email onboarding series. Next up: Power User Tips!',
    step3: 'This is part 3 of your 5-email onboarding series.',
    step4: 'This is part 4 of your 5-email onboarding series. One more to go!',
    step5:
      "This was the final email in your onboarding series. You'll continue to receive weekly digests with the latest content.",
  };

  return [baseLine, { type: 'text', text: messages[preset] }];
}
